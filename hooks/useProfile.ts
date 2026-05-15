'use client';

import { useEffect, useState, useCallback } from 'react';
import { loadProfile, type LocalProfile } from '@/lib/profile';

export function useProfile() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);

    const onChange = () => setProfile(loadProfile());
    window.addEventListener('mn-profile-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('mn-profile-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return { profile, hydrated, refresh };
}
