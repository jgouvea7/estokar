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
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(8,11,18,0.5)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estokar</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Criar conta</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Comece gratuitamente e organize seu estoque sem friccao.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--ink)]">Nome</label>
            <input
              required
              type="text"
              name="name"
              className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              placeholder="Seu nome"
            />
          </div>
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
              minLength={8}
              type="password"
              name="password"
              className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              placeholder="Senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
            {loading ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          Ja possui conta?{' '}
          <Link href="/login" className="font-bold text-[var(--accent)]">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
