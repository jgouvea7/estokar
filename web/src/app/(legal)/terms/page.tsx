import Link from 'next/link';
import { BrandIcon } from '@/components/ui/brand-icon';
import { BackButton } from '@/components/ui/back-button';
import { Scale } from 'lucide-react';

export default function PublicTermsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:py-8">
      <header className="mb-20 flex items-center justify-between rounded-xl border-2 border-(--stroke) bg-(--card) px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-(--ink) text-amber-400">
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
              <Scale size={22} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">Termos de Uso</h1>
          <p className="text-sm text-(--muted)">
            Regras e diretrizes para uso do Estokar
          </p>
        </div>

        <section className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6 sm:p-8 space-y-8 text-sm leading-relaxed text-(--muted)">
          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                1
              </span>
              Aceitação dos Termos
            </h2>
            <p>
              Ao acessar e utilizar o Estokar, você concorda em cumprir e estar vinculado aos
              presentes Termos de Uso. Caso não concorde com qualquer parte destes termos,
              você não deve utilizar o sistema.
            </p>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                2
              </span>
              Cadastro e Segurança
            </h2>
            <p>
              Para utilizar o Estokar, é necessário criar uma conta com informações precisas
              e atualizadas. Você é responsável por manter a confidencialidade de suas
              credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
            <p>
              Notifique imediatamente caso suspeite de uso não autorizado de sua conta.
            </p>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                3
              </span>
              Uso Permitido
            </h2>
            <p>
              O Estokar deve ser utilizado exclusivamente para fins de gestão de estoque.
              É proibido utilizar o sistema para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Armazenar conteúdo ilegal, ofensivo ou que viole direitos de terceiros.</li>
              <li>Tentar acessar áreas restritas ou dados de outros usuários.</li>
              <li>Realizar ações que possam comprometer a segurança ou estabilidade da plataforma.</li>
            </ul>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                4
              </span>
              Disponibilidade
            </h2>
            <p>
              O Estokar é oferecido como está e não garante disponibilidade contínua ou
              ininterrupta. O sistema pode passar por períodos de manutenção sem aviso
              prévio. Não nos responsabilizamos por perdas decorrentes de indisponibilidade
              temporária.
            </p>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                5
              </span>
              Limitação de Responsabilidade
            </h2>
            <p>
              Em nenhuma circunstância o Estokar será responsável por danos indiretos,
              incidentais ou consequenciais decorrentes do uso ou da incapacidade de usar
              o sistema, mesmo que informado sobre a possibilidade de tais danos.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                6
              </span>
              Alterações nestes Termos
            </h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento.
              Alterações serão comunicadas aos usuários registrados e o uso continuado
              do sistema após tais alterações constitui aceitação dos novos termos.
            </p>
          </div>

          <div className="pt-8 border-t-2 border-(--stroke) text-center">
            <p className="text-sm italic text-(--muted)">
              Leia atentamente antes de utilizar o sistema
            </p>
            <p className="mt-2 text-xs text-(--muted)">
              Última atualização: 28 de Abril de 2026
            </p>
          </div>
        </section>

        <div className="mt-10 text-center space-y-4 py-8 border-t-2 border-(--stroke)">
          <p className="text-sm text-(--muted)">Documentos relacionados:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-2.5 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t-2 border-(--stroke) pt-8 pb-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-(--ink) text-amber-400">
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
