"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Edit2, Image as ImageIcon, MoreVertical, PackageSearch, Plus, Search, Trash2, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/lib/api/categories';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/lib/api/products';
import type { Category, CreateProductPayload, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useHistoryStore } from '@/store/history-store';

const NO_PHOTO_IMAGE = 'sem-foto';

type ProductForm = {
  name: string;
  description: string;
  quantity: string;
  categoryId: string;
  image: string;
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const session = useAuthStore((state) => state.session);
  const addHistoryItem = useHistoryStore((state) => state.addHistoryItem);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  useEffect(() => {
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      queueMicrotask(() => {
        setCategoryFilter(categoryParam);
      });
    }
  }, [searchParams]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [productEditing, setProductEditing] = useState<Product | null>(null);
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    quantity: '',
    categoryId: '',
    image: '',
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', session?.user.id],
    queryFn: () => getCategories(session!.accessToken),
    enabled: Boolean(session?.accessToken),
  });

  const productsQuery = useQuery({
    queryKey: ['products', session?.user.id],
    queryFn: () => getProducts(session!.accessToken),
    enabled: Boolean(session?.accessToken),
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const productsQueryKey = ['products', session?.user.id];

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item]));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const source = [...products].sort((a, b) => {
      return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    });

    return source.filter((product) => {
      const productCategory =
        product.category?.name ?? categoryMap.get(product.categoryId ?? '')?.name ?? 'Nao categorizado';
      const matchesCategory = categoryFilter === 'Todos' || productCategory === categoryFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, categoryMap, products, query]);

  const categoryMutation = useMutation({
    mutationFn: async (payload: { id?: string; name: string }) => {
      if (payload.id) {
        return updateCategory(session!.accessToken, payload.id, payload.name);
      }
      return createCategory(session!.accessToken, payload.name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', session?.user.id] });
      setShowCategoryModal(false);
      setCategoryDraft('');
      setCategoryEditing(null);
      toast.success('Categoria salva com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar categoria.');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(session!.accessToken, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', session?.user.id] });
      toast.success('Categoria removida.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover categoria.');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload, session!.accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', session?.user.id] });
      setShowProductModal(false);
      setForm({ name: '', description: '', quantity: '', categoryId: '', image: '' });
      toast.success('Produto criado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto.');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateProductPayload }) =>
      updateProduct(id, payload, session!.accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', session?.user.id] });
      setShowProductModal(false);
      setProductEditing(null);
      toast.success('Produto atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar produto.');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id, session!.accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', session?.user.id] });
      setShowProductModal(false);
      setProductEditing(null);
      toast.success('Produto excluido com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir produto.');
    },
  });

  const quickStockMutation = useMutation({
    mutationFn: async ({ product, type }: { product: Product; type: 'in' | 'out' }) => {
      const nextQuantity = type === 'in' ? product.quantity + 1 : Math.max(product.quantity - 1, 0);
      const updated = await updateProduct(
        product.id,
        {
          name: product.name,
          description: product.description,
          quantity: nextQuantity,
          categoryId: product.categoryId ?? null,
          image: product.image,
        },
        session!.accessToken,
      );

      return { nextQuantity, product: updated, type };
    },
    onMutate: async ({ product, type }) => {
      await queryClient.cancelQueries({ queryKey: productsQueryKey });
      const previous = queryClient.getQueryData<Product[]>(productsQueryKey);
      const nextQuantity = type === 'in' ? product.quantity + 1 : Math.max(product.quantity - 1, 0);

      queryClient.setQueryData<Product[]>(productsQueryKey, (current) =>
        current?.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity, updatedAt: new Date().toISOString() }
            : item,
        ) ?? current,
      );

      return { previous };
    },
    onSuccess: ({ product, type }) => {
      queryClient.setQueryData<Product[]>(productsQueryKey, (current) =>
        current?.map((item) => (item.id === product.id ? { ...item, ...product } : item)) ?? current,
      );
      addHistoryItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        type,
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productsQueryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar estoque.');
    },
  });

  if (!session) {
    return null;
  }

  function openCreateProduct() {
    setProductEditing(null);
    setForm({ name: '', description: '', quantity: '', categoryId: '', image: '' });
    setShowProductModal(true);
  }

  function openEditProduct(product: Product) {
    setProductEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      quantity: String(product.quantity),
      categoryId: product.categoryId ?? '',
      image: product.image === NO_PHOTO_IMAGE ? '' : product.image,
    });
    setShowProductModal(true);
  }

  function toPayload(input: ProductForm): CreateProductPayload {
    return {
      name: input.name.trim(),
      description: input.description.trim(),
      quantity: Math.max(Math.trunc(Number(input.quantity)), 0),
      categoryId: input.categoryId || null,
      image: input.image || NO_PHOTO_IMAGE,
    };
  }

  function handleSaveProduct() {
    const quantity = Number(form.quantity);
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(quantity)) {
      toast.error('Preencha nome, descricao e quantidade valida.');
      return;
    }

    const payload = toPayload(form);

    if (!productEditing) {
      createProductMutation.mutate(payload);
      return;
    }

    updateProductMutation.mutate({ id: productEditing.id, payload });
  }

  function handleQuickStock(product: Product, type: 'in' | 'out') {
    quickStockMutation.mutate({ product, type });
  }

  function openProductPage(productId: string) {
    router.push(`products/${productId}`);
  }

  function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm('Deseja excluir este produto?');
    if (!confirmed) return;

    deleteProductMutation.mutate(product.id);
  }

  return (
    <div className="space-y-8 reveal-up">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-start lg:gap-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight text-[#0f172a]">Gerenciamento de Produtos</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">Visualize, edite e acompanhe o volume total do seu estoque.</p>
        </div>
        <button
          type="button"
          onClick={openCreateProduct}
          className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-[image:var(--brand-gradient)] px-6 text-sm font-bold text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.7)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-20px_rgba(15,23,42,0.85)]">
          <Plus size={18} strokeWidth={2.5} />
          Novo Produto
        </button>
      </section>

      <section className="surface-card p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50">
            <Search size={20} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome ou descrição..."
              className="w-full bg-transparent text-sm font-medium text-[#0f172a] outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip active={categoryFilter === 'Todos'} label="Todos os itens" onClick={() => setCategoryFilter('Todos')} />
            {categories.map((category) => {
              const isActive = categoryFilter === category.name;

              return (
                <div key={category.id} className="group relative">
                  <div
                    className={`flex items-center rounded-full border px-1 shadow-sm transition-all ${isActive
                      ? 'border-transparent bg-[image:var(--brand-gradient)] text-white shadow-[0_18px_35px_-22px_rgba(15,23,42,0.8)] ring-1 ring-white/15'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter(category.name)}
                      className={`h-9 px-4 text-sm font-semibold transition-colors ${isActive
                        ? 'text-white'
                        : 'text-slate-600 hover:text-[#0f172a]'
                        }`}>
                      {category.name}
                    </button>
                    <span className={`h-5 w-px ${isActive ? 'bg-white/30' : 'bg-slate-200'}`} />
                    <button
                      type="button"
                      onClick={() => setOpenCategoryMenuId((current) => (current === category.id ? null : category.id))}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isActive
                        ? 'text-white/80 hover:text-white'
                        : 'text-slate-400 hover:text-[#0f172a]'
                        }`}>
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  {openCategoryMenuId === category.id ? (
                    <div className="absolute left-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryEditing(category);
                          setCategoryDraft(category.name);
                          setOpenCategoryMenuId(null);
                          setShowCategoryModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Edit2 size={14} />
                        Editar Nome
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm('Tem certeza que deseja excluir esta categoria?');
                          setOpenCategoryMenuId(null);
                          if (!confirmed) return;
                          deleteCategoryMutation.mutate(category.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50">
                        <Trash2 size={14} />
                        Excluir Categoria
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setCategoryEditing(null);
                setCategoryDraft('');
                setShowCategoryModal(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--brand-gradient)] text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.8)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {productsQuery.isLoading ? <ProductsSkeleton /> : null}

        {!productsQuery.isLoading && !filteredProducts.length ? (
          <div className="surface-card flex flex-col items-center justify-center border-dashed border-slate-200 bg-transparent py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <PackageSearch size={32} />
            </div>
            <p className="text-base font-bold text-[#0f172a]">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Tente ajustar sua busca ou filtros.</p>
          </div>
        ) : null}

        {filteredProducts.map((product) => {
          const categoryName = product.category?.name ?? categoryMap.get(product.categoryId ?? '')?.name ?? 'Sem Categoria';
          const status = getStatusBadge(
            product.quantity,
            product.estimatedDaysLeft ?? null,
            product.alertDaysBefore ?? session?.user.alertDaysBefore ?? 7,
          );

          return (
            <article
              key={product.id}
              role="link"
              tabIndex={0}
              aria-label={`Abrir produto ${product.name}`}
              onClick={() => openProductPage(product.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openProductPage(product.id);
                }
              }}
              className="surface-card group relative flex cursor-pointer flex-col gap-6 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100/70 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-50 shadow-inner">
                {product.image && product.image !== NO_PHOTO_IMAGE ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-300">
                    <ImageIcon size={32} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{categoryName}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <h5 className="text-xl font-bold tracking-tight text-[#0f172a]">{product.name}</h5>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">{product.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditProduct(product);
                      }}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:border-slate-300 hover:text-[#0f172a]">
                      <Edit2 size={11} />
                      Editar
                    </button>
                    <span className="text-2xl font-bold tracking-tight text-blue-600">{product.quantity}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unidades</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'in'); }}
                      disabled={quickStockMutation.isPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-5 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white disabled:opacity-50">
                      <Plus size={16} strokeWidth={3} />
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'out'); }}
                      disabled={quickStockMutation.isPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-rose-50 px-5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50">
                      <TrendingDown size={16} strokeWidth={3} />
                      Saída
                    </button>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-bold text-slate-400">Abrir produto</span>
                    <ArrowUpRight size={14} className="text-slate-300" />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>


      {showProductModal ? (
        <Modal title={productEditing ? 'Editar produto' : 'Novo produto'} onClose={() => setShowProductModal(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-soft">
                {form.image ? (
                  <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted/40">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-ink">Imagem do produto</p>
                <p className="text-[10px] text-muted">Cole uma URL de imagem abaixo</p>
              </div>
            </div>

            <Input label="Nome" value={form.name} placeholder="Ex: Boneco Sasuke" onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <Input
              label="Descricao"
              value={form.description}
              placeholder="Ex: Boneco de acao 20cm"
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantidade"
                type="number"
                value={form.quantity}
                placeholder="0"
                onChange={(value) => setForm((current) => ({ ...current, quantity: value }))}
              />
              <Input
                label="Imagem (URL)"
                value={form.image}
                placeholder="Opcional"
                onChange={(value) => setForm((current) => ({ ...current, image: value }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#0f172a] outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50">
                <option value="">Nenhuma</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="w-full rounded-2xl bg-[image:var(--brand-gradient)] py-4 text-sm font-bold text-white shadow-[0_18px_35px_-20px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">
                {productEditing ? 'Salvar alterações' : 'Criar produto'}
              </button>

              {productEditing && (
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(productEditing)}
                  className="w-full rounded-xl py-2 text-xs font-bold text-slate-400 transition-colors hover:text-rose-600">
                  Apagar produto permanentemente
                </button>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {showCategoryModal ? (
        <Modal
          title={categoryEditing ? 'Editar categoria' : 'Nova categoria'}
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryEditing(null);
            setCategoryDraft('');
          }}>
          <div className="space-y-4">
            <Input
              label="Nome da categoria"
              value={categoryDraft}
              onChange={setCategoryDraft}
              placeholder="Ex: Colecionaveis"
            />
            <button
              type="button"
              onClick={() => {
                const value = categoryDraft.trim();
                if (!value) {
                  toast.error('Informe um nome para a categoria.');
                  return;
                }
                categoryMutation.mutate({ id: categoryEditing?.id, name: value });
              }}
              className="w-full rounded-2xl bg-[image:var(--brand-gradient)] py-4 text-sm font-bold text-white shadow-[0_18px_35px_-20px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110">
              {categoryMutation.isPending ? 'Salvando...' : categoryEditing ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-sm font-semibold transition-all ${active
        ? 'border-transparent bg-[image:var(--brand-gradient)] text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.7)] ring-1 ring-white/15'
        : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-[#0f172a]'
        }`}>
      {label}
    </button>
  );
}

function getStatusBadge(currentStock: number, estimatedDaysLeft: number | null, alertDaysBefore: number) {
  if (currentStock <= 0) {
    return {
      accent: 'text-rose-600',
      className: 'bg-rose-100 text-rose-700',
      label: 'Sem estoque',
      tone: 'bg-rose-50',
    };
  }

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDaysBefore) {
    return {
      accent: 'text-orange-600',
      className: 'bg-orange-100 text-orange-700',
      label: 'Atenção',
      tone: 'bg-orange-50',
    };
  }

  return {
    accent: 'text-emerald-600',
    className: 'bg-emerald-100 text-emerald-700',
    label: 'Estoque OK',
    tone: 'bg-emerald-50',
  };
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(11,18,32,0.55)] backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className="relative z-[80] w-full max-w-[720px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-[var(--elevated-shadow-strong)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h4 className="text-xl font-bold tracking-tight text-[#0f172a]">{title}</h4>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}


function Input({
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5 text-sm font-medium text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
      />
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <article key={item} className="surface-card animate-pulse rounded-2xl border border-stroke p-4 sm:flex sm:gap-4">
          <div className="h-20 w-20 rounded-xl bg-soft" />
          <div className="mt-4 flex-1 space-y-2 sm:mt-0">
            <div className="h-4 w-1/3 rounded bg-soft" />
            <div className="h-3 w-2/3 rounded bg-soft" />
          </div>
        </article>
      ))}
    </div>
  );
}
