'use client';

import { Copy, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonAnchor } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn, formatPhone } from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';

/**
 * Botão de WhatsApp presente em todo o produto.
 * Abre um modal com a mensagem pré-preenchida e editável antes do envio.
 */
export function WhatsAppSend({
  phone,
  message,
  label = 'Enviar WhatsApp',
  title = 'Enviar pelo WhatsApp',
  size = 'md',
  variant = 'whatsapp',
  fullWidth,
  className,
  iconOnly,
  onSent,
}: {
  phone?: string | null;
  message: string;
  label?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  variant?: 'whatsapp' | 'secondary' | 'ghost' | 'outline' | 'primary';
  fullWidth?: boolean;
  className?: string;
  iconOnly?: boolean;
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(message);
  const { success } = useToast();

  useEffect(() => setText(message), [message]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        onClick={() => setOpen(true)}
        aria-label={label}
      >
        <MessageCircle className="h-4 w-4" />
        {!iconOnly && label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={phone ? `Para ${formatPhone(phone)}` : 'Você escolherá o contato no WhatsApp'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(text);
                success('Mensagem copiada');
              }}
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <ButtonAnchor
              href={waLink(phone, text)}
              variant="whatsapp"
              onClick={() => {
                setOpen(false);
                onSent?.();
              }}
            >
              <Send className="h-4 w-4" />
              Abrir WhatsApp
            </ButtonAnchor>
          </>
        }
      >
        <Textarea
          label="Mensagem"
          hint="Você pode editar antes de enviar. O WhatsApp abre com o texto já pronto."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="font-normal"
        />
      </Modal>
    </>
  );
}

/** Botão de copiar reutilizável. */
export function CopyButton({
  value,
  label = 'Copiar',
  className,
  size = 'sm',
  variant = 'secondary',
}: {
  value: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'icon-sm';
  variant?: 'secondary' | 'ghost' | 'outline';
}) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // fallback para navegadores sem clipboard API
          const el = document.createElement('textarea');
          el.value = value;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        setCopied(true);
        success('Copiado para a área de transferência');
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      {size !== 'icon-sm' && (copied ? 'Copiado!' : label)}
    </Button>
  );
}
