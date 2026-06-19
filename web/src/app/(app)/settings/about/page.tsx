"use client";

import { Boxes, Users, Zap, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <header>
        <h1 className="text-2xl font-black text-(--ink)">Sobre o Estokar</h1>
        <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">Inventory OS</p>
      </header>

      <section className="surface-card rounded-xl border-2 border-(--stroke) p-8 space-y-8 text-sm leading-relaxed text-(--muted)">
        <div className="text-center space-y-4">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-(--ink) text-white">
            <Boxes size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-(--ink)">Estokar Inventory OS</h2>
            <p className="text-(--accent) font-bold">Versão 1.11.0</p>
          </div>
          <p className="max-w-md mx-auto">
            Uma plataforma moderna e intuitiva desenhada para simplificar o controle de estoque de pequenas e medias empresas com foco em agilidade e precisao.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-(--ink) font-black">
              <Zap size={18} className="text-(--accent)" />
              Agilidade Real-time
            </div>
            <p>Sincronizacao imediata entre web e mobile, garantindo que sua equipe sempre veja a quantidade exata em estoque.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-(--ink) font-black">
              <Users size={18} className="text-(--accent)" />
              Gestao Colaborativa
            </div>
            <p>Controle de acesso por niveis, permitindo que multiplos colaboradores gerenciem o inventario com rastreabilidade total.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-(--ink) font-black">
              <Globe size={18} className="text-(--accent)" />
              Multi-Plataforma
            </div>
            <p>Acesse de qualquer lugar via navegador ou utilize nosso aplicativo mobile para registros rapidos no deposito.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-(--ink) font-black">
              <Boxes size={18} className="text-(--accent)" />
              Inteligencia de Dados
            </div>
            <p>Alertas inteligentes de baixo estoque e dashboards operacionais que ajudam na tomada de decisao de compra.</p>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-(--stroke)">
          <h3 className="text-lg font-black text-(--ink) mb-4">Nossa Missao</h3>
          <p>
            O Estokar nasceu da necessidade de transformar o controle de estoque, muitas vezes caotico e manual, em um processo digital transparente e livre de erros. Acreditamos que uma boa gestao de inventario e o coracao de uma operacao comercial saudavel.
          </p>
        </div>
      </section>
    </div>
  );
}
