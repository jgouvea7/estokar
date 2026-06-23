'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL ?? 'http://localhost:3002';
const GRAFANA_DASHBOARD_UID = 'estokar';
const GRAFANA_ORG_ID = 1;

export default function MonitoringPage() {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const dashboardUrl = `${GRAFANA_URL}/d/${GRAFANA_DASHBOARD_UID}/estokar-monitoramento?orgId=${GRAFANA_ORG_ID}&kiosk=tv&from=now-6h&to=now`;

  useEffect(() => {
    const timer = setInterval(() => setKey((k) => k + 1), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-(--ink)">Monitoramento</h1>
          <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">
            Métricas do sistema em tempo real via Prometheus + Grafana
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="flex items-center gap-2 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-2 text-sm font-bold text-(--ink) transition-all hover:bg-(--soft)"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <a
            href={GRAFANA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-(--button) px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-125"
          >
            <ExternalLink size={16} />
            Abrir Grafana
          </a>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-(--stroke) bg-(--card) p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-(--critical-soft)">
            <AlertTriangle size={24} className="text-(--critical)" />
          </div>
          <p className="text-lg font-bold text-(--ink)">Não foi possível carregar o dashboard</p>
          <p className="mt-1 text-sm font-medium text-(--muted)">
            Verifique se o Prometheus e o Grafana estão rodando nos containers Docker.
          </p>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--button) px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-125"
          >
            <ExternalLink size={16} />
            Abrir diretamente no Grafana
          </a>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border-2 border-(--stroke) bg-(--card)">
          <iframe
            key={key}
            src={dashboardUrl}
            title="Grafana Dashboard"
            className="h-[calc(100vh-220px)] w-full"
            onError={() => setError(true)}
            allow="fullscreen"
          />
        </div>
      )}
    </div>
  );
}
