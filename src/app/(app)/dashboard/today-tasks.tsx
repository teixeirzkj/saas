'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, ListTodo, Plus } from 'lucide-react';
import { useOptimistic, useState, useTransition } from 'react';

import { createTask, toggleTask } from '@/app/(app)/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { PRIORITIES } from '@/lib/constants';
import { cn, formatDate, isoDate } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueAt: Date | null;
  customerName: string | null;
};

export function TodayTasks({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [optimistic, setOptimistic] = useOptimistic(tasks, (state: Task[], id: string) =>
    state.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  );

  const openCount = optimistic.filter((t) => !t.done).length;

  return (
    <Card>
      <CardHeader
        title="Tarefas de hoje"
        description={openCount === 0 ? 'Tudo em ordem por aqui' : `${openCount} em aberto`}
        icon={<ListTodo className="h-4 w-4" />}
        action={
          <Button size="icon-sm" variant="secondary" onClick={() => setOpen(true)} aria-label="Nova tarefa">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckSquare className="mb-3 h-8 w-8 text-white/15" />
          <p className="text-[13px] text-white/45">Você ainda não tem tarefas.</p>
          <Button variant="subtle" size="sm" className="mt-4" onClick={() => setOpen(true)}>
            Criar primeira tarefa
          </Button>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {optimistic.map((task) => {
              const overdue = task.dueAt && !task.done && new Date(task.dueAt) < new Date();
              return (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setOptimistic(task.id);
                        const result = await toggleTask(task.id);
                        if (result?.error) error('Não foi possível atualizar', result.error);
                      })
                    }
                    className="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all duration-200',
                        task.done
                          ? 'border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-500))]'
                          : 'border-white/20 bg-white/[0.04] group-hover:border-[rgb(var(--brand-400)/0.6)]',
                      )}
                    >
                      {task.done && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.4}>
                          <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-[13px] leading-snug transition-all',
                          task.done ? 'text-white/30 line-through' : 'text-white/85',
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        {task.dueAt && (
                          <span className={cn('text-[11px]', overdue ? 'font-medium text-red-300' : 'text-white/30')}>
                            {overdue ? 'Atrasada · ' : ''}
                            {formatDate(task.dueAt, { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        {task.customerName && <span className="text-[11px] text-white/30">{task.customerName}</span>}
                        {!task.done && task.priority === 'alta' && (
                          <Badge tone="danger" className="px-1.5 py-0.5 text-[9px]">
                            Alta
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <NewTaskModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          success('Tarefa criada');
        }}
      />
    </Card>
  );
}

function NewTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { error } = useToast();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova tarefa"
      description="Anote agora para não esquecer depois."
      size="sm"
    >
      <form
        id="new-task-form"
        action={(formData) =>
          startTransition(async () => {
            const result = await createTask({}, formData);
            if (result.errors) return setErrors(result.errors);
            if (result.error) return error('Não foi possível criar', result.error);
            setErrors({});
            onCreated();
          })
        }
        className="space-y-4"
      >
        <Input
          label="O que precisa ser feito?"
          name="title"
          placeholder="Ex.: Ligar para o cliente confirmar o orçamento"
          error={errors.title}
          required
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prazo" name="dueAt" type="date" defaultValue={isoDate(new Date())} />
          <Select
            label="Prioridade"
            name="priority"
            defaultValue="media"
            options={Object.entries(PRIORITIES).map(([value, meta]) => ({ value, label: meta.label }))}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Criar tarefa
          </Button>
        </div>
      </form>
    </Modal>
  );
}
