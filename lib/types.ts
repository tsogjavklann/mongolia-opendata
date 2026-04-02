import type { DataRow } from './transform';

export interface DimMeta {
  code: string;
  label: string;
  englishAlias: string;
  values: { code: string; label: string }[];
}

export interface TableEntry {
  id: string;
  path: string;
  text: string;
  category?: string;
  _alias?: string;
}

export interface ParsedFilter {
  code: string;
  values: string[];
  displayValues: string[];
  operator: string;
}

export interface Explain {
  table: string;
  filters: string[];
  limit: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  mongolianName?: string;
  englishAlias?: string;
  sampleValues?: string[];
}

export interface QueryResult {
  rows: DataRow[];
  count: number;
  raw?: unknown;
  timing?: { fetchMs: number; sqlMs: number; totalMs: number };
  parsed?: { filters: ParsedFilter[] };
  explain?: Explain;
  engine?: string;
  schema?: ColumnInfo[];
  duckdbError?: string;
  duckdbSuggestion?: string;
}

export interface HistoryEntry {
  sql: string;
  label: string;
  ts: number;
}
