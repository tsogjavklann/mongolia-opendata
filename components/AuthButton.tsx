'use client';

import { useEffect, useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';

type SessionUser = { name?: string | null; email?: string | null; image?: string | null };

/**
 * Header AuthButton — клиент талаас /api/auth/session-ийг poll хийж
 * нэвтэрсэн хэрэглэгчийн avatar/нэрийг харуулна. Session алгад "Нэвтрэх"
 * товч /login руу заана. Auth тохируулагдаагүй ч /login-аас "Тохиргоо
 * хийгдээгүй" гэсэн мессеж харагдах болно.
 */
export default function AuthButton() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (!cancelled) setUser(s?.user ?? null); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, []);

  if (user === undefined) {
    return <div style={{ width: 88, height: 28 }} />;
  }

  if (user) {
    return (
      <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
        <button type="submit" className="btn-ghost" title={user.email ?? 'Гарах'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {user.image ? (
            <img src={user.image} alt="" width={18} height={18}
              style={{ borderRadius: '50%' }} />
          ) : (
            <User size={14} />
          )}
          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name?.split(' ')[0] ?? 'User'}
          </span>
          <LogOut size={12} style={{ opacity: 0.6 }} />
        </button>
      </form>
    );
  }

  return (
    <a href="/login" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
      <LogIn size={12} /> Нэвтрэх
    </a>
  );
}
