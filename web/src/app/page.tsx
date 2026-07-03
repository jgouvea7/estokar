import Link from 'next/link';
import { BrandIcon } from '@/components/ui/brand-icon';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Package2,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function Home() {
  return <LandingPage />;
}

function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:py-8">
      <header className="mb-16 flex items-center justify-between rounded-xl border-2 border-(--stroke) bg-(--card) px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-(--brand-bg) text-(--accent)">
            <BrandIcon size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-(--ink) leading-tight">Estokar</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Inventory OS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)">
            Entrar
          </Link>
          <Link href="/register" className="rounded-lg bg-(--button) px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-125">
            Criar conta gratuita
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="reveal-up">
          <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-(--ok-soft) bg-(--ok-soft) px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-(--ok)">
            <Bell size={12} />
            Grátis para MEIs
          </p>
          <h2 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-(--ink) sm:text-5xl lg:text-[3.5rem]">
            Nunca mais perca tempo{' '}
            <span className="text-(--accent)">procurando produto no estoque</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-(--muted)">
            Controle de estoque simples: cadastre seus produtos, registre entradas e saídas, e receba alerta quando estiver perto de acabar. Tudo gratuito.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--button) px-6 py-3.5 text-sm font-bold text-white transition-all hover:brightness-125"
            >
              Ver meu painel em 30 segundos
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-(--stroke) bg-(--card) px-6 py-3.5 text-sm font-bold text-(--ink) transition-all hover:bg-(--soft)"
            >
              Como funciona
            </Link>
          </div>
          <p className="mt-3 text-xs font-medium text-(--muted)">Sem cartão de crédito. Sem compromisso.</p>
        </div>

        <div className="reveal-up rounded-xl border-2 border-(--stroke) bg-(--card) p-5" style={{ animationDelay: '100ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Seu painel em tempo real</span>
            <span className="flex items-center gap-1.5 rounded-full bg-(--ok-soft) px-2.5 py-0.5 text-[9px] font-bold text-(--ok)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--ok)" />
              Ativo
            </span>
          </div>
          <div className="space-y-2">
            <DemoRow label="Arroz 5kg" quantity={42} trend="up" />
            <DemoRow label="Óleo de soja" quantity={18} trend="up" />
            <DemoRow label="Café em pó" quantity={6} trend="down" status="low" />
            <DemoRow label="Leite integral" quantity={2} trend="down" status="critical" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-(--low-soft) px-3 py-2.5">
            <AlertTriangle size={14} className="text-(--low)" />
            <span className="text-[10px] font-bold text-(--muted)">Alerta: <span className="text-(--low)">Leite integral acaba em 2 dias</span></span>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">Para quem é</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">
            Feito para o pequeno negócio
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-(--muted)">
            Se você tem uma loja física, mercadinho, oficina ou qualquer negócio que precisa controlar estoque, o Estokar é para você.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Package2}
            title="Cadastro rápido"
            text="Adicione produtos em segundos. Nome, quantidade e pronto."
          />
          <FeatureCard
            icon={ShoppingCart}
            title="Entrada e saída"
            text="Registre movimentações com um clique. Histórico automático."
          />
          <FeatureCard
            icon={AlertTriangle}
            title="Alertas de reposição"
            text="Saiba antes de ficar sem estoque. Nunca mais perca uma venda."
          />
          <FeatureCard
            icon={BarChart3}
            title="Previsão inteligente"
            text="Descubra quantos dias seu estoque ainda vai durar."
          />
        </div>
      </section>

      <section className="mt-24">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">Como funciona</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">
            Comece em 3 passos
          </h3>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <StepCard number="01" title="Crie sua conta" text="Informe apenas nome, email e senha. Leva 15 segundos e não pedimos cartão." />
          <StepCard number="02" title="Cadastre seus produtos" text="Adicione o nome e a quantidade de cada item. Simples como uma planilha." />
          <StepCard number="03" title="Acompanhe o painel" text="Veja alertas, previsão de reposição e histórico em uma tela só." />
        </div>
      </section>

      <section className="mt-24 rounded-xl border-2 border-(--stroke) bg-(--card) px-6 py-12 text-center sm:px-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">Pronto para organizar</p>
        <h3 className="mt-3 text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">
          Menos planilha, mais controle
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm text-(--muted)">
          Cadastre seus primeiros produtos em menos de 2 minutos. Sem custo, sem burocracia.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--button) px-6 py-3.5 text-sm font-bold text-white transition-all hover:brightness-125"
        >
          Criar conta gratuita
          <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="mt-20 border-t-2 border-(--stroke) pt-8 pb-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-(--brand-bg) text-(--accent)">
                <BrandIcon size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-(--ink)">Estokar</p>
                <p className="text-[9px] font-medium text-(--muted)">Inventory OS</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-(--muted) leading-relaxed">
              Plataforma gratuita de gestão de inventário.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-(--muted) mb-3">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Sobre
                </a>
              </li>
              <li>
                <a href="/contact" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Contato
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-(--muted) mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="/terms" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Termos
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-[10px] font-medium text-(--muted)">
          &copy; {new Date().getFullYear()} Estokar Inventory OS. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border-2 border-(--stroke) bg-(--card) p-5 transition-colors hover:bg-(--surface-2)">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
        <Icon size={18} />
      </div>
      <h4 className="mt-4 text-sm font-bold text-(--ink)">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-(--muted)">{text}</p>
    </article>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6">
      <p className="text-3xl font-bold text-(--accent)">{number}</p>
      <h4 className="mt-4 text-sm font-bold text-(--ink)">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-(--muted)">{text}</p>
    </article>
  );
}

function DemoRow({
  label,
  quantity,
  trend,
  status,
}: {
  label: string;
  quantity: number;
  trend: 'up' | 'down';
  status?: 'low' | 'critical';
}) {
  const isWarning = status === 'low' || status === 'critical';
  return (
    <div className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 ${
      isWarning
        ? status === 'critical'
          ? 'border-(--critical-soft) bg-(--critical-soft)'
          : 'border-(--low-soft) bg-(--low-soft)'
        : 'border-(--stroke) bg-(--surface-2)'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`flex h-5 w-5 items-center justify-center rounded ${
          isWarning
            ? status === 'critical'
              ? 'bg-(--critical) text-white'
              : 'bg-(--low) text-white'
            : trend === 'up'
              ? 'bg-(--ok-soft) text-(--ok)'
              : 'bg-(--soft) text-(--muted)'
        }`}>
          <TrendingUp size={10} />
        </div>
        <span className={`text-xs font-semibold ${isWarning ? 'text-(--ink)' : 'text-(--ink)'}`}>{label}</span>
      </div>
      <span className="text-xs font-bold tabular-nums text-(--ink)">
        {quantity} <span className="text-[9px] font-medium text-(--muted)">un.</span>
      </span>
    </div>
  );
}
