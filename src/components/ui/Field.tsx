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
import { AlertCircle, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn'

const control =
  'w-full rounded-xl border bg-[#F4F5F8] px-3.5 text-[15px] text-[#1C1C1E] placeholder:text-[#8E8E93] transition-all duration-150 focus:outline-none disabled:bg-[#E5E5EA] disabled:text-[#8E8E93]'
const controlState = (invalid?: boolean) =>
  invalid
    ? 'border-[#FF3B30] bg-white focus:border-[#FF3B30] focus:ring-[3.5px] focus:ring-[#FF3B30]/15'
    : 'border-black/[0.08] hover:border-black/20 focus:border-[#007AFF] focus:bg-white focus:ring-[3.5px] focus:ring-[#007AFF]/15'

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(control, controlState(invalid), 'h-11 sm:h-12', className)} aria-invalid={invalid || undefined} {...props} />
}

export function Textarea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(control, controlState(invalid), 'min-h-24 resize-y py-2.5 leading-relaxed', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          control,
          controlState(invalid),
          'h-11 sm:h-12 cursor-pointer appearance-none pr-10 font-medium',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[#8E8E93]">
        <ChevronsUpDown className="size-4" strokeWidth={2} aria-hidden="true" />
      </div>
    </div>
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
        <label htmlFor={id} className="text-[13px] font-semibold tracking-tight text-[#1C1C1E]">
          {label}
          {required && <span className="text-[#FF3B30]" aria-hidden="true"> *</span>}
          {optional && <span className="font-normal text-[#8E8E93]"> (optional)</span>}
        </label>
        {counter && (
          <span className={cn('text-[12px] tabular-nums font-medium', counter.value > counter.max ? 'text-[#FF3B30]' : 'text-[#8E8E93]')}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {control}
      {error ? (
        <p id={errorId} className="flex items-start gap-1 text-[12px] font-medium text-[#FF3B30]">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] text-[#8E8E93]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
