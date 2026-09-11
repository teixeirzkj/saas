'use client';

import { useRouter } from 'next/navigation';
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import { EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import { ConfirmDialog } from '@/components/ui/modal';
import { FilterPills } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { brl, cn } from '@/lib/utils';

import { createCategory, deleteCategory, deleteProduct, toggleProductAvailable } from './actions';
import { ProductFormModal } from './product-form';

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
  categoryId: string | null;
  addons: { name: string; price: number }[];
};

type Terminology = { catalogLabel: string; catalogItemLabel: string };
const DEFAULT_TERMINOLOGY: Terminology = { catalogLabel: 'Catálogo', catalogItemLabel: 'Produto' };

export function CatalogView({
  slug,
  appUrl,
  catalogEnabled,
  pendingOrders,
  categories,
  products,
  openNew,
  limit,
  planName,
  terminology = DEFAULT_TERMINOLOGY,
}: {
  slug: string;
  appUrl: string;
  catalogEnabled: boolean;
  pendingOrders: number;
  categories: Category[];
  products: Product[];
  openNew: boolean;
  limit: number;
  planName: string;
  terminology?: Terminology;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [form, setForm] = useState<{ open: boolean; product?: Product }>({ open: openNew });
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [categoryModal, setCategoryModal] = useState(false);

  const catalogUrl = `${appUrl}/catalogo/${slug}`;

  const filtered = useMemo(
    () => (categoryFilter === 'todos' ? products : products.filter((p) => p.categoryId === categoryFilter)),
    [products, categoryFilter],
  );

  const pills = [
    { value: 'todos', label: 'Todos', count: products.length },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      count: products.filter((p) => p.categoryId === c.id).length,
    })),
    { value: '__none', label: 'Sem categoria', count: products.filter((p) => !p.categoryId).length },
  ];

  const limitReached = limit > 0 && products.length >= limit;

  return (
    <>
      <PageHeader
        title={terminology.catalogLabel}
        description={`${terminology.catalogItemLabel}s que aparecem na sua página pública.`}
        action={
          <>
            <ButtonAnchor href="/catalogo/pedidos" variant="secondary">
              <Package className="h-4 w-4" />
              Pedidos
              {pendingOrders > 0 && <Badge tone="purple">{pendingOrders}</Badge>}
            </ButtonAnchor>
            {limitReached ? (
              <ButtonAnchor href="/planos" variant="subtle">
                Liberar {terminology.catalogItemLabel.toLowerCase()}s ilimitados
              </ButtonAnchor>
            ) : (
              <Button onClick={() => setForm({ open: true })}>
                <Plus className="h-4 w-4" />
                Novo {terminology.catalogItemLabel.toLowerCase()}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3">
          {/* Link público */}
          <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                  catalogEnabled
                    ? 'border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300',
                )}
              >
                <ExternalLink className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white">
                  Sua página de catálogo
                  {!catalogEnabled && (
                    <Badge tone="warning" className="ml-2">
                      Desativada
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/40">{catalogUrl.replace(/^https?:\/\//, '')}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(catalogUrl);
                  success('Link copiado');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
              <ButtonAnchor href={`/catalogo/${slug}`} variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </ButtonAnchor>
            </div>
          </div>

          {limitReached && (
            <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">
                  {products.length} de {limit} produtos do plano {planName}
                </p>
                <Progress value={products.length} max={limit} className="mt-2 max-w-xs" />
              </div>
              <ButtonAnchor href="/planos" variant="subtle" size="sm">
                Ver planos
              </ButtonAnchor>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FilterPills items={pills} value={categoryFilter} onChange={setCategoryFilter} />
            <button
              onClick={() => setCategoryModal(true)}
              className="shrink-0 rounded-full border border-dashed border-white/[0.12] px-3 py-1.5 text-[12px] font-medium text-white/40 transition hover:border-[rgb(var(--brand-500)/0.4)] hover:text-[rgb(var(--brand-200))]"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              Categoria
            </button>
          </div>
        </div>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={`Seu ${terminology.catalogLabel.toLowerCase()} ainda está vazio.`}
          description={`Cadastre ${terminology.catalogItemLabel.toLowerCase()}s com foto, preço e descrição. Eles aparecem automaticamente na sua página pública.`}
          action={
            <Button onClick={() => setForm({ open: true })}>
              <Plus className="h-4 w-4" />
              Cadastrar primeiro {terminology.catalogItemLabel.toLowerCase()}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-6 w-6" />}
          title={`Nenhum ${terminology.catalogItemLabel.toLowerCase()} nesta categoria`}
          description="Escolha outro filtro ou cadastre um item para essa categoria."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              onEdit={() => setForm({ open: true, product })}
              onDelete={() => setToDelete(product)}
              onToggle={() =>
                startTransition(async () => {
                  const result = await toggleProductAvailable(product.id);
                  if (result.error) return error('Não foi possível atualizar', result.error);
                  router.refresh();
                })
              }
            />
          ))}
        </div>
      )}

      <ProductFormModal
        open={form.open}
        onClose={() => {
          setForm({ open: false });
          if (openNew) router.replace('/catalogo');
        }}
        product={form.product}
        categories={categories}
      />

      {/* Modal simples para criar categoria */}
      {categoryModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCategoryModal(false)} />
          <div className="surface relative w-full max-w-sm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Nova categoria</h3>
              <button onClick={() => setCategoryModal(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              label="Nome da categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ex.: Bebidas"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCategoryModal(false)}>
                Cancelar
              </Button>
              <Button
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    if (!newCategory.trim()) return;
                    const result = await createCategory(newCategory);
                    if (result.error) return error('Não foi possível criar', result.error);
                    success('Categoria criada');
                    setNewCategory('');
                    setCategoryModal(false);
                    router.refresh();
                  })
                }
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={toDelete ? `Excluir "${toDelete.name}"?` : ''}
        description="O produto será removido do catálogo e da página pública."
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!toDelete) return;
            const result = await deleteProduct(toDelete.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Produto excluído');
            setToDelete(null);
            router.refresh();
          })
        }
      />
    </>
  );
}

