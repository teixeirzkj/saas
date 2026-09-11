'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  Instagram,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { Logo, LogoMark } from '@/components/shared/logo';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { Drawer, Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { brl, cn } from '@/lib/utils';
import { cartMessage, waLink } from '@/lib/whatsapp';

import { createPublicOrder } from './actions';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  imageUrl: string | null;
  featured: boolean;
  categoryId: string | null;
  addons: { name: string; price: number }[];
};

type Category = { id: string; name: string };

type Business = {
  name: string;
  slug: string;
  logoUrl: string | null;
  about: string | null;
  catalogHeadline: string | null;
  address: string | null;
  city: string | null;
  whatsapp: string | null;
  instagram: string | null;
  deliveryFee: number;
  minOrder: number;
};

type CartLine = {
  key: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addons: { name: string; price: number }[];
  notes?: string;
};

let lineCounter = 0;

type Terminology = { catalogLabel: string; catalogItemLabel: string; catalogCta: string };

const DEFAULT_TERMINOLOGY: Terminology = {
  catalogLabel: 'Catálogo',
  catalogItemLabel: 'Produto',
  catalogCta: 'Adicionar ao carrinho',
};

export function PublicCatalog({
  business,
  categories,
  products,
  terminology = DEFAULT_TERMINOLOGY,
}: {
  business: Business;
  categories: Category[];
  products: Product[];
  terminology?: Terminology;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productModal, setProductModal] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<{ number: number; total: number; whatsappUrl: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { success } = useToast();

  const grouped = useMemo(() => {
    const map = new Map<string | null, Product[]>();
    for (const product of products) {
      const key = product.categoryId;
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const featured = products.filter((p) => p.featured);

  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const cartSubtotal = cart.reduce((sum, l) => sum + (l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity, 0);

  const addToCart = (line: Omit<CartLine, 'key'>) => {
    setCart((list) => [...list, { ...line, key: `line-${++lineCounter}` }]);
    setProductModal(null);
    success(`${line.name} adicionado ao carrinho`);
  };

  const updateQty = (key: string, delta: number) =>
    setCart((list) =>
      list
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );

  const removeLine = (key: string) => setCart((list) => list.filter((l) => l.key !== key));

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="surface w-full max-w-md p-7 text-center sm:p-8"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"
          >
            <span className="absolute inset-0 animate-pulse-glow rounded-2xl bg-emerald-500/20 blur-xl" />
            <CheckCircle2 className="relative h-7 w-7 text-emerald-300" />
          </motion.span>

          <h1 className="font-display text-[24px] font-semibold leading-tight text-white">Pedido enviado!</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-white/50">
            Pedido #{confirmed.number} registrado — total de {brl(confirmed.total)}. Confirme pelo WhatsApp para a{' '}
            {business.name} começar a preparar.
          </p>

          <ButtonAnchor href={confirmed.whatsappUrl} variant="whatsapp" size="lg" fullWidth className="mt-6">
            Confirmar pelo WhatsApp
          </ButtonAnchor>

          <button
            onClick={() => {
              setConfirmed(null);
              setCart([]);
            }}
            className="mt-4 text-[13px] font-medium text-white/40 transition hover:text-white"
          >
            Fazer novo pedido
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Cabeçalho */}
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 animate-pulse-glow rounded-full bg-[rgb(var(--brand-600)/0.2)] blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <LogoMark className="h-14 w-14" />
            )}
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
                {business.name}
              </h1>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">
                {business.catalogHeadline ?? business.about ?? 'Confira nossos produtos e faça seu pedido.'}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-white/40">
                {business.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[business.address, business.city].filter(Boolean).join(' · ')}
                  </span>
                )}
                {business.instagram && (
                  <span className="flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    {business.instagram}
                  </span>
                )}
                {business.minOrder > 0 && <span>Pedido mínimo {brl(business.minOrder)}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8">
        {products.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title={`${terminology.catalogLabel} em preparação`}
            description="Volte em breve para ver as novidades."
          />
        ) : (
          <>
            {/* Filtro de categoria */}
            {categories.length > 1 && (
              <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
                <CategoryPill label="Todos" active={categoryFilter === null} onClick={() => setCategoryFilter(null)} />
                {categories.map((c) => (
                  <CategoryPill
                    key={c.id}
                    label={c.name}
                    active={categoryFilter === c.id}
                    onClick={() => setCategoryFilter(c.id)}
                  />
                ))}
              </div>
            )}

            {/* Destaques */}
            {!categoryFilter && featured.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 font-display text-[16px] font-semibold text-white">
                  <Star className="h-4 w-4 text-[rgb(var(--brand-300))]" />
                  Destaques
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {featured.map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => setProductModal(product)} />
                  ))}
                </div>
              </section>
            )}

            {/* Categorias */}
            {categories
              .filter((c) => !categoryFilter || c.id === categoryFilter)
              .map((category) => {
                const items = grouped.get(category.id) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={category.id} className="mb-8">
                    <h2 className="mb-3 font-display text-[16px] font-semibold text-white">{category.name}</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} onClick={() => setProductModal(product)} />
                      ))}
                    </div>
                  </section>
                );
              })}

            {/* Sem categoria */}
            {(!categoryFilter || categoryFilter === '__none') && (grouped.get(null) ?? []).length > 0 && (
              <section className="mb-8">
                {categories.length > 0 && <h2 className="mb-3 font-display text-[16px] font-semibold text-white">Outros</h2>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(grouped.get(null) ?? []).map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => setProductModal(product)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6">
          <Logo href="/" size="sm" />
          <p className="text-[11px] text-white/25">Catálogo online por NEXO</p>
        </footer>
      </main>

      {/* Barra flutuante do carrinho */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && !checkoutOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="safe-bottom fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:right-6"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-b from-[rgb(var(--brand-500))] to-[rgb(var(--brand-700))] px-5 py-4 shadow-glow sm:w-auto sm:min-w-[280px]"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <ShoppingBag className="h-4 w-4 text-white" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[rgb(var(--brand-700))]">
                  {cartCount}
                </span>
              </span>
              <span className="flex-1 text-left text-[14px] font-semibold text-white">Ver carrinho</span>
              <span className="font-display text-[15px] font-semibold text-white">{brl(cartSubtotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal
        product={productModal}
        onClose={() => setProductModal(null)}
        onAdd={addToCart}
        addLabel={terminology.catalogCta}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeLine}
        subtotal={cartSubtotal}
        deliveryFee={business.deliveryFee}
        minOrder={business.minOrder}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onBack={() => {
          setCheckoutOpen(false);
          setCartOpen(true);
        }}
        cart={cart}
        subtotal={cartSubtotal}
        business={business}
        onConfirmed={(result, whatsappUrl) => {
          setCheckoutOpen(false);
          setConfirmed({ number: result.number, total: result.total, whatsappUrl });
        }}
      />
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
        active
          ? 'border-[rgb(var(--brand-500)/0.45)] bg-[rgb(var(--brand-500)/0.18)] text-[rgb(var(--brand-100))]'
          : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-white/15 hover:text-white/85',
      )}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <button onClick={onClick} className="surface surface-hover overflow-hidden p-0 text-left">
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
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[rgb(var(--brand-500)/0.9)] px-2 py-1 text-[10px] font-semibold text-white">
            <Star className="h-2.5 w-2.5 fill-current" />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-[13px] font-medium text-white">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] text-white/40">{product.description}</p>
        )}
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
      </div>
    </button>
  );
}

