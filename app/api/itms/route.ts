import { NextResponse } from 'next/server';
import { fetchTableList } from '@/lib/apiClient';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await fetchTableList();
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, data: [] });
  }
}
