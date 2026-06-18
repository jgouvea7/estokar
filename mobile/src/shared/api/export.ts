import { buildApiUrl } from './client';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

async function downloadAndShareCsv(path: string, accessToken: string, filename: string) {
  const url = buildApiUrl(path);

  const response = await fetch(url, {
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

  const csvText = await response.text();
  const file = new File(Paths.cache, filename);

  file.write(csvText, { encoding: 'utf8' });

  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar CSV',
    });
  } else {
    Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
  }
}

export async function exportProductsCsv(accessToken: string) {
  const date = new Date().toISOString().slice(0, 10);

  try {
    await downloadAndShareCsv(
      '/export/products/csv',
      accessToken,
      `produtos-${date}.csv`,
    );
  } catch (error) {
    Alert.alert('Erro ao exportar', error instanceof Error ? error.message : 'Erro inesperado.');
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
    await downloadAndShareCsv(
      path,
      accessToken,
      `movimentacoes-${date}.csv`,
    );
  } catch (error) {
    Alert.alert('Erro ao exportar', error instanceof Error ? error.message : 'Erro inesperado.');
  }
}

export async function exportDashboardCsv(accessToken: string) {
  const date = new Date().toISOString().slice(0, 10);

  try {
    await downloadAndShareCsv(
      '/export/dashboard/csv',
      accessToken,
      `relatorio-estoque-${date}.csv`,
    );
  } catch (error) {
    Alert.alert('Erro ao exportar', error instanceof Error ? error.message : 'Erro inesperado.');
  }
}
