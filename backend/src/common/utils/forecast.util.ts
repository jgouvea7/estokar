export function calculateForecast(params: {
  currentStock: number;
  soldLast7Days: number;
  soldLast14Days?: number;
  soldLast30Days?: number;
  leadTimeDays?: number;
}): { averageDailySales: number; estimatedDaysLeft: number | null } {
  const {
    currentStock,
    soldLast7Days,
    soldLast14Days,
    soldLast30Days,
    leadTimeDays = 0,
  } = params;

  if (
    !Number.isFinite(currentStock) ||
    currentStock < 0 ||
    !Number.isFinite(soldLast7Days)
  ) {
    return { averageDailySales: 0, estimatedDaysLeft: null };
  }

  let windowDays: number;
  let totalSold: number;

  if (soldLast7Days > 0) {
    windowDays = 7;
    totalSold = soldLast7Days;
  } else if (soldLast14Days && soldLast14Days > 0) {
    windowDays = 14;
    totalSold = soldLast14Days;
  } else if (soldLast30Days && soldLast30Days > 0) {
    windowDays = 30;
    totalSold = soldLast30Days;
  } else {
    return { averageDailySales: 0, estimatedDaysLeft: null };
  }

  const averageDailySales = totalSold / windowDays;
  const safetyStock = averageDailySales * leadTimeDays;
  const effectiveStock = Math.max(currentStock - safetyStock, 0);

  if (effectiveStock <= 0) {
    return { averageDailySales, estimatedDaysLeft: 0 };
  }

  return {
    averageDailySales,
    estimatedDaysLeft: effectiveStock / averageDailySales,
  };
}

export function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value);
}
