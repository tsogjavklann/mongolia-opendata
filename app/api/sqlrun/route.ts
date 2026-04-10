/**
 * /api/sqlrun — Multi-table DuckDB SQL endpoint
 *
 * FROM болон JOIN доторх БҮГД хүснэгтийг 1212.mn-аас татаад
 * DuckDB in-memory DB-д ачаалж жинхэнэ SQL ажиллуулна.
 *
 * Жишээ:
 *   SELECT a.Он, a.VALUE as ажилгүй, b.VALUE as үнэ
 *   FROM "path/labour.px" a
 *   JOIN "path/price.px" b ON a.Он = b.Он AND a["Аймаг"] = b["Аймаг"]
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveAliases } from '@/lib/tableAliases';
import { fetchData, fetchTableMeta, type PxFilter } from '@/lib/apiClient';
import { normalizeResponse } from '@/lib/transform';
import { runSQL, buildSchemaInfo, type ColumnInfo } from '@/lib/duckdb-engine';
import { ENGLISH_ALIASES, resolveEnglishDimension } from '@/lib/dimensionMap';

export const runtime = 'nodejs';
export const maxDuration = 120;

// SQL-аас бүх "path/table.px" замуудыг гаргах
function extractAllTablePaths(sql: string): { path: string; alias: string | null }[] {
  const results: { path: string; alias: string | null }[] = [];
  // FROM "..." alias?, JOIN "..." alias? хэлбэр
  const regex = /(?:FROM|JOIN)\s+["'`]([^"'`]+)["'`](?:\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?/gi;
  let m;
  while ((m = regex.exec(sql)) !== null) {
    let path = m[1].trim();
    if (!path.endsWith('.px')) path += '.px';
    const alias = m[2] ?? null;
    if (!results.find(r => r.path === path)) {
      results.push({ path, alias });
    }
  }
  return results;
}

// path-аас богино хүснэгтийн нэр гаргах
function tableNameFromPath(path: string): string {
  return path.split('/').pop()?.replace(/\.px$/i, '') ?? 'data';
}

// SQL дахь "path/table.px" замыг богино нэрээр солих (Map-based, regex-free)
function replacePathsWithNames(
  sql: string,
  mapping: { path: string; name: string; alias: string | null }[]
): string {
  // Build lookup map: path (with and without .px) → short name
  const lookup = new Map<string, string>();
  for (const m of mapping) {
    lookup.set(m.path.toLowerCase(), m.name);
    lookup.set(m.path.replace(/\.px$/i, '').toLowerCase(), m.name);
  }

  // Single-pass: walk the SQL, find quoted strings, replace if they match a path
  let result = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const closeIdx = sql.indexOf(ch, i + 1);
      if (closeIdx === -1) { result += sql.slice(i); break; }
      const inner = sql.slice(i + 1, closeIdx);
      const replacement = lookup.get(inner.toLowerCase());
      if (replacement) {
        result += `"${replacement}"`;
      } else {
        result += sql.slice(i, closeIdx + 1);
      }
      i = closeIdx + 1;
    } else {
      result += ch;
      i++;
    }
  }
  return result;
}

type DimMeta = {
  code: string; label: string; englishAlias: string;
  values: { code: string; label: string }[];
};

async function fetchTableDims(path: string): Promise<DimMeta[]> {
  try {
    const meta = await fetchTableMeta(path) as Record<string, unknown>;
    const variables = (meta?.variables ?? []) as Array<{
      code: string; text: string; values: string[]; valueTexts: string[];
    }>;
    return variables.map(v => ({
      code: v.code,
      label: v.text,
      englishAlias: (ENGLISH_ALIASES as Record<string, string>)[v.text] ?? v.text,
      values: (v.values ?? []).map((c, i) => ({ code: c, label: v.valueTexts?.[i] ?? c })),
    }));
  } catch {
    return [];
  }
}

/** SQL WHERE-аас шүүлт задлах (table alias-г арилгана: a.Он → Он) */
function extractWhereFilters(sql: string): { dimName: string; values: string[] }[] {
  const whereMatch = sql.match(/\bWHERE\s+([\s\S]+?)(?:\bLIMIT\b|\bGROUP\b|\bORDER\b|\bHAVING\b|;|$)/i);
  if (!whereMatch) return [];
  const w = whereMatch[1];
  const filters: { dimName: string; values: string[] }[] = [];

  // Strip alias prefix: a.Он → Он, a["Аймаг, нийслэл"] → Аймаг, нийслэл
  function strip(name: string): string {
    return name
      .replace(/^[a-zA-Z_]\w*\.\s*/, '')
      .replace(/^\[["']|["']\]$/g, '')
      .replace(/^["'`]|["'`]$/g, '')
      .trim();
  }

  // BETWEEN X AND Y
  const betweenRx = /([\w.[\]"'`]+)\s+BETWEEN\s+['"]?(\w+)['"]?\s+AND\s+['"]?(\w+)['"]?/gi;
  let m;
  while ((m = betweenRx.exec(w)) !== null) {
    const dim = strip(m[1]);
    const from = parseInt(m[2]), to = parseInt(m[3]);
    if (!isNaN(from) && !isNaN(to) && Math.abs(to - from) <= 200) {
      const vals: string[] = [];
      for (let i = Math.min(from, to); i <= Math.max(from, to); i++) vals.push(String(i));
      filters.push({ dimName: dim, values: vals });
    }
  }

  // = 'value'
  const eqRx = /([\w.[\]"'`]+)\s*=\s*['"]([^'"]+)['"]/gi;
  while ((m = eqRx.exec(w)) !== null) {
    const dim = strip(m[1]);
    if (/^(SELECT|WHERE|LIMIT|ORDER|GROUP|AND|OR|ON|VALUE)$/i.test(dim)) continue;
    filters.push({ dimName: dim, values: [m[2]] });
  }

  // IN (...)
  const inRx = /([\w.[\]"'`]+)\s+IN\s*\(([^)]+)\)/gi;
  while ((m = inRx.exec(w)) !== null) {
    const dim = strip(m[1]);
    if (/^(SELECT|WHERE|LIMIT)$/i.test(dim)) continue;
    const vals = m[2].split(',').map(v => v.trim().replace(/^['"`]|['"`]$/g, '').trim()).filter(Boolean);
    filters.push({ dimName: dim, values: vals });
  }

  return filters;
}

/** WHERE шүүлтийг хүснэгтийн dimension-тай тулгах → PxFilter[] */
function matchFiltersToTable(
  whereFilters: { dimName: string; values: string[] }[],
  dims: DimMeta[]
): PxFilter[] {
  const pxFilters: PxFilter[] = [];
  const dimLabels = dims.map(d => d.label);

  for (const wf of whereFilters) {
    // Dimension-г label, code, english alias-аар хайх
    const dim = dims.find(d =>
      d.label === wf.dimName || d.code === wf.dimName || d.englishAlias === wf.dimName
    ) ?? dims.find(d => resolveEnglishDimension(wf.dimName, dimLabels) === d.label);
    if (!dim) continue;

    // Label → code resolve
    const codes: string[] = [];
    for (const val of wf.values) {
      const byCode = dim.values.find(v => v.code === val);
      if (byCode) { codes.push(byCode.code); continue; }
      const byLabel = dim.values.find(v => v.label.toLowerCase() === val.toLowerCase());
      if (byLabel) { codes.push(byLabel.code); continue; }
      codes.push(val);
    }
    if (codes.length > 0) {
      pxFilters.push({ code: dim.code, values: codes });
    }
  }

  return pxFilters;
}

/** "Он" dimension байвал сүүлийн 15 жилээр хязгаарлах (413 сэргийлэх) */
function addDefaultYearLimit(dims: DimMeta[], existing: PxFilter[]): PxFilter[] {
  const yearDim = dims.find(d =>
    d.label === 'Он' || d.label === 'Жил' || d.code === 'Он' ||
    d.englishAlias === 'Year'
  );
  if (!yearDim) return existing;
  if (existing.find(f => f.code === yearDim.code)) return existing;

  const numericYears = yearDim.values
    .map(v => ({ code: v.code, num: parseInt(v.code) }))
    .filter(v => !isNaN(v.num))
    .sort((a, b) => b.num - a.num);
  const recent = numericYears.slice(0, 15).map(v => v.code);
  if (recent.length === 0) return existing;

  return [...existing, { code: yearDim.code, values: recent }];
}

export async function POST(req: NextRequest) {
  let body: { sql: string; useDuckDB?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON', errorType: 'PARSE', suggestion: '' }, { status: 400 }); }

  const { sql, useDuckDB = true } = body;
  if (!sql?.trim()) return NextResponse.json({ ok: false, error: 'SQL хоосон байна', errorType: 'PARSE', suggestion: 'SQL бичнэ үү' });

  // Query length limit
  if (sql.length > 5000) return NextResponse.json({ ok: false, error: 'SQL хэт урт (5000 тэмдэгтээс хэтэрсэн)', errorType: 'PARSE', suggestion: 'SQL-г богиносгоно уу' }, { status: 400 });

  // Block write/DDL operations — only SELECT allowed
  const BLOCKED_OPS = /^\s*(DROP|DELETE|ALTER|CREATE|INSERT|UPDATE|TRUNCATE|GRANT|REVOKE)\b/i;
  const statements = sql.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (BLOCKED_OPS.test(stmt.trim())) {
      return NextResponse.json({ ok: false, error: 'Зөвхөн SELECT асуулга зөвшөөрөгдөнө', errorType: 'PARSE', suggestion: 'DROP, DELETE, ALTER зэрэг үйлдэл хориотой' }, { status: 400 });
    }
  }

  // 0. Alias-г бүтэн замаар орлуулах (FROM "unemployment" → FROM "Regional development/...")
  const resolvedSql = resolveAliases(sql);

  // 1. SQL-аас бүх хүснэгтийн замыг гаргах
  const tablePaths = extractAllTablePaths(resolvedSql);
  if (tablePaths.length === 0) {
    return NextResponse.json({ ok: false, error: 'FROM заагаагүй', errorType: 'FROM', suggestion: 'FROM "хүснэгтийн зам" гэж бичнэ үү' });
  }

  // Query complexity limit: max 5 tables
  if (tablePaths.length > 5) {
    return NextResponse.json({ ok: false, error: '5-аас олон хүснэгт JOIN хийх боломжгүй', errorType: 'PARSE', suggestion: 'Хүснэгтийн тоог багасгана уу' }, { status: 400 });
  }

  // 2. WHERE шүүлтийг задлах
  const whereFilters = extractWhereFilters(resolvedSql);

  // 3. Бүх хүснэгтийг зэрэг татах (WHERE шүүлтийг API руу дамжуулна)
  const startFetch = Date.now();
  const tableResults = await Promise.allSettled(
    tablePaths.map(async ({ path }) => {
      const dims = await fetchTableDims(path);
      // WHERE-аас тохирох шүүлт олох + жилийн автомат хязгаар
      let filters = matchFiltersToTable(whereFilters, dims);
      filters = addDefaultYearLimit(dims, filters);
      const raw = await fetchData({ tblId: path, filters });
      const rows = normalizeResponse(raw);
      return { path, dims, rows };
    })
  );

  const fetchTimeMs = Date.now() - startFetch;

  // Алдаа шалгах
  const failedResults = tableResults.filter(r => r.status === 'rejected');
  if (failedResults.length > 0) {
    const msgs = failedResults.map(r => (r as PromiseRejectedResult).reason?.message ?? 'Татахад алдаа гарлаа');
    const error = failedResults.length === tablePaths.length
      ? msgs[0]
      : `${failedResults.length}/${tablePaths.length} хүснэгт ачаалахад алдаа: ${msgs.join('; ')}`;
    return NextResponse.json({ ok: false, error, errorType: 'FETCH', suggestion: 'Хүснэгтийн замыг шалгана уу' }, { status: 502 });
  }

  // 3. Table name mapping үүсгэх
  const mapping = tablePaths.map(({ path, alias }) => ({
    path,
    name: tableNameFromPath(path),
    alias,
  }));

  // 4. DuckDB-д ачаалах өгөгдөл бэлтгэх
  const tableData: Record<string, ReturnType<typeof normalizeResponse>> = {};
  const allDims: DimMeta[] = [];
  let schemaColumns: ColumnInfo[] = [];
  let totalRows = 0;

  for (const result of tableResults) {
    if (result.status === 'fulfilled') {
      const { path, dims, rows } = result.value;
      const tblName = tableNameFromPath(path);
      tableData[tblName] = rows;
      totalRows += rows.length;
      allDims.push(...dims);
      if (!schemaColumns.length) {
        schemaColumns = buildSchemaInfo(tblName, rows, dims);
      }
    }
  }

  // Row limit: max 500,000 total rows across all tables
  if (totalRows > 500_000) {
    return NextResponse.json({
      ok: false,
      error: `Нийт ${totalRows.toLocaleString()} мөр — хэт их (500,000 хязгаар)`,
      errorType: 'DATA',
      suggestion: 'WHERE шүүлт нэмж өгөгдлийг багасгана уу',
    }, { status: 400 });
  }

  // 5. SQL дахь long path-уудыг богино нэрээр солих
  const duckSQL = replacePathsWithNames(resolvedSql, mapping);

  // 6. DuckDB ажиллуулах
  if (useDuckDB && Object.keys(tableData).length > 0) {
    const duckResult = await runSQL(duckSQL, tableData);

    if ('errorType' in duckResult) {
      // Fallback — анхны өгөгдлийг буцаах
      const firstRows = Object.values(tableData)[0] ?? [];
      return NextResponse.json({
        ok: true,
        rows: firstRows.slice(0, 500),
        count: firstRows.length,
        engine: 'api-fallback',
        schema: schemaColumns,
        duckdbError: duckResult.message,
        duckdbSuggestion: duckResult.suggestion,
        timing: { fetchMs: fetchTimeMs, sqlMs: 0, totalMs: fetchTimeMs },
        tablesLoaded: mapping.map(m => m.name),
      });
    }

    return NextResponse.json({
      ok: true,
      rows: duckResult.rows,
      count: duckResult.rowCount,
      engine: 'duckdb',
      schema: schemaColumns,
      timing: { fetchMs: fetchTimeMs, sqlMs: duckResult.executionTimeMs, totalMs: fetchTimeMs + duckResult.executionTimeMs },
      tablesLoaded: mapping.map(m => m.name),
      explain: {
        table: mapping.map(m => m.name).join(' + '),
        filters: [],
        limit: duckResult.rowCount,
      },
    });
  }

  // 7. API-only fallback
  const firstRows = Object.values(tableData)[0] ?? [];
  return NextResponse.json({
    ok: true,
    rows: firstRows.slice(0, 500),
    count: firstRows.length,
    engine: 'api-only',
    schema: schemaColumns,
    timing: { fetchMs: fetchTimeMs, sqlMs: 0, totalMs: fetchTimeMs },
    tablesLoaded: mapping.map(m => m.name),
  });
}
