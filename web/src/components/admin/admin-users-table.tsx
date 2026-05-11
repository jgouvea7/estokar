"use client";

import { useState } from 'react';
import { Search, ShieldCheck, UserMinus, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </form>

        <div className="text-sm font-semibold text-slate-500">
          Total: <span className="text-slate-900">{total}</span> usuários
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all">
        <div>
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="w-[34%] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:px-6 sm:py-4 sm:text-xs">Usuário</th>
                <th className="w-[30%] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:px-6 sm:py-4 sm:text-xs">Email</th>
                <th className="w-[12%] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:px-6 sm:py-4 sm:text-xs">Role</th>
                <th className="hidden w-[14%] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:table-cell sm:px-6 sm:py-4 sm:text-xs">Criado em</th>
                <th className="w-[10%] px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:px-6 sm:py-4 sm:text-xs">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3 py-3 sm:px-6 sm:py-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4"><div className="h-4 w-28 rounded bg-slate-100" /></td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4"><div className="h-5 w-12 rounded-full bg-slate-100" /></td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4"><div className="h-4 w-20 rounded bg-slate-100" /></td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4"><div className="ml-auto h-7 w-7 rounded bg-slate-100" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-2 sm:px-5 sm:py-3">
                      <span className="text-xs font-bold text-slate-900 sm:text-sm break-words">
                        {user.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-500 break-all sm:px-6 sm:py-4 sm:text-sm">{user.email}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold sm:px-2.5 sm:text-xs ${user.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-600'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-xs font-medium text-slate-500 sm:table-cell sm:px-6 sm:py-4 sm:text-sm break-words">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => onPromote(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition-all hover:bg-blue-50 active:scale-95 sm:h-9 sm:w-9"
                            title="Promover para Admin"
                          >
                            <ShieldCheck size={16} className="sm:hidden" />
                            <ShieldCheck size={18} className="hidden sm:block" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-rose-600 transition-all hover:bg-rose-50 active:scale-95 sm:h-9 sm:w-9"
                          title="Remover Usuário"
                        >
                          <UserMinus size={16} className="sm:hidden" />
                          <UserMinus size={18} className="hidden sm:block" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/30 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{lastPage}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === lastPage || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
