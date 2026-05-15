import { signIn, auth, authIsConfigured, googleEnabled, githubEnabled } from '@/auth';
import { redirect } from 'next/navigation';
import { Database, Sparkles, ShieldCheck, Bookmark, History, ArrowLeft, Github } from 'lucide-react';
import { GoogleIcon } from '@/components/AuthButton';

export const metadata = { title: 'Нэвтрэх — Mongolia OpenData' };

const PERKS = [
  { Icon: Bookmark, label: 'SQL хадгалах', desc: 'Дуртай query-уудаа нэрлэн хадгална' },
  { Icon: History, label: 'Cloud түүх', desc: 'Бүх төхөөрөмж дээр түүх синк' },
  { Icon: ShieldCheck, label: 'Хувийн орчин', desc: 'Зөвхөн та өөрийн өгөгдлийг харна' },
];

export default async function LoginPage() {
  if (authIsConfigured) {
    const session = await auth();
    if (session?.user) redirect('/');
  }

  async function googleAction() {
    'use server';
    await signIn('google', { redirectTo: '/' });
  }
  async function githubAction() {
    'use server';
    await signIn('github', { redirectTo: '/' });
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-6">
      <div className="grid lg:grid-cols-[1.1fr_1fr] w-full max-w-5xl rounded-2xl border border-border bg-card overflow-hidden shadow-floating">
        {/* ── LEFT: Brand panel ──────────────────────────── */}
        <div className="relative p-10 lg:p-12 overflow-hidden bg-gradient-to-br from-surface-darker to-surface min-h-[420px]">
          {/* Decorative gradient blobs */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full opacity-50 blur-3xl"
            style={{
              background: 'radial-gradient(circle, var(--c-accent-glow) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{
              background: 'radial-gradient(circle, var(--c-accent2-glow) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow-green"
              style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent2))' }}
            >
              <Database size={22} className="text-white" strokeWidth={2.5} />
            </div>

            <h1
              className="mt-6 text-3xl lg:text-4xl font-display font-extrabold leading-tight tracking-tight text-foreground"
            >
              Mongolia
              <span
                className="ml-2"
                style={{
                  background: 'linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent2) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                OpenData
              </span>
            </h1>

            <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed max-w-sm">
              ҮСХ-ын 1,282 статистик хүснэгтийг SQL, AI, Python-аар хайж график
              үүсгэх premium engine.
            </p>

            <div className="mt-9 space-y-4">
              {PERKS.map(({ Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-display font-semibold text-foreground leading-tight">
                      {label}
                    </div>
                    <div className="text-[12px] text-muted-foreground leading-snug mt-0.5">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-2 text-[10.5px] text-muted-foreground font-mono uppercase tracking-wider">
              <Sparkles size={11} className="text-accent" />
              ҮСХ — DATA.1212.MN — 1,282 TABLES
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth panel ──────────────────────────── */}
        <div className="p-10 lg:p-12 flex flex-col">
          <h2 className="text-2xl font-display font-bold text-foreground">Тавтай морил</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Аккаунтаараа нэвтрэн query-уудаа хадгал.
          </p>

          {authIsConfigured ? (
            <div className="space-y-2.5 mt-7">
              {googleEnabled && (
                <form action={googleAction}>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-xl border border-border bg-surface-darker/60 hover:bg-surface-raised hover:border-accent/40 transition-all text-[14px] font-display font-semibold text-foreground"
                  >
                    <GoogleIcon size={20} />
                    Google-оор үргэлжлүүлэх
                  </button>
                </form>
              )}
              {githubEnabled && (
                <form action={githubAction}>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-xl border border-border bg-surface-darker/60 hover:bg-surface-raised hover:border-accent/40 transition-all text-[14px] font-display font-semibold text-foreground"
                  >
                    <Github size={18} />
                    GitHub-оор үргэлжлүүлэх
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-accent3/30 bg-accent3-dim p-4 mt-7">
              <div className="text-[13px] text-accent3 font-display font-semibold mb-1">
                Auth тохиргоо хийгдээгүй
              </div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                Production-д идэвхжүүлэхийн тулд env-д{' '}
                <code className="text-accent2 font-mono">AUTH_SECRET</code>,{' '}
                <code className="text-accent2 font-mono">AUTH_GOOGLE_ID</code>,{' '}
                <code className="text-accent2 font-mono">AUTH_GOOGLE_SECRET</code> тавина уу.
                <br />
                <br />
                <strong className="text-foreground">GitHub нэмэх:</strong>{' '}
                <code className="text-accent2 font-mono">AUTH_GITHUB_ID</code>,{' '}
                <code className="text-accent2 font-mono">AUTH_GITHUB_SECRET</code>
              </div>
            </div>
          )}

          <div className="mt-auto pt-8 space-y-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-accent transition-colors no-underline"
            >
              <ArrowLeft size={13} /> Аккаунтгүйгээр үргэлжлүүлэх
            </a>

            <div className="text-[10.5px] text-muted-foreground/70 font-mono leading-relaxed">
              Нэвтэрснээр Mongolia OpenData-ийн Үйлчилгээний нөхцөл ба Нууцлалын
              бодлогыг зөвшөөрсөнд тооцно.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
