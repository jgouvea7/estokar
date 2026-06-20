import Link from 'next/link';
import { BrandIcon } from '@/components/ui/brand-icon';
import { BackButton } from '@/components/ui/back-button';
import { ShieldCheck } from 'lucide-react';

export default function PublicPrivacyPage() {
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
              <ShieldCheck size={22} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-(--ink) sm:text-4xl">Privacidade e Dados</h1>
          <p className="text-sm text-(--muted)">Saiba como protegemos suas informações</p>
        </div>

        <section className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6 sm:p-8 space-y-8 text-sm leading-relaxed text-(--muted)">
          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                1
              </span>
              Coleta de Dados
            </h2>
            <p>
              O Estokar coleta informações essenciais para o funcionamento da gestão de estoque, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="font-bold text-(--ink)">Dados de Usuário:</strong> Nome, email e senha (criptografada).
              </li>
              <li>
                <strong className="font-bold text-(--ink)">Dados de Inventário:</strong> Informações sobre produtos (nome, descrição, quantidade, imagem) e categorias.
              </li>
              <li>
                <strong className="font-bold text-(--ink)">Histórico de Movimentação:</strong> Registros detalhados de todas as entradas e saídas de produtos, incluindo data e horário.
              </li>
            </ul>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                2
              </span>
              Uso das Informações
            </h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gerar relatórios de estoque e movimentação.</li>
              <li>Fornecer alertas de baixo estoque e sugerir reposições.</li>
              <li>Identificar o autor de cada alteração no inventário para fins de auditoria interna.</li>
            </ul>
          </div>

          <div className="space-y-4 pb-8 border-b-2 border-(--stroke)">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                3
              </span>
              Proteção e Armazenamento
            </h2>
            <p>
              Todos os dados são armazenados em servidores seguros e transmitidos via conexão criptografada (SSL/TLS). As senhas dos usuários são protegidas por algoritmos de hash de alta segurança, impedindo o acesso mesmo por administradores do sistema.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent) font-bold text-xs">
                4
              </span>
              Compartilhamento com Terceiros
            </h2>
            <p>
              O Estokar não vende, aluga ou compartilha dados de inventário com terceiros para fins comerciais. O acesso aos dados é restrito aos usuários autorizados pela organização contratante.
            </p>
          </div>

          <div className="pt-8 border-t-2 border-(--stroke) text-center">
            <p className="text-sm italic text-(--muted)">
              Compromisso com a LGPD e Segurança da Informação
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
              href="/terms"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-2.5 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
            >
              Termos de Uso
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
