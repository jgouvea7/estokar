"use client";

import type { AnalyticsPeriod } from '@/lib/types';

const periodLabels: Record<AnalyticsPeriod, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  annual: 'Anual',
};

type AnalyticsPeriodToggleProps = {
  period: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
};

export function AnalyticsPeriodToggle({ period, onChange }: AnalyticsPeriodToggleProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border-2 border-(--stroke) p-0.5">
      {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            period === p
              ? 'bg-(--button) text-white'
              : 'text-(--muted) hover:text-(--ink)'
          }`}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}
