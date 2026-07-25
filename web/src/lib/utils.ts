export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
}

export function formatDays(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Math.max(value, 0));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

export function getStatusBadge(currentStock: number, estimatedDaysLeft: number | null, alertDaysBefore: number) {
  if (currentStock <= 0) {
    return {
      accent: 'text-(--critical)',
      className: 'border-(--critical) bg-(--critical-soft) text-(--critical)',
      label: 'Sem estoque',
      tone: 'bg-(--critical-soft)',
    };
  }

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDaysBefore) {
    return {
      accent: 'text-(--low)',
      className: 'border-(--low) bg-(--low-soft) text-(--low)',
      label: 'Atenção',
      tone: 'bg-(--low-soft)',
    };
  }

  return {
    accent: 'text-(--ok)',
    className: 'border-(--ok) bg-(--ok-soft) text-(--ok)',
    label: 'Estoque OK',
    tone: 'bg-(--ok-soft)',
  };
}
