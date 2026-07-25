"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Image as ImageIcon, MoreVertical, PackageSearch, Pencil, Plus, Search, Trash2, TrendingDown } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { getStatusBadge } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/lib/api/categories';
import { exportProductsCsv } from '@/lib/api/export';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/lib/api/products';
import type { Category, CreateProductPayload, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useHistoryStore } from '@/store/history-store';
import { getSupabaseClient } from '@/lib/supabase/client';

const NO_PHOTO_IMAGE = 'sem-foto';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

type ProductForm = {
  name: string;
  description: string;
  quantity: string;
  categoryId: string;
  image: string;
  hasExpiration: boolean;
  expirationDate: string;
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
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') ?? 'Todos');
  const [sortBy, setSortBy] = useState('stock_asc');

  function updateCategoryInUrl(category: string) {
    setCategoryFilter(category);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'Todos') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/products';
    router.replace(newUrl, { scroll: false });
  }

  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [productEditing, setProductEditing] = useState<Product | null>(null);
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    quantity: '0',
    categoryId: '',
    image: '',
    hasExpiration: false,
    expirationDate: '',
  });
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, { in: string; out: string }>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);

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

  const ITEMS_PER_PAGE = 12;

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'stock_asc':
          return (a.quantity ?? 0) - (b.quantity ?? 0);
        case 'stock_desc':
          return (b.quantity ?? 0) - (a.quantity ?? 0);
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'newest':
          return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        case 'oldest':
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        default:
          return (a.quantity ?? 0) - (b.quantity ?? 0);
      }
    });
  }, [products, sortBy]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const productCategory =
        product.category?.name ?? categoryMap.get(product.categoryId ?? '')?.name ?? 'Nao categorizado';
      const matchesCategory = categoryFilter === 'Todos' || productCategory === categoryFilter;
      const matchesQuery =
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.description ?? '').toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, categoryMap, sortedProducts, query]);

  const totalProducts = products.length;
  const filteredCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

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
      handleCloseProductModal();
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
      handleCloseProductModal();
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
      handleCloseProductModal();
      toast.success('Produto excluido com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir produto.');
    },
  });

  const quickStockMutation = useMutation({
    mutationFn: async ({ product, quantity, type }: { product: Product; quantity: number; type: 'in' | 'out' }) => {
      const nextQuantity = type === 'in' ? product.quantity + quantity : Math.max(product.quantity - quantity, 0);
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

      return { nextQuantity, product: updated, type, quantity };
    },
    onMutate: async ({ product, quantity, type }) => {
      await queryClient.cancelQueries({ queryKey: productsQueryKey });
      const previous = queryClient.getQueryData<Product[]>(productsQueryKey);
      const nextQuantity = type === 'in' ? product.quantity + quantity : Math.max(product.quantity - quantity, 0);

      queryClient.setQueryData<Product[]>(productsQueryKey, (current) =>
        current?.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity, updatedAt: new Date().toISOString() }
            : item,
        ) ?? current,
      );

      return { previous };
    },
    onSuccess: ({ product, type }, variables) => {
      queryClient.setQueryData<Product[]>(productsQueryKey, (current) =>
        current?.map((item) => (item.id === product.id ? { ...item, ...product } : item)) ?? current,
      );
      addHistoryItem({
        productId: product.id,
        productName: product.name,
        quantity: variables.quantity,
        type,
      });
      setStockAdjustments((current) => {
        const previousValue = current[product.id] ?? { in: '1', out: '1' };
        return {
          ...current,
          [product.id]: {
            ...previousValue,
            [type]: '1',
          },
        };
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productsQueryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar estoque.');
    },
  });

  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
    };
  }, []);

  if (!session) {
    return null;
  }

  function clearImagePreview() {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setImagePreviewUrl('');
  }

  function resetImageState() {
    setImageFile(null);
    clearImagePreview();
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }

  function handleCloseProductModal() {
    setShowCreateProductModal(false);
    setShowEditProductModal(false);
    setProductEditing(null);
    setForm({ name: '', description: '', quantity: '0', categoryId: '', image: '', hasExpiration: false, expirationDate: '' });
    resetImageState();
  }

  function openCreateProduct() {
    setProductEditing(null);
    setForm({ name: '', description: '', quantity: '0', categoryId: '', image: '', hasExpiration: false, expirationDate: '' });
    resetImageState();
    setShowCreateProductModal(true);
  }

  function openEditProduct(product: Product) {
    setProductEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      quantity: String(product.quantity),
      categoryId: product.categoryId ?? '',
      image: product.image === NO_PHOTO_IMAGE ? '' : product.image,
      hasExpiration: Boolean(product.hasExpiration),
      expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
    });
    resetImageState();
    if (product.image && product.image !== NO_PHOTO_IMAGE) {
      setImagePreviewUrl(product.image);
    }
    setShowEditProductModal(true);
  }

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error('Formato invalido. Use PNG, JPG ou WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('Arquivo muito grande. Limite de 2MB.');
      event.target.value = '';
      return;
    }

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = previewUrl;
    setImageFile(file);
    setImagePreviewUrl(previewUrl);
  }

  async function uploadProductImage(file: File) {
    const supabase = getSupabaseClient();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'png';
    const fileName = `${crypto.randomUUID()}.${safeExtension}`;
    const filePath = `products/${session?.user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (error || !data) {
      throw new Error(error?.message ?? 'Falha ao enviar imagem.');
    }

    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    if (!publicData?.publicUrl) {
      throw new Error('Nao foi possivel gerar a URL publica.');
    }

    return publicData.publicUrl;
  }

  function getSupabaseImagePath(imageUrl: string) {
    const marker = '/storage/v1/object/public/product-images/';
    const index = imageUrl.indexOf(marker);
    if (index === -1) return null;
    return imageUrl.slice(index + marker.length);
  }

  function toPayload(input: ProductForm): CreateProductPayload {
    const parsedQuantity = Number(input.quantity);
    const normalizedQuantity = Number.isFinite(parsedQuantity) ? Math.max(Math.trunc(parsedQuantity), 0) : 0;

    return {
      name: input.name.trim(),
      description: input.description.trim() || null,
      quantity: normalizedQuantity,
      categoryId: input.categoryId || null,
      image: input.image || NO_PHOTO_IMAGE,
      hasExpiration: input.hasExpiration,
      expirationDate: input.hasExpiration && input.expirationDate ? new Date(input.expirationDate).toISOString() : null,
    };
  }

  async function handleSaveProduct() {
    const quantity = Number(form.quantity);

    if (!form.name.trim()) {
      toast.error('Preencha o nome.');
      return;
    }

    if (form.hasExpiration && !form.expirationDate) {
      toast.error('Preencha a data de validade.');
      return;
    }

    if (!productEditing && (!Number.isFinite(quantity) || quantity < 0)) {
      toast.error('Preencha uma quantidade válida.');
      return;
    }

    let imageUrl = form.image || NO_PHOTO_IMAGE;

    if (imageFile) {
      try {
        setIsImageUploading(true);
        const previousImageUrl = form.image;
        imageUrl = await uploadProductImage(imageFile);
        if (imageObjectUrlRef.current) {
          URL.revokeObjectURL(imageObjectUrlRef.current);
          imageObjectUrlRef.current = null;
        }
        setForm((current) => ({ ...current, image: imageUrl }));
        setImagePreviewUrl(imageUrl);
        setImageFile(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
        if (previousImageUrl && previousImageUrl !== NO_PHOTO_IMAGE) {
          const previousPath = getSupabaseImagePath(previousImageUrl);
          if (previousPath) {
            const supabase = getSupabaseClient();
            await supabase.storage.from('product-images').remove([previousPath]);
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao enviar imagem.');
        return;
      } finally {
        setIsImageUploading(false);
      }
    }

    const payload = toPayload({ ...form, image: imageUrl });

    if (!productEditing) {
      createProductMutation.mutate(payload);
      return;
    }

    updateProductMutation.mutate({ id: productEditing.id, payload });
  }

  function getStockAdjustmentValue(productId: string, type: 'in' | 'out') {
    return stockAdjustments[productId]?.[type] ?? '1';
  }

  function updateStockAdjustment(productId: string, type: 'in' | 'out', value: string) {
    setStockAdjustments((current) => {
      const previousValue = current[productId] ?? { in: '1', out: '1' };
      return {
        ...current,
        [productId]: {
          ...previousValue,
          [type]: value,
        },
      };
    });
  }

  function parseStockAdjustment(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }

  function normalizeStockAdjustment(value: string) {
    if (value === '') return '';
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return '1';
    return String(parsed);
  }

  function handleQuickStock(product: Product, type: 'in' | 'out') {
    const quantity = parseStockAdjustment(getStockAdjustmentValue(product.id, type));
    if (!quantity) return;
    quickStockMutation.mutate({ product, quantity, type });
  }

  function openProductPage(productId: string) {
    router.push(`products/${productId}`);
  }

  return (
    <div className="space-y-8 reveal-up">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm font-medium text-(--muted)">Visualize, edite e acompanhe o volume total do seu estoque.</p>
        </div>
        <ExportButton onExportCsv={() => exportProductsCsv(session!.accessToken)} />
      </section>

      <section className="surface-card p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-1 items-center gap-3 rounded-xl border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 transition-all focus-within:border-(--accent) focus-within:bg-(--card) focus-within:ring-4 focus-within:[--tw-ring-color:var(--accent)]/30">
              <Search size={20} className="text-(--muted)" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }}
                placeholder="Pesquisar por nome ou descrição..."
                className="w-full bg-transparent text-sm font-medium text-(--ink) outline-none placeholder:text-(--muted)"
              />
            </div>
            <button
              type="button"
              onClick={openCreateProduct}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-(--button) px-4 text-xs font-bold text-white transition-all hover:brightness-125 self-end sm:self-auto"
            >
              <Plus size={14} strokeWidth={2.5} />
              Novo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip active={categoryFilter === 'Todos'} label="Todos" onClick={() => updateCategoryInUrl('Todos')} />
            {categories.map((category) => {
              const isActive = categoryFilter === category.name;

              return (
                <div key={category.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => updateCategoryInUrl(category.name)}
                    className={`h-8 rounded-full border-2 px-3 text-xs font-semibold transition-all ${isActive
                      ? 'border-(--button) bg-(--button) text-white'
                      : 'border-(--stroke) bg-(--card) text-(--muted) hover:bg-(--soft) hover:text-(--ink)'
                      }`}>
                    {category.name}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCategoryEditing(category);
                      setCategoryDraft(category.name);
                      setShowCategoryModal(true);
                    }}
                    className="absolute -top-1 -right-1 hidden h-5 w-5 items-center justify-center rounded-full border-2 border-(--stroke) bg-(--card) text-(--muted) transition-all hover:bg-(--soft) hover:text-(--ink) group-hover:flex"
                  >
                    <Pencil size={10} />
                  </button>
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
              className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-(--stroke) bg-(--card) px-3 text-xs font-semibold text-(--muted) transition-all hover:border-(--button) hover:text-(--ink)">
              <Plus size={14} strokeWidth={2.5} />
              Nova
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-(--muted)">Mostrando {filteredCount} de {totalProducts} produtos</p>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-8 rounded-lg border-2 border-(--stroke) bg-(--card) px-3 text-xs font-bold text-(--ink) outline-none transition-all focus:border-(--accent) hover:bg-(--soft)"
            >
              <option value="stock_asc">Menor estoque primeiro</option>
              <option value="stock_desc">Maior estoque primeiro</option>
              <option value="name_asc">Nome A-Z</option>
              <option value="newest">Mais recente</option>
              <option value="oldest">Mais antigo</option>
            </select>
          </div>
        </div>
      </section>

      {productsQuery.isLoading ? (
        <ProductsSkeleton />
      ) : !filteredProducts.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) py-16 text-center sm:py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--soft) text-(--muted)">
            <PackageSearch size={32} />
          </div>
          <p className="text-base font-bold text-(--ink)">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm font-medium text-(--muted)">Tente ajustar sua busca ou filtros.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-3">
          {paginatedProducts.map((product) => {
          const categoryName = product.category?.name ?? categoryMap.get(product.categoryId ?? '')?.name ?? 'Sem Categoria';
          const status = getStatusBadge(
            product.quantity,
            product.estimatedDaysLeft ?? null,
            product.alertDaysBefore ?? session?.user.alertDaysBefore ?? 7,
          );
          const entryValue = getStockAdjustmentValue(product.id, 'in');
          const exitValue = getStockAdjustmentValue(product.id, 'out');
          const entryQuantity = parseStockAdjustment(entryValue);
          const exitQuantity = parseStockAdjustment(exitValue);
          const isStockPending = quickStockMutation.isPending;

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
              className="flex cursor-pointer gap-3 rounded-xl border-2 border-(--stroke) bg-(--card) p-4 transition-all hover:bg-(--surface-2) focus:outline-none focus-visible:ring-4 focus-visible:[--tw-ring-color:var(--accent)]/40 sm:gap-5 sm:p-5"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-(--soft) sm:h-20 sm:w-20">
                {product.image && product.image !== NO_PHOTO_IMAGE ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={80}
                    height={80}
                    sizes="(min-width: 640px) 80px, 64px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-(--muted)">
                    <ImageIcon size={24} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">{categoryName}</span>
                    <span className={`rounded-md border-2 px-1.5 py-0.5 text-[9px] font-bold leading-none ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuProductId(openMenuProductId === product.id ? null : product.id);
                      }}
                      className="shrink-0 rounded-md p-1 text-(--muted) transition-colors hover:bg-(--soft) hover:text-(--ink)"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {openMenuProductId === product.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuProductId(null)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border-2 border-(--stroke) bg-(--card) py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuProductId(null);
                              openEditProduct(product);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
                          >
                            <Edit2 size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuProductId(null);
                              setProductToDelete(product);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-(--critical) transition-colors hover:bg-(--critical-soft)"
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h5 className="truncate text-[15px] font-bold text-(--ink)">{product.name}</h5>
                <p className="line-clamp-1 text-xs font-medium text-(--muted)">{product.description || 'Sem descrição'}</p>
                {product.hasExpiration && product.expirationDate && (
                  <p className="text-[10px] font-semibold text-(--critical) mt-0.5">
                    Validade: {new Date(product.expirationDate).toLocaleDateString('pt-BR')}
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-2 border-t-2 border-(--stroke) pt-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={entryValue}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          updateStockAdjustment(product.id, 'in', normalizeStockAdjustment(event.target.value));
                        }}
                        onBlur={() => {
                          if (!parseStockAdjustment(entryValue)) {
                            updateStockAdjustment(product.id, 'in', '1');
                          }
                        }}
                        disabled={isStockPending}
                        className="h-7 w-14 rounded-md border-2 border-(--stroke) bg-(--surface-2) px-2 text-xs font-bold text-(--ok) outline-none transition-all focus:border-(--ok) focus:bg-(--card)"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'in'); }}
                        disabled={isStockPending || !entryQuantity}
                        className="flex h-7 items-center gap-1 rounded-md bg-(--ok) px-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        <Plus size={11} strokeWidth={3} />
                        Entrada
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={exitValue}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          updateStockAdjustment(product.id, 'out', normalizeStockAdjustment(event.target.value));
                        }}
                        onBlur={() => {
                          if (!parseStockAdjustment(exitValue)) {
                            updateStockAdjustment(product.id, 'out', '1');
                          }
                        }}
                        disabled={isStockPending}
                        className="h-7 w-14 rounded-md border-2 border-(--stroke) bg-(--surface-2) px-2 text-xs font-bold text-(--critical) outline-none transition-all focus:border-(--critical) focus:bg-(--card)"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleQuickStock(product, 'out'); }}
                        disabled={isStockPending || !exitQuantity}
                        className="flex h-7 items-center gap-1 rounded-md bg-(--critical) px-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        <TrendingDown size={11} strokeWidth={3} />
                        Saída
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold tracking-tight text-(--ink) sm:text-2xl">{product.quantity}</span>
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">un</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}


      {showCreateProductModal ? (
        <Modal title="Novo produto" onClose={handleCloseProductModal}>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Nome" value={form.name} placeholder="Ex: Boneco Sasuke" onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Descricao"
                  value={form.description}
                  placeholder="Ex: Boneco de acao 20cm"
                  onChange={(value) => setForm((current) => ({ ...current, description: value }))}
                />
              </div>
              <Input
                label="Quantidade"
                type="number"
                value={form.quantity}
                placeholder="0"
                onChange={(value) => setForm((current) => ({ ...current, quantity: value }))}
              />
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink) uppercase tracking-wider">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-all focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30">
                  <option value="" className="font-medium text-(--ink)">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} className="font-medium text-(--ink)">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink) uppercase tracking-wider">Controle de Validade</label>
                <select
                  value={form.hasExpiration ? 'yes' : 'no'}
                  onChange={(event) => {
                    const hasExp = event.target.value === 'yes';
                    setForm((current) => ({
                      ...current,
                      hasExpiration: hasExp,
                      expirationDate: hasExp ? current.expirationDate || new Date().toISOString().split('T')[0] : '',
                    }));
                  }}
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-all focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30">
                  <option value="no" className="font-medium text-(--ink)">Sem validade</option>
                  <option value="yes" className="font-medium text-(--ink)">Com validade</option>
                </select>
              </div>
              {form.hasExpiration ? (
                <div>
                  <Input
                    label="Data de Validade"
                    type="date"
                    value={form.expirationDate}
                    onChange={(value) => setForm((current) => ({ ...current, expirationDate: value }))}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-(--ink) uppercase tracking-wider">Imagem</label>
              {imagePreviewUrl ? (
                <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-(--card)">
                    <Image
                      src={imagePreviewUrl}
                      alt="Preview"
                      width={56}
                      height={56}
                      
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-(--ink)">Imagem selecionada</p>
                    <p className="text-[10px] text-(--muted)">PNG, JPG ou WEBP ate 2MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetImageState();
                      setForm((current) => ({ ...current, image: NO_PHOTO_IMAGE }));
                    }}
                    className="rounded-md border-2 border-(--critical) px-2.5 py-1.5 text-[10px] font-bold text-(--critical) transition-colors hover:bg-(--critical-soft)"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--stroke) bg-(--surface-2) px-4 py-6 text-center transition-colors hover:bg-(--card)">
                  <div>
                    <ImageIcon size={20} className="mx-auto text-(--muted)" />
                    <p className="mt-2 text-xs font-bold text-(--muted)">Clique para selecionar</p>
                    <p className="text-[10px] text-(--muted)">PNG, JPG ou WEBP ate 2MB</p>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageFileChange}
                    disabled={isImageUploading}
                    className="sr-only"
                  />
                </label>
              )}
              {isImageUploading ? <p className="text-xs font-bold text-(--accent)">Enviando imagem...</p> : null}
            </div>

            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isImageUploading || createProductMutation.isPending || updateProductMutation.isPending}
              className="w-full rounded-lg bg-(--button) py-3.5 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-60">
              {isImageUploading ? 'Enviando imagem...' : 'Criar produto'}
            </button>
          </div>
        </Modal>
      ) : null}

      {showEditProductModal ? (
        <Modal title="Editar produto" onClose={handleCloseProductModal}>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Nome" value={form.name} placeholder="Ex: Boneco Sasuke" onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Descricao"
                  value={form.description}
                  placeholder="Ex: Boneco de acao 20cm"
                  onChange={(value) => setForm((current) => ({ ...current, description: value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink) uppercase tracking-wider">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-all focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30">
                  <option value="" className="font-medium text-(--ink)">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} className="font-medium text-(--ink)">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-(--ink) uppercase tracking-wider">Controle de Validade</label>
                <select
                  value={form.hasExpiration ? 'yes' : 'no'}
                  onChange={(event) => {
                    const hasExp = event.target.value === 'yes';
                    setForm((current) => ({
                      ...current,
                      hasExpiration: hasExp,
                      expirationDate: hasExp ? current.expirationDate || new Date().toISOString().split('T')[0] : '',
                    }));
                  }}
                  className="w-full rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-all focus:border-(--accent) focus:bg-(--card) focus:ring-4 focus:[--tw-ring-color:var(--accent)]/30">
                  <option value="no" className="font-medium text-(--ink)">Sem validade</option>
                  <option value="yes" className="font-medium text-(--ink)">Com validade</option>
                </select>
              </div>
              {form.hasExpiration ? (
                <div>
                  <Input
                    label="Data de Validade"
                    type="date"
                    value={form.expirationDate}
                    onChange={(value) => setForm((current) => ({ ...current, expirationDate: value }))}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-(--ink) uppercase tracking-wider">Imagem</label>
              {imagePreviewUrl ? (
                <div className="flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-(--card)">
                    <Image
                      src={imagePreviewUrl}
                      alt="Preview"
                      width={56}
                      height={56}
                      
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-(--ink)">Imagem selecionada</p>
                    <p className="text-[10px] text-(--muted)">PNG, JPG ou WEBP ate 2MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetImageState();
                      setForm((current) => ({ ...current, image: NO_PHOTO_IMAGE }));
                    }}
                    className="rounded-md border-2 border-(--critical) px-2.5 py-1.5 text-[10px] font-bold text-(--critical) transition-colors hover:bg-(--critical-soft)"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--stroke) bg-(--surface-2) px-4 py-6 text-center transition-colors hover:bg-(--card)">
                  <div>
                    <ImageIcon size={20} className="mx-auto text-(--muted)" />
                    <p className="mt-2 text-xs font-bold text-(--muted)">Clique para selecionar</p>
                    <p className="text-[10px] text-(--muted)">PNG, JPG ou WEBP ate 2MB</p>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageFileChange}
                    disabled={isImageUploading}
                    className="sr-only"
                  />
                </label>
              )}
              {isImageUploading ? <p className="text-xs font-bold text-(--accent)">Enviando imagem...</p> : null}
            </div>

            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isImageUploading || createProductMutation.isPending || updateProductMutation.isPending}
              className="w-full rounded-lg bg-(--button) py-3.5 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-60">
              {isImageUploading ? 'Enviando imagem...' : 'Salvar alterações'}
            </button>

          </div>
        </Modal>
      ) : null}

      {productToDelete && (
        <Modal title="Excluir produto" onClose={() => setProductToDelete(null)}>
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-(--muted)">
              Tem certeza que deseja excluir <strong className="text-(--ink)">{productToDelete.name}</strong> ({productToDelete.quantity} un.)? Todo o histórico de movimentação deste produto será perdido.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 rounded-lg border-2 border-(--stroke) py-3 text-sm font-bold text-(--ink) transition-colors hover:bg-(--soft)"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProductMutation.mutate(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 rounded-lg bg-(--critical) py-3 text-sm font-bold text-white transition-all hover:brightness-125"
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCategoryModal ? (
        <Modal
          title={categoryEditing ? 'Editar categoria' : 'Nova categoria'}
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryEditing(null);
            setCategoryDraft('');
          }}>
          <div className="space-y-5">
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
              className="w-full rounded-lg bg-(--button) py-3.5 text-sm font-bold text-white transition-all hover:brightness-125">
              {categoryMutation.isPending ? 'Salvando...' : categoryEditing ? 'Salvar alterações' : 'Criar categoria'}
            </button>
            {categoryEditing && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm('Tem certeza que deseja excluir esta categoria?');
                  if (!confirmed) return;
                  deleteCategoryMutation.mutate(categoryEditing.id);
                }}
                className="w-full rounded-lg py-2 text-xs font-bold text-(--muted) transition-colors hover:text-(--critical)">
                Excluir categoria permanentemente
              </button>
            )}
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
      className={`h-8 rounded-full border-2 px-3 text-xs font-semibold transition-all ${active
        ? 'border-(--button) bg-(--button) text-white'
        : 'border-(--stroke) bg-(--card) text-(--muted) hover:bg-(--soft) hover:text-(--ink)'
        }`}>
      {label}
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <article key={item} className="surface-card p-4 sm:flex sm:gap-4">
          <div className="h-20 w-20 rounded-xl bg-(--soft)" />
          <div className="mt-4 flex-1 space-y-2 sm:mt-0">
            <div className="h-4 w-1/3 rounded bg-(--soft)" />
            <div className="h-3 w-2/3 rounded bg-(--soft)" />
          </div>
        </article>
      ))}
    </div>
  );
}
