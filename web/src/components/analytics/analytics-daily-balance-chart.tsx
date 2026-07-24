"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { AnalyticsFilter } from '@/lib/types';

type AnalyticsDailyBalanceChartProps = {
  data: { date: string; entries: number; outputs: number; balance: number; label?: string }[];
  filter: AnalyticsFilter;
};

const titleByFilter: Record<string, string> = {
  daily: 'Entradas vs Saídas por Dia',
  weekly: 'Entradas vs Saídas por Semana',
  monthly: 'Entradas vs Saídas por Mês',
  yearly: 'Entradas vs Saídas por Ano',
};

export function AnalyticsDailyBalanceChart({ data, filter }: AnalyticsDailyBalanceChartProps) {
  const title = filter ? titleByFilter[filter] : 'Entradas vs Saídas';

  const chartData = useMemo(() => {
    if (!data || !data.length) return [];
    return data
      .filter((d) => d.date)
      .map((d) => {
        if (d.label) return { ...d, label: d.label };
        const dateStr = d.date.length > 10 ? d.date.slice(0, 10) : d.date;
        const date = new Date(dateStr + 'T00:00:00');
        return {
          ...d,
          label: isNaN(date.getTime()) ? d.date : date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
          }),
        };
      });
  }, [data]);

  if (!chartData.length) {
    return (
      <section className="surface-card p-5 sm:p-6 h-full">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Balanço</p>
          <h3 className="mt-1 text-lg font-bold text-(--ink)">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--card) text-(--muted)">
            <BarChart3 size={18} strokeWidth={2.2} />
          </div>
          <p className="text-sm font-bold text-(--ink)">Nenhuma movimentação no período</p>
          <p className="mt-1 text-xs font-medium text-(--muted)">Registre entradas e saídas para ver o balanço.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-card p-5 sm:p-6 h-full">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Balanço</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">{title}</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--stroke)' }}
              interval={filter && filter !== 'daily' ? 0 : 'preserveStartEnd'}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '2px solid var(--stroke)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
              labelFormatter={(label) => {
                if (typeof label === 'string' && label.length <= 12) return label;
                const d = new Date(String(label));
                return isNaN(d.getTime()) ? String(label) : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}
            />
            <Bar dataKey="entries" fill="var(--ok)" name="Entradas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outputs" fill="var(--critical)" name="Saídas" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
