/**
 * DuckDB SQL Engine — @duckdb/node-api ашиглан жинхэнэ SQL ажиллуулна
 *
 * npm install @duckdb/node-api
 */

import { DataRow } from './transform';

export interface DuckDBResult {
  rows: DataRow[];
  columns: ColumnInfo[];
  rowCount: number;
  executionTimeMs: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  mongolianName?: string;
  englishAlias?: string;
  sampleValues?: string[];
}

export interface DuckDBError {
  message: string;
  suggestion: string;
  errorType: 'SQL' | 'DATA' | 'TIMEOUT';
}

function inferColumns(rows: DataRow[]): { name: string; type: 'DOUBLE' | 'VARCHAR' }[] {
  if (rows.length === 0) return [];
  const sample = rows.slice(0, 20);
  return Object.keys(rows[0]).map(name => {
    const isNumeric = sample.every(r => {
      const v = r[name];
      return v === null || v === undefined || typeof v === 'number' ||
        (typeof v === 'string' && v.trim() !== '' && !isNaN(parseFloat(v)));
    });
    return { name, type: (isNumeric ? 'DOUBLE' : 'VARCHAR') as 'DOUBLE' | 'VARCHAR' };
  });
}

/**
 * Cyrillic тэмдэгтүүд DuckDB Linux binding-д UTF-8 encoding bug бий.
 * Тиймээс identifier-ууд ба string value-уудыг бүхэлд нь ASCII tag-аар орлуулна:
 *   - Нэр: "Он" → "c_He_1"
 *   - Утга: "Нийт дүн" → "v_a3f2"
 * SQL execute хийхээс өмнө Cyrillic-ийг tag-аар орлуулж, үр дүнг буцааж label болгоно.
 */
export interface CyrillicMap {
  identifiers: { ascii: string; original: string }[];
  values: { ascii: string; original: string }[];
}

function safeAscii(name: string, prefix: string, used: Set<string>): string {
  let base = `${prefix}_${name.replace(/[^A-Za-z0-9_]/g, '').slice(0, 10) || 'x'}`;
  let candidate = base;
  let i = 0;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}_${++i}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function isAscii(s: string): boolean {
  return /^[\x00-\x7F]*$/.test(s);
}

function buildCyrillicMap(
  columnNames: string[],
  rows: DataRow[],
): CyrillicMap {
  const idUsed = new Set<string>();
  const identifiers: { ascii: string; original: string }[] = [];
  for (const name of columnNames) {
    if (isAscii(name)) {
      identifiers.push({ ascii: name, original: name });
      idUsed.add(name.toLowerCase());
    } else {
      identifiers.push({ ascii: safeAscii(name, 'c', idUsed), original: name });
    }
  }

  // Утгууд — Cyrillic string literal-уудыг tag болгох
  const valueUsed = new Set<string>();
  const valueMap = new Map<string, string>(); // original → ascii
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (typeof v !== 'string') continue;
      if (isAscii(v)) continue;
      if (!valueMap.has(v)) {
        valueMap.set(v, safeAscii(v, 'v', valueUsed));
      }
    }
  }
  const values = Array.from(valueMap.entries()).map(([original, ascii]) => ({ ascii, original }));
  return { identifiers, values };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** SQL дотор Cyrillic identifier болон string literal-уудыг ASCII tag-аар орлуулах */
