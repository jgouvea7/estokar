"use client";

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="space-y-5">
      <section className="surface-card rounded-3xl border border-[var(--stroke)] p-5 lg:p-6">
        <h3 className="text-3xl font-black">Historico operacional</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Timeline de entradas e saidas com rastreabilidade de horario e quantidade.</p>
      </section>

      <section className="surface-card rounded-3xl border border-[var(--stroke)] p-4 lg:p-5">
        {groupedEntries.length ? (
          <div className="space-y-7">
            {groupedEntries.map(([dateLabel, entries]) => (
              <article key={dateLabel} className="space-y-3">
                <header className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-[var(--stroke)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{dateLabel}</p>
                  <span className="h-px flex-1 bg-[var(--stroke)]" />
                </header>

                <div className="relative ml-3 space-y-3 border-l border-[var(--stroke)] pl-5">
                  {entries.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="group relative"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.03 }}>
                      <span
                        className={`absolute -left-[29px] top-5 grid h-4 w-4 place-items-center rounded-full border-2 border-white ${
                          item.type === 'in' ? 'bg-[var(--ok)]' : 'bg-[var(--critical)]'
                        }`}
                      />
                      <div className="surface-card surface-card-hover rounded-2xl border border-[var(--stroke)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`grid h-9 w-9 place-items-center rounded-xl ${
                                item.type === 'in'
                                  ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                                  : 'bg-[var(--critical-soft)] text-[var(--critical)]'
                              }`}>
                              {item.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-black">{item.productName}</p>
                              <p className="text-xs text-[var(--muted)]">
                                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-base font-black ${item.type === 'in' ? 'text-[var(--ok)]' : 'text-[var(--critical)]'}`}>
                              {item.type === 'in' ? '+' : '-'}{item.quantity}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                item.type === 'in'
                                  ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                                  : 'bg-[var(--critical-soft)] text-[var(--critical)]'
                              }`}>
                              {item.type === 'in' ? 'Entrada' : 'Saida'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-[var(--soft)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Ainda nao ha movimentacoes registradas nesta sessao.
          </p>
        )}
      </section>
    </div>
  );
}
