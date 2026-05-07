import { NextResponse } from 'next/server';
import { fetchItmDimensions } from '@/lib/apiClient';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || !/^[A-Za-z0-9_]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid table ID' }, { status: 400 });
  }
  try {
    const data = await fetchItmDimensions(id);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[/api/itms/${id}]`, msg);
    return NextResponse.json({ ok: false, error: msg, data: null }, { status: 500 });
  }
}
