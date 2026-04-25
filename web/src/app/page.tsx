import Link from 'next/link';
import { Boxes, ChartNoAxesColumnIncreasing, CheckCheck, History, Layers3, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col px-6 py-10 sm:px-8 lg:py-12">
      <header className="surface-card mb-12 flex items-center justify-between rounded-3xl border border-[var(--stroke)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-white">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estokar</p>
            <h1 className="text-xl font-black text-[var(--ink)]">Inventory OS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="interactive-press rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold hover:bg-[var(--soft)]">
            Entrar
          </Link>
          <Link href="/register" className="interactive-press rounded-2xl bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            Comecar
          </Link>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="reveal-up rounded-3xl bg-[var(--ink)] p-8 text-white shadow-[0_30px_60px_-45px_rgba(8,11,18,0.9)] lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#AEB7C8]">Controle inteligente de estoque</p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight lg:text-5xl">Controle total do seu estoque, sem complicacao.</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#C9D1DF]">
            Gerencie produtos, categorias e movimentacoes em segundos com uma experiencia fluida e previsao operacional em tempo real.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="interactive-press rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[var(--ink)] hover:opacity-90">
              Criar conta gratuitamente
            </Link>
            <Link href="/login" className="interactive-press rounded-2xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              Entrar agora
            </Link>
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
              <span className="rounded-full bg-[var(--ok-soft)] px-3 py-1 text-xs font-bold text-[var(--ok)]">Sincronizado</span>
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

      <section className="surface-card mt-8 rounded-3xl border border-[var(--stroke)] bg-[var(--accent-soft)] px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Pronto para evoluir sua operacao</p>
        <h3 className="mt-2 text-3xl font-black text-[var(--ink)]">Leve sua gestao para o nivel profissional</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--muted)]">Use web e mobile com experiencia consistente, sincronizacao real e leitura operacional clara para tomar decisoes rapidas.</p>
        <Link href="/register" className="interactive-press mt-6 inline-flex rounded-2xl bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
          Criar conta gratuitamente
        </Link>
      </section>
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
        className={`rounded-full px-2 py-1 text-xs font-bold ${
          status === 'low' ? 'bg-[var(--critical-soft)] text-[var(--critical)]' : 'bg-[var(--ok-soft)] text-[var(--ok)]'
        }`}>
        {quantity} un.
      </span>
    </div>
  );
}
