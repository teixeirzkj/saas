import { LogoMark } from '@/components/shared/logo';
import { brl, formatDate, formatPhone } from '@/lib/utils';

export type QuoteDocumentData = {
  number: number;
  title: string;
  status: string;
  subtotal: number;
  discount: number;
  discountType: string;
  total: number;
  notes: string | null;
  validUntil: Date | null;
  createdAt: Date;
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    address: string | null;
  } | null;
  items: { id: string; description: string; quantity: number; unitPrice: number; total: number }[];
};

export type BusinessInfo = {
  name: string;
  logoUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  document?: string | null;
  instagram?: string | null;
};

/**
 * Documento do orçamento.
 * Usado na tela interna, na página pública e na impressão/PDF (classe print-plain).
 */
export function QuoteDocument({ quote, business }: { quote: QuoteDocumentData; business: BusinessInfo }) {
  const discountValue =
    quote.discountType === 'percent' ? (quote.subtotal * quote.discount) / 100 : quote.discount;

  const location = [business.city, business.state].filter(Boolean).join(' - ');

  return (
    <article className="print-plain surface overflow-hidden">
      {/* Cabeçalho */}
      <header className="print-plain flex flex-col gap-5 border-b border-white/[0.07] bg-gradient-to-br from-[rgb(var(--brand-900)/0.25)] to-transparent p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div className="flex items-start gap-3.5">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
            />
          ) : (
            <LogoMark className="h-12 w-12" />
          )}
          <div className="min-w-0">
            <h2 className="font-display text-[19px] font-semibold leading-tight text-white">{business.name}</h2>
            <div className="mt-1.5 space-y-0.5 text-[12px] leading-relaxed text-white/45">
              {business.address && <p>{business.address}</p>}
              {location && <p>{location}</p>}
              {(business.phone || business.whatsapp) && <p>{formatPhone(business.whatsapp ?? business.phone)}</p>}
              {business.email && <p>{business.email}</p>}
              {business.document && <p>CNPJ/CPF: {business.document}</p>}
            </div>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--brand-300))]">Orçamento</p>
          <p className="font-display text-[26px] font-semibold leading-none text-white">#{quote.number}</p>
          <p className="mt-2 text-[12px] text-white/45">Emitido em {formatDate(quote.createdAt)}</p>
          {quote.validUntil && (
            <p className="text-[12px] text-white/45">Válido até {formatDate(quote.validUntil)}</p>
          )}
        </div>
      </header>

      <div className="p-6 sm:p-8">
        {/* Cliente + título */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Para</p>
            {quote.customer ? (
              <div className="mt-2">
                <p className="text-[15px] font-semibold text-white">{quote.customer.name}</p>
                <div className="mt-1 space-y-0.5 text-[12px] text-white/45">
                  {quote.customer.company && <p>{quote.customer.company}</p>}
                  {quote.customer.phone && <p>{formatPhone(quote.customer.phone)}</p>}
                  {quote.customer.email && <p>{quote.customer.email}</p>}
                  {quote.customer.address && <p>{quote.customer.address}</p>}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-white/35">Cliente não informado</p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Referente a</p>
            <p className="mt-2 text-[15px] font-semibold text-white">{quote.title}</p>
          </div>
        </div>

        {/* Itens */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.09]">
                <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Descrição
                </th>
                <th className="w-20 pb-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Qtd.
                </th>
                <th className="w-32 pb-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Unitário
                </th>
                <th className="w-32 pb-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-[13.5px] text-white/85">{item.description}</td>
                  <td className="py-3 text-right text-[13px] text-white/60">
                    {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 text-right text-[13px] text-white/60">{brl(item.unitPrice)}</td>
                  <td className="py-3 text-right text-[13.5px] font-medium text-white">{brl(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/85">{brl(quote.subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-white/50">
                  Desconto
                  {quote.discountType === 'percent' ? ` (${quote.discount}%)` : ''}
                </span>
                <span className="text-emerald-300">- {brl(discountValue)}</span>
              </div>
            )}
            <div className="h-px bg-white/[0.09]" />
            <div className="flex items-end justify-between">
              <span className="text-[13px] font-medium text-white/70">Total</span>
              <span className="font-display text-[24px] font-semibold leading-none text-white">
                {brl(quote.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {quote.notes && (
          <div className="mt-8 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Observações</p>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-white/70">{quote.notes}</p>
          </div>
        )}

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {business.name}
            {business.instagram ? ` · ${business.instagram}` : ''}
          </p>
          <p>Orçamento gerado pelo NEXO</p>
        </footer>
      </div>
    </article>
  );
}
