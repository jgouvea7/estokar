"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { BrandIcon } from '@/components/ui/brand-icon';
import { ChevronLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, handleGoogleLogin } from '@/lib/api/auth';
import { GoogleIcon } from '@/components/ui/google-icon';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function getRedirectPath() {
    return hasCompletedOnboarding ? '/dashboard' : '/onboarding';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    setLoading(true);

    try {
      const session = await login({ email, password });
      localStorage.setItem('accessToken', session.accessToken);
      localStorage.setItem('refreshToken', session.refreshToken);
      setSession(session);
      toast.success('Login realizado com sucesso.');
      router.replace(getRedirectPath());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:py-8">
      <header className="mb-20 flex items-center justify-between rounded-xl border-2 border-(--stroke) bg-(--card) px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-(--brand-bg) text-(--accent)">
            <BrandIcon size={20} />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-bold text-(--ink) leading-tight">Estokar</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Inventory OS</p>
          </div>
        </Link>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-3.5 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
        >
          <ChevronLeft size={14} />
          Voltar
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-xl border-2 border-(--stroke) bg-(--card) p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-(--accent-soft) text-(--accent)">
                <LogIn size={22} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-(--ink) sm:text-3xl">Bem-vindo de volta</h1>
              <p className="mt-2 text-sm text-(--muted)">Acesse sua operação e acompanhe seu estoque em tempo real.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink)">E-mail</label>
                <input
                  required
                  type="email"
                  name="email"
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
                  placeholder="voce@email.com"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-(--ink)">Senha</label>
                  <span className="text-[11px] font-semibold text-(--accent)">Esqueceu a senha?</span>
                </div>
                <input
                  required
                  minLength={6}
                  type="password"
                  name="password"
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--button) px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-60"
              >
                {loading ? 'Conectando...' : 'Entrar na conta'}
              </button>
            </form>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-(--stroke)" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-(--card) px-3 text-[11px] font-bold text-(--muted)">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin(setGoogleLoading)}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-5 py-3 text-sm font-bold text-(--ink) transition-colors hover:bg-(--soft) disabled:opacity-60"
            >
              {googleLoading ? (
                'Redirecionando...'
              ) : (
                <>
                  <GoogleIcon />
                  Google
                </>
              )}
            </button>

            <p className="mt-8 text-center text-sm text-(--muted)">
              Não tem uma conta?{' '}
              <Link href="/register" className="font-bold text-(--accent) hover:underline">
                Crie uma agora
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t-2 border-(--stroke) pt-8 pb-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-(--brand-bg) text-(--accent)">
              <BrandIcon size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-(--ink)">Estokar</p>
              <p className="text-[9px] font-medium text-(--muted)">Inventory OS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">Sobre</Link>
            <Link href="/contact" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">Contato</Link>
            <Link href="/privacy" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">Privacidade</Link>
            <Link href="/terms" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">Termos</Link>
          </div>
        </div>
        <div className="mt-6 text-center text-[10px] font-medium text-(--muted)">
          &copy; {new Date().getFullYear()} Estokar Inventory OS. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
