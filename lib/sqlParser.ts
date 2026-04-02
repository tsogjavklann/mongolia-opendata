/**
 * Enhanced SQL Parser for 1212.mn PX-Web API
 * Supports:
 * - WHERE X IN ('a','b')
 * - WHERE X = 'a'           → converts to IN
 * - WHERE Year BETWEEN 2018 AND 2023 → expands to IN list
 * - Label-to-code resolution (Эрэгтэй → '1')
 * - English alias resolution (Gender → Хүйс)
 */

import { resolveEnglishDimension } from './dimensionMap';

export interface ParsedFilter {
  code: string;         // API dimension name (Mongolian)
  values: string[];     // code values sent to API
  displayValues: string[]; // human-readable labels shown in UI
  operator: 'IN' | '=' | 'BETWEEN';
}

export interface ParsedQuery {
  tblId: string;
  filters: ParsedFilter[];
  limit: number;
  raw: string;
  // for Explain tab
  explain: {
    table: string;
    filters: string[];
    limit: number;
  };
}

export interface ParseError { message: string; errorType: 'PARSE' | 'FROM' | 'DIMENSION' | 'SYNTAX'; suggestion: string; }

export type DimMeta = {
  code: string;
  label: string;
  englishAlias: string;
  values: { code: string; label: string }[];
};

