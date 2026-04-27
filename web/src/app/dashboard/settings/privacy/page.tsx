"use client";

import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-ink">Privacidade e Dados</h1>
          <p className="text-xs font-bold text-muted uppercase tracking-wider">Estokar Inventory OS</p>
        </div>
      </header>

      <section className="surface-card rounded-2xl border border-stroke p-8 space-y-6 text-sm leading-relaxed text-muted">
        <div className="space-y-4">
          <h2 className="text-lg font-black text-ink flex items-center gap-2">
            <ShieldCheck size={20} className="text-ok" />
            1. Coleta de Dados
          </h2>
          <p>
            O Estokar coleta informacoes essenciais para o funcionamento da gestao de estoque, incluindo:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dados de Usuario:</strong> Nome, email e senha (criptografada).</li>
            <li><strong>Dados de Inventario:</strong> Informacoes sobre produtos (nome, descricao, quantidade, imagem) e categorias.</li>
            <li><strong>Historico de Movimentacao:</strong> Registros detalhados de todas as entradas e saidas de produtos, incluindo data e horario.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-ink">2. Uso das Informacoes</h2>
          <p>
            Os dados coletados sao utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Gerar relatorios de estoque e movimentacao.</li>
            <li>Fornecer alertas de baixo estoque e sugerir reposicoes.</li>
            <li>Identificar o autor de cada alteracao no inventario para fins de auditoria interna.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-ink">3. Protecao e Armazenamento</h2>
          <p>
            Todos os dados sao armazenados em servidores seguros e transmitidos via conexao criptografada (SSL/TLS). As senhas dos usuarios sao protegidas por algoritmos de hash de alta seguranca, impedindo o acesso mesmo por administradores do sistema.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-ink">4. Compartilhamento com Terceiros</h2>
          <p>
            O Estokar nao vende, aluga ou compartilha dados de inventario com terceiros para fins comerciais. O acesso aos dados e restrito aos usuarios autorizados pela organizacao contratante.
          </p>
        </div>

        <div className="pt-6 border-t border-stroke text-center italic text-xs">
          Compromisso com a LGPD e Seguranca da Informacao.
        </div>
      </section>
    </div>
  );
}
