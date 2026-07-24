"use client";

import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Download, History } from 'lucide-react';
import { useHistoryStore } from '@/store/history-store';
import { getStockMovements } from '@/lib/api/stock-movements';
import { exportStockMovementsCsv } from '@/lib/api/export';
import { useAuthStore } from '@/store/auth-store';

export default function HistoryPage() {
  const items = useHistoryStore((state) => state.items);
  const setItems = useHistoryStore((state) => state.setItems);
  const session = useAuthStore((state) => state.session);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (!session?.accessToken) return;

    const controller = new AbortController();
    let active = true;

    getStockMovements(session.accessToken, controller.signal, period)
      .then((items) => {
        if (!active) return;
        setItems(items);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [session, setItems, period]);

  const groupedByDate = items.reduce<Record<string, typeof items>>((acc, item) => {
    const date = new Date(item.createdAt);
    const key = period === 'yearly'
      ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);
    return acc;
  }, {});

  const groupedEntries = Object.entries(groupedByDate);

  return (
    <div className="space-y-8 reveal-up">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-(--muted)">Acompanhe cada entrada e saída do seu estoque em tempo real.</p>
        <div className="flex gap-1 rounded-lg border-2 border-(--stroke) p-0.5">
          {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
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
        <button
          type="button"
          onClick={() => {
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
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 text-xs font-bold text-(--ink) transition-all hover:bg-(--soft)">
          <Download size={14} strokeWidth={2.5} />
          CSV
        </button>
      </section>

      <section>
        {groupedEntries.length ? (
          <div className="space-y-8">
            {groupedEntries.map(([dateLabel, entries]) => (
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
                            <p className="text-sm font-bold text-(--ink) truncate">{item.productName}</p>
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
          </div>
        )}
      </section>
    </div>
  );
}
