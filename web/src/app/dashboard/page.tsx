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
    <div className="space-y-8 reveal-up">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-white lg:p-10 shadow-xl shadow-slate-200/50">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Visão Geral Inteligente</p>
          <h3 className="mt-4 text-4xl font-bold tracking-tight lg:text-5xl">{insights.totalStock.toLocaleString()} <span className="text-slate-400 font-medium text-2xl">itens em estoque</span></h3>
          <p className="mt-4 max-w-xl text-base text-slate-300">
            Há <span className="text-white font-bold">{insights.outOfStock + insights.lowProducts}</span> produtos que requerem sua atenção imediata hoje.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={Boxes} label="Total" value={String(insights.totalProducts)} color="blue" />
        <MetricCard icon={AlertCircle} label="Baixo" value={String(insights.lowProducts)} color="orange" />
        <MetricCard icon={PackageSearch} label="Faltando" value={String(insights.outOfStock)} color="red" />
        <MetricCard icon={LogIn} label="Entradas" value={String(insights.entries)} color="green" />
        <MetricCard icon={LogOut} label="Saídas" value={String(insights.outputs)} color="slate" />
        <MetricCard icon={Flame} label="Destaque" value={shortText(insights.mostUsed, 10)} color="purple" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="surface-card p-8">
          <header className="mb-8">
            <h4 className="text-xl font-bold text-[#0f172a]">Visão operacional</h4>
            <p className="text-sm font-medium text-slate-500">Produtos com maior e menor volume</p>
          </header>

          <div className="space-y-10">
            {insights.highestStock.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Top 3 Maiores estoques</p>
                </div>
                <div className="space-y-3">
                  {insights.highestStock.map((product) => (
                    <OperationalRow
                      key={product.id}
                      color="emerald"
                      product={product}
                      maxQuantity={maxQuantity}
                    />
                  ))}
                </div>
              </div>
            )}

            {insights.lowestStock.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Top 3 Menores estoques</p>
                </div>
                <div className="space-y-3">
                  {insights.lowestStock.map((product) => (
                    <OperationalRow
                      key={product.id}
                      color="rose"
                      product={product}
                      maxQuantity={maxQuantity}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="surface-card p-8">
          <header className="mb-8">
            <h4 className="text-xl font-bold text-[#0f172a]">Ações de Reposição</h4>
            <p className="text-sm font-medium text-slate-500">Alertas de estoque crítico</p>
          </header>

          {insights.alerts.length ? (
            <div className="space-y-3">
              {insights.alerts.map((alert) => (
                <article key={alert.id} className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-100/50">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert.status === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">{alert.name}</p>
                    <p className="text-xs font-medium text-slate-500">
                      Atual: <span className="text-slate-900">{alert.quantity}</span> • Repor <span className="text-blue-600">+{alert.suggestedRestock}</span>
                    </p>
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20">Repor</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <Boxes size={24} />
              </div>
              <p className="text-sm font-bold text-slate-900">Tudo sob controle</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Nenhum produto em nível crítico no momento.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function OperationalRow({
  product,
  maxQuantity,
  color,
}: {
  product: Product;
  maxQuantity: number;
  color: 'emerald' | 'rose';
}) {
  const width = `${Math.max((product.quantity / maxQuantity) * 100, 5)}%`;

  return (
    <article className="group relative">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <p className="text-sm font-bold text-slate-700">{product.name}</p>
        <span className={`text-xs font-bold ${color === 'emerald' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {product.quantity} un.
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width }}
        />
      </div>
    </article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color = 'blue'
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  color?: 'blue' | 'orange' | 'red' | 'green' | 'slate' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <article className="surface-card flex flex-col items-center justify-center p-6 text-center transition-colors hover:bg-slate-50">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-bold tracking-tight text-[#0f172a]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    </article>
  );
}


function shortText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
}
