'use client';

import { useId } from 'react';

type InputProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
  value: string;
};

export function Input({ label, onChange, placeholder, type = 'text', value }: InputProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-xs font-bold text-(--ink) uppercase tracking-wider">{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-all placeholder:text-(--muted) focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30"
      />
    </div>
  );
}
