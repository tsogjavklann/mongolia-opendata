/**
 * Saved queries — нэртэйгээр хадгалж байх SQL-ууд.
 * localStorage-д суурилсан (login-гүй ч ажиллана). Дараа login-той үед
 * cloud sync нэмэх боломжтой.
 */

const LS_KEY = 'mn_saved_queries';
const MAX_QUERIES = 100;
const MAX_TOTAL_BYTES = 2_000_000; // 2 MB

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: number;
  updatedAt: number;
}

export function listSavedQueries(): SavedQuery[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedQuery[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

function persist(queries: SavedQuery[]): void {
  // Хэрэв 2MB-ыг даавал хамгийн хуучин-уудыг устгана
  let trimmed = queries.slice(0, MAX_QUERIES);
  while (trimmed.length > 0 && new Blob([JSON.stringify(trimmed)]).size > MAX_TOTAL_BYTES) {
    trimmed = trimmed.slice(0, -1);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
}

export function saveQuery(name: string, sql: string): SavedQuery {
  const now = Date.now();
  const id = `q_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: SavedQuery = {
    id,
    name: name.trim() || 'Untitled query',
    sql,
    createdAt: now,
    updatedAt: now,
  };
  persist([entry, ...listSavedQueries()]);
  return entry;
}

export function updateQuery(id: string, patch: Partial<Pick<SavedQuery, 'name' | 'sql'>>): void {
  const all = listSavedQueries();
  const next = all.map(q =>
    q.id === id
      ? { ...q, ...patch, updatedAt: Date.now() }
      : q,
  );
  persist(next);
}

export function deleteQuery(id: string): void {
  persist(listSavedQueries().filter(q => q.id !== id));
}

export function findByName(name: string): SavedQuery | undefined {
  return listSavedQueries().find(q => q.name === name);
}
