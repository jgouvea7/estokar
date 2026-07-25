'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminProducts } from '@/lib/api/admin';
import { Search, AlertTriangle, Package2 } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/pagination';

export default function AdminProductsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => getAdminProducts({ page, perPage: 20, search: search || undefined, accessToken: accessToken! }),
    enabled: Boolean(accessToken),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-(--ink)">Produtos</h1>
          <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">
            Todos os produtos do sistema
          </p>
        </div>
      </header>

      {data && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
            <Package2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Total de produtos cadastrados</p>
            <p className="text-lg font-bold text-(--ink)">{data.meta.total}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--muted)" />
        <input
          type="text" placeholder="Buscar produtos..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border-2 border-(--stroke) bg-(--card) py-2.5 pl-10 pr-4 text-sm font-bold text-(--ink) placeholder:text-(--muted) outline-none focus:border-(--accent)"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surface-card h-16 rounded-xl bg-(--soft)" />
          ))}
        </div>
      ) : (
        <div className="surface-card overflow-hidden rounded-xl border-2 border-(--stroke)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-(--stroke) bg-(--soft) text-left text-[11px] font-bold uppercase tracking-wider text-(--muted)">
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Estoque</th>
                  <th className="px-5 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--stroke)">
                {data?.data.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-(--soft)">
                    <td className="px-5 py-3">
                      <Link href={`/products/${product.id}`} className="font-bold text-(--ink) hover:text-(--accent)">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-(--muted)">{product.userName}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-(--soft) px-2.5 py-1 text-[10px] font-bold text-(--muted)">
                        {product.categoryName ?? 'Sem categoria'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${product.quantity <= 5 ? 'text-(--critical)' : 'text-(--ok)'}`}>
                        {product.quantity <= 5 && <AlertTriangle size={12} />}
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-(--muted)">
                      {new Date(product.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.meta.lastPage > 1 && (
        <Pagination currentPage={page} totalPages={data.meta.lastPage} onPageChange={setPage} />
      )}
    </div>
  );
}
