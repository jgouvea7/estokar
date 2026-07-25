"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import Sidebar from '@/components/sidebar';
import { SettingsModal } from '@/components/settings/settings-modal';

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
  const session = useAuthStore((state) => state.session);

  const isDesktopCollapsed = useUIStore((state) => state.isDesktopCollapsed);
  const toggleDesktopCollapsed = useUIStore((state) => state.toggleDesktopCollapsed);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const [isMobile, setIsMobile] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

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
        if (process.env.NODE_ENV === 'development') console.warn(e);
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
    queueMicrotask(() => {
      setIsSettingsOpen(false);
    });
  }, [pathname]);

  function openSettings() {
    setIsSettingsOpen(true);
  }

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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
      />

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </main>
  );
}
