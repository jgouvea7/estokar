"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, ShieldCheck, UserMinus, ChevronLeft, ChevronRight, Users, Shield, User } from 'lucide-react';
import type { AdminUser } from '@/lib/types';
import { formatDate } from '../../lib/utils';

interface AdminUsersTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onPromote: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  isLoading: boolean;
}

export function AdminUsersTable({
  users,
  total,
  page,
  perPage,
  onPageChange,
  onSearch,
  onPromote,
  onDelete,
  isLoading,
}: AdminUsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const userCount = total - adminCount;

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(searchTerm);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, onSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    onSearch(searchTerm);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
            <Users size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Total</p>
            <p className="text-lg font-bold text-(--ink)">{total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--ok-soft) text-(--ok)">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Administradores</p>
            <p className="text-lg font-bold text-(--ok)">{adminCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--soft) text-(--ink)">
            <User size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Usuários</p>
            <p className="text-lg font-bold text-(--ink)">{userCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--muted)" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) pl-10 pr-4 text-xs font-medium text-(--ink) outline-none transition-all placeholder:text-(--muted) focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-(--stroke) bg-(--card)">
        <div>
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-(--stroke) bg-(--surface-2)">
                <th className="w-[34%] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-(--muted)">Usuário</th>
                <th className="w-[30%] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-(--muted)">Email</th>
                <th className="w-[12%] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-(--muted)">Role</th>
                <th className="hidden w-[14%] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-(--muted) sm:table-cell">Criado em</th>
                <th className="w-[10%] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-(--muted)">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--stroke)">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-(--soft)" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-(--soft)" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 rounded bg-(--soft)" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-(--soft)" /></td>
                    <td className="px-4 py-3"><div className="ml-auto h-7 w-7 rounded bg-(--soft)" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-(--muted)">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-(--surface-2) transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-(--ink) break-words">
                        {user.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-(--muted) break-all">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-lg border-2 px-2 py-0.5 text-[10px] font-bold ${user.role === 'ADMIN'
                        ? 'border-(--ok) bg-(--ok-soft) text-(--ok)'
                        : 'border-(--stroke) bg-(--card) text-(--muted)'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs font-medium text-(--muted) sm:table-cell break-words">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => onPromote(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-(--stroke) text-(--muted) transition-all hover:bg-(--soft) hover:text-(--ok)"
                            title="Promover para Admin"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-(--stroke) text-(--muted) transition-all hover:bg-(--critical-soft) hover:text-(--critical)"
                          title="Remover Usuário"
                        >
                          <UserMinus size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-(--stroke) bg-(--surface-2) px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">
              Página <span className="text-(--ink)">{page}</span> de <span className="text-(--ink)">{lastPage}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-(--stroke) bg-(--card) text-(--muted) transition-all hover:bg-(--soft) disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === lastPage || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-(--stroke) bg-(--card) text-(--muted) transition-all hover:bg-(--soft) disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
