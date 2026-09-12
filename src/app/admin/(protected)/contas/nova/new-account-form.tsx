'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { SEGMENTS } from '@/lib/constants';
import { PLANS } from '@/lib/plans';
import { isoDate } from '@/lib/utils';

import { createBusinessAccount } from '@/app/admin/actions';

export function NewAccountForm() {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ email: string; password: string; slug: string } | null>(null);

  const defaultDueDate = isoDate(new Date(Date.now() + 30 * 86400000));

  const submit = (formData: FormData) => {
    const email = String(formData.get('ownerEmail') ?? '');

    startTransition(async () => {
      const result = await createBusinessAccount({}, formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível criar', result.error);

      setErrors({});
      if (result.generatedPassword) {
        setCreated({ email, password: result.generatedPassword, slug: '' });
      }
      success('Conta criada com sucesso');
      router.refresh();
    });
  };

  if (created) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader title="Conta criada!" description="Envie esses dados de acesso para o cliente." />
          <div className="space-y-3">
            <CredentialRow label="E-mail" value={created.email} />
            <CredentialRow label="Senha provisória" value={created.password} />
            <p className="text-[12px] text-white/40">
              Recomende que o cliente troque a senha em Configurações → Perfil assim que entrar.
            </p>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setCreated(null)}>
              Criar outra conta
            </Button>
            <Button onClick={() => router.push('/admin')}>Voltar para contas</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todas as contas
      </Link>

      <Card>
        <CardHeader title="Nova conta" description="Crie o acesso do cliente manualmente — a senha é gerada automaticamente." />

        <form action={submit} className="space-y-4">
          <Input label="Nome do negócio" name="businessName" error={errors.businessName} required autoFocus />

          <Select
            label="Segmento"
            name="segment"
            defaultValue="outro"
            options={SEGMENTS.map((s) => ({ value: s.value, label: `${s.emoji} ${s.label}` }))}
          />

          <div className="divider" />

          <Input label="Nome do responsável" name="ownerName" error={errors.ownerName} required />
          <Input label="E-mail do responsável" name="ownerEmail" type="email" error={errors.ownerEmail} required />

          <div className="divider" />

          <Select
            label="Plano"
            name="planCode"
            defaultValue="free"
            options={PLANS.map((p) => ({ value: p.code, label: `${p.name} — R$ ${(p.priceCents / 100).toFixed(2).replace('.', ',')}/mês` }))}
          />

          <Input
            label="Vencimento da próxima cobrança"
            name="dueDate"
            type="date"
            defaultValue={defaultDueDate}
            error={errors.dueDate}
            required
          />

          <Button type="submit" size="lg" fullWidth loading={pending}>
            Criar conta
          </Button>
        </form>
      </Card>
    </div>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-white/35">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[14px] text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          success('Copiado');
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.07] hover:text-white"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