function ProductModal({
  product,
  onClose,
  onAdd,
  addLabel = 'Adicionar',
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, 'key'>) => void;
  addLabel?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setQuantity(1);
    setSelectedAddons(new Set());
    setNotes('');
  }, [product?.id]);

  if (!product) return <Modal open={false} onClose={onClose}><span /></Modal>;

  const basePrice = product.promoPrice ?? product.price;
  const addonsTotal = product.addons
    .filter((a) => selectedAddons.has(a.name))
    .reduce((sum, a) => sum + a.price, 0);
  const lineTotal = (basePrice + addonsTotal) * quantity;

  const toggleAddon = (name: string) =>
    setSelectedAddons((set) => {
      const next = new Set(set);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      size="md"
      footer={
        <Button
          fullWidth
          size="lg"
          onClick={() =>
            onAdd({
              productId: product.id,
              name: product.name,
              unitPrice: basePrice,
              quantity,
              addons: product.addons.filter((a) => selectedAddons.has(a.name)),
              notes: notes.trim() || undefined,
            })
          }
        >
          {addLabel} · {brl(lineTotal)}
        </Button>
      }
    >
      <div className="-mx-5 -mt-5 mb-4 aspect-video w-[calc(100%+2.5rem)] overflow-hidden bg-white/[0.03]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-white/10" />
          </div>
        )}
      </div>

      <h2 className="font-display text-[19px] font-semibold text-white">{product.name}</h2>
      {product.description && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{product.description}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {product.promoPrice ? (
          <>
            <span className="font-display text-[18px] font-semibold text-[rgb(var(--brand-200))]">{brl(product.promoPrice)}</span>
            <span className="text-[13px] text-white/30 line-through">{brl(product.price)}</span>
          </>
        ) : (
          <span className="font-display text-[18px] font-semibold text-white">{brl(product.price)}</span>
        )}
      </div>

      {product.addons.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-white/35">Adicionais</p>
          <div className="space-y-2">
            {product.addons.map((addon) => (
              <label
                key={addon.name}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <Checkbox
                  checked={selectedAddons.has(addon.name)}
                  onChange={() => toggleAddon(addon.name)}
                  label={addon.name}
                />
                <span className="text-[13px] font-medium text-white/70">+ {brl(addon.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Textarea
        label="Alguma observação?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Opcional"
        rows={2}
        className="mt-5"
      />

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/60">Quantidade</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] text-white/70 transition hover:bg-white/[0.06]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center font-display text-[16px] font-semibold text-white">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] text-white/70 transition hover:bg-white/[0.06]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CartDrawer({
  open,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  subtotal,
  deliveryFee,
  minOrder,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  onUpdateQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  subtotal: number;
  deliveryFee: number;
  minOrder: number;
  onCheckout: () => void;
}) {
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Seu carrinho"
      footer={
        cart.length > 0 ? (
          <div className="w-full space-y-3">
            {belowMin && (
              <p className="text-center text-[12px] text-amber-300">
                Faltam {brl(minOrder - subtotal)} para o pedido mínimo de {brl(minOrder)}
              </p>
            )}
            <Button fullWidth size="lg" disabled={belowMin} onClick={onCheckout}>
              Finalizar pedido · {brl(subtotal)}
            </Button>
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Carrinho vazio" description="Adicione produtos para continuar." />
      ) : (
        <div className="space-y-3">
          {cart.map((line) => (
            <div key={line.key} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-white">{line.name}</p>
                {line.addons.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-white/35">+ {line.addons.map((a) => a.name).join(', ')}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(line.key, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] text-white/60 transition hover:bg-white/[0.06]"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-[13px] font-medium text-white">{line.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(line.key, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] text-white/60 transition hover:bg-white/[0.06]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-between">
                <button
                  onClick={() => onRemove(line.key)}
                  aria-label="Remover"
                  className="text-white/25 transition hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="text-[13.5px] font-semibold text-white">
                  {brl((line.unitPrice + line.addons.reduce((s, a) => s + a.price, 0)) * line.quantity)}
                </span>
              </div>
            </div>
          ))}

          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/85">{brl(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-white/50">Taxa de entrega</span>
                <span className="text-white/85">{brl(deliveryFee)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function CheckoutModal({
  open,
  onClose,
  onBack,
  cart,
  subtotal,
  business,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  cart: CartLine[];
  subtotal: number;
  business: Business;
  onConfirmed: (result: { number: number; total: number }, whatsappUrl: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryType, setDeliveryType] = useState<'entrega' | 'retirada'>('entrega');
  const { error } = useToast();

  const deliveryFee = deliveryType === 'entrega' ? business.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const submit = (formData: FormData) => {
    formData.set('slug', business.slug);
    formData.set('deliveryType', deliveryType);
    formData.set(
      'items',
      JSON.stringify(
        cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          addons: l.addons,
          notes: l.notes,
        })),
      ),
    );

    const customerName = String(formData.get('customerName') ?? '');
    const customerPhone = String(formData.get('customerPhone') ?? '');
    const address = String(formData.get('address') ?? '');
    const paymentMethod = String(formData.get('paymentMethod') ?? 'pix');
    const notes = String(formData.get('notes') ?? '');

    startTransition(async () => {
      const result = await createPublicOrder(formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) {
        setErrors({});
        return error('Não foi possível enviar', result.error);
      }

      if (result.order) {
        const message = cartMessage({
          businessName: business.name,
          customerName,
          phone: customerPhone,
          deliveryType,
          address: deliveryType === 'entrega' ? address : undefined,
          paymentMethod: paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'cartao' ? 'Cartão' : 'Dinheiro',
          notes: notes || undefined,
          items: cart.map((l) => ({
            name: l.name,
            quantity: l.quantity,
            total: (l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity,
            addons: l.addons,
            notes: l.notes,
          })),
          subtotal,
          deliveryFee,
          total,
          orderNumber: result.order.number,
        });

        onConfirmed(result.order, waLink(business.whatsapp, message));
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Finalizar pedido" description="Últimos dados para enviar seu pedido." size="md">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Voltar ao carrinho
      </button>

      <form action={submit} className="space-y-4">
        <Input label="Seu nome" name="customerName" placeholder="Nome completo" error={errors.customerName} required autoFocus />
        <Input
          label="Telefone (WhatsApp)"
          name="customerPhone"
          inputMode="tel"
          placeholder="(11) 98765-4321"
          error={errors.customerPhone}
          required
        />

        <div>
          <span className="label">Tipo de entrega</span>
          <div className="grid grid-cols-2 gap-2">
            {(['entrega', 'retirada'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={cn(
                  'h-11 rounded-xl border text-[13.5px] font-medium transition-all',
                  deliveryType === type
                    ? 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500)/0.16)] text-[rgb(var(--brand-100))]'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white/85',
                )}
              >
                {type === 'entrega' ? 'Entrega' : 'Retirada no local'}
              </button>
            ))}
          </div>
        </div>

        {deliveryType === 'entrega' && (
          <Input
            label="Endereço de entrega"
            name="address"
            placeholder="Rua, número, bairro"
            error={errors.address}
            required
          />
        )}

        <Select
          label="Forma de pagamento"
          name="paymentMethod"
          defaultValue="pix"
          options={[
            { value: 'pix', label: 'Pix' },
            { value: 'dinheiro', label: 'Dinheiro' },
            { value: 'cartao', label: 'Cartão' },
          ]}
        />

        <Textarea label="Observações" name="notes" placeholder="Opcional" rows={2} />

        <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white/85">{brl(subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-white/50">Taxa de entrega</span>
              <span className="text-white/85">{brl(deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-end justify-between pt-1">
            <span className="text-[13px] font-medium text-white/70">Total</span>
            <span className="font-display text-[19px] font-semibold text-white">{brl(total)}</span>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={pending}>
          Enviar pedido
        </Button>
      </form>
    </Modal>
  );
}
