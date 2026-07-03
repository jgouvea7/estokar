import Link from 'next/link';
import { BrandIcon } from '@/components/ui/brand-icon';
import { BackButton } from '@/components/ui/back-button';
import { Info } from 'lucide-react';

export default function PublicAboutPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:py-8">
      <header className="mb-20 flex items-center justify-between rounded-xl border-2 border-(--stroke) bg-(--card) px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-(--brand-bg) text-(--accent)">
              <BrandIcon size={20} />
            </div>
            <div className="hidden sm:block">
            <h1 className="text-base font-bold text-(--ink) leading-tight">Estokar</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Inventory OS</p>
            </div>
          </Link>
        </div>
        <BackButton />
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl">
        <div className="space-y-3 text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-(--accent-soft) text-(--accent)">
              <Info size={22} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">Sobre o Estokar</h1>
          <p className="text-sm text-(--muted)">
            Controle de estoque simples e gratuito para o pequeno negócio
          </p>
        </div>

        <section className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6 sm:p-8 space-y-8 text-sm leading-relaxed text-(--muted)">
          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink)">O que é</h2>
            <p>
              O Estokar é uma plataforma gratuita de controle de estoque feita para o pequeno negócio.
              Cadastre seus produtos, registre entradas e saídas, e receba alertas quando o estoque estiver perto do fim.
            </p>
            <p>
              Tudo em uma interface simples, direta e sem custo.
            </p>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink)">Funcionalidades</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-(--ok)" />
                <span><strong className="text-(--ink)">Cadastro de produtos:</strong> nome, categoria, imagem e quantidade.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-(--ok)" />
                <span><strong className="text-(--ink)">Movimentações:</strong> registre entradas e saídas com um clique.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-(--ok)" />
                <span><strong className="text-(--ink)">Alertas de reposição:</strong> saiba antes de ficar sem estoque.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-(--ok)" />
                <span><strong className="text-(--ink)">Dashboard:</strong> métricas, previsão de dias restantes e tendências.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink)">Custo</h2>
            <p>
              O Estokar é totalmente gratuito. Não há cobrança pelo uso da plataforma.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-(--ink)">Projeto em desenvolvimento</h2>
            <p>
              O Estokar está em evolução constante. Funcionalidades podem mudar, serem ajustadas ou expandidas ao longo do tempo.
            </p>
          </div>
        </section>

        <div className="mt-10 text-center space-y-4 py-8 border-t-2 border-(--stroke)">
          <p className="text-sm text-(--muted)">Dúvidas ou feedback?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-(--button) px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-125"
            >
              Entrar em contato
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t-2 border-(--stroke) pt-8 pb-6">
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
              Plataforma de gestão de inventário para pequenas e médias empresas.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-(--muted) mb-3">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-(--muted) mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-xs font-medium text-(--muted) transition-colors hover:text-(--ink)">
                  Termos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-[10px] font-medium text-(--muted)">
          &copy; {new Date().getFullYear()} Estokar Inventory OS. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
