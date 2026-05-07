import { NextRequest, NextResponse } from 'next/server';
import { fetchData, DataPayload } from '@/lib/apiClient';
import { normalizeResponse } from '@/lib/transform';
import { apiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let payload: DataPayload;
  try {
    payload = await req.json();
  } catch {
    return apiError('BAD_REQUEST', { publicMessage: 'JSON формат буруу байна' });
  }

  if (!payload?.tblId || typeof payload.tblId !== 'string') {
    return apiError('BAD_REQUEST', { publicMessage: 'tblId заавал байна' });
  }
  // Path traversal protection — only allow safe PX-Web style paths
  if (payload.tblId.length > 500 || !/^[\w./\- ()]+$/i.test(payload.tblId)) {
    return apiError('BAD_REQUEST', { publicMessage: 'tblId формат буруу' });
  }

  try {
    const raw = await fetchData(payload);
    const rows = normalizeResponse(raw);
    return NextResponse.json({ ok: true, rows, count: rows.length, raw, payload });
  } catch (e) {
    return apiError('UPSTREAM', {
      publicMessage: '1212.mn-аас өгөгдөл татах үед алдаа гарлаа',
      suggestion: 'tblId болон шүүлтийг шалгана уу',
      cause: e,
      logContext: { tblId: payload.tblId },
    });
  }
}
