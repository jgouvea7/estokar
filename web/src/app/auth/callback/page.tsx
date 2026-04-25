'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import type { AuthSession } from '@/lib/types';

export default function AuthCallbackClient({
  searchParams,
}: {
  searchParams: {
    access_token?: string;
    refresh_token?: string;
    id?: string;
    name?: string;
    email?: string;
  };
}) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const accessToken = searchParams.access_token ?? '';
    const refreshToken = searchParams.refresh_token ?? '';
    const id = searchParams.id ?? '';
    const name = searchParams.name ?? 'Usuario';
    const email = searchParams.email ?? '';

    if (!accessToken || !refreshToken) {
      toast.error('Nao foi possivel concluir o login com Google.');
      router.replace('/login');
      return;
    }

    const session: AuthSession = {
      accessToken,
      refreshToken,
      user: { id, name, email },
    };

    setSession(session);
    toast.success('Login realizado com sucesso.');
    router.replace('/dashboard/products');
  }, [router, searchParams, setSession]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-white p-8 text-center shadow-[0_20px_50px_-30px_rgba(8,11,18,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Estokar</p>
        <h1 className="mt-3 text-2xl font-extrabold text-[var(--ink)]">Concluindo login...</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Voce sera redirecionado em instantes.</p>
      </div>
    </main>
  );
}