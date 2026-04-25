"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGoogleOAuthUrl, login } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    setLoading(true);

    try {
      const session = await login({ email, password });
      setSession(session);
      toast.success('Login realizado com sucesso.');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel entrar.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = getGoogleOAuthUrl(redirectUri);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(8,11,18,0.5)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estokar</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Entrar</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Acesse sua operacao e acompanhe seu estoque em tempo real.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--ink)]">E-mail</label>
            <input
              required
              type="email"
              name="email"
              className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--ink)]">Senha</label>
            <input
              required
              minLength={6}
              type="password"
              name="password"
              className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              placeholder="Senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
            <LogIn size={16} />
            {loading ? 'Conectando...' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="mt-3 w-full rounded-2xl border border-[var(--stroke)] bg-white px-5 py-3 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--soft)] disabled:opacity-60">
          {googleLoading ? 'Redirecionando...' : 'Login com Google'}
        </button>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          Nao tem conta?{' '}
          <Link href="/register" className="font-bold text-[var(--accent)]">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