function ProductCard({
  product,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'surface surface-hover group relative overflow-hidden p-0',
        !product.available && 'opacity-55',
      )}
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white/[0.03]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-white/10" />
          </div>
        )}

        {product.featured && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[rgb(var(--brand-500)/0.9)] px-2 py-1 text-[10px] font-semibold text-white shadow-glow-sm">
            <Star className="h-2.5 w-2.5 fill-current" />
            Destaque
          </span>
        )}

        <Dropdown
          width="w-44"
          align="right"
          className="absolute right-2 top-2"
          trigger={
            <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          }
        >
          {(close) => (
            <>
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); onEdit(); }}>
                Editar
              </DropdownItem>
              <DropdownItem
                icon={product.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onClick={() => { close(); onToggle(); }}
              >
                {product.available ? 'Ocultar do catálogo' : 'Tornar disponível'}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => { close(); onDelete(); }}>
                Excluir
              </DropdownItem>
            </>
          )}
        </Dropdown>

        {!product.available && (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
            Indisponível
          </span>
        )}
      </div>

      <button onClick={onEdit} className="block w-full p-3 text-left">
        <p className="truncate text-[13px] font-medium text-white">{product.name}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {product.promoPrice ? (
            <>
              <span className="font-display text-[14px] font-semibold text-[rgb(var(--brand-200))]">{brl(product.promoPrice)}</span>
              <span className="text-[11px] text-white/30 line-through">{brl(product.price)}</span>
            </>
          ) : (
            <span className="font-display text-[14px] font-semibold text-white">{brl(product.price)}</span>
          )}
        </div>
      </button>
    </div>
  );
}
