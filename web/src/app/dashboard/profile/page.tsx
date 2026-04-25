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
    <div className="space-y-5">
      <section className="surface-card rounded-3xl border border-[var(--stroke)] p-5">
        <h3 className="text-3xl font-black">Perfil</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Configuracoes da sua conta.</p>
      </section>

      <section className="surface-card surface-card-hover rounded-3xl border border-[var(--stroke)] p-5">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-[var(--soft)] px-4 py-3">
            <span className="text-[var(--muted)]">Nome</span>
            <span className="font-bold">{session.user.name}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[var(--soft)] px-4 py-3">
            <span className="text-[var(--muted)]">E-mail</span>
            <span className="font-bold">{session.user.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDeleteAccount}
          className="interactive-press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F4C7CA] bg-white px-5 py-3 text-sm font-bold text-[var(--critical)] hover:bg-[var(--critical-soft)]">
          <Trash2 size={16} />
          Excluir conta
        </button>
      </section>
    </div>
  );
}
