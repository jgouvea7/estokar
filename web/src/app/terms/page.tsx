"use client";

import Link from 'next/link';
import { ChevronLeft, FileText } from 'lucide-react';

export default function PublicTermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header simples */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-slate-600 transition-colors font-semibold">
            <ChevronLeft size={20} />
            Voltar
          </Link>
          <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50">
            Entrar
          </Link>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12 sm:px-8">
        <article className="space-y-8">
          {/* Título */}
          <div className="space-y-3 text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                <FileText size={28} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900">Termos de Uso</h1>
            <p className="text-base text-slate-600">Leia os termos e condições de uso</p>
          </div>

          {/* Card de conteúdo */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 space-y-8 text-slate-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Seção 1 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  1
                </span>
                Aceitação dos Termos
              </h2>
              <p className="leading-relaxed">
                Ao acessar e utilizar o Estokar Inventory OS, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Este sistema é destinado exclusivamente para gestão de inventário e controle de estoque empresarial.
              </p>
            </div>

            {/* Seção 2 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  2
                </span>
                Responsabilidade do Usuário
              </h2>
              <p className="leading-relaxed">
                O usuário é responsável pela veracidade das informações inseridas no sistema, incluindo nomes de produtos, quantidades e categorias. O uso indevido do sistema para fins não relacionados a gestão de estoque é estritamente proibido.
              </p>
            </div>

            {/* Seção 3 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  3
                </span>
                Controle de Acesso
              </h2>
              <p className="leading-relaxed">
                As credenciais de acesso (email e senha) são pessoais e intransferíveis. O usuário compromete-se a notificar a administração imediatamente em caso de suspeita de uso não autorizado de sua conta.
              </p>
            </div>

            {/* Seção 4 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  4
                </span>
                Funcionalidades do Sistema
              </h2>
              <p className="leading-relaxed">
                O Estokar permite a criação, edição, exclusão e monitoramento de produtos e categorias, bem como o registro histórico de entradas e saídas de mercadorias. A disponibilidade destas funções pode variar de acordo com o nível de permissão do usuário.
              </p>
            </div>

            {/* Seção 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  5
                </span>
                Alterações nos Termos
              </h2>
              <p className="leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do próprio sistema ou por email.
              </p>
            </div>

            {/* Rodapé */}
            <div className="pt-8 border-t border-slate-200 text-center">
              <p className="text-sm italic text-slate-600">
                Comprometimento com a conformidade legal e segurança do usuário
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Última atualização: 28 de Abril de 2026
              </p>
            </div>
          </section>

          {/* Links relacionados */}
          <div className="mt-12 text-center space-y-4 py-8 border-t border-slate-200">
            <p className="text-slate-600">Documentos relacionados:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-6">
        <div className="mx-auto max-w-[1120px] flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-slate-600 sm:px-8">
          <p>© 2026 Estokar - Inventory OS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