function rewriteSQL(sql: string, map: CyrillicMap): string {
  let result = sql;

  // 1. Identifier (хашилттай ба хашилтгүй)
  const sortedIds = [...map.identifiers].sort((a, b) => b.original.length - a.original.length);
  for (const { ascii, original } of sortedIds) {
    if (ascii === original) continue;
    result = result.replace(new RegExp(`"${escapeRegex(original)}"`, 'g'), `"${ascii}"`);
    result = result.replace(
      new RegExp(`(^|[^"\\w\\u0400-\\u04FF])(${escapeRegex(original)})(?=$|[^"\\w\\u0400-\\u04FF])`, 'g'),
      (_, pre) => `${pre}"${ascii}"`,
    );
  }

  // 2. String literal-уудын доторх Cyrillic утгуудыг tag-аар орлуулах
  // SQL дотор '...' гэсэн литерал бүрд тохирох утга байгаа эсэхийг шалгана
  const sortedVals = [...map.values].sort((a, b) => b.original.length - a.original.length);
  for (const { ascii, original } of sortedVals) {
    // 'value' эсвэл "value" хэлбэрт байна
    const escaped = original.replace(/'/g, "''");
    result = result.replace(new RegExp(`'${escapeRegex(escaped)}'`, 'g'), `'${ascii}'`);
  }
  return result;
}

function formatError(msg: string): string {
  if (msg.includes('no such table') || msg.includes('does not exist'))
    return `Хүснэгт олдсонгүй — FROM-д зөв нэр бичнэ үү`;
  if (msg.includes('no such column') || msg.includes('Referenced column'))
    return `Багана олдсонгүй — Schema sidebar-аас баганы нэрийг шалгана уу`;
  if (msg.includes('syntax error'))
    return `SQL синтакс алдаатай`;
  if (msg.includes('ambiguous'))
    return `Багана давхцаж байна — хүснэгтийн нэрийг тодорхой зааж өгнө үү (жш: a."Он")`;
  if (msg.includes('type mismatch') || msg.includes('Conversion Error'))
    return `Өгөгдлийн төрөл таарахгүй — CAST() ашиглана уу`;
  if (msg.includes('division by zero'))
    return `Тэгд хуваасан — NULLIF(denominator, 0) ашиглана уу`;
  if (msg.includes('timeout') || msg.includes('90 секунд'))
    return `Query хэт удсан (90 сек) — LIMIT эсвэл WHERE шүүлт нэмнэ үү`;
  return msg;
}

function getSuggestion(msg: string): string {
  if (msg.includes('no such table')) return 'FROM-д хүснэгтийн зөв нэр бичнэ үү';
  if (msg.includes('no such column')) return 'Schema sidebar-аас баганы нэрийг copy хийнэ үү';
  if (msg.includes('syntax error')) return 'SQL бичлэгийг шалгана уу';
  if (msg.includes('ambiguous')) return 'Жишээ: a."Он" гэж хүснэгтийн alias ашиглана уу';
  if (msg.includes('type mismatch') || msg.includes('Conversion Error')) return 'CAST("Багана" AS DOUBLE) эсвэл CAST("Багана" AS VARCHAR) ашиглана уу';
  if (msg.includes('division by zero')) return 'NULLIF(хуваагч, 0) ашиглана уу';
  if (msg.includes('timeout') || msg.includes('90 секунд')) return 'LIMIT 1000 нэмэх эсвэл WHERE шүүлтээр өгөгдлийг багасгана уу';
  return 'SQL-г дахин шалгана уу';
}

export async function runSQL(
  userSQL: string,
  tableData: Record<string, DataRow[]>
): Promise<DuckDBResult | DuckDBError> {
  const startTime = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conn: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any = null;

  async function cleanup() {
    try {
      if (conn) { if (conn.closeSync) conn.closeSync(); else if (conn.close) await conn.close(); }
    } catch (e) {
      console.error('[DuckDB] conn cleanup error:', e);
    }
    try {
      if (instance) { if (instance.closeSync) instance.closeSync(); else if (instance.close) await instance.close(); }
    } catch (e) {
      console.error('[DuckDB] instance cleanup error:', e);
    }
    conn = null;
    instance = null;
  }

  try {
    // Dynamic import — @duckdb/node-api (optional dependency)
    // @ts-ignore — DuckDB may not be installed in serverless environments
    const duckdb = await import('@duckdb/node-api');
    instance = await duckdb.DuckDBInstance.create(':memory:');
    conn = await instance.connect();

    // Cyrillic identifier ба value-уудыг ASCII tag-аар орлуулах нэгдсэн map
    // (DuckDB Linux binding-ийн UTF-8 алдааг тойрох цогц шийдэл)
    const allColumnNames = new Set<string>();
    const allRows: DataRow[] = [];
    for (const rows of Object.values(tableData)) {
      if (!rows?.length) continue;
      for (const k of Object.keys(rows[0])) allColumnNames.add(k);
      allRows.push(...rows);
    }
    const cyrMap = buildCyrillicMap([...allColumnNames], allRows);
    const idAscii = (orig: string) => cyrMap.identifiers.find(m => m.original === orig)?.ascii ?? orig;
    const idReverse = (a: string) => cyrMap.identifiers.find(m => m.ascii === a)?.original ?? a;
    const valAscii = (orig: string) => cyrMap.values.find(m => m.original === orig)?.ascii ?? orig;
    const valReverse = (a: string) => cyrMap.values.find(m => m.ascii === a)?.original ?? a;

    // Өгөгдлийг хүснэгт болгон ачаалах (бүх Cyrillic-ийг ASCII tag-аар орлуулсан)
    for (const [tableName, rows] of Object.entries(tableData)) {
      if (!rows || rows.length === 0) continue;

      const columns = inferColumns(rows);
      const colDefs = columns.map(c => `"${idAscii(c.name)}" ${c.type}`).join(', ');
      await conn.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs})`);

      const BATCH = rows.length > 50_000 ? 100 : rows.length > 10_000 ? 200 : 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const vals = batch.map(row =>
          '(' + columns.map(c => {
            const v = row[c.name];
            if (v === null || v === undefined) return 'NULL';
            if (c.type === 'DOUBLE') {
              const n = typeof v === 'number' ? v : parseFloat(String(v));
              return isNaN(n) ? 'NULL' : String(n);
            }
            // String value — Cyrillic байвал ASCII tag болгох
            const sv = String(v);
            const safe = isAscii(sv) ? sv : valAscii(sv);
            return `'${safe.replace(/'/g, "''")}'`;
          }).join(', ') + ')'
        ).join(', ');
        await conn.run(`INSERT INTO "${tableName}" VALUES ${vals}`);
      }
    }

    // Хэрэглэгчийн SQL-ийг бүхэлд нь ASCII болгох (identifier + string literal-ууд)
    const rewrittenSQL = rewriteSQL(userSQL, cyrMap);

    // SQL ажиллуулах (90s timeout)
    const queryPromise = conn.run(rewrittenSQL);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout: 90 секундээс хэтэрсэн')), 90_000)
    );
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const rawRows = await result.getRows();
    const asciiColumnNames = result.columnNames();
    const columnNames = asciiColumnNames.map((c: string) => idReverse(c));

    const rows: DataRow[] = rawRows.map((row: unknown[]) => {
      const obj: DataRow = {};
      columnNames.forEach((col: string, i: number) => {
        const v = row[i];
        if (v === null || v === undefined) {
          obj[col] = '';
        } else if (typeof v === 'bigint') {
          obj[col] = Number(v);
        } else if (typeof v === 'string') {
          // Cyrillic ASCII tag-ыг буцаагаад жинхэнэ утга болгох
          obj[col] = valReverse(v);
        } else {
          obj[col] = v as string | number;
        }
      });
      return obj;
    });

    const columns: ColumnInfo[] = columnNames.map((name: string) => ({
      name,
      type: typeof rows[0]?.[name] === 'number' ? 'number' : 'text',
    }));

    await cleanup();
    return { rows, columns, rowCount: rows.length, executionTimeMs: Date.now() - startTime };

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const errorType: 'SQL' | 'DATA' | 'TIMEOUT' = msg.includes('timeout') || msg.includes('90 секунд') ? 'TIMEOUT' : 'SQL';
    return { message: formatError(msg), suggestion: getSuggestion(msg), errorType };
  } finally {
    await cleanup();
  }
}

export function buildSchemaInfo(
  tableName: string,
  rows: DataRow[],
  apiDims: Array<{ code: string; label: string; englishAlias: string; values: { code: string; label: string }[] }>
): ColumnInfo[] {
  if (rows.length === 0) return [];
  const columns = inferColumns(rows);
  return columns.map(col => {
    const dim = apiDims.find(d => d.label === col.name || d.code === col.name);
    const sampleVals = [...new Set(rows.slice(0, 50).map(r => String(r[col.name] ?? '')).filter(Boolean))].slice(0, 8);
    return {
      name: col.name,
      type: col.type === 'DOUBLE' ? 'number' : 'text',
      mongolianName: dim?.label,
      englishAlias: dim?.englishAlias,
      sampleValues: sampleVals,
    };
  });
}
