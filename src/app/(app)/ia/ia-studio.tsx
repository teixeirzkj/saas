'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  History,
  Instagram,
  Megaphone,
  Package,
  Pencil,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Video,
  Zap,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import { ConfirmDialog } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { AI_OBJECTIVES, AI_TYPES, type AIType } from '@/lib/constants';
import { cn, formatDateTime, relativeTime } from '@/lib/utils';

import { deleteAIContent, generateAIContent, regenerateAIContent, saveAIContent, updateAIContent } from './actions';

const ICONS: Record<string, typeof Instagram> = {
  Instagram,
  Type,
  Zap,
  Megaphone,
  Tag,
  Package,
  Video,
  CalendarDays,
};

type HistoryItem = {
  id: string;
  type: string;
  output: string;
  saved: boolean;
  createdAt: Date;
  prompt: string;
};

export function IaStudio({
  business,
  creditsUsed,
  creditsLimit,
  planName,
  history,
}: {
  business: { name: string; segment: string };
  creditsUsed: number;
  creditsLimit: number;
  planName: string;
  history: HistoryItem[];
}) {
  const [selectedType, setSelectedType] = useState<AIType | null>(null);
  const [view, setView] = useState<'picker' | 'form' | 'result'>('picker');
  const [result, setResult] = useState<{ id: string; output: string; saved: boolean } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [used, setUsed] = useState(creditsUsed);
  const { success, error } = useToast();

  const exhausted = creditsLimit > 0 && used >= creditsLimit;
  const typeInfo = AI_TYPES.find((t) => t.value === selectedType);

  const submit = (formData: FormData) => {
    formData.set('type', selectedType ?? 'post');

    startTransition(async () => {
      const response = await generateAIContent({}, formData);

      if (response.errors) {
        setErrors(response.errors);
        return error('Verifique os campos', Object.values(response.errors)[0]);
      }
      if (response.error) return error('Não foi possível gerar', response.error);

      setErrors({});
      if (response.output && response.id) {
        setResult({ id: response.id, output: response.output, saved: false });
        setUsed(response.creditsUsed ?? used + 1);
        setView('result');
      }
    });
  };

  const regenerate = () => {
    if (!result) return;
    startTransition(async () => {
      const response = await regenerateAIContent(result.id);
      if (response.error) return error('Não foi possível gerar', response.error);
      if (response.output && response.id) {
        setResult({ id: response.id, output: response.output, saved: false });
        setUsed(response.creditsUsed ?? used + 1);
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Nexo IA"
        description="Gere conteúdo pronto para o Instagram e o WhatsApp em segundos."
        action={
          <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" />
            Histórico
            {history.length > 0 && <Badge className="ml-1">{history.length}</Badge>}
          </Button>
        }
      >
        {creditsLimit > 0 && (
          <div className="surface p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-white/70">Créditos de IA este mês</span>
              <span className="font-semibold text-white">
                {used} / {creditsLimit}
              </span>
            </div>
            <Progress value={used} max={creditsLimit} className="mt-2.5" />
            {exhausted && (
              <p className="mt-2 text-[12px] text-amber-300">
                Você usou todos os créditos do plano {planName} este mês. Faça upgrade para continuar gerando.
              </p>
            )}
          </div>
        )}
      </PageHeader>

      <AnimatePresence mode="wait">
        {view === 'picker' && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="mb-4 font-display text-[19px] font-semibold text-white">
              O que você quer criar hoje?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {AI_TYPES.map((type, i) => {
                const Icon = ICONS[type.icon] ?? Sparkles;
                return (
                  <motion.button
                    key={type.value}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => {
                      setSelectedType(type.value);
                      setErrors({});
                      setView('form');
                    }}
                    className="surface surface-hover flex flex-col items-start p-4 text-left"
                  >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.25)] bg-[rgb(var(--brand-500)/0.12)] text-[rgb(var(--brand-200))]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="text-[14px] font-semibold text-white">{type.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/40">{type.description}</p>
                    <ChevronRight className="mt-3 h-4 w-4 text-white/20 transition group-hover:text-[rgb(var(--brand-300))]" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === 'form' && typeInfo && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-xl"
          >
            <button
              onClick={() => setView('picker')}
              className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Escolher outro tipo
            </button>

            <Card>
              <CardHeader title={typeInfo.label} description={typeInfo.description} icon={<Sparkles className="h-4 w-4" />} />

              <form action={submit} className="space-y-4">
                <Input
                  label="Nome do negócio"
                  name="businessName"
                  defaultValue={business.name}
                  error={errors.businessName}
                  required
                />
                <Input
                  label="Segmento"
                  name="segment"
                  defaultValue={business.segment}
                  placeholder="Ex.: salão de beleza"
                  error={errors.segment}
                  required
                />
                <Input
                  label="Produto ou serviço"
                  name="product"
                  placeholder="O que você quer divulgar?"
                  error={errors.product}
                  required
                  autoFocus
                />
                <Select
                  label="Objetivo"
                  name="objective"
                  placeholder="Escolha um objetivo"
                  options={AI_OBJECTIVES.map((o) => ({ value: o.label, label: o.label }))}
                  error={errors.objective}
                />
                <Input
                  label="Público"
                  name="audience"
                  placeholder="Ex.: mulheres de 25 a 40 anos"
                  error={errors.audience}
                  required
                />
                <Textarea
                  label="Alguma informação extra? (opcional)"
                  name="extra"
                  placeholder="Preço, condição especial, diferencial..."
                  rows={2}
                />

                <Button type="submit" size="lg" fullWidth loading={pending} disabled={exhausted}>
                  <Sparkles className="h-4 w-4" />
                  Gerar conteúdo
                </Button>
                {exhausted && (
                  <p className="text-center text-[12px] text-amber-300">
                    Créditos esgotados este mês no plano {planName}.
                  </p>
                )}
              </form>
            </Card>
          </motion.div>
        )}

        {view === 'result' && result && typeInfo && (
          <ResultView
            key="result"
            typeLabel={typeInfo.label}
            result={result}
            pending={pending}
            onBack={() => setView('form')}
            onNew={() => {
              setView('picker');
              setResult(null);
            }}
            onRegenerate={regenerate}
            onSave={() =>
              startTransition(async () => {
                const response = await saveAIContent(result.id);
                if (response.error) return error('Não foi possível salvar', response.error);
                setResult({ ...result, saved: true });
                success('Salvo no histórico');
              })
            }
            onEdit={(text) =>
              startTransition(async () => {
                const response = await updateAIContent(result.id, text);
                if (response.error) return error('Não foi possível salvar', response.error);
                setResult({ ...result, output: text });
                success('Conteúdo atualizado');
              })
            }
          />
        )}
      </AnimatePresence>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} history={history} />
    </>
  );
}

function ResultView({
  typeLabel,
  result,
  pending,
  onBack,
  onNew,
  onRegenerate,
  onSave,
  onEdit,
}: {
  typeLabel: string;
  result: { id: string; output: string; saved: boolean };
  pending: boolean;
  onBack: () => void;
  onNew: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onEdit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(result.output);
  const { success } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-xl"
    >
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Editar informações
      </button>

      <Card>
        <CardHeader
          title={typeLabel}
          description="Pronto para copiar e colar"
          icon={<Sparkles className="h-4 w-4" />}
          action={result.saved && <Badge tone="success">Salvo</Badge>}
        />

        <AnimatePresence mode="wait">
          {pending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative mb-4 h-12 w-12">
                <span className="absolute inset-0 animate-ping rounded-full bg-[rgb(var(--brand-500)/0.3)]" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--brand-500)/0.15)] text-[rgb(var(--brand-200))]">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </span>
              </div>
              <p className="text-[13px] font-medium text-white/60">Gerando seu conteúdo...</p>
            </motion.div>
          ) : editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12} className="font-mono text-[13px]" />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    onEdit(draft);
                    setEditing(false);
                  }}
                >
                  <Check className="h-4 w-4" />
                  Salvar edição
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="whitespace-pre-line rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[13.5px] leading-relaxed text-white/85"
            >
              {result.output}
            </motion.div>
          )}
        </AnimatePresence>

        {!pending && !editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(result.output);
                success('Copiado!');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </Button>
            <Button variant="secondary" size="sm" onClick={onRegenerate}>
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            {!result.saved && (
              <Button variant="subtle" size="sm" onClick={onSave}>
                <Bookmark className="h-3.5 w-3.5" />
                Salvar
              </Button>
            )}
          </div>
        )}
      </Card>

      <Button variant="ghost" fullWidth className="mt-3" onClick={onNew}>
        Criar outro conteúdo
      </Button>
    </motion.div>
  );
}

