"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { BrandIcon } from '@/components/ui/brand-icon';
import { ChevronLeft, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, handleGoogleLogin } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    setLoading(true);

    try {
      await register({ name, email, password });
      toast.success('Conta criada. Agora faça login.');
      router.replace('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
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
                <UserPlus size={22} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-(--ink) sm:text-3xl">Criar conta</h1>
              <p className="mt-2 text-sm text-(--muted)">Comece gratuitamente e organize seu estoque sem fricção.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink)">Nome</label>
                <input
                  required
                  type="text"
                  name="name"
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
                  placeholder="Seu nome"
                />
              </div>
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
                <label className="mb-1.5 block text-xs font-bold text-(--ink)">Senha</label>
                <input
                  required
                  minLength={8}
                  type="password"
                  name="password"
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--button) px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-60"
              >
                {loading ? 'Criando conta...' : 'Criar conta gratuitamente'}
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
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </>
              )}
            </button>

            <p className="mt-8 text-center text-sm text-(--muted)">
              Já possui conta?{' '}
              <Link href="/login" className="font-bold text-(--accent) hover:underline">
                Entrar
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
