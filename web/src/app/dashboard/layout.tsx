"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Boxes, Grid2x2, History, LogOut, Package2, UserCircle2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { href: '/dashboard', icon: Grid2x2, label: 'Inicio' },
  { href: '/dashboard/products', icon: Package2, label: 'Produtos' },
  { href: '/dashboard/history', icon: History, label: 'Historico' },
  { href: '/dashboard/profile', icon: UserCircle2, label: 'Perfil' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuracoes' },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  return pathname.startsWith(href);
}

function getHeaderTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Inicio';
  if (pathname.startsWith('/dashboard/products')) return 'Produtos';
  if (pathname.startsWith('/dashboard/history')) return 'Historico';
  if (pathname.startsWith('/dashboard/profile')) return 'Perfil';
  if (pathname.startsWith('/dashboard/settings')) return 'Configuracoes';
  return 'Dashboard';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    // if there's no session yet, check for a persisted token in localStorage
    // to avoid redirecting while the zustand persist middleware hydrates the store
    if (!session) {
      try {
        const token = localStorage.getItem('accessToken')
          ?? (function () {
            const raw = localStorage.getItem('estokar-web-auth');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.state?.session?.accessToken ?? null;
          })();

        if (!token) {
          router.replace('/');
        }
      } catch (e) {
        router.replace('/');
      }
    }
  }, [router, session]);

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center">Carregando sessão...</div>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[image:var(--brand-gradient)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] transition-all">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-lg shadow-black/20 ring-1 ring-white/20">
            <Boxes size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Estokar</p>
            <h1 className="text-lg font-bold tracking-tight">Inventory OS</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${active
                  ? 'bg-white/12 text-white shadow-lg shadow-black/20 ring-1 ring-white/15'
                  : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
                  }`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6">
          <button
            onClick={() => {
              clearSession();
              router.push('/');
              toast.success('Sessão encerrada');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300/80 transition-all hover:bg-white/10 hover:text-white">
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-72">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#0f172a]">{getHeaderTitle(pathname)}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-[#0f172a]">{session.user.name}</p>
            </div>
            <Link
              href="/dashboard/profile"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-[#0f172a] hover:bg-slate-200"
            >
              {(session.user.name?.trim().slice(0, 1) || 'E').toUpperCase()}
            </Link>
          </div>
        </header>

        <section className="p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
