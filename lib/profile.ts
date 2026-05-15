/**
 * Локал хэрэглэгчийн profile — localStorage-аар хадгална.
 * Auth.js (OAuth) шаардахгүй, энгийн овог/нэр/утас/email бүртгэл.
 */

export interface LocalProfile {
  surname: string;
  name: string;
  phone: string;
  email: string;
  createdAt: number;
}

const KEY = 'mn_local_profile';

export function loadProfile(): LocalProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LocalProfile;
    if (!p.email || !p.name) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: Omit<LocalProfile, 'createdAt'>): LocalProfile {
  const full: LocalProfile = { ...p, createdAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent('mn-profile-change'));
  } catch {
    /* ignore quota errors */
  }
  return full;
}

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('mn-profile-change'));
  } catch {
    /* ignore */
  }
}

// ── Validation helpers ──────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+()-]{6,16}$/;

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof Omit<LocalProfile, 'createdAt'>, string>>;
}

export function validateProfile(p: Partial<Omit<LocalProfile, 'createdAt'>>): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!p.surname?.trim()) errors.surname = 'Овгоо оруулна уу';
  else if (p.surname.trim().length < 2) errors.surname = 'Хэт богино';

  if (!p.name?.trim()) errors.name = 'Нэрээ оруулна уу';
  else if (p.name.trim().length < 2) errors.name = 'Хэт богино';

  if (!p.phone?.trim()) errors.phone = 'Утас оруулна уу';
  else if (!PHONE_RE.test(p.phone.trim())) errors.phone = 'Зөв формат: 99119911 эсвэл +976...';

  if (!p.email?.trim()) errors.email = 'Email оруулна уу';
  else if (!EMAIL_RE.test(p.email.trim())) errors.email = 'Зөв email биш';

  return { ok: Object.keys(errors).length === 0, errors };
}
