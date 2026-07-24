"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Info, Moon, Monitor, Shield, Smartphone, Sun, Trash2, X, ChevronRight, type LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth-store';
import { useHistoryStore } from '@/store/history-store';
import { useUIStore } from '@/store/ui-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { deleteMyAccount, updateUser } from '@/lib/api/users';
import { BUILD_STRING } from '@/lib/version';
import Sidebar from '@/components/sidebar';

const VersionModal = dynamic(() => import('@/components/settings/version-modal').then((m) => m.VersionModal));

function getHeaderTitle(pathname: string) {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/products')) return 'Produtos';
  if (pathname.startsWith('/history')) return 'Historico';
  if (pathname.startsWith('/profile')) return 'Perfil';
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  return 'Dashboard';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);

  const isDesktopCollapsed = useUIStore((state) => state.isDesktopCollapsed);
  const toggleDesktopCollapsed = useUIStore((state) => state.toggleDesktopCollapsed);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const [isMobile, setIsMobile] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('stock-alerts');
  const [stockAlertDays, setStockAlertDays] = useState('7');
  const isMountedRef = useRef(true);
  const pendingSaveControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      pendingSaveControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 1024);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

    if (session && pathname.startsWith('/admin') && session.user.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
      router.replace('/');
    }

    if (session) {
      const hasCompleted = useOnboardingStore.getState().hasCompletedOnboarding;
      if (!hasCompleted && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    }
  }, [router, session, pathname]);

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
      setIsSettingsOpen(false);
    });
  }, [pathname]);

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

  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir sua conta? Voce perdera permanentemente o acesso a todos os seus produtos, historico de movimentacoes, alertas e configuracoes. Essa acao nao pode ser desfeita.'
    );
    if (!confirmed) return;

    if (!session) {
      toast.error('Usuario nao autenticado');
      return;
    }

    try {
      await deleteMyAccount(session.accessToken);
      clearHistory();
      clearSession();
      setIsSettingsOpen(false);
      toast.success('Conta excluida com sucesso.');
      router.replace('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel excluir sua conta.');
    }
  }

  const settingsTabs = [
    { id: 'preferences', label: 'Preferencias', description: 'Ajustes de estoque e aparencia', enabled: true },
    { id: 'profile', label: 'Perfil', description: 'Informacoes da conta', enabled: true },
    { id: 'legal', label: 'Informacoes legais', description: 'Versao e documentos', enabled: true },
  ];

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center">Carregando sessão...</div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-(--bg)">
      <Sidebar
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleCollapse={toggleDesktopCollapsed}
        onOpenSettings={() => openSettings()}
      />

      <div
        className="flex h-screen flex-1 flex-col overflow-y-auto transition-all duration-300 ease-in-out"
        style={{
          paddingLeft: isMobile ? '72px' : (isDesktopCollapsed ? '72px' : '280px'),
        }}
      >
        <header className="sticky top-0 z-50 flex min-h-[72px] items-center justify-between border-b-2 border-(--stroke) bg-(--card) px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[1.75rem] font-bold leading-tight tracking-tight text-(--ink) sm:text-2xl">{getHeaderTitle(pathname)}</h2>
          </div>
        </header>

        <section className="px-4 pb-6 pt-5 sm:p-6 sm:pt-7">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </section>
      </div>

      {isSettingsOpen ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-(--overlay) px-6 py-10">
          <div
            className="absolute inset-0"
            onClick={() => setIsSettingsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-xl border-2 border-(--stroke) bg-(--card) reveal-up">
            <div className="flex items-center justify-between border-b-2 border-(--stroke) px-6 py-5 shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">Configuracoes</p>
                <h3 className="text-xl font-bold text-(--ink)">Preferencias da conta</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-(--stroke) text-(--muted) hover:bg-(--soft)"
                aria-label="Fechar configuracoes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[240px_1fr] min-h-0 flex-1 overflow-y-auto">
              <aside className="border-b-2 border-(--stroke) bg-(--surface-2) p-5 lg:border-b-0 lg:border-r-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">Seções</p>
                <div className="mt-4 space-y-1">
                  {settingsTabs.map((tab) => {
                    const isActive = activeSettingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => tab.enabled && setActiveSettingsTab(tab.id)}
                        className={`w-full rounded-lg px-5 py-2.5 text-left text-sm font-semibold transition-all ${tab.enabled
                          ? isActive
                            ? 'bg-(--card) text-(--ink) border-2 border-(--stroke)'
                            : 'text-(--muted) hover:bg-(--card)'
                          : 'cursor-not-allowed text-(--muted)'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{tab.label}</span>
                          {!tab.enabled ? (
                            <span className="rounded-full bg-(--soft) px-2 py-0.5 text-[9px] font-bold uppercase text-(--muted)">Em breve</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-(--muted)">{tab.description}</p>
                      </button>
                    );
                  })}
                </div>
              </aside>

        <section className="p-4 sm:p-6">
                {activeSettingsTab === 'preferences' ? (
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <header className="space-y-2">
                        <h4 className="text-lg font-bold text-(--ink)">Estoque e Alertas</h4>
                        <p className="text-sm font-medium text-(--muted)">
                          Ajuste os dias de antecedencia para alertas de reposicao.
                        </p>
                      </header>

                      <div className="rounded-lg border-2 border-(--stroke) bg-(--card) p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-(--ink)">Avisar quando faltar</p>
                            <p className="text-xs font-medium text-(--muted)">Defina com quantos dias de antecedência o sistema deve alertar que o estoque de um produto está próximo do fim.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={stockAlertDays}
                              onChange={(event) => setStockAlertDays(event.target.value)}
                              className="h-11 w-24 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-3 text-sm font-semibold text-(--ink) outline-none transition-all focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30"
                            />
                            <span className="text-sm font-semibold text-(--muted)">dias</span>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSaveStockAlertDays}
                            className="rounded-lg bg-(--button) px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-125"
                          >
                            Salvar preferencia
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsSettingsOpen(false)}
                            className="rounded-lg border-2 border-(--stroke) px-4 py-2 text-sm font-semibold text-(--muted) hover:bg-(--soft)"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <header className="space-y-2">
                        <h4 className="text-lg font-bold text-(--ink)">Aparencia</h4>
                        <p className="text-sm font-medium text-(--muted)">
                          Escolha entre tema claro, escuro ou acompanhe o sistema.
                        </p>
                      </header>

                      <div className="space-y-3">
                        {[
                          { id: 'light' as const, icon: Sun, label: 'Claro', desc: 'Fundo claro e contraste padrao' },
                          { id: 'dark' as const, icon: Moon, label: 'Escuro', desc: 'Fundo escuro para baixa luminosidade' },
                          { id: 'system' as const, icon: Monitor, label: 'Sistema', desc: 'Acompanha a preferencia do seu dispositivo' },
                        ].map(({ id: mode, icon: Icon, label, desc }) => {
                          const active = theme === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setTheme(mode)}
                              className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                                active
                                  ? 'border-(--accent) bg-(--accent-soft)'
                                  : 'border-(--stroke) bg-(--card) hover:bg-(--soft)'
                              }`}
                            >
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                active ? 'bg-(--card) text-(--accent)' : 'bg-(--soft) text-(--muted)'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-bold ${active ? 'text-(--accent)' : 'text-(--ink)'}`}>{label}</p>
                                <p className="text-xs font-medium text-(--muted)">{desc}</p>
                              </div>
                              {active && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent) text-white text-xs font-bold">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
                {activeSettingsTab === 'profile' ? (
                  <div className="space-y-6">
                    <header className="space-y-2">
                      <h4 className="text-lg font-bold text-(--ink)">Perfil</h4>
                      <p className="text-sm font-medium text-(--muted)">
                        Informacoes da sua conta.
                      </p>
                    </header>

                    <div className="rounded-lg border-2 border-(--stroke) bg-(--card) p-6">
                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--soft) text-xl font-bold text-(--ink) border-4 border-(--card)">
                          {(session?.user?.name?.trim().slice(0, 1) || 'E').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-(--ink)">{session?.user?.name}</p>
                          <p className="text-sm font-medium text-(--muted)">{session?.user?.email}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-(--ok)" />
                            <span className="text-xs font-bold text-(--ok)">Conta ativa</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-(--stroke) bg-(--card) p-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Nome Completo</span>
                          <span className="text-sm font-bold text-(--ink)">{session?.user?.name}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Endereco de E-mail</span>
                          <span className="text-sm font-bold text-(--ink)">{session?.user?.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-(--stroke) bg-(--card) p-6">
                      <h4 className="text-lg font-bold text-(--critical)">Zona de Perigo</h4>
                      <p className="mt-1 text-sm font-medium text-(--muted)">
                        Ao excluir sua conta, todos os seus dados de estoque, produtos e historico serao removidos permanentemente. Esta acao nao pode ser desfeita.
                      </p>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-(--critical) bg-(--card) px-4 py-2.5 text-xs font-bold text-(--critical) transition-all hover:bg-(--critical-soft)"
                      >
                        <Trash2 size={14} />
                        Excluir Minha Conta Permanentemente
                      </button>
                    </div>
                  </div>
                ) : null}
                {activeSettingsTab === 'legal' ? (
                  <div className="space-y-6">
                    <header className="space-y-2">
                      <h4 className="text-lg font-bold text-(--ink)">Informacoes legais</h4>
                      <p className="text-sm font-medium text-(--muted)">
                        Documentos e detalhes do aplicativo para consulta rapida.
                      </p>
                    </header>

                    <div className="space-y-4">
                      <LegalLink href="/settings/terms" icon={FileText} label="Termos de uso" onClick={() => setIsSettingsOpen(false)} />
                      <LegalLink href="/settings/privacy" icon={Shield} label="Privacidade" onClick={() => setIsSettingsOpen(false)} />
                      <LegalLink href="/settings/about" icon={Info} label="Sobre o sistema" onClick={() => setIsSettingsOpen(false)} />
                      <button
                        type="button"
                        onClick={() => setIsVersionModalOpen(true)}
                        className="flex w-full items-center justify-between rounded-lg border-2 border-(--stroke) bg-(--card) p-4 transition-all hover:bg-(--soft)"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
                            <Smartphone size={18} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-(--ink)">Versão do sistema</p>
                            <p className="text-xs font-medium text-(--muted)">Estokar Inventory OS</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-(--accent)">{BUILD_STRING}</span>
                          <ChevronRight size={14} className="text-(--muted)" />
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
      className="flex items-center justify-between rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-semibold text-(--ink) transition-all hover:bg-(--soft)"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
          <Icon size={16} />
        </div>
        <span>{label}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">Abrir</span>
    </Link>
  );
}
