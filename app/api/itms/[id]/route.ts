import { NextResponse } from 'next/server';
import { fetchItmDimensions } from '@/lib/apiClient';
import { apiError } from '@/lib/apiError';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || id.length > 64 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return apiError('BAD_REQUEST', { publicMessage: 'Хүснэгтийн ID буруу' });
  }
  try {
    const data = await fetchItmDimensions(id);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return apiError('UPSTREAM', {
      publicMessage: 'Хүснэгтийн dimension татах үед алдаа',
      cause: e,
      logContext: { id },
    });
  }
}
