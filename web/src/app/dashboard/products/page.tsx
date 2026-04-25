"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Search, TrendingDown, TrendingUp, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';
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
  const session = useAuthStore((state) => state.session);
  const addHistoryItem = useHistoryStore((state) => state.addHistoryItem);
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
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
    mutationFn: ({ product, type }: { product: Product; type: 'in' | 'out' }) => {
      const nextQuantity = type === 'in' ? product.quantity + 1 : Math.max(product.quantity - 1, 0);
      return updateProduct(
        product.id,
        {
          name: product.name,
          description: product.description,
          quantity: nextQuantity,
          categoryId: product.categoryId ?? null,
          image: product.image,
        },
        session!.accessToken,
      ).then(() => ({ nextQuantity, product, type }));
    },
    onSuccess: ({ product, type }) => {
      addHistoryItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        type,
      });
      void queryClient.invalidateQueries({ queryKey: ['products', session?.user.id] });
    },
    onError: (error) => {
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

  function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm('Deseja excluir este produto?');
    if (!confirmed) return;

    deleteProductMutation.mutate(product.id);
  }

  return (
    <div className="space-y-4">
      <section className="surface-card rounded-2xl border border-stroke p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-ink">Produtos</h3>
            <p className="mt-1 text-xs font-medium text-muted">Fluxo direto com backend e atualizacao imediata.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateProduct}
              className="interactive-press flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white hover:brightness-110">
              <Plus size={16} strokeWidth={3} />
              Novo
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-stroke bg-white px-4 focus-within:border-accent">
            <Search size={18} className="text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar produto ou descricao"
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryChip active={categoryFilter === 'Todos'} label="Todos" onClick={() => setCategoryFilter('Todos')} />
            {categories.map((category) => (
              <div key={category.id} className="relative flex items-center gap-1.5">
                <CategoryChip
                  active={categoryFilter === category.name}
                  label={category.name}
                  onClick={() => setCategoryFilter(category.name)}
                />
                <button
                  type="button"
                  onClick={() => setOpenCategoryMenuId((current) => (current === category.id ? null : category.id))}
                  className="interactive-press flex h-8 w-8 items-center justify-center rounded-lg border border-stroke bg-white text-muted hover:bg-soft">
                  <MoreVertical size={14} />
                </button>

                {openCategoryMenuId === category.id ? (
                  <div className="surface-card absolute left-0 top-10 z-20 w-36 rounded-xl border border-stroke p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryEditing(category);
                        setCategoryDraft(category.name);
                        setOpenCategoryMenuId(null);
                        setShowCategoryModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold hover:bg-soft">
                      <Edit2 size={12} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm('Tem certeza que deseja excluir esta categoria?');
                        setOpenCategoryMenuId(null);
                        if (!confirmed) return;
                        deleteCategoryMutation.mutate(category.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold text-critical hover:bg-critical-soft">
                      <Trash2 size={12} />
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setCategoryEditing(null);
                setCategoryDraft('');
                setShowCategoryModal(true);
              }}
              className="interactive-press flex h-8 w-8 items-center justify-center rounded-full border border-stroke bg-white text-ink hover:bg-soft">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {productsQuery.isLoading ? <ProductsSkeleton /> : null}

        {!productsQuery.isLoading && !filteredProducts.length ? (
          <div className="surface-card rounded-2xl border border-stroke px-4 py-12 text-center">
            <p className="text-sm font-bold text-ink">Nenhum produto encontrado</p>
          </div>
        ) : null}

        {filteredProducts.map((product) => {
          const categoryName = product.category?.name ?? categoryMap.get(product.categoryId ?? '')?.name ?? 'Nao categorizado';
          const critical = product.quantity <= 0;
          const low = product.quantity > 0 && product.quantity <= 5;
          const statusLabel = critical ? 'Critico' : low ? 'Baixo' : 'OK';
          const statusClass = critical
            ? 'bg-critical-soft text-critical'
            : low
              ? 'bg-low-soft text-low'
              : 'bg-ok-soft text-ok';

          return (
            <article 
              key={product.id} 
              onClick={() => openEditProduct(product)}
              className="surface-card surface-card-hover group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-stroke p-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft shadow-inner">
                {product.image && product.image !== NO_PHOTO_IMAGE ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted/40">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-lg font-black leading-tight text-ink">{product.name}</h5>
                    <p className="mt-0.5 line-clamp-1 text-xs font-medium text-muted">{product.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-soft px-2 py-1 text-[10px] font-bold text-ink/70">{categoryName}</span>
                  <div className="h-1 w-1 rounded-full bg-stroke" />
                  <span className="text-xs font-black text-accent">{product.quantity} un.</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'in'); }}
                    disabled={quickStockMutation.isPending}
                    className="interactive-press flex h-9 items-center justify-center gap-1.5 rounded-xl bg-ok-soft px-4 text-xs font-black text-ok transition hover:bg-ok hover:text-white disabled:opacity-60">
                    <TrendingUp size={14} strokeWidth={3} />
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'out'); }}
                    disabled={quickStockMutation.isPending}
                    className="interactive-press flex h-9 items-center justify-center gap-1.5 rounded-xl bg-critical-soft px-4 text-xs font-black text-critical transition hover:bg-critical hover:text-white disabled:opacity-60">
                    <TrendingDown size={14} strokeWidth={3} />
                    -1
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

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
                className="w-full rounded-xl border border-stroke bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-accent">
                <option value="">Nenhuma</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="interactive-press w-full rounded-xl bg-ink py-3 text-xs font-black text-white hover:opacity-90 disabled:opacity-60">
                {productEditing ? 'Salvar alteracoes' : 'Criar produto'}
              </button>

              {productEditing && (
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(productEditing)}
                  className="w-full rounded-xl py-2 text-[10px] font-bold text-critical/60 hover:text-critical">
                  Apagar produto
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
              className="interactive-press w-full rounded-xl bg-ink py-3 text-xs font-black text-white hover:opacity-90">
              {categoryMutation.isPending ? 'Salvando...' : categoryEditing ? 'Salvar' : 'Criar'}
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
      className={`interactive-press h-8 rounded-full border px-4 text-xs font-bold transition-all ${active
        ? 'border-ink bg-ink text-white'
        : 'border-stroke bg-white text-ink hover:bg-soft'
        }`}>
      {label}
    </button>
  );
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
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="surface-card w-full max-w-xl rounded-2xl border border-stroke p-6 lg:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h4 className="text-xl font-black text-ink">{title}</h4>
        </div>
        {children}
      </div>
    </div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stroke bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none transition focus:border-accent"
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
