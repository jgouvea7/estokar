'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boxes, ChartNoAxesColumnIncreasing, CheckCheck, History, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from './(app)/layout';
import DashboardPage from './(app)/page';

export default function Home() {
  const session = useAuthStore((state) => state.session);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Pequeno delay para garantir que o Zustand hidratou do localStorage
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return (
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    );
  }

  return <LandingPage />;
}

function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col px-6 py-10 sm:px-8 lg:py-12">
      <header className="surface-card mb-12 flex items-center justify-between rounded-3xl border border-[var(--stroke)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--brand-gradient)] text-white shadow-[0_16px_32px_-20px_rgba(15,23,42,0.7)] ring-1 ring-white/20">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estokar</p>
            <h1 className="text-xl font-black text-[var(--ink)]">Inventory OS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]">
            Entrar
          </Link>
          <Link href="/register" className="rounded-xl bg-[image:var(--brand-gradient)] px-4 py-2 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.8)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5">
            Comecar
          </Link>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="relative overflow-hidden reveal-up rounded-3xl bg-[image:var(--brand-gradient)] p-8 text-white shadow-[0_40px_80px_-30px_rgba(15,23,42,0.75)] lg:p-12">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#6aa1ff] opacity-25 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#1b3a8a] opacity-40 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/80">Controle inteligente de estoque</p>
            <h2 className="mt-5 max-w-xl text-5xl font-black leading-[1.1] tracking-tight lg:text-6xl">
              Controle total do seu estoque, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">sem complicação.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-blue-100/80">
              Gerencie produtos, categorias e movimentações em segundos com uma experiência fluida e previsão operacional em tempo real.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="rounded-xl bg-[image:var(--brand-gradient)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_35px_-20px_rgba(15,23,42,0.6)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5">
                Criar conta gratuitamente
              </Link>
              <Link href="/login" className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20">
                Entrar agora
              </Link>
            </div>
          </div>
        </article>

        <article className="surface-card reveal-up rounded-3xl border border-[var(--stroke)] p-6" style={{ animationDelay: '80ms' }}>
          <h3 className="text-2xl font-black">Por que usar?</h3>
          <div className="mt-5 space-y-3">
            <Benefit icon={ChartNoAxesColumnIncreasing} title="Controle simples" text="Produtos e categorias com fluxo direto e sem friccao." />
            <Benefit icon={History} title="Historico de entradas/saidas" text="Acompanhe movimentacoes e mantenha rastreabilidade operacional." />
            <Benefit icon={ShieldCheck} title="Conectado ao backend" text="Dados sempre vindos do servidor com atualizacao imediata." />
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="surface-card surface-card-hover rounded-3xl border border-[var(--stroke)] p-6 lg:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Demo do produto</p>
          <h3 className="mt-3 text-3xl font-black leading-tight">Visualizacao operacional premium</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Acompanhe ranking de produtos, alertas de baixo estoque e movimentacoes em uma unica tela com leitura imediata.</p>
          <div className="mt-5 rounded-2xl border border-[var(--stroke)] bg-white p-4 shadow-[0_20px_40px_-35px_rgba(8,11,18,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Painel ativo</span>
            </div>
            <div className="space-y-2">
              <MockupRow label="Refrigerante lata" quantity={82} status="high" />
              <MockupRow label="Cafe em po" quantity={18} status="high" />
              <MockupRow label="Leite integral" quantity={4} status="low" />
            </div>
          </div>
        </article>

        <article className="space-y-5">
          <div className="surface-card rounded-3xl border border-[var(--stroke)] p-6">
            <h3 className="text-2xl font-black">Como funciona</h3>
            <div className="mt-4 grid gap-3">
              <HowItWorks icon={Layers3} title="Cadastre em segundos" text="Organize produtos e categorias com formularios objetivos." />
              <HowItWorks icon={Sparkles} title="Movimente com um clique" text="Entradas e saidas instantaneas com historico em timeline." />
              <HowItWorks icon={CheckCheck} title="Atualize em tempo real" text="Cada acao envia direto ao backend e revalida os dados." />
            </div>
          </div>
          <div className="surface-card rounded-3xl border border-[var(--stroke)] p-6">
            <h3 className="text-2xl font-black">Para quem e</h3>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-[var(--soft)] px-3 py-2">Mercados locais</span>
              <span className="rounded-full bg-[var(--soft)] px-3 py-2">Farmacias</span>
              <span className="rounded-full bg-[var(--soft)] px-3 py-2">Lojas de conveniencia</span>
              <span className="rounded-full bg-[var(--soft)] px-3 py-2">Operacoes multi-turno</span>
            </div>
          </div>
        </article>
      </section>
      <section className="surface-card mt-8 rounded-3xl border border-slate-100 bg-blue-50/40 px-6 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Pronto para evoluir sua operacao</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">Leve sua gestao para o nivel profissional</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">Use web e mobile com experiencia consistente, sincronizacao real e leitura operacional clara para tomar decisoes rapidas.</p>
        <Link href="/register" className="mt-6 inline-flex rounded-xl bg-[image:var(--brand-gradient)] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5">
          Criar conta gratuitamente
        </Link>
      </section>
      <footer className="border-t border-slate-200 mt-16 pt-10 pb-6">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-sm text-slate-500 hover:text-blue-600 transition">
                  Sobre
                </a>
              </li>
              <li>
                <a href="/contact" className="text-sm text-slate-500 hover:text-blue-600 transition">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-sm text-slate-500 hover:text-blue-600 transition">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-slate-500 hover:text-blue-600 transition">
                  Termos
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Estokar - Inventory OS. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  icon: Icon,
  text,
  title,
}: {
  icon: React.ComponentType<{ size?: number }>;
  text: string;
  title: string;
}) {
  return (
    <article className="flex items-start gap-3 rounded-2xl bg-[var(--soft)] px-4 py-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-black text-[var(--ink)]">{title}</h4>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{text}</p>
      </div>
    </article>
  );
}

function HowItWorks({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
}) {
  return (
    <article className="flex gap-3 rounded-2xl bg-[var(--soft)] p-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[var(--ink)]">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-black">{title}</h4>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{text}</p>
      </div>
    </article>
  );
}

function MockupRow({
  label,
  quantity,
  status,
}: {
  label: string;
  quantity: number;
  status: 'low' | 'high';
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center rounded-xl bg-[var(--soft)] px-3 py-2 text-sm">
      <p className="truncate font-semibold">{label}</p>
      <span
        className={`rounded-full px-2 py-1 text-xs font-bold ${status === 'low' ? 'bg-[var(--critical-soft)] text-[var(--critical)]' : 'bg-[var(--ok-soft)] text-[var(--ok)]'
          }`}>
        {quantity} un.
      </span>
    </div>
  );
}
