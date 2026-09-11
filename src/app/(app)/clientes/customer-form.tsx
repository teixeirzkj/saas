'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { CUSTOMER_STATUS, SOURCES } from '@/lib/constants';

import { createCustomer, updateCustomer } from './actions';

export type CustomerFormValues = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
  source?: string | null;
  status?: string | null;
};

export function CustomerFormModal({
  open,
  onClose,
  customer,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customer?: CustomerFormValues;
  onSaved?: (id: string) => void;
}) {
  const editing = Boolean(customer?.id);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success, error } = useToast();
  const router = useRouter();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar cliente' : 'Novo cliente'}
      description={
        editing
          ? 'As alterações aparecem em todos os módulos.'
          : 'Este cadastro é usado em orçamentos, agenda, pedidos e CRM.'
      }
      size="lg"
    >
      <form
        action={(formData) =>
          startTransition(async () => {
            const result = editing ? await updateCustomer({}, formData) : await createCustomer({}, formData);

            if (result.errors) return setErrors(result.errors);
            if (result.error) return error('Não foi possível salvar', result.error);

            setErrors({});
            success(editing ? 'Cliente atualizado' : 'Cliente cadastrado');
            router.refresh();
            if (result.id) onSaved?.(result.id);
            onClose();
          })
        }
        className="space-y-4"
      >
        {editing && <input type="hidden" name="id" value={customer!.id} />}

        <Input
          label="Nome"
          name="name"
          defaultValue={customer?.name ?? ''}
          placeholder="Nome completo do cliente"
          error={errors.name}
          required
          autoFocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Telefone / WhatsApp"
            name="phone"
            defaultValue={customer?.phone ?? ''}
            placeholder="(11) 98765-4321"
            inputMode="tel"
            hint="Usado nos botões de WhatsApp"
            error={errors.phone}
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ''}
            placeholder="cliente@email.com"
            error={errors.email}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Empresa"
            name="company"
            defaultValue={customer?.company ?? ''}
            placeholder="Opcional"
            error={errors.company}
          />
          <Input
            label="CPF / CNPJ"
            name="document"
            defaultValue={customer?.document ?? ''}
            placeholder="Opcional"
            error={errors.document}
          />
        </div>

        <Input
          label="Endereço"
          name="address"
          defaultValue={customer?.address ?? ''}
          placeholder="Rua, número, bairro, cidade"
          error={errors.address}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Origem"
            name="source"
            defaultValue={customer?.source ?? ''}
            placeholder="Como chegou até você?"
            options={SOURCES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <Select
            label="Situação"
            name="status"
            defaultValue={customer?.status ?? 'ativo'}
            options={Object.entries(CUSTOMER_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
        </div>

        <Textarea
          label="Observações"
          name="notes"
          defaultValue={customer?.notes ?? ''}
          placeholder="Preferências, histórico, detalhes importantes..."
          rows={3}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
