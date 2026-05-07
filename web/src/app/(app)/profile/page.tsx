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
        <h3 className="text-3xl font-bold tracking-tight text-[#0f172a]">Perfil do Usuário</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">Gerencie suas informações pessoais e configurações de conta.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <article className="surface-card p-8">
            <header className="mb-6">
              <h4 className="text-lg font-bold text-[#0f172a]">Dados Pessoais</h4>
              <p className="text-sm font-medium text-slate-500">Informações básicas de identificação.</p>
            </header>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome Completo</span>
                <span className="text-sm font-bold text-[#0f172a]">{session.user.name}</span>
              </div>
              <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endereço de E-mail</span>
                <span className="text-sm font-bold text-[#0f172a]">{session.user.email}</span>
              </div>
            </div>
          </article>

          <article className="surface-card p-8 border-rose-100 bg-rose-50/10">
            <header className="mb-6">
              <h4 className="text-lg font-bold text-rose-600">Zona de Perigo</h4>
              <p className="text-sm font-medium text-slate-500">Ações irreversíveis relacionadas à sua conta.</p>
            </header>

            <p className="text-sm text-slate-600 mb-6">
              Ao excluir sua conta, todos os seus dados de estoque, produtos e histórico serão removidos permanentemente. Esta ação não pode ser desfeita.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-6 py-3.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-600 hover:text-white active:scale-95">
              <Trash2 size={18} />
              Excluir Minha Conta Permanentemente
            </button>
          </article>
        </section>

        <section className="space-y-6">
          <article className="surface-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-600 border-4 border-white shadow-xl">
              {(session.user.name?.trim().slice(0, 1) || 'E').toUpperCase()}
            </div>
            <h4 className="text-lg font-bold text-[#0f172a]">{session.user.name}</h4>

            <div className="mt-8 flex flex-col gap-2">
              <div className="rounded-xl bg-slate-50 p-3 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Desde</p>
                <p className="text-xs font-bold text-slate-700">{session.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })
                  : '-'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-emerald-600">Conta Ativa</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>

  );
}
