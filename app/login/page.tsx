import { signIn, auth, authIsConfigured } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Нэвтрэх — Mongolia OpenData' };

export default async function LoginPage() {
  if (authIsConfigured) {
    const session = await auth();
    if (session?.user) redirect('/');
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg, #050a14 0%, #070e1a 50%, #050a14 100%)',
      color: '#e2e8f0',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(12,19,34,0.85)',
        backdropFilter: 'blur(16px) saturate(1.5)',
        border: '1px solid rgba(26,45,74,0.4)',
        padding: '2.5rem',
        borderRadius: 14,
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #00d68f 0%, #0080ff 100%)',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: 'white',
        }}>M</div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Mongolia OpenData
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
          SQL query хадгалах болон бусад боломжуудад нэвтэрнэ үү.<br/>
          Login-гүйгээр ашиглаж бас болно.
        </p>

        {authIsConfigured ? (
          <form action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}>
            <button type="submit" style={{
              width: '100%',
              background: 'white',
              color: '#0c1322',
              padding: '12px 16px',
              border: 0,
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.48a4.8 4.8 0 0 1 0-3.04V5.37H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.37L4.5 7.44a4.77 4.77 0 0 1 4.48-3.26z"/>
              </svg>
              Google-ээр нэвтрэх
            </button>
          </form>
        ) : (
          <div style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: '#fbbf24',
            padding: 14,
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            <strong>Auth тохиргоо хийгдээгүй.</strong>
            <br />
            Production-д идэвхжүүлэхийн тулд Vercel env-д AUTH_SECRET,
            AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET тавина уу.
          </div>
        )}

        <a href="/" style={{
          display: 'block', textAlign: 'center',
          marginTop: 16, color: '#64748b',
          fontSize: 13, textDecoration: 'none',
        }}>
          ← Нүүр хуудас
        </a>
      </div>
    </main>
  );
}
