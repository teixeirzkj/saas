'use client';

import { ImagePlus, Link2, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type UploadAction = (formData: FormData) => Promise<{ url?: string; error?: string }>;

/**
 * Botão de "Adicionar foto" com upload direto (arrasta o arquivo pro servidor,
 * sem precisar colar link). Mantém um link alternativo por trás de "ou colar um
 * link" para quem já tem a imagem hospedada em outro lugar.
 */
export function ImageUpload({
  value,
  onChange,
  action,
  folder,
  shape = 'square',
  size = 'md',
  label = 'Foto',
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  action: UploadAction;
  folder: string;
  shape?: 'square' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLinkField, setShowLinkField] = useState(false);
  const { success, error } = useToast();

  const sizes = { sm: 'h-14 w-14', md: 'h-20 w-20', lg: 'h-24 w-24' };
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('folder', folder);

    try {
      const result = await action(formData);
      if (result.error) {
        error('Não foi possível enviar a foto', result.error);
        return;
      }
      if (result.url) {
        onChange(result.url);
        success('Foto atualizada');
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden border border-white/[0.08] bg-white/[0.03]',
            sizes[size],
            radius,
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-white/20" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remover foto"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-black/80 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[rgb(var(--brand-500)/0.3)] bg-[rgb(var(--brand-500)/0.12)] px-3.5 text-[13px] font-semibold text-[rgb(var(--brand-200))] transition hover:bg-[rgb(var(--brand-500)/0.2)] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Adicionar foto
            </button>
            <button
              type="button"
              onClick={() => setShowLinkField((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[12.5px] font-medium text-white/40 transition hover:text-white/70"
            >
              <Link2 className="h-3.5 w-3.5" />
              ou colar um link
            </button>
          </div>

          {showLinkField && (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="max-w-sm"
            />
          )}

          {hint && <p className="hint">{hint}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
