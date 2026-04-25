"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Boxes,
  Flame,
  LogIn,
  LogOut,
  PackageSearch,
} from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import { getStockMovements } from '@/lib/api/stock-movements';
import { useAuthStore } from '@/store/auth-store';
import { useHistoryStore } from '@/store/history-store';
import { useEffect } from 'react';
import type { Product } from '@/lib/types';


const LOW_STOCK_LIMIT = 3;

type AlertItem = {
  id: string;
  name: string;
  quantity: number;
  suggestedRestock: number;
  status: 'critical' | 'low';
};

export default function DashboardPage() {
  const session = useAuthStore((state) => state.session);
  const historyItems = useHistoryStore((state) => state.items);

  const productsQuery = useQuery({
    queryKey: ['products', session?.user.id],
    queryFn: () => getProducts(session!.accessToken),
    enabled: Boolean(session?.accessToken),
  });

  const setHistoryItems = useHistoryStore((state) => state.setItems);

  useEffect(() => {
    if (session?.accessToken) {
      getStockMovements(session.accessToken).then(setHistoryItems);
    }
  }, [session, setHistoryItems]);

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const insights = useMemo(() => {
    const totalStock = products.reduce((acc, product) => acc + product.quantity, 0);
    const lowProducts = products.filter(
      (product) => product.quantity > 0 && product.quantity <= LOW_STOCK_LIMIT,
    ).length;
    const outOfStock = products.filter((product) => product.quantity <= 0).length;

    const entries = historyItems
      .filter((item) => item.type === 'in')
      .reduce((acc, item) => acc + item.quantity, 0);
    const outputs = historyItems
      .filter((item) => item.type === 'out')
      .reduce((acc, item) => acc + item.quantity, 0);

    const consumedByProduct = historyItems
      .filter((item) => item.type === 'out')
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.productName] = (acc[item.productName] ?? 0) + item.quantity;
        return acc;
      }, {});

    const mostUsed =
      Object.entries(consumedByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nenhum';

    const highestStock = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 3);
    const selectedIds = new Set(highestStock.map((product) => product.id));
    const lowestStock = products
      .filter((product) => !selectedIds.has(product.id))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 3);

    const alerts: AlertItem[] = products
      .filter((product) => product.quantity <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.quantity - b.quantity)
      .map((product) => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        suggestedRestock: Math.max(LOW_STOCK_LIMIT * 2 - product.quantity, LOW_STOCK_LIMIT),
        status: product.quantity <= 0 ? 'critical' : 'low',
      }));

    return {
      alerts,
      entries,
      highestStock,
      lowestStock,
      lowProducts,
      mostUsed,
      outOfStock,
      outputs,
      totalProducts: products.length,
      totalStock,
    };

}, [historyItems, products]);

const maxQuantity = useMemo(() => {
  const allOp = [...insights.highestStock, ...insights.lowestStock];
  return Math.max(...allOp.map((item) => item.quantity), 1);
}, [insights.highestStock, insights.lowestStock]);

if (!session) {
  return null;
}

return (
  <div className="space-y-5">
    <section className="relative overflow-hidden rounded-3xl border border-stroke bg-ink p-6 text-white lg:p-7">
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent opacity-90" />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#AEB7C8]">Dashboard inteligente</p>
      <h3 className="mt-3 text-4xl font-black leading-tight">{insights.totalStock} itens em estoque</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#C9D1DF]">
        {insights.outOfStock + insights.lowProducts} produto(s) em falta ou criticos. Reposicao sugerida em destaque.
      </p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard icon={Boxes} label="Produtos totais" value={String(insights.totalProducts)} />
      <MetricCard icon={AlertCircle} label="Baixo estoque" value={String(insights.lowProducts)} />
      <MetricCard icon={PackageSearch} label="Em falta" value={String(insights.outOfStock)} />
      <MetricCard icon={LogIn} label="Entradas" value={`+${insights.entries}`} />
      <MetricCard icon={LogOut} label="Saidas" value={`-${insights.outputs}`} />
      <MetricCard icon={Flame} label="Mais usado" value={shortText(insights.mostUsed, 14)} />
    </section>

    <section className="surface-card rounded-3xl border border-[var(--stroke)] p-5 lg:p-6">
      <header className="mb-4">
        <h4 className="text-2xl font-black">Visao operacional</h4>
        <p className="text-sm text-[var(--muted)]">3 maiores e 3 menores estoques</p>
      </header>

      <div className="space-y-6">
        {/* Maiores Estoques */}
        {insights.highestStock.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ok">Maiores estoques (Top 3)</p>
            <div className="space-y-2">
              {insights.highestStock.map((product) => (
                <OperationalRow
                  key={product.id}
                  colorClass="bg-ok"
                  badgeClass="bg-ok-soft text-ok"
                  product={product}
                  maxQuantity={maxQuantity}
                />
              ))}
            </div>
          </div>
        )}

        {/* Menores Estoques */}
        {insights.lowestStock.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-critical">Menores estoques (Base 3)</p>
            <div className="space-y-2">
              {insights.lowestStock.map((product) => (
                <OperationalRow
                  key={product.id}
                  colorClass="bg-critical"
                  badgeClass="bg-critical-soft text-critical"
                  product={product}
                  maxQuantity={maxQuantity}
                />
              ))}
            </div>
          </div>
        )}

        {!insights.highestStock.length && !insights.lowestStock.length ? (
          <p className="rounded-2xl bg-soft px-4 py-8 text-center text-sm text-muted">
            Nenhum produto cadastrado.
          </p>
        ) : null}
      </div>
    </section>


  <section className="surface-card rounded-3xl border border-[var(--stroke)] p-5 lg:p-6">
    <header className="mb-4">
      <h4 className="text-2xl font-black">Reposicao sugerida</h4>
      <p className="text-sm text-[var(--muted)]">Produtos com estoque critico</p>
    </header>

    {insights.alerts.length ? (
      <div className="space-y-3">
        {insights.alerts.map((alert) => (
          <article key={alert.id} className="flex items-center gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3">
            <span
              className={`h-3 w-3 rounded-full ${alert.status === 'critical' ? 'bg-critical' : 'bg-low'
                }`}
            />
            <div className="flex-1">
              <p className="text-sm font-black text-[var(--ink)]">{alert.name}</p>
              <p className="text-xs text-[var(--muted)]">
                Estoque atual: {alert.quantity}. Repor {alert.suggestedRestock} unidade(s).
              </p>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <p className="rounded-2xl bg-[var(--soft)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        Nenhum alerta critico agora.
      </p>
    )}
  </section>
    </div >
  );
}

function OperationalRow({
  product,
  maxQuantity,
  colorClass,
  badgeClass,
}: {
  product: Product;
  maxQuantity: number;
  colorClass: string;
  badgeClass: string;
}) {
  const width = `${Math.max((product.quantity / maxQuantity) * 100, 8)}%`;

  return (
    <article className="grid grid-cols-[minmax(120px,1fr)_minmax(100px,2fr)_auto] items-center gap-3 rounded-2xl bg-bg px-3 py-3 shadow-sm">
      <p className="truncate text-sm font-bold text-ink">{product.name}</p>
      <div className="h-2 overflow-hidden rounded-full bg-soft">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width }} />
      </div>
      <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass}`}>
        {product.quantity}
      </span>
    </article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <article className="surface-card rounded-3xl border border-[var(--stroke)] p-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon size={18} />
      </div>
      <p className="mt-3 truncate text-2xl font-black text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{label}</p>
    </article>
  );
}

function shortText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
}
