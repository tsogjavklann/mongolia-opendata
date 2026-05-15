'use client';

import { LogIn, LogOut, User, Settings, Github, Mail, Phone } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useProfile } from '@/hooks/useProfile';
import { clearProfile } from '@/lib/profile';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  onOpenAuthModal?: () => void;
}

export default function AuthButton({ onOpenAuthModal }: Props) {
  const { status, user } = useSession();
  const { profile, hydrated } = useProfile();

  // Loading skeleton — wait until both session check and localStorage hydration done
  if (status === 'loading' || !hydrated) {
    return <div className="w-8 h-8 rounded-full bg-surface-raised animate-pulse" />;
  }

  // ── Auth.js session takes priority over local profile
  if (status === 'authenticated' && user) {
    const initial = (user.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase();
    return (
      <TooltipProvider delayDuration={150}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-transform hover:scale-105"
                  aria-label="User menu"
                >
                  <Avatar>
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">{user.name ?? user.email ?? 'Профайл'}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-display font-semibold text-foreground truncate">
                    {user.name ?? 'Хэрэглэгч'}
                  </span>
                  {user.email && (
                    <span className="text-[10.5px] text-muted-foreground font-mono truncate">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Github size={13} className="text-muted-foreground" />
              OAuth · Auth.js
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action="/api/auth/signout" method="POST" className="m-0">
              <button
                type="submit"
                className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut size={13} />
                Гарах
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  // ── Local profile (no OAuth session)
  if (profile) {
    const initial = (profile.name?.[0] ?? profile.surname?.[0] ?? 'U').toUpperCase();
    const fullName = `${profile.surname} ${profile.name}`.trim();
    return (
      <TooltipProvider delayDuration={150}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-transform hover:scale-105"
                  aria-label="User menu"
                >
                  <Avatar>
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">{fullName || profile.email}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">{initial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-display font-semibold text-foreground truncate">
                    {fullName || 'Хэрэглэгч'}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground font-mono truncate flex items-center gap-1">
                    <Mail size={9} />
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Phone size={13} className="text-muted-foreground" />
              <span className="text-[12px] font-mono">{profile.phone}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <User size={13} className="text-muted-foreground" />
              Локал бүртгэл
              <span className="ml-auto text-[9px] text-muted-foreground font-mono">browser</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings size={13} className="text-muted-foreground" />
              Тохиргоо
              <span className="ml-auto text-[9px] text-muted-foreground">удахгүй</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                clearProfile();
                toast.success('Бүртгэл устгагдсан');
              }}
              className="hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut size={13} />
              Гарах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  // ── Unauthenticated + no local profile
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-br from-accent to-accent-hover text-primary-foreground text-xs font-display font-bold shadow-[0_2px_12px_var(--c-accent-glow)] hover:shadow-[0_4px_20px_var(--c-accent-glow)] hover:-translate-y-px transition-all"
          >
            <LogIn size={12} /> Нэвтрэх
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Бүртгэл / Нэвтрэх</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.48a4.8 4.8 0 0 1 0-3.04V5.37H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.37L4.5 7.44a4.77 4.77 0 0 1 4.48-3.26z"
      />
    </svg>
  );
}

export { Github as GithubIcon };
