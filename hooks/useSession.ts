'use client';

import { useEffect, useState, useCallback } from 'react';

export type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unauthenticated'; user: null };

export function useSession(): SessionState & { refresh: () => void } {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });

  const refresh = useCallback(() => {
    setState({ status: 'loading', user: null });
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.user) setState({ status: 'authenticated', user: s.user });
        else setState({ status: 'unauthenticated', user: null });
      })
      .catch(() => setState({ status: 'unauthenticated', user: null }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
