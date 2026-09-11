'use client';

import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input, MoneyInput, Select, Switch, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

import { createProduct, updateProduct, uploadProductImage } from './actions';
import type { Category, Product } from './catalog-view';

type Addon = { key: string; name: string; price: string };

let keyCounter = 0;
const newKey = () => `addon-${++keyCounter}-${Date.now()}`;

export function ProductFormModal({
  open,
  onClose,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product;
  categories: Category[];
}) {
  const editing = Boolean(product?.id);
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [addons, setAddons] = useState<Addon[]>(
    product?.addons.map((a) => ({ key: newKey(), name: a.name, price: String(a.price).replace('.', ',') })) ?? [],
  );

  useEffect(() => {
    if (!open) return;
    setImageUrl(product?.imageUrl ?? '');
    setAvailable(product?.available ?? true);
    setFeatured(product?.featured ?? false);
    setAddons(
      product?.addons.map((a) => ({ key: newKey(), name: a.name, price: String(a.price).replace('.', ',') })) ?? [],
    );
    setErrors({});
  }, [open, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addAddon = () => setAddons((list) => [...list, { key: newKey(), name: '', price: '' }]);
  const updateAddon = (key: string, patch: Partial<Addon>) =>
    setAddons((list) => list.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  const removeAddon = (key: string) => setAddons((list) => list.filter((a) => a.key !== key));

  const submit = (formData: FormData) => {
    formData.set('imageUrl', imageUrl);
    formData.set('available', available ? 'true' : 'false');
    formData.set('featured', featured ? 'true' : 'false');
    formData.set('addonCount', String(addons.length));
    addons.forEach((addon, i) => {
      formData.set(`addon-${i}-name`, addon.name);
      formData.set(`addon-${i}-price`, addon.price);
    });

    startTransition(async () => {
      const result = editing ? await updateProduct({}, formData) : await createProduct({}, formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);

      setErrors({});
      success(editing ? 'Produto atualizado' : 'Produto cadastrado');
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar produto' : 'Novo produto'}
      description="Preencha os dados que aparecem na sua página pública de catálogo."
      size="lg"
    >
      <form action={submit} className="space-y-4">
        {editing && <input type="hidden" name="id" value={product!.id} />}

        <ImageUpload
          label="Foto do produto"
          value={imageUrl}
          onChange={setImageUrl}
          action={uploadProductImage}
          folder="products"
        />

        <Input
          label="Nome do produto"
          name="name"
          defaultValue={product?.name ?? ''}
          placeholder="Ex.: Kit Hidratação Intensa"
          error={errors.name}
          required
          autoFocus={!editing}
        />

        <Textarea
          label="Descrição"
          name="description"
          defaultValue={product?.description ?? ''}
          placeholder="O que o cliente recebe, ingredientes, diferenciais..."
          rows={3}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <MoneyInput
            label="Preço"
            name="price"
            defaultValue={product ? String(product.price).replace('.', ',') : ''}
            placeholder="0,00"
            error={errors.price}
            required
          />
          <MoneyInput
            label="Preço promocional"
            name="promoPrice"
            defaultValue={product?.promoPrice ? String(product.promoPrice).replace('.', ',') : ''}
            placeholder="Opcional"
          />
          <Select
            label="Categoria"
            name="categoryId"
            defaultValue={product?.categoryId ?? ''}
            placeholder="Sem categoria"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        {/* Adicionais */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Adicionais (opcional)</span>
            <button
              type="button"
              onClick={addAddon}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))]"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </button>
          </div>

          {addons.length === 0 ? (
            <p className="text-xs text-white/30">
              Ex.: &ldquo;Queijo extra&rdquo;, &ldquo;Entrega expressa&rdquo;. O cliente escolhe na página pública.
            </p>
          ) : (
            <div className="space-y-2">
              {addons.map((addon) => (
                <div key={addon.key} className="flex gap-2">
                  <Input
                    value={addon.name}
                    onChange={(e) => updateAddon(addon.key, { name: e.target.value })}
                    placeholder="Nome do adicional"
                    className="flex-1"
                  />
                  <MoneyInput
                    value={addon.price}
                    onChange={(e) => updateAddon(addon.key, { price: e.target.value })}
                    placeholder="0,00"
                    className="w-32"
                  />
                  <button
                    type="button"
                    onClick={() => removeAddon(addon.key)}
                    aria-label="Remover adicional"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/30 transition hover:bg-red-500/12 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:grid-cols-2">
          <Switch checked={available} onChange={setAvailable} label="Disponível" description="Aparece no catálogo" />
          <Switch checked={featured} onChange={setFeatured} label="Destaque" description="Aparece em primeiro lugar" />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
