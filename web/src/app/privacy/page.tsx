"use client";

import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function PublicPrivacyPage() {
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
                <ShieldCheck size={28} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900">Privacidade e Dados</h1>
            <p className="text-base text-slate-600">Saiba como protegemos suas informações</p>
          </div>

          {/* Card de conteúdo */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 space-y-8 text-slate-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Seção 1 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  1
                </span>
                Coleta de Dados
              </h2>
              <p className="leading-relaxed">
                O Estokar coleta informações essenciais para o funcionamento da gestão de estoque, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong className="text-slate-900">Dados de Usuário:</strong> Nome, email e senha (criptografada).
                </li>
                <li>
                  <strong className="text-slate-900">Dados de Inventário:</strong> Informações sobre produtos (nome, descrição, quantidade, imagem) e categorias.
                </li>
                <li>
                  <strong className="text-slate-900">Histórico de Movimentação:</strong> Registros detalhados de todas as entradas e saídas de produtos, incluindo data e horário.
                </li>
              </ul>
            </div>

            {/* Seção 2 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  2
                </span>
                Uso das Informações
              </h2>
              <p className="leading-relaxed">
                Os dados coletados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Gerar relatórios de estoque e movimentação.</li>
                <li>Fornecer alertas de baixo estoque e sugerir reposições.</li>
                <li>Identificar o autor de cada alteração no inventário para fins de auditoria interna.</li>
              </ul>
            </div>

            {/* Seção 3 */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  3
                </span>
                Proteção e Armazenamento
              </h2>
              <p className="leading-relaxed">
                Todos os dados são armazenados em servidores seguros e transmitidos via conexão criptografada (SSL/TLS). As senhas dos usuários são protegidas por algoritmos de hash de alta segurança, impedindo o acesso mesmo por administradores do sistema.
              </p>
            </div>

            {/* Seção 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                  4
                </span>
                Compartilhamento com Terceiros
              </h2>
              <p className="leading-relaxed">
                O Estokar não vende, aluga ou compartilha dados de inventário com terceiros para fins comerciais. O acesso aos dados é restrito aos usuários autorizados pela organização contratante.
              </p>
            </div>

            {/* Rodapé */}
            <div className="pt-8 border-t border-slate-200 text-center">
              <p className="text-sm italic text-slate-600">
                Compromisso com a LGPD e Segurança da Informação
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
                href="/terms"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
              >
                Termos de Uso
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
