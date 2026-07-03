'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import type { AuthSession, UserRole } from '@/lib/types';

function parseHash(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return {};
  return Object.fromEntries(new URLSearchParams(hash));
}

export default function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setSession = useAuthStore((state) => state.setSession);
    const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);

    useEffect(() => {
        const hashParams = parseHash();
        const accessToken = hashParams.accessToken ?? '';
        const refreshToken = hashParams.refreshToken ?? '';
        const id = searchParams.get('id') ?? '';
        const name = searchParams.get('name') ?? 'Usuario';
        const email = searchParams.get('email') ?? '';
        const roleParam = searchParams.get('role');
        const role: UserRole =
            roleParam === 'ADMIN' ? 'ADMIN' : 'FREE';
        const createdAt = searchParams.get('createdAt') ?? '';
        const alertDaysBefore = Number(searchParams.get('alertDaysBefore') ?? '') || undefined;

        if (!accessToken || !refreshToken) {
            toast.error('Nao foi possivel concluir o login com Google.');
            router.replace('/login');
            return;
        }

        window.location.hash = '';

        const session: AuthSession = {
            accessToken,
            refreshToken,
            user: { id, name, email, role, createdAt, alertDaysBefore },
        };

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setSession(session);
        toast.success('Login realizado com sucesso.');

        const redirect = hasCompletedOnboarding ? '/dashboard' : '/onboarding';
        router.replace(redirect);
    }, [router, searchParams, setSession, hasCompletedOnboarding]);

    return (
        <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-6">
        </main>
    );
}