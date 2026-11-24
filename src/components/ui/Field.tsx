'use client'

import {
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from './cn'

const control =
  'w-full rounded-[var(--radius-control)] border bg-surface px-3.5 text-body text-ink placeholder:text-muted/75 transition-colors focus:outline-none focus:ring-4 disabled:bg-subtle disabled:text-muted'
const controlState = (invalid?: boolean) =>
  invalid
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line-strong hover:border-[#a9b6c6] focus:border-brand focus:ring-brand/15'

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(control, controlState(invalid), 'h-12', className)} aria-invalid={invalid || undefined} {...props} />
}

export function Textarea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(control, controlState(invalid), 'min-h-28 resize-y py-3 leading-6', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        control,
        controlState(invalid),
        "h-12 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23536477' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")] bg-[right_0.875rem_center] bg-no-repeat pr-10",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  )
}

interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  counter?: { value: number; max: number }
  className?: string
  children: ReactElement<Record<string, unknown>>
}

/** Label + control + hint/error, with ids and ARIA wired automatically. */
export function Field({ label, hint, error, required, optional, counter, className, children }: FieldProps) {
  const generatedId = useId()
  const id = (isValidElement(children) && (children.props.id as string | undefined)) || generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        invalid: Boolean(error),
        required: required || undefined,
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-label font-semibold text-ink">
          {label}
          {required && <span className="text-danger" aria-hidden="true"> *</span>}
          {optional && <span className="font-normal text-muted"> (optional)</span>}
        </label>
        {counter && (
          <span className={cn('text-caption tabular-nums', counter.value > counter.max ? 'text-danger' : 'text-muted')}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {control}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-label text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
