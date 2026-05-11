"use client";

import { useState } from 'react';
import { VersionModal } from '@/components/settings/version-modal';
import { ChevronRight, FileText, Info, Link, LucideIcon, Shield, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  return (
    <div className="space-y-8 reveal-up">
      <section>
        <h3 className="text-3xl font-bold tracking-tight text-[#0f172a]">Configurações</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">Gerencie as preferências da plataforma e informações legais.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <article className="surface-card p-8">
            <header className="mb-8">
              <h4 className="text-lg font-bold text-[#0f172a]">Sistema</h4>
              <p className="text-sm font-medium text-slate-500">Informações técnicas sobre o aplicativo.</p>
            </header>

            <div className="space-y-4">
              <SettingsItem
                icon={Smartphone}
                label="Versão do sistema"
                value="v1.7.1 (Build 20260510)"
                color="blue"
                onClick={() => setIsVersionModalOpen(true)}
              />
            </div>
          </article>

          <article className="surface-card p-8">
            <header className="mb-8">
              <h4 className="text-lg font-bold text-[#0f172a]">Jurídico e Suporte</h4>
              <p className="text-sm font-medium text-slate-500">Documentação legal e diretrizes de uso.</p>
            </header>

            <div className="space-y-2">
              <SettingsLink
                href="/settings/terms"
                icon={FileText}
                label="Termos de uso"
                description="Direitos e deveres na utilização do Estokar."
                color="slate"
              />

              <SettingsLink
                href="/settings/privacy"
                icon={Shield}
                label="Privacidade e Dados"
                description="Como protegemos sua segurança e informações."
                color="emerald"
              />

              <SettingsLink
                href="/settings/about"
                icon={Info}
                label="Sobre o Estokar"
                description="Conheça a história e os criadores por trás da ferramenta."
                color="indigo"
              />
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <article className="surface-card p-8 bg-slate-50 border-none shadow-none">
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#0f172a] mb-4">Informações Legais</h4>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                O <span className="font-bold text-[#0f172a]">Estokar Inventory OS</span> é uma plataforma de gerenciamento de inventário projetada para otimização de fluxos operacionais.
              </p>
              <p>
                Ao utilizar este software, você declara estar ciente de que a integridade dos dados inseridos é de responsabilidade da organização proprietária da conta.
              </p>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                  © 2026 Estokar Inventory OS. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
}

function SettingsItem({ icon: Icon, label, value, color, onClick }: { icon: LucideIcon, label: string, value: string, color: string, onClick?: () => void }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`flex w-full items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all ${onClick ? 'hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0f172a]">{label}</p>
          <p className="text-xs font-medium text-slate-500">Sistema Estokar</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-blue-600">{value}</span>
        {onClick && <ChevronRight size={16} className="text-slate-300" />}
      </div>
    </Component>
  );
}


function SettingsLink({ icon: Icon, label, description, href, color }: { icon: LucideIcon, label: string, description: string, href: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Link href={href} className="group flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-slate-50">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0f172a]">{label}</p>
          <p className="text-xs font-medium text-slate-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
