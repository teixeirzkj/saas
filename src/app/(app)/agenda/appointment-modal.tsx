'use client';

import { useRouter } from 'next/navigation';
import { Check, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { CustomerFormModal } from '@/app/(app)/clientes/customer-form';
import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { APPOINTMENT_STATUS } from '@/lib/constants';
import { brl, isoDate } from '@/lib/utils';
import { appointmentMessage } from '@/lib/whatsapp';

import { createAppointment, deleteAppointment, setAppointmentStatus, updateAppointment } from './actions';
import type { Appointment, Service } from './agenda-view';

export function AppointmentModal({
  open,
  onClose,
  appointment,
  defaultDate,
  services,
  customers,
  presetCustomerId,
  businessName,
  template,
}: {
  open: boolean;
  onClose: () => void;
  appointment?: Appointment;
  defaultDate?: Date;
  services: Service[];
  customers: { id: string; name: string; phone: string | null }[];
  presetCustomerId?: string;
  businessName: string;
  template: string | null;
}) {
  const editing = Boolean(appointment);
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerModal, setCustomerModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [customerId, setCustomerId] = useState(appointment?.customerId ?? presetCustomerId ?? '');
  const [serviceId, setServiceId] = useState(appointment?.serviceId ?? services.find((s) => s.active)?.id ?? '');
  const [title, setTitle] = useState(appointment?.title ?? '');

  useEffect(() => {
    if (!open) return;
    setCustomerId(appointment?.customerId ?? presetCustomerId ?? '');
    setServiceId(appointment?.serviceId ?? services.find((s) => s.active)?.id ?? '');
    setTitle(appointment?.title ?? '');
    setErrors({});
  }, [open, appointment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Título automático: "Serviço - Nome" (o usuário pode sobrescrever)
  const autoTitle =
    selectedService && selectedCustomer
      ? `${selectedService.name} - ${selectedCustomer.name.split(' ')[0]}`
      : selectedService?.name ?? '';

  const dateValue = appointment
    ? isoDate(new Date(appointment.startsAt))
    : isoDate(defaultDate ?? new Date());

  const timeValue = appointment
    ? new Date(appointment.startsAt).toTimeString().slice(0, 5)
    : '09:00';

  const submit = (formData: FormData) => {
    formData.set('customerId', customerId);
    formData.set('serviceId', serviceId);
    if (!String(formData.get('title') ?? '').trim()) {
      formData.set('title', autoTitle || 'Compromisso');
    }

    startTransition(async () => {
      const result = editing ? await updateAppointment({}, formData) : await createAppointment({}, formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);

      setErrors({});
      success(editing ? 'Compromisso atualizado' : 'Compromisso criado');
      router.refresh();
      onClose();
    });
  };

  const changeStatus = (status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou') =>
    startTransition(async () => {
      if (!appointment) return;
      const result = await setAppointmentStatus(appointment.id, status);
      if (result.error) return error('Não foi possível atualizar', result.error);
      success(`Marcado como ${APPOINTMENT_STATUS[status].label.toLowerCase()}`);
      router.refresh();
      onClose();
    });

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? 'Editar compromisso' : 'Novo compromisso'}
        description={
          editing
            ? 'Atualize os dados ou mude a situação do atendimento.'
            : 'A duração vem do serviço escolhido — não precisa calcular nada.'
        }
        size="lg"
      >
        <form action={submit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={appointment!.id} />}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="appt-customer" className="text-[13px] font-medium text-white/70">
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
              id="appt-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Selecione o cliente (opcional)"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <Select
            label="Serviço"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="Selecione um serviço"
            options={services
              .filter((s) => s.active || s.id === serviceId)
              .map((s) => ({
                value: s.id,
                label: `${s.name} · ${s.durationMin} min · ${brl(s.price)}`,
              }))}
            hint={
              selectedService
                ? `Duração de ${selectedService.durationMin} minutos, valor ${brl(selectedService.price)}.`
                : 'Cadastre serviços para preencher a duração automaticamente.'
            }
          />

          <Input
            label="Título do compromisso"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoTitle || 'Ex.: Reunião com fornecedor'}
            hint="Deixe em branco para usar o serviço e o nome do cliente."
            error={errors.title}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Data" name="date" type="date" defaultValue={dateValue} error={errors.date} required />
            <Input label="Horário" name="time" type="time" defaultValue={timeValue} error={errors.time} required />
            <Input
              label="Duração (min)"
              name="durationMin"
              type="number"
              min={5}
              step={5}
              defaultValue={selectedService?.durationMin ?? 30}
              hint={selectedService ? 'Definida pelo serviço' : undefined}
              disabled={Boolean(selectedService)}
            />
          </div>

          <Select
            label="Situação"
            name="status"
            defaultValue={appointment?.status ?? 'agendado'}
            options={Object.entries(APPOINTMENT_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />

          <Textarea
            label="Observações"
            name="notes"
            defaultValue={appointment?.notes ?? ''}
            placeholder="Preferências do cliente, o que preparar antes..."
            rows={3}
          />

          {/* Ações rápidas de status na edição */}
          {editing && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <p className="mb-2.5 text-[12px] font-medium text-white/60">Ações rápidas</p>
              <div className="flex flex-wrap gap-2">
                {appointment!.status !== 'confirmado' && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => changeStatus('confirmado')}>
                    Confirmar
                  </Button>
                )}
                {appointment!.status !== 'concluido' && (
                  <Button type="button" variant="success" size="sm" onClick={() => changeStatus('concluido')}>
                    <Check className="h-3.5 w-3.5" />
                    Concluído
                  </Button>
                )}
                {appointment!.status !== 'faltou' && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => changeStatus('faltou')}>
                    Não compareceu
                  </Button>
                )}
                {appointment!.status !== 'cancelado' && (
                  <Button type="button" variant="danger" size="sm" onClick={() => changeStatus('cancelado')}>
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                )}
              </div>

              {(appointment!.customer?.phone || appointment!.guestPhone) && (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <WhatsAppSend
                    phone={appointment!.customer?.phone ?? appointment!.guestPhone}
                    message={appointmentMessage({
                      template: template ?? undefined,
                      customerName: appointment!.customer?.name ?? appointment!.guestName,
                      serviceName: appointment!.service?.name,
                      startsAt: new Date(appointment!.startsAt),
                      businessName,
                    })}
                    label="Enviar lembrete pelo WhatsApp"
                    size="sm"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-red-300 hover:bg-red-500/12"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            ) : (
              <span />
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" loading={pending}>
                {editing ? 'Salvar alterações' : 'Criar compromisso'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <CustomerFormModal
        open={customerModal}
        onClose={() => setCustomerModal(false)}
        onSaved={(id) => {
          setCustomerId(id);
          setCustomerModal(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir este compromisso?"
        description="O horário voltará a ficar livre na sua agenda."
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!appointment) return;
            const result = await deleteAppointment(appointment.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Compromisso excluído');
            setConfirmDelete(false);
            router.refresh();
            onClose();
          })
        }
      />
    </>
  );
}
