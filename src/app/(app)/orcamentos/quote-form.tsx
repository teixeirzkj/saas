'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GripVertical, Plus, Save, Send, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { CustomerFormModal } from '@/app/(app)/clientes/customer-form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, MoneyInput, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { brl, cn, isoDate } from '@/lib/utils';

import { createQuote, updateQuote } from './actions';

type Item = { key: string; description: string; quantity: string; unitPrice: string };

export type QuoteFormData = {
  id?: string;
  title?: string;
  customerId?: string | null;
  status?: string;
  discount?: number;
  discountType?: string;
  notes?: string | null;
  validUntil?: Date | null;
  items?: { description: string; quantity: number; unitPrice: number }[];
};

let keyCounter = 0;
const newKey = () => `item-${++keyCounter}-${Date.now()}`;

function parseMoney(value: string) {
  if (!value) return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function QuoteForm({
  customers,
  quote,
  defaultValidDays,
  presetCustomerId,
}: {
  customers: { id: string; name: string }[];
  quote?: QuoteFormData;
  defaultValidDays: number;
  presetCustomerId?: string;
}) {
  const editing = Boolean(quote?.id);
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerModal, setCustomerModal] = useState(false);
  const [customerId, setCustomerId] = useState(quote?.customerId ?? presetCustomerId ?? '');

  const [items, setItems] = useState<Item[]>(
    quote?.items?.length
      ? quote.items.map((item) => ({
          key: newKey(),
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: item.unitPrice.toFixed(2).replace('.', ','),
        }))
      : [{ key: newKey(), description: '', quantity: '1', unitPrice: '' }],
  );

  const [discount, setDiscount] = useState(
    quote?.discount ? String(quote.discount).replace('.', ',') : '',
  );
  const [discountType, setDiscountType] = useState(quote?.discountType ?? 'value');

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + parseMoney(item.quantity) * parseMoney(item.unitPrice),
      0,
    );
    const d = parseMoney(discount);
    const discountValue = discountType === 'percent' ? (subtotal * d) / 100 : d;
    return { subtotal, discountValue, total: Math.max(0, subtotal - discountValue) };
  }, [items, discount, discountType]);

  const updateItem = (key: string, patch: Partial<Item>) =>
    setItems((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const addItem = () =>
    setItems((list) => [...list, { key: newKey(), description: '', quantity: '1', unitPrice: '' }]);

  const removeItem = (key: string) =>
    setItems((list) => (list.length === 1 ? list : list.filter((item) => item.key !== key)));

  const defaultValidUntil = quote?.validUntil
    ? isoDate(new Date(quote.validUntil))
    : isoDate(new Date(Date.now() + defaultValidDays * 86400000));

  const submit = (status: 'rascunho' | 'enviado') => (formData: FormData) => {
    formData.set('status', status);
    formData.set('customerId', customerId);
    formData.set('discount', discount);
    formData.set('discountType', discountType);
    formData.set('itemCount', String(items.length));

    items.forEach((item, i) => {
      formData.set(`item-${i}-description`, item.description);
      formData.set(`item-${i}-quantity`, item.quantity);
      formData.set(`item-${i}-unitPrice`, item.unitPrice);
    });

    startTransition(async () => {
      const result = editing ? await updateQuote({}, formData) : await createQuote({}, formData);

      if (result.errors) {
        setErrors(result.errors);
        error('Verifique os campos', Object.values(result.errors)[0]);
        return;
      }
      if (result.error) return error('Não foi possível salvar', result.error);

      setErrors({});
      success(
        editing ? 'Orçamento atualizado' : status === 'enviado' ? 'Orçamento criado e marcado como enviado' : 'Orçamento salvo como rascunho',
      );
      router.push(`/orcamentos/${result.id ?? quote?.id}`);
    });
  };

  return (
    <>
      <Link
        href={editing ? `/orcamentos/${quote!.id}` : '/orcamentos'}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {editing ? 'Voltar ao orçamento' : 'Todos os orçamentos'}
      </Link>

      <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
        {editing ? 'Editar orçamento' : 'Novo orçamento'}
      </h1>
      <p className="mt-1.5 text-sm text-white/45">
        Preencha os itens — o total é calculado automaticamente enquanto você digita.
      </p>

      <form id="quote-form" className="mt-6 grid gap-4 lg:grid-cols-3">
        {editing && <input type="hidden" name="id" value={quote!.id} />}

        {/* Coluna principal */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Informações" />
            <div className="space-y-4">
              <Input
                label="Título do orçamento"
                name="title"
                defaultValue={quote?.title ?? ''}
                placeholder="Ex.: Pacote de manutenção mensal"
                error={errors.title}
                required
                autoFocus={!editing}
              />

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="quote-customer" className="text-[13px] font-medium text-white/70">
                    Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomerModal(true)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))]"
                  >
                    <UserPlus className="h-3 w-3" />
                    Cadastrar novo
                  </button>
                </div>
                <Select
                  id="quote-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Selecione um cliente (opcional)"
                  options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  hint="Escolher o cliente libera o envio direto pelo WhatsApp."
                />
              </div>
            </div>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader
              title="Itens do orçamento"
              description="Produtos ou serviços que compõem o valor"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar item
                </Button>
              }
            />

            {errors.items && <p className="mb-3 text-xs text-red-300">{errors.items}</p>}

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item, index) => {
                  const lineTotal = parseMoney(item.quantity) * parseMoney(item.unitPrice);
                  return (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                          <GripVertical className="h-3 w-3" />
                          Item {index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Remover item ${index + 1}`}
                            className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/12 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <Input
                        label="Descrição"
                        value={item.description}
                        onChange={(e) => updateItem(item.key, { description: e.target.value })}
                        placeholder="Ex.: Corte e finalização"
                      />

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Input
                          label="Quantidade"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                          inputMode="decimal"
                          placeholder="1"
                        />
                        <MoneyInput
                          label="Preço unitário"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                          placeholder="0,00"
                        />
                        <div className="col-span-2 flex flex-col justify-end sm:col-span-1">
                          <span className="label">Subtotal</span>
                          <div className="flex h-11 items-center rounded-xl border border-white/[0.05] bg-ink-950/40 px-3.5">
                            <span className="font-display text-[14px] font-semibold text-[rgb(var(--brand-200))]">
                              {brl(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-3 text-[13px] font-medium text-white/40 transition-all hover:border-[rgb(var(--brand-500)/0.35)] hover:bg-[rgb(var(--brand-500))]/[0.05] hover:text-[rgb(var(--brand-200))]"
            >
              <Plus className="h-4 w-4" />
              Adicionar outro item
            </button>
          </Card>

          <Card>
            <CardHeader title="Observações e validade" />
            <div className="space-y-4">
              <Textarea
                label="Observações"
                name="notes"
                defaultValue={quote?.notes ?? ''}
                placeholder="Condições de pagamento, prazo de execução, o que está incluído..."
                rows={4}
              />
              <Input
                label="Válido até"
                name="validUntil"
                type="date"
                defaultValue={defaultValidUntil}
                hint="Depois dessa data o orçamento aparece como vencido."
              />
            </div>
          </Card>
        </div>

        {/* Resumo fixo */}
        <div className="lg:sticky lg:top-[88px] lg:self-start">
          <Card>
            <CardHeader title="Resumo" />

            <div className="space-y-3">
              <Row label="Subtotal" value={brl(totals.subtotal)} />

              <div>
                <span className="label">Desconto</span>
                <div className="flex gap-2">
                  <input
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-ink-850/60 px-3.5 text-sm text-white placeholder:text-white/30 focus:border-[rgb(var(--brand-400)/0.6)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--brand-500)/0.12)]"
                  />
                  <div className="flex shrink-0 overflow-hidden rounded-xl border border-white/[0.09]">
                    {(['value', 'percent'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDiscountType(type)}
                        className={cn(
                          'px-3.5 text-[13px] font-semibold transition-colors',
                          discountType === type ? 'bg-[rgb(var(--brand-500)/0.2)] text-[rgb(var(--brand-100))]' : 'text-white/40 hover:text-white/70',
                        )}
                      >
                        {type === 'value' ? 'R$' : '%'}
                      </button>
                    ))}
                  </div>
                </div>
                {totals.discountValue > 0 && (
                  <p className="hint">Desconto de {brl(totals.discountValue)} aplicado.</p>
                )}
              </div>

              <div className="divider" />

              <div className="flex items-end justify-between">
                <span className="text-[13px] font-medium text-white/55">Total</span>
                <span className="font-display text-[24px] font-semibold leading-none text-white">
                  {brl(totals.total)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={pending}
                formAction={submit('enviado')}
              >
                <Send className="h-4 w-4" />
                {editing ? 'Salvar e marcar enviado' : 'Criar e marcar enviado'}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                loading={pending}
                formAction={submit('rascunho')}
              >
                <Save className="h-4 w-4" />
                Salvar como rascunho
              </Button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-white/30">
              Depois de salvar você poderá gerar o PDF e enviar pelo WhatsApp.
            </p>
          </Card>
        </div>
      </form>

      <CustomerFormModal
        open={customerModal}
        onClose={() => setCustomerModal(false)}
        onSaved={(id) => {
          setCustomerId(id);
          setCustomerModal(false);
          router.refresh();
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-white/50">{label}</span>
      <span className="text-[14px] font-medium text-white">{value}</span>
    </div>
  );
}
