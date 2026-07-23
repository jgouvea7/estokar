"use client";

import type { AnalyticsFilter } from '@/lib/types';

const filterOptions: { value: AnalyticsFilter; label: string }[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

type AnalyticsFilterToggleProps = {
  selected: AnalyticsFilter;
  onChange: (filter: AnalyticsFilter) => void;
};

export function AnalyticsFilterToggle({ selected, onChange }: AnalyticsFilterToggleProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border-2 border-(--stroke) p-0.5">
      {filterOptions.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(selected === opt.value ? null : opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            selected === opt.value
              ? 'bg-(--button) text-white'
              : 'text-(--muted) hover:text-(--ink)'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
