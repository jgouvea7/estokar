"use client";

import { Suspense, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, History, Link as LinkIcon, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getStockMovements } from '@/lib/api/stock-movements';
import { exportStockMovementsCsv } from '@/lib/api/export';
import { useAuthStore } from '@/store/auth-store';
import { ExportButton } from '@/components/ui/export-button';
import type { StockHistoryItem } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

type MovementType = 'all' | 'in' | 'out';

function formatDateHeader(date: Date, period: string): string {
  const now = new Date();
  const crossesYear = date.getFullYear() !== now.getFullYear();

  if (period === 'yearly') {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  if (crossesYear) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="space-y-8 reveal-up"><div className="h-10 w-full animate-pulse rounded-lg bg-(--soft)" /></div>}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  const session = useAuthStore((state) => state.session);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [typeFilter, setTypeFilter] = useState<MovementType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const movementsQuery = useQuery({
    queryKey: ['stock-movements', session?.user.id, period],
    queryFn: () => getStockMovements(session!.accessToken, undefined, period),
    enabled: Boolean(session?.accessToken),
  });

  const allItems = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesSearch = normalizedQuery === '' || item.productName.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesSearch;
    });
  }, [allItems, typeFilter, searchQuery]);

  const groupedByDate = useMemo(() => {
    return filteredItems.reduce<Record<string, StockHistoryItem[]>>((acc, item) => {
      const date = new Date(item.createdAt);
      const key = formatDateHeader(date, period);

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredItems, period]);

  const groupedEntries = Object.entries(groupedByDate);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedGroupedEntries = useMemo(() => {
    const allFlat: { dateLabel: string; item: StockHistoryItem }[] = [];
    for (const [dateLabel, entries] of groupedEntries) {
      for (const item of entries) {
        allFlat.push({ dateLabel, item });
      }
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = allFlat.slice(start, start + ITEMS_PER_PAGE);

    const groups: Record<string, StockHistoryItem[]> = {};
    for (const { dateLabel, item } of pageItems) {
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(item);
    }
    return Object.entries(groups);
  }, [groupedEntries, currentPage]);

  return (
    <div className="space-y-8 reveal-up">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-(--muted)">Acompanhe cada entrada e saída do seu estoque em tempo real.</p>
          </div>

          <div className="flex gap-1 rounded-lg border-2 border-(--stroke) p-0.5 w-fit">
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setPeriod(p); setCurrentPage(1); }}
                className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
                  period === p
                    ? 'bg-(--button) text-white'
                    : 'text-(--muted) hover:text-(--ink)'
                }`}
              >
                {p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensal' : 'Anual'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-xl border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 transition-all focus-within:border-(--accent) focus-within:bg-(--card) focus-within:ring-4 focus-within:[--tw-ring-color:var(--accent)]/30">
              <Search size={20} className="text-(--muted)" />
              <input
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
                placeholder="Buscar por nome do produto..."
                className="w-full bg-transparent text-sm font-medium text-(--ink) outline-none placeholder:text-(--muted)"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-lg border-2 border-(--stroke) p-0.5">
                {([['all', 'Todos'], ['in', 'Entradas'], ['out', 'Saídas']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setTypeFilter(value); setCurrentPage(1); }}
                    className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
                      typeFilter === value
                        ? value === 'in' ? 'bg-(--ok) text-white' : value === 'out' ? 'bg-(--critical) text-white' : 'bg-(--button) text-white'
                        : 'text-(--muted) hover:text-(--ink)'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ExportButton
                onExportCsv={() => {
                  const now = new Date();
                  const endDate = now.toISOString().slice(0, 10);
                  const startDate = new Date(now);
                  switch (period) {
                    case 'weekly': startDate.setDate(startDate.getDate() - 7); break;
                    case 'monthly': startDate.setMonth(startDate.getMonth() - 1); break;
                    case 'yearly': startDate.setFullYear(startDate.getFullYear() - 1); break;
                  }
                  exportStockMovementsCsv(session!.accessToken, startDate.toISOString().slice(0, 10), endDate);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        {movementsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-(--soft)" />
            ))}
          </div>
        ) : paginatedGroupedEntries.length ? (
          <div className="space-y-8">
            {paginatedGroupedEntries.map(([dateLabel, entries]) => (
              <article key={dateLabel} className="space-y-4">
                <header className="flex items-center gap-3">
                  <div className="rounded-full border-2 border-(--stroke) bg-(--card) px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-(--muted)">
                    {dateLabel}
                  </div>
                  <span className="h-px flex-1 bg-(--stroke)" />
                </header>

                <div className="relative ml-4 space-y-3 border-l-2 border-(--stroke) pl-4 sm:ml-5 sm:pl-5">
                  {entries.map((item) => (
                    <div key={item.id} className="relative">
                      <div className={`absolute top-4 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 ${item.type === 'in' ? 'border-(--ok) bg-(--ok)' : 'border-(--critical) bg-(--critical)'} -left-[27px] sm:-left-[31px]`}
                      />

                      <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-(--stroke) bg-(--card) px-3 py-2.5 transition-colors hover:bg-(--surface-2) sm:gap-3 sm:px-4 sm:py-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.type === 'in' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
                            {item.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.productId}`}
                              className="text-sm font-bold text-(--ink) truncate hover:underline inline-flex items-center gap-1"
                            >
                              {item.productName}
                              <LinkIcon size={10} className="shrink-0 opacity-50" />
                            </Link>
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="text-[11px] font-medium text-(--muted)">
                                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <span className="h-1 w-1 rounded-full bg-(--stroke)" />
                              <span className={`text-[9px] font-bold uppercase ${item.type === 'in' ? 'text-(--ok)' : 'text-(--critical)'}`}>
                                {item.type === 'in' ? 'Entrada' : 'Saída'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`shrink-0 text-base font-bold tracking-tight ${item.type === 'in' ? 'text-(--ok)' : 'text-(--critical)'}`}>
                          {item.type === 'in' ? '+' : '-'}{item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--card) text-(--muted)">
              <History size={26} strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-(--ink)">Sem movimentações</p>
            <p className="mt-1 text-sm font-medium text-(--muted)">Nenhuma movimentação encontrada no período selecionado.</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-(--button) px-4 text-xs font-bold text-white transition-all hover:brightness-125"
            >
              Registrar movimentação
            </Link>
          </div>
        )}
      </section>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
