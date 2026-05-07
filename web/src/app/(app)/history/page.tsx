"use client";

import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { useHistoryStore } from '@/store/history-store';
import { useEffect } from 'react';
import { getStockMovements } from '@/lib/api/stock-movements';
import { useAuthStore } from '@/store/auth-store';

export default function HistoryPage() {
  const items = useHistoryStore((state) => state.items);
  const setItems = useHistoryStore((state) => state.setItems);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (session?.accessToken) {
      getStockMovements(session.accessToken).then(setItems);
    }
  }, [session, setItems]);
  const groupedByDate = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = new Date(item.createdAt).toLocaleDateString('pt-BR', {
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
      <section>
        <h3 className="text-3xl font-bold tracking-tight text-[#0f172a]">Histórico de Operações</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">Acompanhe cada entrada e saída do seu estoque em tempo real.</p>
      </section>

      <section className="surface-card p-0 overflow-hidden border-none bg-transparent shadow-none">
        {groupedEntries.length ? (
          <div className="space-y-12">
            {groupedEntries.map(([dateLabel, entries]) => (
              <article key={dateLabel} className="space-y-6">
                <header className="flex items-center gap-4 bg-[#f5f7fb] py-3">
                  <div className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm border border-slate-100">
                    {dateLabel}
                  </div>
                  <span className="h-px flex-1 bg-slate-200" />
                </header>

                <div className="relative ml-8 space-y-6 pt-3">
                  <div className="absolute left-3 top-0 h-full w-px bg-slate-200" />

                  {entries.map((item) => (
                    <div
                      key={item.id}
                      className="group relative pl-10">

                      <div className={`absolute left-3 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${item.type === 'in' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />

                      <div className="surface-card flex items-center justify-between gap-6 p-5 transition-colors hover:bg-slate-50">
                        <div className="flex items-center gap-5">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.type === 'in'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                              }`}>
                            {item.type === 'in' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#0f172a]">{item.productName}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="text-xs font-medium text-slate-400">
                                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <span className="h-1 w-1 rounded-full bg-slate-200" />
                              <span className={`text-[10px] font-bold uppercase ${item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {item.type === 'in' ? 'Entrada de material' : 'Saída de material'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <p className={`text-2xl font-bold tracking-tight ${item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.type === 'in' ? '+' : '-'}{item.quantity}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unidades</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <History size={32} strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-[#0f172a]">Sem movimentações</p>
            <p className="mt-1 text-sm font-medium text-slate-500">As operações realizadas aparecerão nesta timeline.</p>
          </div>
        )}
      </section>
    </div>
  );
}