function HistoryDrawer({
  open,
  onClose,
  history,
}: {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
}) {
  const [toDelete, setToDelete] = useState<HistoryItem | null>(null);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  const typeLabel = (type: string) => AI_TYPES.find((t) => t.value === type)?.label ?? type;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/[0.08] bg-ink-900/97 backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <h2 className="text-base font-semibold text-white">Histórico</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-white/40 hover:bg-white/[0.07] hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {history.length === 0 ? (
            <EmptyState icon={<History className="h-6 w-6" />} title="Nada gerado ainda" description="Seu histórico de conteúdo aparece aqui." />
          ) : (
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge tone="purple">{typeLabel(item.type)}</Badge>
                      {item.saved && <BookmarkCheck className="h-3.5 w-3.5 text-[rgb(var(--brand-300))]" />}
                    </div>
                    <span className="text-[10.5px] text-white/25">{relativeTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-white/60">{item.output}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.output);
                        success('Copiado!');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))]"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                    <button
                      onClick={() => setToDelete(item)}
                      className="text-[11px] text-white/25 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.aside>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Excluir este conteúdo?"
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!toDelete) return;
            const result = await deleteAIContent(toDelete.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Conteúdo excluído');
            setToDelete(null);
            window.location.reload();
          })
        }
      />
    </div>
  );
}
