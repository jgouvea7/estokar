'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import type { AuthSession } from '@/lib/types';

export default function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setSession = useAuthStore((state) => state.setSession);

    useEffect(() => {
        const accessToken = searchParams.get('accessToken') ?? '';
        const refreshToken = searchParams.get('refreshToken') ?? '';
        const id = searchParams.get('id') ?? '';
        const name = searchParams.get('name') ?? 'Usuario';
        const email = searchParams.get('email') ?? '';

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
        </main>
    );
}