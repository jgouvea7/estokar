"use client";

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <header>
        <h1 className="text-2xl font-black text-(--ink)">Termos de Uso</h1>
        <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">Estokar Inventory OS</p>
      </header>

      <section className="surface-card rounded-xl border-2 border-(--stroke) p-8 space-y-6 text-sm leading-relaxed text-(--muted)">
        <div className="space-y-4">
          <h2 className="text-lg font-black text-(--ink) flex items-center gap-2">
            <FileText size={20} className="text-(--accent)" />
            1. Aceitacao dos Termos
          </h2>
          <p>
            Ao acessar e utilizar o Estokar Inventory OS, voce concorda em cumprir e estar vinculado aos seguintes termos e condicoes de uso. Este sistema e destinado exclusivamente para gestao de inventario e controle de estoque empresarial.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-(--ink)">2. Responsabilidade do Usuario</h2>
          <p>
            O usuario e responsavel pela veracidade das informacoes inseridas no sistema, incluindo nomes de produtos, quantidades e categorias. O uso indevido do sistema para fins nao relacionados a gestao de estoque e estritamente proibido.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-(--ink)">3. Controle de Acesso</h2>
          <p>
            As credenciais de acesso (email e senha) sao pessoais e intransferiveis. O usuario compromete-se a notificar a administracao imediatamente em caso de suspeita de uso nao autorizado de sua conta.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-(--ink)">4. Funcionalidades do Sistema</h2>
          <p>
            O Estokar permite a criacao, edicao, exclusao e monitoramento de produtos e categorias, bem como o registro historico de entradas e saidas de mercadorias. A disponibilidade destas funcoes pode variar de acordo com o nivel de permissao do usuario.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-(--ink)">5. Alteracoes nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Alteracoes significativas serao comunicadas atraves do proprio sistema ou por email.
          </p>
        </div>

        <div className="pt-6 border-t-2 border-(--stroke) text-center italic text-xs text-(--muted)">
          Ultima atualizacao: 22 de Abril de 2026
        </div>
      </section>
    </div>
  );
}
