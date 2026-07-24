"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { AnalyticsFilter } from '@/lib/types';

type AnalyticsTimelineChartProps = {
  data: { date: string; balance: number; label?: string }[];
  filter?: AnalyticsFilter;
};

const titleByFilter: Record<string, string> = {
  daily: 'Movimentação Diária',
  weekly: 'Movimentação Semanal',
  monthly: 'Movimentação Mensal',
  yearly: 'Movimentação Anual',
};

export function AnalyticsTimelineChart({ data, filter }: AnalyticsTimelineChartProps) {
  const title = filter ? titleByFilter[filter] : 'Movimentação do Estoque';

  const getLabelByFilter = (dateStr: string, f?: AnalyticsFilter) => {
    const normalized = dateStr.length > 10 ? dateStr.slice(0, 10) : dateStr;
    const date = new Date(normalized + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    switch (f) {
      case 'yearly':
        return String(date.getFullYear());
      case 'monthly':
        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }
  };

  const chartData = useMemo(() => {
    if (!data || !data.length) return [];
    return data
      .filter((p) => p.date)
      .map((p) => {
        if (p.label) return { ...p, label: p.label };
        const normalized = p.date.length > 10 ? p.date.slice(0, 10) : p.date;
        const date = new Date(normalized + 'T00:00:00');
        return {
          date: p.date,
          balance: p.balance,
          label: isNaN(date.getTime()) ? p.date : getLabelByFilter(p.date, filter),
        };
      });
  }, [data, filter]);

  if (!chartData.length) {
    return (
      <section className="surface-card p-5 sm:p-6 h-full">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Gráfico</p>
          <h3 className="mt-1 text-lg font-bold text-(--ink)">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--card) text-(--muted)">
            <BarChart3 size={18} strokeWidth={2.2} />
          </div>
          <p className="text-sm font-bold text-(--ink)">Nenhuma movimentação no período</p>
          <p className="mt-1 text-xs font-medium text-(--muted)">Registre entradas e saídas para ver o histórico.</p>
        </div>
      </section>
    );
  }

  const minBalance = Math.min(...chartData.map((d) => d.balance));
  const maxBalance = Math.max(...chartData.map((d) => d.balance));
  const padding = Math.max(1, Math.abs(maxBalance - minBalance) * 0.1);
  const yDomain = [minBalance - padding, maxBalance + padding];

  return (
    <section className="surface-card p-5 sm:p-6 h-full">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Gráfico</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">{title}</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
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
              domain={yDomain}
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
              formatter={(value) => [Number(value ?? 0).toLocaleString('pt-BR'), 'Saldo']}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
