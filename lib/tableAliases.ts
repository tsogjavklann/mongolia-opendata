/**
 * Хүснэгтийн alias систем
 * public/aliases.json-аас 1282 хүснэгтийн alias-г ачаалдаг
 *
 * Alias дүрэм: {subcategory}_{sequence}
 * Жишээ: gdp_2, cpi_21, health_3, livestock_1, gender_1
 */

export interface TableAlias {
  alias: string;
  id: string;
  path: string;
  label: string;
  category: string;
}

let _aliases: TableAlias[] | null = null;
let _byAlias: Map<string, TableAlias> | null = null;

/** Client-side: fetch /aliases.json */
export async function loadAliases(): Promise<TableAlias[]> {
  if (_aliases) return _aliases;
  try {
    const res = await fetch('/aliases.json');
    const data = await res.json() as TableAlias[];
    _aliases = data;
    _byAlias = new Map(data.map(a => [a.alias, a]));
    return data;
  } catch { return []; }
}

/** Server-side: aliases.json + DEFAULT_ALIASES merge хийнэ (DEFAULT эрхэмлэлтэй) */
export function loadAliasesSync(): TableAlias[] {
  if (_aliases) return _aliases;
  if (typeof window !== 'undefined') {
    _aliases = DEFAULT_ALIASES;
    _byAlias = new Map(DEFAULT_ALIASES.map(a => [a.alias, a]));
    return DEFAULT_ALIASES;
  }

  let fileAliases: TableAlias[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const candidates = [
      path.join(process.cwd(), 'public', 'aliases.json'),
      path.join(__dirname, '..', 'public', 'aliases.json'),
      path.join(__dirname, '..', '..', 'public', 'aliases.json'),
      path.join(__dirname, '..', '..', '..', 'public', 'aliases.json'),
    ];
    for (const filePath of candidates) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        fileAliases = JSON.parse(raw) as TableAlias[];
        break;
      } catch { /* try next */ }
    }
  } catch (e) {
    console.warn('[tableAliases] fs error:', e instanceof Error ? e.message : e);
  }

  // Merge: DEFAULT_ALIASES эрхэм (тэдгээр нь curated, гараар хийсэн)
  const merged = new Map<string, TableAlias>();
  for (const a of fileAliases) merged.set(a.alias, a);
  for (const a of DEFAULT_ALIASES) merged.set(a.alias, a); // override
  _aliases = Array.from(merged.values());
  _byAlias = merged;
  return _aliases;
}

/** SQL-д alias → бүтэн зам орлуулах */
export function resolveAliases(sql: string): string {
  const aliases = loadAliasesSync();
  if (!aliases.length) return sql;
  const map = _byAlias ?? new Map(aliases.map(a => [a.alias, a]));
  return sql.replace(/(FROM|JOIN)\s+["'`]([^"'`\n]+)["'`]/gi, (match, kw, name) => {
    const a = map.get(name.trim());
    if (!a) return match;
    const path = a.path.endsWith('.px') ? a.path : a.path + '.px';
    return `${kw} "${path}"`;
  });
}

export const DEFAULT_ALIASES: TableAlias[] = [
  { alias: 'population',   id: 'DT_NSO_0300_001V3', label: 'Хүн амын тоо',      category: 'Хүн ам, өрх',      path: 'Population, household/1_Population, household/DT_NSO_0300_001V3.px' },
  { alias: 'gdp',          id: 'DT_NSO_0500_002V1', label: 'ДНБ (салбараар)',   category: 'Эдийн засаг',      path: 'Economy, environment/National Accounts/DT_NSO_0500_002V1.px' },
  { alias: 'inflation',    id: 'DT_NSO_0600_013V2', label: 'Инфляци (ХҮИ)',     category: 'Эдийн засаг',      path: 'Regional development/Price/DT_NSO_0600_013V2.px' },
  { alias: 'unemployment', id: 'DT_NSO_0400_020V2_10', label: 'Ажилгүйдэл',    category: 'Хөдөлмөр, бизнес', path: 'Regional development/Labour and business/DT_NSO_0400_020V2_10.px' },
  { alias: 'livestock',    id: 'DT_NSO_1001_109V1', label: 'Малын тоо толгой', category: 'Мал аж ахуй',     path: 'Regional development/Livestock/DT_NSO_1001_109V1.px' },
];
