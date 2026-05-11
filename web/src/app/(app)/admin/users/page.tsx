"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getAdminUsers, promoteUser, deleteUser } from '@/lib/api/admin';
import { AdminUsersTable } from '@/components/admin/admin-users-table';
import { ConfirmationModal } from '@/components/admin/confirmation-modal';
import type { AdminUser, PaginatedResponse } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const session = useAuthStore((state) => state.session);
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modals state
  const [userToPromote, setUserToPromote] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = useCallback(async (options?: { signal?: AbortSignal; isActive?: () => boolean }) => {
    if (!session) return;

    if (options?.signal?.aborted) return;
    setIsLoading(true);
    try {
      const response = await getAdminUsers({
        accessToken: session.accessToken,
        page,
        search,
        signal: options?.signal,
      });
      if (options?.isActive && !options.isActive()) return;
      setData(response);
    } catch (error) {
      if (options?.signal?.aborted) return;
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar usuários.');
    } finally {
      if (options?.isActive && !options.isActive()) return;
      setIsLoading(false);
    }
  }, [session, page, search]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchUsers({
      signal: controller.signal,
      isActive: () => active,
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fetchUsers]);

  const handlePromote = async () => {
    if (!userToPromote || !session) return;

    setIsActionLoading(true);
    try {
      await promoteUser(userToPromote.id, session.accessToken);
      toast.success(`${userToPromote.name} agora é um administrador.`);
      setUserToPromote(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao promover usuário.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete || !session) return;

    setIsActionLoading(true);
    try {
      await deleteUser(userToDelete.id, session.accessToken);
      toast.success('Usuário removido com sucesso.');
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao remover usuário.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Gestão de Usuários</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Gerencie permissões e visualize todos os usuários da plataforma.
        </p>
      </header>

      <AdminUsersTable
        users={data?.data ?? []}
        total={data?.meta?.total ?? 0}
        page={page}
        perPage={10}
        onPageChange={setPage}
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        onPromote={setUserToPromote}
        onDelete={setUserToDelete}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={!!userToPromote}
        onClose={() => setUserToPromote(null)}
        onConfirm={handlePromote}
        variant="info"
        title="Promover Usuário"
        description={`Tem certeza que deseja promover ${userToPromote?.name} para administrador? Esta ação dará acesso total ao painel administrativo.`}
        confirmText="Promover"
        isLoading={isActionLoading}
      />

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Remover Usuário"
        description={`Tem certeza que deseja remover ${userToDelete?.name}? Esta ação é permanente e o usuário perderá acesso a todos os seus dados.`}
        confirmText="Remover"
        isLoading={isActionLoading}
      />
    </div>
  );
}
