"use client";

import { useState } from 'react';
import Link from 'next/link';
import { VersionModal } from '@/components/settings/version-modal';
import { BUILD_STRING } from '@/lib/version';
import { ChevronRight, FileText, Info, LucideIcon, Shield, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  return (
    <div className="space-y-8 reveal-up">
      <section>
        <h3 className="text-3xl font-bold tracking-tight text-(--ink)">Configurações</h3>
        <p className="mt-2 text-sm font-medium text-(--muted)">Gerencie as preferências da plataforma e informações legais.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <article className="surface-card p-6">
            <header className="mb-6">
              <h4 className="text-lg font-bold text-(--ink)">Sistema</h4>
              <p className="text-sm font-medium text-(--muted)">Informações técnicas sobre o aplicativo.</p>
            </header>

            <div className="space-y-3">
              <SettingsItem
                icon={Smartphone}
                label="Versão do sistema"
                value={BUILD_STRING}
                onClick={() => setIsVersionModalOpen(true)}
              />
            </div>
          </article>

          <article className="surface-card p-6">
            <header className="mb-6">
              <h4 className="text-lg font-bold text-(--ink)">Jurídico e Suporte</h4>
              <p className="text-sm font-medium text-(--muted)">Documentação legal e diretrizes de uso.</p>
            </header>

            <div className="space-y-3">
              <SettingsLink
                href="/settings/terms"
                icon={FileText}
                label="Termos de uso"
                description="Direitos e deveres na utilização do Estokar."
              />

              <SettingsLink
                href="/settings/privacy"
                icon={Shield}
                label="Privacidade e Dados"
                description="Como protegemos sua segurança e informações."
              />

              <SettingsLink
                href="/settings/about"
                icon={Info}
                label="Sobre o Estokar"
                description="Conheça a história e os criadores por trás da ferramenta."
              />
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <article className="surface-card p-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-(--ink) mb-4">Informações Legais</h4>
            <div className="space-y-4 text-sm text-(--muted) leading-relaxed">
              <p>
                O <span className="font-bold text-(--ink)">Estokar Inventory OS</span> é uma plataforma de gerenciamento de inventário projetada para otimização de fluxos operacionais.
              </p>
              <p>
                Ao utilizar este software, você declara estar ciente de que a integridade dos dados inseridos é de responsabilidade da organização proprietária da conta.
              </p>
              <div className="pt-4 border-t-2 border-(--stroke)">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-(--muted)">
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

function SettingsItem({ icon: Icon, label, value, onClick }: { icon: LucideIcon, label: string, value: string, onClick?: () => void }) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border-2 border-(--stroke) bg-(--card) p-4 text-left transition-all ${onClick ? 'hover:bg-(--soft) cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-(--ink)">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-(--accent)">{value}</span>
        {onClick && <ChevronRight size={14} className="text-(--muted)" />}
      </div>
    </Component>
  );
}


function SettingsLink({ icon: Icon, label, description, href }: { icon: LucideIcon, label: string, description: string, href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border-2 border-(--stroke) bg-(--card) p-4 transition-all hover:bg-(--soft)">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-(--ink)">{label}</p>
          <p className="text-xs font-medium text-(--muted)">{description}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-(--muted)" />
    </Link>
  );
}
