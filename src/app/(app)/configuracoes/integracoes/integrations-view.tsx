'use client';

import { useRouter } from 'next/navigation';
import { CreditCard, Instagram, MessageCircle, Save } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Switch, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

import { toggleIntegration, updateMessageTemplate } from '../actions';

type Integration = { provider: string; status: string; connectedAt: Date | null };
type Template = { key: string; title: string; body: string };

const PROVIDER_META: Record<string, { label: string; icon: typeof MessageCircle; description: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'Usado nos botões de envio em todo o sistema (via wa.me, sem necessidade de token).',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    description: 'Exibe seu @ nas páginas públicas e no dashboard.',
  },
  payment: {
    label: 'Pagamento',
    icon: CreditCard,
    description: 'Gateway usado no checkout de planos pagos.',
  },
};

export function IntegrationsView({ integrations, templates }: { integrations: Integration[]; templates: Template[] }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <PageHeader title="Integrações" description="Conecte as ferramentas que seu negócio já usa." />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Canais" />
          <div className="space-y-3">
            {(['whatsapp', 'instagram', 'payment'] as const).map((provider) => {
              const meta = PROVIDER_META[provider];
              const integration = integrations.find((i) => i.provider === provider);
              const connected = integration?.status === 'connected';
              const Icon = meta.icon;

              return (
                <div
                  key={provider}
                  className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-medium text-white">{meta.label}</p>
                      <Badge tone={connected ? 'success' : 'neutral'}>{connected ? 'Conectado' : 'Desconectado'}</Badge>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/40">{meta.description}</p>
                    {integration?.connectedAt && connected && (
                      <p className="mt-0.5 text-[10.5px] text-white/25">Desde {formatDate(integration.connectedAt)}</p>
                    )}
                  </div>
                  <Switch
                    checked={connected}
                    onChange={() =>
                      startTransition(async () => {
                        const result = await toggleIntegration(provider);
                        if (result.error) return error('Não foi possível atualizar', result.error);
                        success(connected ? `${meta.label} desconectado` : `${meta.label} conectado`);
                        router.refresh();
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Modelos de mensagem"
            description="Editáveis a qualquer momento — usados como ponto de partida nos botões de WhatsApp."
          />
          <div className="space-y-4">
            {templates.map((template) => (
              <TemplateEditor key={template.key} template={template} />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function TemplateEditor({ template }: { template: Template }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState(template.body);
  const dirty = body !== template.body;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-medium text-white">{template.title}</p>
        {dirty && (
          <Button
            size="sm"
            variant="subtle"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await updateMessageTemplate(template.key, body);
                if (result.error) return error('Não foi possível salvar', result.error);
                success('Modelo atualizado');
                router.refresh();
              })
            }
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>
        )}
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} className="text-[13px]" />
      <p className="mt-1.5 text-[11px] text-white/25">
        Use {'{cliente}'}, {'{link}'}, {'{data}'}, {'{hora}'}, {'{numero}'}, {'{total}'} conforme o tipo de mensagem.
      </p>
    </div>
  );
}
