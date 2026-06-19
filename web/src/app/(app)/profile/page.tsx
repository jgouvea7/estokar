"use client";

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { deleteMyAccount } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth-store';
import { useHistoryStore } from '@/store/history-store';

export default function ProfilePage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearHistory = useHistoryStore((state) => state.clearHistory);


  if (!session) {
    return null;
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Essa acao nao pode ser desfeita.');
    if (!confirmed) return;

    try {
      if (!session) {
        toast.error('Usuário não autenticado');
        return;
      }

      await deleteMyAccount(session.accessToken);
      clearHistory();
      clearSession();
      toast.success('Conta excluida com sucesso.');
      router.replace('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel excluir sua conta.');
    }
  }


  return (
    <div className="space-y-8 reveal-up">
      <section>
        <h3 className="text-3xl font-bold tracking-tight text-(--ink)">Perfil do Usuário</h3>
        <p className="mt-2 text-sm font-medium text-(--muted)">Gerencie suas informações pessoais e configurações de conta.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <article className="surface-card p-6">
            <header className="mb-6">
              <h4 className="text-lg font-bold text-(--ink)">Dados Pessoais</h4>
              <p className="text-sm font-medium text-(--muted)">Informações básicas de identificação.</p>
            </header>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Nome Completo</span>
                <span className="text-sm font-bold text-(--ink)">{session.user.name}</span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Endereço de E-mail</span>
                <span className="text-sm font-bold text-(--ink)">{session.user.email}</span>
              </div>
            </div>
          </article>

          <article className="surface-card p-6">
            <header className="mb-4">
              <h4 className="text-lg font-bold text-(--critical)">Zona de Perigo</h4>
              <p className="text-sm font-medium text-(--muted)">Ações irreversíveis relacionadas à sua conta.</p>
            </header>

            <p className="text-sm text-(--muted) mb-5">
              Ao excluir sua conta, todos os seus dados de estoque, produtos e histórico serão removidos permanentemente. Esta ação não pode ser desfeita.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-(--critical) bg-(--card) px-4 py-2.5 text-xs font-bold text-(--critical) transition-all hover:bg-(--critical-soft)">
              <Trash2 size={14} />
              Excluir Minha Conta Permanentemente
            </button>
          </article>
        </section>

        <section className="space-y-6">
          <article className="surface-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-(--soft) text-2xl font-bold text-(--ink) border-4 border-(--card)">
              {(session.user.name?.trim().slice(0, 1) || 'E').toUpperCase()}
            </div>
            <h4 className="text-lg font-bold text-(--ink)">{session.user.name}</h4>

            <div className="mt-6 flex flex-col gap-2">
              <div className="rounded-lg border-2 border-(--stroke) bg-(--surface-2) p-3 text-left">
                <p className="text-[10px] font-bold text-(--muted) uppercase">Desde</p>
                <p className="text-xs font-bold text-(--ink)">{session.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })
                  : '-'}</p>
              </div>
              <div className="rounded-lg border-2 border-(--stroke) bg-(--surface-2) p-3 text-left">
                <p className="text-[10px] font-bold text-(--muted) uppercase">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-(--ok)" />
                  <p className="text-xs font-bold text-(--ok)">Conta Ativa</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>

  );
}
