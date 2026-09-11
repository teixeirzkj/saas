'use client';

import { useRouter } from 'next/navigation';
import { Building2, Check, Palette, RotateCcw, Save } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input, MoneyInput, Switch, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { BRAND_SWATCHES, SEGMENTS, WEEKDAYS } from '@/lib/constants';
import { cn, slugify } from '@/lib/utils';

import { updateBusiness, uploadBusinessLogo } from './actions';

type BusinessData = {
  name: string;
  segment: string;
  slug: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  document: string | null;
  about: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  catalogHeadline: string | null;
  deliveryFee: number;
  minOrder: number;
  quoteValidDays: number;
  bookingEnabled: boolean;
  catalogEnabled: boolean;
  bookingSlotMin: number;
  workdayStart: string;
  workdayEnd: string;
  workdays: number[];
};

export function BusinessForm({ business }: { business: BusinessData }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState(business.logoUrl ?? '');
  const [slug, setSlug] = useState(business.slug);
  const [segment, setSegment] = useState(business.segment);
  const [brandColor, setBrandColor] = useState(business.brandColor ?? '');
  const [bookingEnabled, setBookingEnabled] = useState(business.bookingEnabled);
  const [catalogEnabled, setCatalogEnabled] = useState(business.catalogEnabled);
  const [workdays, setWorkdays] = useState<Set<number>>(new Set(business.workdays));

  const segmentChanged = segment !== business.segment;

  const submit = (formData: FormData) => {
    formData.set('logoUrl', logoUrl);
    formData.set('slug', slug);
    formData.set('segment', segment);
    formData.set('brandColor', brandColor);
    formData.set('bookingEnabled', bookingEnabled ? 'true' : 'false');
    formData.set('catalogEnabled', catalogEnabled ? 'true' : 'false');
    formData.delete('workdays');
    workdays.forEach((d) => formData.append('workdays', String(d)));

    startTransition(async () => {
      const result = await updateBusiness({}, formData);
      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);
      setErrors({});
      success('Empresa atualizada');
      router.refresh();
    });
  };

  const toggleWorkday = (day: number) =>
    setWorkdays((set) => {
      const next = new Set(set);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  return (
    <>
      <PageHeader title="Minha empresa" description="Essas informações aparecem nas suas páginas públicas e documentos." />

      <form action={submit} className="space-y-4">
        <Card>
          <CardHeader title="Identidade" icon={<Building2 className="h-4 w-4" />} />
          <div className="space-y-4">
            <ImageUpload
              label="Logo"
              value={logoUrl}
              onChange={setLogoUrl}
              action={uploadBusinessLogo}
              folder="logo"
              hint="Aparece nas suas páginas públicas, no orçamento em PDF e no painel."
            />

            <Input
              label="Nome do negócio"
              name="name"
              defaultValue={business.name}
              error={errors.name}
              required
              onChange={(e) => {
                if (slug === slugify(business.name)) setSlug(slugify(e.target.value));
              }}
            />

            <Input
              label="Link das suas páginas públicas"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              hint={`nexo.app/catalogo/${slug || 'seu-negocio'} · nexo.app/agendar/${slug || 'seu-negocio'}`}
              error={errors.slug}
            />

            <Textarea label="Sobre o negócio" name="about" defaultValue={business.about ?? ''} rows={3} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Aparência"
            description="A NEXO adapta cores, ícones e a organização do painel ao seu tipo de negócio."
            icon={<Palette className="h-4 w-4" />}
          />
          <div className="space-y-5">
            <div>
              <span className="label">Segmento do negócio</span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SEGMENTS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSegment(option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-2.5 text-left text-[12.5px] font-medium transition-all',
                      segment === option.value
                        ? 'border-white/25 bg-white/[0.06] text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/15 hover:text-white/80',
                    )}
                    style={segment === option.value ? { borderColor: `${option.preview}80` } : undefined}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px]"
                      style={{ background: `${option.preview}22` }}
                    >
                      {option.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              {segmentChanged && (
                <p className="mt-2.5 text-[12px] text-[rgb(var(--brand-300))]">
                  Ao salvar, o painel e suas páginas públicas vão usar o tema de{' '}
                  {SEGMENTS.find((s) => s.value === segment)?.label}. Nenhum dado é perdido.
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Cor de destaque</span>
                {brandColor && (
                  <button
                    type="button"
                    onClick={() => setBrandColor('')}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-white/40 transition hover:text-white/70"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Usar cor padrão do segmento
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {BRAND_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setBrandColor(swatch)}
                    aria-label={`Usar cor ${swatch}`}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                      brandColor.toLowerCase() === swatch.toLowerCase()
                        ? 'scale-110 border-white'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ background: swatch }}
                  >
                    {brandColor.toLowerCase() === swatch.toLowerCase() && (
                      <Check className="h-4 w-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <p className="hint">
                {brandColor
                  ? 'Sua cor personalizada substitui o destaque padrão do segmento em todo o painel e nas páginas públicas.'
                  : `Sem sobrescrever, o painel usa a cor padrão do tema de ${SEGMENTS.find((s) => s.value === segment)?.label}.`}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Contato" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Telefone" name="phone" defaultValue={business.phone ?? ''} placeholder="(11) 3000-0000" />
            <Input label="WhatsApp" name="whatsapp" defaultValue={business.whatsapp ?? ''} placeholder="(11) 98765-4321" />
            <Input label="Instagram" name="instagram" defaultValue={business.instagram ?? ''} placeholder="@seunegocio" />
            <Input label="E-mail" name="email" type="email" defaultValue={business.email ?? ''} />
            <Input label="Endereço" name="address" defaultValue={business.address ?? ''} className="sm:col-span-2" />
            <Input label="Cidade" name="city" defaultValue={business.city ?? ''} />
            <Input label="Estado" name="state" defaultValue={business.state ?? ''} placeholder="SP" />
            <Input label="CNPJ / CPF" name="document" defaultValue={business.document ?? ''} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Orçamentos" />
          <Input
            label="Validade padrão (dias)"
            name="quoteValidDays"
            type="number"
            min={1}
            max={90}
            defaultValue={business.quoteValidDays}
            hint="Prazo padrão de validade de novos orçamentos"
            className="max-w-xs"
          />
        </Card>

        <Card>
          <CardHeader title="Agenda" description="Configurações da sua página pública de agendamento" />
          <div className="space-y-4">
            <Switch checked={bookingEnabled} onChange={setBookingEnabled} label="Página de agendamento ativa" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Início do expediente" name="workdayStart" type="time" defaultValue={business.workdayStart} />
              <Input label="Fim do expediente" name="workdayEnd" type="time" defaultValue={business.workdayEnd} />
              <Input
                label="Intervalo dos horários (min)"
                name="bookingSlotMin"
                type="number"
                min={10}
                step={5}
                defaultValue={business.bookingSlotMin}
              />
            </div>

            <div>
              <span className="label">Dias de atendimento</span>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkday(i)}
                    className={cn(
                      'h-10 w-12 rounded-xl border text-[13px] font-medium transition-all',
                      workdays.has(i)
                        ? 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500)/0.16)] text-[rgb(var(--brand-100))]'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/40',
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Catálogo" description="Configurações da sua página pública de vendas" />
          <div className="space-y-4">
            <Switch checked={catalogEnabled} onChange={setCatalogEnabled} label="Página de catálogo ativa" />
            <Input
              label="Frase de destaque"
              name="catalogHeadline"
              defaultValue={business.catalogHeadline ?? ''}
              placeholder="Ex.: Produtos escolhidos pela nossa equipe"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput
                label="Taxa de entrega"
                name="deliveryFee"
                defaultValue={String(business.deliveryFee).replace('.', ',')}
              />
              <MoneyInput
                label="Pedido mínimo"
                name="minOrder"
                defaultValue={String(business.minOrder).replace('.', ',')}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={pending} size="lg">
            <Save className="h-4 w-4" />
            Salvar alterações
          </Button>
        </div>
      </form>
    </>
  );
}
