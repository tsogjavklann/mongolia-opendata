import { NextRequest, NextResponse } from 'next/server';
import { ENGLISH_ALIASES } from '@/lib/dimensionMap';
import { fetchTableMeta } from '@/lib/apiClient';
import { cacheGet, cacheSet } from '@/lib/cache';
import { apiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return apiError('BAD_REQUEST', { publicMessage: 'path параметр заавал байх ёстой' });
  if (path.length > 500 || !/^[\w./\- ()]+$/i.test(path)) {
    return apiError('BAD_REQUEST', { publicMessage: 'path формат буруу' });
  }

  // Cache — зөвхөн амжилттай dims хадгална
  const cacheKey = `dims:${path}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) return NextResponse.json({ ok: true, dims: cached });

  try {
    // apiClient.ts-ийн fetchTableMeta ашиглана (retry + зөв URL encoding)
    const meta = await fetchTableMeta(path) as Record<string, unknown>;
    const variables = (meta?.variables ?? []) as Array<{
      code: string; text: string; values: string[]; valueTexts: string[];
    }>;

    const dims = variables.map(v => ({
      code: v.code,
      label: v.text,
      englishAlias: ENGLISH_ALIASES[v.text] ?? v.text,
      values: (v.values ?? []).map((c: string, i: number) => ({
        code: c,
        label: v.valueTexts?.[i] ?? c,
      })),
    }));

    // Зөвхөн хоосон биш dims-г cache хийнэ
    if (dims.length > 0) {
      cacheSet(cacheKey, dims);
    }

    return NextResponse.json({ ok: true, dims });
  } catch (e) {
    return apiError('UPSTREAM', {
      publicMessage: 'Хүснэгтийн мета мэдээлэл татах үед алдаа',
      cause: e,
      logContext: { path },
    });
  }
}
