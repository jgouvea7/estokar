"use client";

import Link from 'next/link';
import { Shield, FileText, Info, Smartphone, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl border border-stroke p-6">
        <h3 className="text-2xl font-black text-ink mb-6">Configuracoes</h3>

        <div className="space-y-4">
          <SettingsItem
            icon={Smartphone}
            label="Versao do aplicativo"
            value="v1.2.4 (Build 20240422)"
          />

          <div className="h-px bg-stroke" />

          <SettingsLink
            href="/dashboard/settings/terms"
            icon={FileText}
            label="Termos de uso"
            description="Leia as regras de utilizacao do sistema."
          />

          <SettingsLink
            href="/dashboard/settings/privacy"
            icon={Shield}
            label="Privacidade e Dados"
            description="Como seus dados sao tratados e protegidos."
          />

          <SettingsLink
            href="/dashboard/settings/about"
            icon={Info}
            label="Sobre o Estokar"
            description="Informacoes sobre a plataforma e equipe."
          />
        </div>
      </section>

      <section className="surface-card rounded-2xl border border-stroke p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Informacoes Legais</h4>
        <div className="prose prose-sm max-w-none text-muted">
          <p>
            O Estokar Inventory OS e uma ferramenta de gestao interna. Ao utilizar este software,
            voce concorda que os dados inseridos sao de responsabilidade da organizacao contratante.
          </p>
          <p className="mt-2 text-xs opacity-60">
            © 2026 Estokar Inventory OS. Todos os direitos reservados.
          </p>
        </div>
      </section>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-soft text-ink">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="text-xs text-muted">Informacao do sistema</p>
        </div>
      </div>
      <span className="text-sm font-black text-accent">{value}</span>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, description, href }: { icon: any, label: string, description: string, href: string }) {
  return (
    <Link href={href} className="interactive-press w-full flex items-center justify-between py-2 text-left hover:opacity-80">
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-soft text-ink">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}
