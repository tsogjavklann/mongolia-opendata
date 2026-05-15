'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Database,
  ArrowRight,
  Check,
  ShieldCheck,
  Bookmark,
  History,
  Github,
  User,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/AuthButton';
import { saveProfile, validateProfile, loadProfile, type LocalProfile } from '@/lib/profile';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  authConfigured: boolean;
  googleEnabled: boolean;
  githubEnabled: boolean;
  onContinueAnonymously: () => void;
  onProfileSaved?: (p: LocalProfile) => void;
}

const PERKS = [
  { Icon: Bookmark, label: 'SQL хадгалах', desc: 'Дуртай query-уудаа нэрлэн хадгална' },
  { Icon: History, label: 'Хайлтын түүх', desc: 'Сүүлийн 30 query брoузерт хадгалагдана' },
  { Icon: ShieldCheck, label: 'Хувийн орчин', desc: 'Бүх өгөгдөл локал — сервер дамждаггүй' },
];

export function WelcomeModal({
  open,
  onOpenChange,
  authConfigured,
  googleEnabled,
  githubEnabled,
  onContinueAnonymously,
  onProfileSaved,
}: Props) {
  // Default tab — if user already has a saved profile, default to "signin" so they
  // see "Continue as ..." rather than the empty registration form.
  const [tab, setTab] = useState<'register' | 'signin'>('register');
  const [existingProfile, setExistingProfile] = useState<LocalProfile | null>(null);

  useEffect(() => {
    if (!open) return;
    const p = loadProfile();
    setExistingProfile(p);
    setTab(p ? 'signin' : 'register');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-border bg-card">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* ── LEFT: Brand panel ───────────────────────────── */}
          <div className="relative p-8 md:p-9 overflow-hidden bg-gradient-to-br from-surface-darker to-surface">
            <div
              className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full opacity-50 blur-3xl"
              style={{
                background: 'radial-gradient(circle, var(--c-accent-glow) 0%, transparent 70%)',
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-10 h-60 w-60 rounded-full opacity-40 blur-3xl"
              style={{
                background: 'radial-gradient(circle, var(--c-accent2-glow) 0%, transparent 70%)',
              }}
            />

            <div className="relative">
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl shadow-glow-green"
                style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent2))' }}
              >
                <Database size={20} className="text-white" strokeWidth={2.5} />
              </div>

              <DialogTitle asChild>
                <h2 className="mt-5 text-[26px] font-display font-extrabold leading-tight text-foreground">
                  Mongolia
                  <span
                    className="ml-1.5"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent2) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    OpenData
                  </span>
                </h2>
              </DialogTitle>

              <DialogDescription asChild>
                <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed max-w-[300px]">
                  ҮСХ-ын 1,282 статистик хүснэгтийг SQL, AI, Python-аар хайж график үүсгэ.
                </p>
              </DialogDescription>

              <div className="mt-7 space-y-3">
                {PERKS.map(({ Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim text-accent flex-shrink-0">
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-display font-semibold text-foreground leading-tight">
                        {label}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-2 text-[10.5px] text-muted-foreground font-mono uppercase tracking-wider">
                <Sparkles size={10} className="text-accent" />
                ҮСХ — DATA.1212.MN
              </div>
            </div>
          </div>

          {/* ── RIGHT: Auth panel ───────────────────────────── */}
          <div className="p-8 md:p-9 flex flex-col">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as 'register' | 'signin')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="register">Бүртгүүлэх</TabsTrigger>
                <TabsTrigger value="signin">Нэвтрэх</TabsTrigger>
              </TabsList>

              {/* ── REGISTER (simple local form) ───────────── */}
              <TabsContent value="register" className="space-y-3 mt-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Шинэ бүртгэл
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1">
                    Нэр, утас, email-ээ оруулна уу. Сервер дамжихгүй, зөвхөн брoузерт хадгалагдана.
                  </p>
                </div>

                <RegisterForm
                  onDone={(p) => {
                    onProfileSaved?.(p);
                    onOpenChange(false);
                  }}
                />
              </TabsContent>

              {/* ── SIGN IN (OAuth + saved profile) ───────── */}
              <TabsContent value="signin" className="space-y-3 mt-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Тавтай морил
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1">
                    {existingProfile
                      ? 'Өмнө нь бүртгэлтэй байна — үргэлжлүүлнэ үү.'
                      : 'Аккаунтаараа нэвтрэх эсвэл шинээр бүртгүүлнэ үү.'}
                  </p>
                </div>

                {existingProfile && (
                  <Button
                    className="w-full justify-between h-12 rounded-xl"
                    onClick={() => onOpenChange(false)}
                  >
                    <span className="flex items-center gap-2">
                      <User size={14} />
                      <span>
                        {existingProfile.surname} {existingProfile.name}
                      </span>
                    </span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {(googleEnabled || githubEnabled) && (
                  <>
                    {existingProfile && <Separator className="my-3" />}
                    <div className="space-y-2">
                      {googleEnabled && <ProviderLink provider="google" label="Google" />}
                      {githubEnabled && <ProviderLink provider="github" label="GitHub" />}
                    </div>
                  </>
                )}

                {!authConfigured && !existingProfile && (
                  <div className="rounded-lg border border-accent3/30 bg-accent3-dim p-3">
                    <div className="text-[11.5px] text-accent3 font-display font-semibold mb-0.5">
                      OAuth тохиргоо хийгдээгүй
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      Google/GitHub нэвтрэх горим идэвхгүй. Бүртгүүлэх tab-аас нэр/email
                      оруулж энгийн profile үүсгэж болно.
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={onContinueAnonymously}
                >
                  Аккаунтгүйгээр үргэлжлүүлэх
                  <ArrowRight size={13} />
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-auto pt-4 text-[10px] text-muted-foreground/70 font-mono leading-relaxed">
              Бүртгэл бүхэлдээ таны брoузерт хадгалагдах бөгөөд гурав дагч талд дамжуулагдахгүй.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────
function RegisterForm({ onDone }: { onDone: (p: LocalProfile) => void }) {
  const [form, setForm] = useState({ surname: '', name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateProfile(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSubmitting(true);
    try {
      const saved = saveProfile({
        surname: form.surname.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      toast.success(`Тавтай морил, ${saved.name}!`);
      onDone(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field
          icon={<User size={12} />}
          label="Овог"
          placeholder="Доржийн"
          value={form.surname}
          onChange={(v) => update('surname', v)}
          error={errors.surname}
          autoFocus
        />
        <Field
          icon={<User size={12} />}
          label="Нэр"
          placeholder="Бат"
          value={form.name}
          onChange={(v) => update('name', v)}
          error={errors.name}
        />
      </div>
      <Field
        icon={<Phone size={12} />}
        label="Утас"
        placeholder="99119911"
        value={form.phone}
        onChange={(v) => update('phone', v)}
        error={errors.phone}
        type="tel"
      />
      <Field
        icon={<Mail size={12} />}
        label="Email"
        placeholder="bat@example.mn"
        value={form.email}
        onChange={(v) => update('email', v)}
        error={errors.email}
        type="email"
      />

      <Button type="submit" className="w-full mt-2 h-11" disabled={submitting}>
        {submitting ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
        Бүртгүүлэх
      </Button>

      <div className="text-[10.5px] text-muted-foreground/70 leading-relaxed text-center">
        Нууц үг шаардахгүй. Мэдээлэл зөвхөн таны браузерт.
      </div>
    </form>
  );
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  autoFocus,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[11px] font-display font-semibold text-muted-foreground mb-1">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className={error ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20' : ''}
      />
      {error && (
        <span className="block mt-1 text-[10.5px] text-destructive font-mono">{error}</span>
      )}
    </label>
  );
}

function ProviderLink({ provider, label }: { provider: 'google' | 'github'; label: string }) {
  const href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent('/')}`;
  return (
    <a
      href={href}
      className="w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-xl border border-border bg-surface-darker/60 hover:bg-surface-raised hover:border-accent/40 transition-all text-sm font-display font-semibold text-foreground no-underline"
    >
      {provider === 'google' ? <GoogleIcon size={18} /> : <Github size={18} />}
      {label}-оор үргэлжлүүлэх
    </a>
  );
}
