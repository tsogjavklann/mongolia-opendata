import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'UPSTREAM'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TIMEOUT: 504,
  UPSTREAM: 502,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

const DEFAULT_MSG: Record<ApiErrorCode, string> = {
  BAD_REQUEST: 'Хүсэлт буруу байна',
  UNAUTHORIZED: 'Нэвтрэх шаардлагатай',
  NOT_FOUND: 'Олдсонгүй',
  TIMEOUT: 'Хүсэлт хэт удсан',
  UPSTREAM: 'Эх сурвалжийн алдаа',
  RATE_LIMITED: 'Хэт олон хүсэлт — түр хүлээгээд дахин оролдоно уу',
  INTERNAL: 'Серверийн алдаа гарлаа',
};

type ApiErrorOpts = {
  publicMessage?: string;
  suggestion?: string;
  errorType?: string;
  cause?: unknown;
  logContext?: Record<string, unknown> | string;
};

export function apiError(code: ApiErrorCode, opts: ApiErrorOpts = {}) {
  const status = STATUS[code];
  const message = opts.publicMessage ?? DEFAULT_MSG[code];

  if (status >= 500 || code === 'UPSTREAM' || code === 'TIMEOUT') {
    console.error(`[api ${code}]`, opts.logContext ?? '', opts.cause ?? '');
  } else {
    console.warn(`[api ${code}]`, opts.logContext ?? '');
  }

  return NextResponse.json(
    {
      ok: false,
      error: message,
      errorType: opts.errorType ?? code,
      ...(opts.suggestion ? { suggestion: opts.suggestion } : {}),
    },
    { status },
  );
}
