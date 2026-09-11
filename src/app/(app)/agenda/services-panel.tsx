'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, MoneyInput, Switch, Textarea } from '@/components/ui/input';
import { ConfirmDialog, Drawer, Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { brl, cn } from '@/lib/utils';

import { createService, deleteService, toggleServiceActive, updateService } from './actions';
import type { Service } from './agenda-view';

const COLORS = ['#8B2FFF', '#B48CFF', '#5AA9FF', '#2FD98A', '#FFB020', '#FF6B8A'];

export function ServicesPanel({
  open,
  onClose,
  services,
}: {
  open: boolean;
  onClose: () => void;
  services: Service[];
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ open: boolean; service?: Service }>({ open: false });
  const [toDelete, setToDelete] = useState<Service | null>(null);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Serviços"
        description="Cada serviço define a duração e o preço do atendimento."
        footer={
          <Button fullWidth onClick={() => setForm({ open: true })}>
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      >
        {services.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Scissors className="mb-4 h-8 w-8 text-white/15" />
            <p className="text-[14px] font-medium text-white">Nenhum serviço cadastrado</p>
            <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/45">
              Cadastre o que você oferece para montar a agenda e a página pública de agendamento.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {services.map((service) => (
                <motion.li
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    'rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5',
                    !service.active && 'opacity-55',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: service.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13.5px] font-medium text-white">{service.name}</p>
                        {!service.active && <Badge>Inativo</Badge>}
                      </div>
                      <p className="mt-1 flex items-center gap-3 text-[12px] text-white/45">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMin} min
                        </span>
                        <span className="font-medium text-white/70">{brl(service.price)}</span>
                      </p>
                      {service.description && (
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-white/30">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Editar serviço"
                        onClick={() => setForm({ open: true, service })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Excluir serviço"
                        onClick={() => setToDelete(service)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-white/[0.05] pt-3">
                    <Switch
                      checked={service.active}
                      onChange={() =>
                        startTransition(async () => {
                          const result = await toggleServiceActive(service.id);
                          if (result.error) return error('Não foi possível atualizar', result.error);
                          router.refresh();
                        })
                      }
                      label={service.active ? 'Disponível para agendamento' : 'Oculto da página pública'}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Drawer>

      <ServiceFormModal
        open={form.open}
        onClose={() => setForm({ open: false })}
        service={form.service}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={toDelete ? `Excluir "${toDelete.name}"?` : ''}
        description="Agendamentos existentes ficarão sem serviço vinculado, mas continuarão na agenda."
        confirmLabel="Excluir serviço"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!toDelete) return;
            const result = await deleteService(toDelete.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Serviço excluído');
            setToDelete(null);
            router.refresh();
          })
        }
      />
    </>
  );
}

function ServiceFormModal({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service;
}) {
  const editing = Boolean(service);
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [color, setColor] = useState(service?.color ?? COLORS[0]);
  const [active, setActive] = useState(service?.active ?? true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar serviço' : 'Novo serviço'}
      description="A duração é usada para montar os horários disponíveis."
    >
      <form
        action={(formData) => {
          formData.set('color', color);
          formData.set('active', active ? 'true' : 'false');

          startTransition(async () => {
            const result = editing ? await updateService({}, formData) : await createService({}, formData);
            if (result.errors) return setErrors(result.errors);
            if (result.error) return error('Não foi possível salvar', result.error);
            setErrors({});
            success(editing ? 'Serviço atualizado' : 'Serviço cadastrado');
            router.refresh();
            onClose();
          });
        }}
        className="space-y-4"
      >
        {editing && <input type="hidden" name="id" value={service!.id} />}

        <Input
          label="Nome do serviço"
          name="name"
          defaultValue={service?.name ?? ''}
          placeholder="Ex.: Corte e finalização"
          error={errors.name}
          required
          autoFocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Duração (minutos)"
            name="durationMin"
            type="number"
            min={5}
            step={5}
            defaultValue={service?.durationMin ?? 30}
            error={errors.durationMin}
            required
          />
          <MoneyInput
            label="Preço"
            name="price"
            defaultValue={service ? String(service.price).replace('.', ',') : ''}
            placeholder="0,00"
            error={errors.price}
          />
        </div>

        <Textarea
          label="Descrição"
          name="description"
          defaultValue={service?.description ?? ''}
          placeholder="O que está incluído neste serviço (aparece na página pública)"
          rows={3}
        />

        <div>
          <span className="label">Cor no calendário</span>
          <div className="flex gap-2">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Cor ${option}`}
                className={cn(
                  'h-9 w-9 rounded-xl border-2 transition-all',
                  color === option ? 'scale-110 border-white' : 'border-transparent hover:scale-105',
                )}
                style={{ background: option }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <Switch
            checked={active}
            onChange={setActive}
            label="Disponível para agendamento"
            description="Serviços inativos não aparecem na sua página pública."
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? 'Salvar alterações' : 'Cadastrar serviço'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
