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
    <main className="relative grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-20 antialiased">
      <Link 
        href="/" 
        className="absolute left-8 top-8 flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Voltar ao início
      </Link>

      <div className="w-full max-w-md reveal-up">
        <div className="surface-card p-8 sm:p-10">
          <div className="mb-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-xl">
              <LogIn size={28} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">Bem-vindo de volta</h1>
            <p className="mt-3 text-base font-medium text-slate-500">Acesse sua operação e acompanhe seu estoque em tempo real.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0f172a]">E-mail</label>
              <input
                required
                type="email"
                name="email"
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 text-sm font-medium text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                placeholder="voce@email.com"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-bold text-[#0f172a]">Senha</label>
                <Link href="#" className="text-xs font-semibold text-[var(--accent)] hover:underline">Esqueceu a senha?</Link>
              </div>
              <input
                required
                minLength={6}
                type="password"
                name="password"
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 text-sm font-medium text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--brand-gradient)] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Conectando...' : 'Entrar na conta'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--stroke)]"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[var(--muted)] font-medium">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-bold text-[#0f172a] transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
          >
            {googleLoading ? (
              'Redirecionando...'
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </>
            )}
          </button>

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-semibold text-[var(--accent)] hover:underline">
              Crie uma agora
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
