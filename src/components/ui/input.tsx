'use client';

import { forwardRef, useId, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

const control =
  'w-full rounded-xl border border-white/[0.09] bg-ink-850/60 px-3.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:border-[rgb(var(--brand-400)/0.6)] focus:bg-ink-850 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--brand-500)/0.12)] disabled:opacity-50';

// --------------------------------------------------------------- Field

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-[rgb(var(--brand-300))]">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

// --------------------------------------------------------------- Input

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, icon, suffix, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <Field label={label} hint={hint} error={error} required={props.required} htmlFor={inputId}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            control,
            'h-11',
            icon && 'pl-10',
            suffix && 'pr-12',
            error && 'border-red-500/50 focus:border-red-400/70 focus:ring-red-500/12',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/40">{suffix}</span>
        )}
      </div>
    </Field>
  );
});

// --------------------------------------------------------------- Password

export function PasswordInput({ label = 'Senha', ...props }: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} label={label} type={show ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-1 top-[30px] rounded-lg p-2 text-white/40 transition hover:text-white/80"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// --------------------------------------------------------------- Textarea

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={props.required} htmlFor={textareaId}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={props.rows ?? 3}
        className={cn(control, 'resize-y py-2.5 leading-relaxed', error && 'border-red-500/50', className)}
        {...props}
      />
    </Field>
  );
});

// --------------------------------------------------------------- Select

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, options, placeholder, children, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={props.required} htmlFor={selectId}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(control, 'h-11 cursor-pointer appearance-none pr-10', error && 'border-red-500/50', className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      </div>
    </Field>
  );
});

// --------------------------------------------------------------- Search

export function SearchInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input {...props} className={cn(control, 'h-11 pl-10')} />
    </div>
  );
}

// --------------------------------------------------------------- Switch

export function Switch({
  checked,
  onChange,
  label,
  description,
  name,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {name && <input type="hidden" name={name} value={checked ? 'true' : 'false'} />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-all duration-300',
          checked ? 'border-[rgb(var(--brand-400)/0.6)] bg-[rgb(var(--brand-500)/0.8)]' : 'border-white/10 bg-white/[0.07]',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-300',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-white/90">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-relaxed text-white/45">{description}</span>}
        </span>
      )}
    </label>
  );
}

// --------------------------------------------------------------- Checkbox

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-sm text-white/75', className)}>
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
          checked ? 'border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-500))]' : 'border-white/15 bg-white/[0.04]',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

/** Campo de moeda com máscara leve (aceita "1.234,56") */
export function MoneyInput({ label, hint, error, ...props }: InputProps) {
  return (
    <Input
      {...props}
      label={label}
      hint={hint}
      error={error}
      inputMode="decimal"
      icon={<span className="text-xs font-medium">R$</span>}
    />
  );
}