function parseInList(raw: string): string[] {
  return raw
    .replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '')
    .split(',').map(s => s.trim().replace(/^['"`]|['"`]$/g, '').trim()).filter(Boolean);
}

function expandBetween(from: string, to: string): string[] {
  // numeric range e.g. 2018 BETWEEN 2023
  const fromN = parseInt(from), toN = parseInt(to);
  if (!isNaN(fromN) && !isNaN(toN) && Math.abs(toN - fromN) <= 200) {
    const result = [];
    for (let i = Math.min(fromN, toN); i <= Math.max(fromN, toN); i++) result.push(String(i));
    return result;
  }
  return [from, to];
}

/** Resolve label → code using dimension metadata */
function resolveValues(rawValues: string[], dim: DimMeta | undefined): { codes: string[]; labels: string[] } {
  if (!dim) return { codes: rawValues, labels: rawValues };
  const codes: string[] = [];
  const labels: string[] = [];
  for (const raw of rawValues) {
    // Try exact code match
    const byCode = dim.values.find(v => v.code === raw);
    if (byCode) { codes.push(byCode.code); labels.push(byCode.label || byCode.code); continue; }
    // Try label match (Mongolian or English)
    const byLabel = dim.values.find(v =>
      v.label.toLowerCase() === raw.toLowerCase() ||
      v.code.toLowerCase() === raw.toLowerCase()
    );
    if (byLabel) { codes.push(byLabel.code); labels.push(byLabel.label || byLabel.code); continue; }
    // Fallback: use as-is
    codes.push(raw); labels.push(raw);
  }
  return { codes, labels };
}

export function parseSQL(sql: string, availableDims: DimMeta[] = []): ParsedQuery | ParseError {
  try {
    const normalized = sql
      .replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ').trim();

    if (!/^SELECT\s/i.test(normalized)) {
      return { message: 'SELECT-ээр эхлэх ёстой', errorType: 'SYNTAX', suggestion: 'SELECT * FROM "..." гэж эхэл' };
    }

    const fromMatch = normalized.match(/\bFROM\s+["'`]([^"'`]+)["'`]/i) ?? normalized.match(/\bFROM\s+(\S+)/i);
    if (!fromMatch) {
      return { message: 'FROM заагаагүй', errorType: 'FROM', suggestion: 'Хүснэгт хайлтаас сонгоод FROM автоматаар орно' };
    }

    let tblId = fromMatch[1].trim();
    if (!tblId.endsWith('.px')) tblId += '.px';

    const limitMatch = normalized.match(/\bLIMIT\s+(\d+)/i);
    const limit = limitMatch ? Math.min(parseInt(limitMatch[1], 10), 100000) : 5000;

    const whereMatch = normalized.match(/\bWHERE\s+([\s\S]+?)(?:\bLIMIT\b|\bGROUP\b|\bORDER\b|;|$)/i);
    const whereBlock = whereMatch ? whereMatch[1].trim() : '';

    const filters: ParsedFilter[] = [];
    const explainFilters: string[] = [];

    if (whereBlock) {
      // Match: DimName BETWEEN val AND val
      const betweenRx = /([^\s(]+(?:\s+[^(BETWEEN\s]+)*?)\s+BETWEEN\s+['"]?([^'"AND\s]+)['"]?\s+AND\s+['"]?([^'")\s]+)['"]?/gi;
      let bm;
      while ((bm = betweenRx.exec(whereBlock)) !== null) {
        const rawCode = bm[1].trim().replace(/\bAND\b/i, '').trim();
        const from = bm[2].trim(), to = bm[3].trim();
        const expanded = expandBetween(from, to);
        const dim = availableDims.find(d => d.englishAlias === rawCode || d.label === rawCode || d.code === rawCode)
          ?? availableDims.find(d => resolveEnglishDimension(rawCode, availableDims.map(x => x.label)) === d.label);
        const { codes, labels } = resolveValues(expanded, dim);
        const apiCode = dim?.label ?? rawCode;
        filters.push({ code: apiCode, values: codes, displayValues: labels, operator: 'BETWEEN' });
        explainFilters.push(`${dim?.englishAlias ?? rawCode}: ${from}–${to} (${expanded.length} утга)`);
      }

      // Match: DimName = 'val'
      const eqRx = /([^\s(=]+)\s*=\s*['"]([^'"]+)['"]/gi;
      let em;
      while ((em = eqRx.exec(whereBlock)) !== null) {
        const rawCode = em[1].trim().replace(/\bAND\b/i, '').trim();
        if (/^(SELECT|WHERE|LIMIT|ORDER|GROUP)$/i.test(rawCode)) continue;
        const dim = availableDims.find(d => d.englishAlias === rawCode || d.label === rawCode)
          ?? availableDims.find(d => resolveEnglishDimension(rawCode, availableDims.map(x => x.label)) === d.label);
        const { codes, labels } = resolveValues([em[2]], dim);
        const apiCode = dim?.label ?? rawCode;
        if (!filters.find(f => f.code === apiCode)) {
          filters.push({ code: apiCode, values: codes, displayValues: labels, operator: '=' });
          explainFilters.push(`${dim?.englishAlias ?? rawCode} = ${labels[0]}`);
        }
      }

      // Match: DimName IN ('a','b')
      const inRx = /([^\s(][^(]*?)\s+IN\s*(\([^)]+\))/gi;
      let im;
      while ((im = inRx.exec(whereBlock)) !== null) {
        const rawCode = im[1].trim().replace(/\bAND\b/i, '').trim().replace(/\bBETWEEN[\s\S]*$/i, '').trim();
        if (!rawCode || /^(SELECT|WHERE|LIMIT)$/i.test(rawCode)) continue;
        const rawVals = parseInList(im[2]);
        const dim = availableDims.find(d => d.englishAlias === rawCode || d.label === rawCode || d.code === rawCode)
          ?? (availableDims.length > 0 ? availableDims.find(d => resolveEnglishDimension(rawCode, availableDims.map(x => x.label)) === d.label) : undefined);
        const { codes, labels } = resolveValues(rawVals, dim);
        const apiCode = dim?.label ?? rawCode;
        if (!filters.find(f => f.code === apiCode)) {
          filters.push({ code: apiCode, values: codes, displayValues: labels, operator: 'IN' });
          explainFilters.push(`${dim?.englishAlias ?? rawCode}: ${labels.slice(0,3).join(', ')}${labels.length > 3 ? ` +${labels.length-3}` : ''}`);
        }
      }
    }

    const tblName = tblId.split('/').pop()?.replace('.px','') ?? tblId;
    return {
      tblId, filters, limit, raw: sql,
      explain: { table: tblName, filters: explainFilters, limit }
    };
  } catch (e) {
    return { message: 'Parse алдаа: ' + String(e), errorType: 'PARSE', suggestion: 'SQL бичлэгийг шалгана уу' };
  }
}

export function isParseError(r: ParsedQuery | ParseError): r is ParseError {
  return 'errorType' in r;
}

/** Smart WHERE/AND insert */
export function smartInsert(currentSql: string, snippet: string): string {
  const hasWhere = /\bWHERE\b/i.test(currentSql);
  const hasLimit = /\bLIMIT\b/i.test(currentSql);
  const clause = hasWhere ? `\n  AND ${snippet}` : `\nWHERE ${snippet}`;
  if (hasLimit) {
    return currentSql.replace(/(\bLIMIT\b)/i, `${clause}\n$1`);
  }
  return currentSql.trimEnd() + clause;
}
