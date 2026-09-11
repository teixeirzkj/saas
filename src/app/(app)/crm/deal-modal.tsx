'use client';

import { useRouter } from 'next/navigation';
import { Check, Plus, StickyNote, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { createNote, createTask, deleteNote, toggleTask } from '@/app/(app)/actions';
import { CustomerFormModal } from '@/app/(app)/clientes/customer-form';
import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Button } from '@/components/ui/button';
import { Input, MoneyInput, Select, Textarea } from '@/components/ui/input';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { DEAL_STAGES, SOURCES, type DealStage } from '@/lib/constants';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

import { deleteDeal, updateDeal } from './actions';
import { createDeal } from './actions';
import type { Deal } from './crm-board';

export function DealModal({
  open,
  onClose,
  deal,
  defaultStage,
  customers,
  presetCustomerId,
  businessName,
}: {
  open: boolean;
  onClose: () => void;
  deal?: Deal;
  defaultStage?: DealStage;
  customers: { id: string; name: string; phone: string | null }[];
  presetCustomerId?: string;
  businessName: string;
}) {
  const editing = Boolean(deal?.id);
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerModal, setCustomerModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customerId, setCustomerId] = useState(deal?.customer?.id ?? presetCustomerId ?? '');
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    if (!open) return;
    setCustomerId(deal?.customer?.id ?? presetCustomerId ?? '');
    setErrors({});
    setNoteContent('');
    setTaskTitle('');
  }, [open, deal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const submit = (formData: FormData) => {
    formData.set('customerId', customerId);
    formData.set('stage', deal?.stage ?? defaultStage ?? 'novo_lead');

    startTransition(async () => {
      const result = editing ? await updateDeal({}, formData) : await createDeal({}, formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);

      setErrors({});
      success(editing ? 'Negociação atualizada' : 'Negociação criada');
      router.refresh();
      onClose();
    });
  };

  const addNote = () => {
    if (!noteContent.trim() || !deal) return;
    const formData = new FormData();
    formData.set('content', noteContent);
    formData.set('dealId', deal.id);

    startTransition(async () => {
      const result = await createNote(formData);
      if (result.error) return error('Não foi possível salvar', result.error);
      setNoteContent('');
      success('Nota adicionada');
      router.refresh();
    });
  };

  const addTask = () => {
    if (!taskTitle.trim() || !deal) return;
    const formData = new FormData();
    formData.set('title', taskTitle);
    formData.set('dealId', deal.id);
    formData.set('priority', 'media');

    startTransition(async () => {
      const result = await createTask({}, formData);
      if (result.error) return error('Não foi possível criar', result.error);
      setTaskTitle('');
      success('Tarefa criada');
      router.refresh();
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? 'Negociação' : 'Nova negociação'}
        description={editing ? DEAL_STAGES.find((s) => s.value === deal!.stage)?.label : undefined}
        size="lg"
      >
        <form action={submit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={deal!.id} />}

          <Input
            label="Título da negociação"
            name="title"
            defaultValue={deal?.title ?? ''}
            placeholder="Ex.: Pacote de manutenção mensal"
            error={errors.title}
            required
            autoFocus={!editing}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="deal-customer" className="text-[13px] font-medium text-white/70">
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
              id="deal-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Selecione um cliente (opcional)"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput
              label="Valor potencial"
              name="value"
              defaultValue={deal ? String(deal.value).replace('.', ',') : ''}
              placeholder="0,00"
              error={errors.value}
            />
            <Select
              label="Origem"
              name="source"
              defaultValue={deal?.source ?? ''}
              placeholder="Como chegou até você?"
              options={SOURCES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </div>

          <Textarea
            label="Observações"
            name="notes"
            defaultValue={deal?.notes ?? ''}
            placeholder="Contexto da negociação, próximos passos..."
            rows={3}
          />

          {editing && selectedCustomer?.phone && (
            <WhatsAppSend
              phone={selectedCustomer.phone}
              message={`Olá, ${selectedCustomer.name.split(' ')[0]}! Tudo bem? Sobre ${deal!.title}...`}
              label="Falar com o cliente"
              fullWidth
            />
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
                {editing ? 'Salvar alterações' : 'Criar negociação'}
              </Button>
            </div>
          </div>
        </form>

        {/* Tarefas e notas — só disponível após criar */}
        {editing && (
          <div className="mt-6 space-y-5 border-t border-white/[0.06] pt-5">
            <div>
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-white/35">Tarefas</p>
              <div className="flex gap-2">
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Nova tarefa..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                />
                <Button type="button" size="icon" onClick={addTask} disabled={!taskTitle.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {deal!.tasks.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {deal!.tasks.map((task) => (
                    <li key={task.id}>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await toggleTask(task.id);
                            router.refresh();
                          })
                        }
                        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-white/[0.04]"
                      >
                        <span
                          className={cn(
                            'flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-md border',
                            task.done ? 'border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-500))]' : 'border-white/20 bg-white/[0.04]',
                          )}
                        >
                          {task.done && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        <span className={cn('text-[12.5px]', task.done ? 'text-white/30 line-through' : 'text-white/80')}>
                          {task.title}
                        </span>
                        {task.dueAt && <span className="ml-auto text-[10.5px] text-white/25">{formatDate(task.dueAt)}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-white/35">Notas</p>
              <div className="flex gap-2">
                <Input
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Registrar um combinado, uma ligação..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNote())}
                />
                <Button type="button" size="icon" onClick={addNote} disabled={!noteContent.trim()}>
                  <StickyNote className="h-4 w-4" />
                </Button>
              </div>

              {deal!.notesList.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {deal!.notesList.map((note) => (
                    <li key={note.id} className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <p className="text-[12.5px] leading-relaxed text-white/70">{note.content}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10.5px] text-white/25">
                          {note.authorName ? `${note.authorName} · ` : ''}
                          {formatDateTime(note.createdAt)}
                        </span>
                        <button
                          onClick={() =>
                            startTransition(async () => {
                              await deleteNote(note.id);
                              router.refresh();
                            })
                          }
                          className="text-[10.5px] text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
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
        title="Excluir esta negociação?"
        description="Tarefas e notas vinculadas a ela também serão removidas."
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!deal) return;
            const result = await deleteDeal(deal.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Negociação excluída');
            router.refresh();
            onClose();
          })
        }
      />
    </>
  );
}
