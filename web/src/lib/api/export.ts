import { buildApiUrl } from './client';
import toast from 'react-hot-toast';

async function downloadCsv(path: string, accessToken: string, filename: string) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Falha ao exportar CSV.';
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {}

    throw new Error(message);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export async function exportProductsCsv(accessToken: string) {
  const date = new Date().toISOString().slice(0, 10);

  try {
    await downloadCsv('/export/products/csv', accessToken, `produtos-${date}.csv`);
    toast.success('Exportação concluída.');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Erro ao exportar CSV.');
  }
}

export async function exportStockMovementsCsv(
  accessToken: string,
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();

  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const qs = params.toString();
  const path = `/export/stock-movements/csv${qs ? `?${qs}` : ''}`;
  const date = new Date().toISOString().slice(0, 10);

  try {
    await downloadCsv(path, accessToken, `movimentacoes-${date}.csv`);
    toast.success('Exportação concluída.');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Erro ao exportar CSV.');
  }
}

export async function exportDashboardCsv(accessToken: string) {
  const date = new Date().toISOString().slice(0, 10);

  try {
    await downloadCsv('/export/dashboard/csv', accessToken, `relatorio-estoque-${date}.csv`);
    toast.success('Exportação concluída.');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Erro ao exportar CSV.');
  }
}
