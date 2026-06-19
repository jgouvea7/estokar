"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { BrandIcon } from '@/components/ui/brand-icon';
import {
  BarChart3,
  Grid2x2,
  History,
  LogOut,
  Menu,
  Package2,
  Settings,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { getDashboard } from '@/lib/api/dashboard';
import { buildDashboardOverviewData } from '@/lib/dashboard/dashboard-data';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { href: '/dashboard', icon: Grid2x2, label: 'Dashboard' },
  { href: '/products', icon: Package2, label: 'Produtos' },
  { href: '/history', icon: History, label: 'Historico' },
];

const adminItems = [
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin/stats', icon: BarChart3, label: 'Estatísticas' },
];

function isNavItemActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

function NavItem({
  href,
  icon: Icon,
  label,
  pathname,
  sidebarOpen,
  onHover,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  pathname: string;
  sidebarOpen: boolean;
  onHover?: () => void;
}) {
  const active = isNavItemActive(pathname, href);

  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      data-active={active}
      className="group relative flex items-center rounded-xl py-3 text-[15px] font-semibold transition-all duration-200
        data-[active=true]:bg-(--accent-soft) data-[active=true]:text-(--accent)
        data-[active=false]:text-white/50 data-[active=false]:hover:bg-white/8 data-[active=false]:hover:text-white/85"
    >
      <div className="flex w-[60px] shrink-0 items-center justify-center"
        style={{ width: sidebarOpen ? '60px' : '100%' }}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span
        className="overflow-hidden whitespace-nowrap text-[15px] transition-all duration-300 ease-out"
        style={{
          maxWidth: sidebarOpen ? '160px' : '0px',
          opacity: sidebarOpen ? 1 : 0,
          marginLeft: sidebarOpen ? '0' : '-8px',
          transitionDelay: sidebarOpen ? '60ms' : '0ms',
        }}
      >
        {label}
      </span>
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-(--accent)" />
      )}
    </Link>
  );
}

export default function Sidebar({
  isDesktopCollapsed,
  onToggleCollapse,
  onOpenSettings,
}: {
  isDesktopCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const userFirstName = session?.user?.name?.trim().split(' ')[0] || 'Usuario';
  const userInitial = (session?.user?.name?.trim().slice(0, 1) || 'E').toUpperCase();
  const sidebarOpen = !isDesktopCollapsed;
  const queryClient = useQueryClient();

  function handlePrefetchDashboard() {
    const s = useAuthStore.getState().session;
    if (!s?.accessToken) return;
    queryClient.prefetchQuery({
      queryKey: ['dashboard', s.user.id],
      queryFn: async () => buildDashboardOverviewData({
        dashboard: await getDashboard(s.accessToken),
      }),
      staleTime: 30_000,
    });
  }

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 1024);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/');
    toast.success('Sessao encerrada');
  }

  return (
    <>
      {/* Mobile backdrop — only when expanded on mobile */}
      <div
        data-open={sidebarOpen && isMobile}
        className="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ease-in-out
          data-[open=true]:pointer-events-auto data-[open=true]:opacity-100
          data-[open=false]:pointer-events-none data-[open=false]:opacity-0 lg:hidden"
        onClick={() => {
          onToggleCollapse();
          setIsAccountOpen(false);
        }}
      />

      {isAccountOpen && (
        <div
          className="fixed inset-0 z-[65]"
          onClick={() => setIsAccountOpen(false)}
        />
      )}

      <aside
        data-desktop-collapsed={isDesktopCollapsed}
        className="fixed inset-y-0 left-0 z-[70] flex flex-col bg-[#111111] text-white transition-all duration-300 ease-in-out
          translate-x-0
          data-[desktop-collapsed=true]:w-[72px]
          data-[desktop-collapsed=false]:w-[280px]"
      >
        <div
          className="flex shrink-0 items-center px-4 pt-5 pb-4"
          style={{ justifyContent: sidebarOpen ? 'space-between' : 'center' }}
        >
          <div
            className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-out"
            style={{
              maxWidth: sidebarOpen ? '180px' : '0px',
              opacity: sidebarOpen ? 1 : 0,
              transitionDelay: sidebarOpen ? '60ms' : '0ms',
            }}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-(--accent-soft) text-(--accent)">
                <BrandIcon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight tracking-tight text-white">Estokar</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--accent)">Inventory OS</p>
              </div>
            </Link>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/10 text-white/50 transition-all hover:bg-white/8 hover:text-white/85"
            aria-label={sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-0.5 px-3">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              pathname={pathname}
              sidebarOpen={sidebarOpen}
              onHover={item.href === '/dashboard' ? handlePrefetchDashboard : undefined}
            />
          ))}
        </nav>

        {session?.user?.role === 'ADMIN' && (
          <div className="mt-4 px-3">
            <p
              className="overflow-hidden whitespace-nowrap px-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/30 transition-all duration-300 ease-out"
              style={{
                maxHeight: sidebarOpen ? '24px' : '0px',
                opacity: sidebarOpen ? 1 : 0,
                transitionDelay: sidebarOpen ? '60ms' : '0ms',
              }}
            >
              Administração
            </p>
            <nav className="space-y-0.5">
              {adminItems.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  pathname={pathname}
                  sidebarOpen={sidebarOpen}
                />
              ))}
            </nav>
          </div>
        )}

        <div className="mt-auto shrink-0 border-t border-white/8 px-3 pt-3 pb-4">
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="flex w-full items-center rounded-xl py-2.5 text-left text-[15px] font-semibold text-white/50 transition-all hover:bg-white/8 hover:text-white/85"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
            >
              <div className="flex shrink-0 items-center justify-center"
                style={{ width: sidebarOpen ? '60px' : '100%' }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-(--accent-soft) text-base font-bold text-(--accent)">
                  {userInitial}
                </div>
              </div>
              <div
                className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-out"
                style={{
                  maxWidth: sidebarOpen ? '160px' : '0px',
                  opacity: sidebarOpen ? 1 : 0,
                  transitionDelay: sidebarOpen ? '60ms' : '0ms',
                }}
              >
                <p className="truncate text-[15px] font-semibold text-white">{userFirstName}</p>
                <p className="text-sm font-medium text-(--accent)">Conta</p>
              </div>
            </button>

            {isAccountOpen && (
              <div
                className="absolute z-[75] w-64 rounded-xl border-2 border-(--stroke) bg-(--card) p-3 shadow-none"
                style={
                  sidebarOpen
                    ? isMobile
                      ? { left: 0, top: '100%', marginTop: '8px' }
                      : { left: 0, bottom: '100%', marginBottom: '8px' }
                    : { left: '100%', bottom: 0, marginLeft: '12px' }
                }
              >
                <div className="border-b-2 border-(--stroke) px-3 pb-2 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Conta</p>
                  <p className="text-sm font-bold text-(--ink)">{session?.user?.name}</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-(--ink) transition-colors hover:bg-(--soft)"
                  >
                    <UserCircle2 size={18} />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-(--ink) transition-colors hover:bg-(--soft)"
                  >
                    <Settings size={18} />
                    Configuracoes
                  </button>
                </div>
                <div className="mt-1 border-t-2 border-(--stroke) pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-(--critical) transition-colors hover:bg-(--critical-soft)"
                  >
                    <LogOut size={18} />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
