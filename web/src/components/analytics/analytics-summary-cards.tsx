"use client";

import { memo, type ComponentType } from 'react';
import {
  Boxes,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Package,
} from 'lucide-react';
import type { AnalyticsData } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

function CompactStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  tone: 'accent' | 'ok' | 'critical' | 'muted';
}) {
  const toneColors = {
    accent: 'text-(--accent) bg-(--accent-soft)',
    ok: 'text-(--ok) bg-(--ok-soft)',
    critical: 'text-(--critical) bg-(--critical-soft)',
    muted: 'text-(--muted) bg-(--soft)',
  };

  return (
    <article className="surface-card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneColors[tone]}`}>
        <Icon size={18} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-(--ink)">{value}</p>
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-(--muted)">{label}</p>
      </div>
    </article>
  );
}

export const AnalyticsSummaryCards = memo(function AnalyticsSummaryCards({
  summary,
}: {
  summary: AnalyticsData['summary'];
}) {
  const cards = [
    { icon: Boxes, label: 'Estoque total', value: formatNumber(summary.totalStock), tone: 'accent' as const },
    { icon: Package, label: 'Produtos', value: formatNumber(summary.totalProducts), tone: 'accent' as const },
    { icon: ArrowUpRight, label: 'Movimentações', value: formatNumber(summary.totalMovements), tone: 'muted' as const },
    { icon: ArrowDownLeft, label: 'Entradas', value: formatNumber(summary.totalEntries), tone: 'ok' as const },
    { icon: TrendingUp, label: 'Saídas', value: formatNumber(summary.totalOutputs), tone: 'critical' as const },
    { icon: BarChart3, label: 'Catálogo ativo', value: `${summary.catalogAvailability.toFixed(0)}%`, tone: 'accent' as const },
    { icon: TrendingDown, label: 'Média/saída', value: formatNumber(summary.avgOutputPerMovement), tone: 'muted' as const },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <CompactStat key={card.label} {...card} />
      ))}
    </section>
  );
});
