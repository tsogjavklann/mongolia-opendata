import { NextResponse } from 'next/server';
import { fetchTableList } from '@/lib/apiClient';
import { apiError } from '@/lib/apiError';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await fetchTableList();
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return apiError('UPSTREAM', { publicMessage: 'Хүснэгтийн жагсаалт татаж чадсангүй', cause: e });
  }
}
