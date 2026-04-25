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
    if (!session) {
      router.replace('/login');
    }
  }, [router, session]);

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-bg text-ink">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="surface-card border border-stroke px-5 py-5 lg:min-h-[calc(100vh-3rem)] lg:w-72 lg:rounded-3xl lg:px-6 lg:py-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white shadow-[0_10px_25px_-15px_rgba(8,11,18,0.6)]">
              <Boxes size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estokar</p>
              <h1 className="text-xl font-extrabold">Inventory OS</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`interactive-press flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active
                    ? 'bg-ink text-white'
                    : 'bg-soft text-ink hover:bg-accent-soft'
                    }`}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-8 border-t border-stroke pt-6">
            <button
              onClick={() => {
                clearSession();
                router.push('/login');
                toast.success('Sessao encerrada');
              }}
              className="interactive-press flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-critical hover:bg-critical-soft">
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </aside>

        <section className="flex-1 px-0 py-5 sm:px-4 lg:px-8 lg:py-4">
          <header className="surface-card mb-6 flex items-center justify-between rounded-3xl border border-stroke px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Estokar</p>
              <h2 className="text-xl font-extrabold">{getHeaderTitle(pathname)}</h2>
            </div>
            <Link 
              href="/dashboard/profile"
              className="interactive-press grid h-11 w-11 place-items-center rounded-2xl bg-ink text-base font-black text-white hover:brightness-110"
            >
              {(session.user.name?.trim().slice(0, 1) || 'E').toUpperCase()}
            </Link>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
