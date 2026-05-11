"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, FileText, Grid2x2, History, Info, LogOut, Package2, Settings, Shield, Smartphone, UserCircle2, X, ChevronRight, Users, BarChart3, Lock, Menu, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { updateUser } from '@/lib/api/users';
import { VersionModal } from '@/components/settings/version-modal';

const navItems = [
  { href: '/', icon: Grid2x2, label: 'Inicio' },
  { href: '/products', icon: Package2, label: 'Produtos' },
  { href: '/history', icon: History, label: 'Historico' },
];

const adminItems = [
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin/stats', icon: BarChart3, label: 'Estatísticas' },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(href);
}

function getHeaderTitle(pathname: string) {
  if (pathname === '/') return 'Inicio';
  if (pathname.startsWith('/products')) return 'Produtos';
  if (pathname.startsWith('/history')) return 'Historico';
  if (pathname.startsWith('/profile')) return 'Perfil';
  if (pathname.startsWith('/admin/users')) return 'Gestão de Usuários';
  if (pathname.startsWith('/admin/stats')) return 'Estatísticas Gerais';
  return 'Dashboard';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);

  // UI State
  const isDesktopCollapsed = useUIStore((state) => state.isDesktopCollapsed);
  const toggleDesktopCollapsed = useUIStore((state) => state.toggleDesktopCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('stock-alerts');
  const [stockAlertDays, setStockAlertDays] = useState('7');
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const pendingSaveControllerRef = useRef<AbortController | null>(null);
  const userFirstName = session?.user?.name?.trim().split(' ')[0] || 'Usuario';
  const userInitial = (session?.user?.name?.trim().slice(0, 1) || 'E').toUpperCase();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      pendingSaveControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
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
          return;
        }
      } catch (e) {
        console.error(e);
        router.replace('/');
        return;
      }
    }

    if (pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
      router.replace('/');
    }
  }, [router, session, pathname]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isSettingsOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!session?.user) return;

    const fallback = session.user.alertDaysBefore ?? 7;

    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setStockAlertDays(String(fallback));
    });
  }, [session?.user]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setIsAccountMenuOpen(false);
      setIsSettingsOpen(false);
      setIsMobileOpen(false);
    });
  }, [pathname]);

  // ESC key to close mobile sidebar
  useEffect(() => {
    if (!isMobileOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileOpen(false);
      }
    }

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobileOpen]);

  function handleLogout() {
    clearSession();
    router.push('/');
    toast.success('Sessao encerrada');
  }

  function openSettings() {
    setActiveSettingsTab('stock-alerts');
    setIsSettingsOpen(true);
  }

  async function handleSaveStockAlertDays() {
    const parsedValue = Number.parseInt(stockAlertDays, 10);
    const normalizedValue = Number.isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue;

    if (!session) {
      toast.error('Sessao expirada. Faça login novamente.');
      return;
    }

    pendingSaveControllerRef.current?.abort();
    const controller = new AbortController();
    pendingSaveControllerRef.current = controller;

    try {
      const updatedUser = await updateUser(
        session.user.id,
        { alertDaysBefore: normalizedValue },
        session.accessToken,
        controller.signal,
      );

      if (!isMountedRef.current || controller.signal.aborted) return;

      setSession({
        ...session,
        user: {
          ...session.user,
          alertDaysBefore: updatedUser.alertDaysBefore,
        },
      });

      setStockAlertDays(String(updatedUser.alertDaysBefore ?? normalizedValue));
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['product-dashboard'] });
      toast.success('Preferencia salva');
    } catch (error) {
      if (!isMountedRef.current || controller.signal.aborted) return;
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    } finally {
      if (pendingSaveControllerRef.current === controller) {
        pendingSaveControllerRef.current = null;
      }
    }
  }

  const settingsTabs = [
    { id: 'stock-alerts', label: 'Estoque e Alertas', description: 'Alertas de reposicao e limites', enabled: true },
    { id: 'legal', label: 'Informacoes legais', description: 'Versao e documentos', enabled: true },
  ];

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center">Carregando sessão...</div>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#f5f7fb]">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col bg-[image:var(--brand-gradient)] text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'w-75 p-6' : 'w-24 p-4'}
          ${isDesktopCollapsed ? 'lg:w-24 lg:p-4' : 'lg:w-75 lg:p-6'}
        `}
      >
        <div className={`mb-10 flex items-center transition-all duration-300 ${isMobileOpen ? 'justify-between gap-3' : 'flex-col-reverse gap-6'} ${isDesktopCollapsed ? 'lg:flex-col-reverse lg:gap-6' : 'lg:flex-row lg:justify-between lg:gap-3'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${isMobileOpen ? '' : 'justify-center'} ${isDesktopCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-lg shadow-black/20 ring-1 ring-white/20">
              <Boxes size={22} strokeWidth={2.5} />
            </div>
            <div className={`transition-all duration-300 ${isMobileOpen ? 'block' : 'hidden'} ${isDesktopCollapsed ? 'lg:hidden' : 'lg:block'}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Estokar</p>
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">Inventory OS</h1>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen(!isMobileOpen);
              } else {
                toggleDesktopCollapsed();
              }
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center rounded-xl py-3 text-sm font-semibold transition-all ${active
                  ? 'bg-white/12 text-white shadow-lg shadow-black/20 ring-1 ring-white/15'
                  : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
                  } ${isMobileOpen ? 'justify-start px-4 gap-3' : 'justify-center px-0 gap-0'} ${isDesktopCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0' : 'lg:justify-start lg:px-4 lg:gap-3'}`}
                title={(isDesktopCollapsed || !isMobileOpen) ? item.label : ''}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isMobileOpen ? 'w-auto opacity-100 block' : 'w-0 opacity-0 hidden'} ${isDesktopCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'lg:w-auto lg:opacity-100 lg:block'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {session?.user?.role === 'ADMIN' && (
          <div className="mt-8">
            <p className={`mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/50 ${isMobileOpen ? '' : 'hidden'} ${isDesktopCollapsed ? 'lg:hidden' : 'lg:block'}`}>
              Administração
            </p>
            <nav className="space-y-1.5">
              {adminItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center rounded-xl py-3 text-sm font-semibold transition-all ${active
                      ? 'bg-white/12 text-white shadow-lg shadow-black/20 ring-1 ring-white/15'
                      : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
                      } ${isMobileOpen ? 'justify-start px-4 gap-3' : 'justify-center px-0 gap-0'} ${isDesktopCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0' : 'lg:justify-start lg:px-4 lg:gap-3'}`}
                    title={(isDesktopCollapsed || !isMobileOpen) ? item.label : ''}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isMobileOpen ? 'w-auto opacity-100 block' : 'w-0 opacity-0 hidden'} ${isDesktopCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'lg:w-auto lg:opacity-100 lg:block'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div className="mt-auto border-t border-white/10 pt-3">

          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((current) => !current)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl py-3 text-left text-sm font-semibold text-slate-200/90 transition-all hover:bg-white/10 hover:text-white ${isMobileOpen ? 'px-5' : 'justify-center px-0'} ${isDesktopCollapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between lg:px-5'}`}
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
            >
              <div className={`flex items-center ${isMobileOpen ? 'gap-3' : 'justify-center'} ${isDesktopCollapsed ? 'lg:justify-center' : 'lg:gap-3'}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15">
                  {userInitial}
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isMobileOpen ? 'w-auto opacity-100 block' : 'w-0 opacity-0 hidden'} ${isDesktopCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'lg:w-auto lg:opacity-100 lg:block'}`}>
                  <p className="truncate text-sm font-semibold text-white">{userFirstName}</p>
                  <p className="text-xs font-medium text-blue-200/70">Conta</p>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-200/60 transition-all duration-300 ${isMobileOpen ? 'block' : 'hidden'} ${isDesktopCollapsed ? 'lg:hidden' : 'lg:block'}`}>Menu</span>
            </button>

            {isAccountMenuOpen ? (
              <div className="absolute bottom-full left-0 mb-3 w-65 rounded-2xl border border-gray-700 bg-white/1 p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.3)] backdrop-blur-md">
                <div className="px-3 pb-2 pt-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Conta</p>
                  <p className="text-sm font-semibold text-white">{session.user.name}</p>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    <UserCircle2 size={16} />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      openSettings();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    <Settings size={16} />
                    Configuracoes
                  </button>
                </div>
                <div className="mt-2 border-t border-gray-700 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-white/20"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${isDesktopCollapsed ? 'lg:pl-24' : 'lg:pl-80'} pl-24`}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold tracking-tight text-[#0f172a]">{getHeaderTitle(pathname)}</h2>
          </div>
        </header>

        <section className="p-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </section>
      </div>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-6 py-10">
          <div
            className="absolute inset-0"
            onClick={() => setIsSettingsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] reveal-up">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Configuracoes</p>
                <h3 className="text-xl font-bold text-[#0f172a]">Preferencias da conta</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Fechar configuracoes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
              <aside className="border-b border-slate-200 bg-slate-50/80 p-5 lg:border-b-0 lg:border-r">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Seções</p>
                <div className="mt-4 space-y-1">
                  {settingsTabs.map((tab) => {
                    const isActive = activeSettingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => tab.enabled && setActiveSettingsTab(tab.id)}
                        className={`w-full rounded-xl px-6 py-3 text-left text-sm font-semibold transition-all ${tab.enabled
                          ? isActive
                            ? 'bg-white text-[#0f172a] shadow-sm'
                            : 'text-slate-600 hover:bg-white/80'
                          : 'cursor-not-allowed text-slate-400'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{tab.label}</span>
                          {!tab.enabled ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Em breve</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-400">{tab.description}</p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="p-6">
                {activeSettingsTab === 'stock-alerts' ? (
                  <div className="space-y-6">
                    <header className="space-y-2">
                      <h4 className="text-lg font-bold text-[#0f172a]">Estoque e Alertas</h4>
                      <p className="text-sm font-medium text-slate-500">
                        Ajuste os dias de antecedencia para alertas de reposicao.
                      </p>
                    </header>

                    <div className="surface-card p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#0f172a]">Avisar quando faltar</p>
                          <p className="text-xs font-medium text-slate-500">Defina quantos dias antes do estoque acabar.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={stockAlertDays}
                            onChange={(event) => setStockAlertDays(event.target.value)}
                            className="h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0f172a] shadow-sm focus:border-blue-500 focus:outline-none"
                          />
                          <span className="text-sm font-semibold text-slate-500">dias</span>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveStockAlertDays}
                          className="rounded-xl bg-[image:var(--brand-gradient)] px-4 py-2 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110"
                        >
                          Salvar preferencia
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(false)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {activeSettingsTab === 'legal' ? (
                  <div className="space-y-6">
                    <header className="space-y-2">
                      <h4 className="text-lg font-bold text-[#0f172a]">Informacoes legais</h4>
                      <p className="text-sm font-medium text-slate-500">
                        Documentos e detalhes do aplicativo para consulta rapida.
                      </p>
                    </header>

                    <div className="surface-card space-y-4 p-6">
                      <div className="space-y-2">
                        <LegalLink href="/settings/terms" icon={FileText} label="Termos de uso" onClick={() => setIsSettingsOpen(false)} />
                        <LegalLink href="/settings/privacy" icon={Shield} label="Privacidade" onClick={() => setIsSettingsOpen(false)} />
                        <LegalLink href="/settings/about" icon={Info} label="Sobre o sistema" onClick={() => setIsSettingsOpen(false)} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsVersionModalOpen(true)}
                        className="group/version flex w-full items-center justify-between rounded-2xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover/version:scale-110">
                            <Smartphone size={18} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-[#0f172a]">Versão do sistema</p>
                            <p className="text-xs font-medium text-slate-500">Estokar Inventory OS</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">v1.7.0 (Build 20260510)</span>
                          <ChevronRight size={16} className="text-slate-300 transition-transform group-hover/version:translate-x-1" />
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </main>
  );
}

function LegalLink({ href, icon: Icon, label, onClick }: { href: string; icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={16} />
        </div>
        <span>{label}</span>
      </div>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Abrir</span>
    </Link>
  );
}
