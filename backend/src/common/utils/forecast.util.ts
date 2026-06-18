export function calculateForecast(
  currentStock: number,
  recentSoldQuantity: number,
  windowDays: number,
): { averageDailySales: number; estimatedDaysLeft: number | null } {
  if (
    !Number.isFinite(currentStock) ||
    !Number.isFinite(recentSoldQuantity) ||
    !Number.isFinite(windowDays)
  ) {
    return { averageDailySales: 0, estimatedDaysLeft: null };
  }

  if (recentSoldQuantity <= 0 || windowDays <= 0) {
    return { averageDailySales: 0, estimatedDaysLeft: null };
  }

  const averageDailySales = recentSoldQuantity / windowDays;

  if (averageDailySales <= 0) {
    return { averageDailySales: 0, estimatedDaysLeft: null };
  }

  return {
    averageDailySales,
    estimatedDaysLeft: currentStock / averageDailySales,
  };
}

export function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value);
}
