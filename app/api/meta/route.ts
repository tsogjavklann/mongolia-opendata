import { NextRequest, NextResponse } from 'next/server';
import { ENGLISH_ALIASES } from '@/lib/dimensionMap';
import { cacheGet, cacheSet } from '@/lib/cache';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BASE = 'https://data.1212.mn:443/api/v1/mn/NSO';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ ok: false, error: 'path required', dims: [] });

  const cacheKey = `meta:${path}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) return NextResponse.json({ ok: true, dims: cached });

  try {
    const clean = path.replace(/\.px$/i, '');
    // 1212.mn API нь зай болон таслалыг encode хийхгүй хүлээдэг
    // Зөвхөн URL-д аюултай тэмдэгтүүдийг (#, ?, &) encode хийнэ
    const url = BASE + '/' + clean
      .split('/')
      .map(seg => seg
        .replace(/%/g, '%25')   // % эхлээд
        .replace(/#/g, '%23')
        .replace(/\?/g, '%3F')
        .replace(/&/g, '%26')
      )
      .join('/');

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = await res.json() as Record<string, unknown>;
    const variables = (raw?.variables ?? []) as Array<{
      code: string; text: string; values: string[]; valueTexts: string[];
    }>;

    const dims = variables.map(v => ({
      code: v.code,
      label: v.text,
      // englishAlias included so browser doesn't need to re-map
      englishAlias: ENGLISH_ALIASES[v.text] ?? v.text,
      values: (v.values ?? []).map((c: string, i: number) => ({
        code: c,
        label: v.valueTexts?.[i] ?? c,
      })),
    }));

    cacheSet(cacheKey, dims);
    return NextResponse.json({ ok: true, dims });
  } catch (e) {
    console.error('[/api/meta]', String(e));
    return NextResponse.json({ ok: false, error: String(e), dims: [] }, { status: 500 });
  }
}
