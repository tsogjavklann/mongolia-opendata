/**
 * 1212.mn PX-Web API client (data.1212.mn:443)
 * Шинэ API: https://data.1212.mn:443/api/v1/mn/NSO/{path}.px
 * Формат: json-stat2
 */

import { cacheGet, cacheSet } from './cache';

const BASE = 'https://data.1212.mn:443/api/v1/mn/NSO';

const pending = new Map<string, Promise<unknown>>();

/** Encode a path for the PX-Web API — encode each segment properly */
function encodePath(rawPath: string): string {
  return rawPath.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

/** Deduplicate concurrent requests for the same key */
async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const inflight = pending.get(key);
  if (inflight) return inflight as Promise<T>;
  const promise = fn().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options });
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
}

export interface TableInfo {
  id: string;
  path: string;
  title: string;
  updated?: string;
}

/** 
 * GET /api/v1/mn/NSO — хүснэгтийн жагсаалт (рекурсив)
 * PX-Web-д /api/v1/{lang}/{db} руу GET хийхэд folder/table жагсаалт буцаана
 */
export async function fetchTableList(path = ''): Promise<unknown[]> {
  const cacheKey = `tables:${path}`;
  const cached = cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  return dedupe(cacheKey, async () => {
    const url = path ? `${BASE}/${encodePath(path)}` : BASE;
    const res = await fetchWithRetry(url, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Table list API returned ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    cacheSet(cacheKey, list);
    return list;
  });
}

/**
 * GET /api/v1/mn/NSO/{path}.px — хүснэгтийн metadata (dimension-ууд)
 */
export async function fetchTableMeta(path: string): Promise<unknown> {
  const cacheKey = `meta:${path}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  return dedupe(cacheKey, async () => {
    const fullPath = path.endsWith('.px') ? path : path + '.px';
    const url = BASE + '/' + encodePath(fullPath);
    const res = await fetchWithRetry(url, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Meta API returned ${res.status}`);
    const data = await res.json();
    cacheSet(cacheKey, data);
    return data;
  });
}

/**
 * GET /api/v1/mn/NSO/{id} — хүснэгтийн dimension-ууд (id-ээр хайх)
 */
export async function fetchItmDimensions(id: string): Promise<unknown> {
  const cacheKey = `itm-dims:${id}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  return dedupe(cacheKey, async () => {
    // First get the table list to find the full path for this ID
    const tables = await fetchTableList() as Array<{ id?: string; path?: string }>;
    const entry = tables.find(t => t.id === id || t.id === `${id}.px`);
    if (!entry?.path) throw new Error(`Хүснэгт олдсонгүй: ${id}`);

    const meta = await fetchTableMeta(entry.path);
    cacheSet(cacheKey, meta);
    return meta;
  });
}

export interface PxFilter {
  code: string;       // dimension нэр, жш: "Хүйс", "Он", "Нас"
  values: string[];   // утгын жагсаалт, жш: ["0", "1", "2"]
}

export interface DataPayload {
  tblId: string;       // хүснэгтийн зам, жш: "Population, household/1_Population, household/DT_NSO_0300_001V3.px"
  filters?: PxFilter[];
  limit?: number;
}

/**
 * POST /api/v1/mn/NSO/{path}.px
 * PX-Web json-stat2 формат
 */
export async function fetchData(payload: DataPayload): Promise<unknown> {
  // path дотор .px байхгүй бол нэм
  const rawPath = payload.tblId.endsWith('.px') ? payload.tblId : `${payload.tblId}.px`;
  const url = BASE + '/' + encodePath(rawPath);

  const query = (payload.filters ?? []).map(f => ({
    code: f.code,
    selection: {
      filter: 'item',
      values: f.values,
    }
  }));

  const body = {
    query,
    response: { format: 'json-stat2' }
  };

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(`Data API returned ${res.status}: ${text.slice(0, 300)}`);
  }

  return data;
}
