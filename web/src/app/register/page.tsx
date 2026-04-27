"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { register } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    setLoading(true);

    try {
      await register({ name, email, password });
      toast.success('Conta criada. Agora faca login.');
      router.replace('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-20 antialiased">
      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar ao início
      </Link>
      <div className="w-full max-w-md surface-card p-8 sm:p-10 reveal-up">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Estokar</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#0f172a]">Criar conta</h1>
          <p className="mt-3 text-base font-medium text-slate-500">Comece gratuitamente e organize seu estoque sem fricção.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0f172a]">Nome</label>
            <input
              required
              type="text"
              name="name"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 text-sm font-medium text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
              placeholder="Seu nome"
            />
          </div>
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
            <label className="mb-2 block text-sm font-bold text-[#0f172a]">Senha</label>
            <input
              required
              minLength={8}
              type="password"
              name="password"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 text-sm font-medium text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
              placeholder="Senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[image:var(--brand-gradient)] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">
            {loading ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Já possui conta?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
