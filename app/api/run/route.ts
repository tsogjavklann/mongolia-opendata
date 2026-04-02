import { NextRequest, NextResponse } from 'next/server';
import { fetchData, DataPayload } from '@/lib/apiClient';
import { normalizeResponse } from '@/lib/transform';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let payload: DataPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload.tblId) {
    return NextResponse.json({ ok: false, error: 'tblId заавал байна' }, { status: 400 });
  }

  try {
    const raw = await fetchData(payload);
    const rows = normalizeResponse(raw);
    return NextResponse.json({ ok: true, rows, count: rows.length, raw, payload });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
