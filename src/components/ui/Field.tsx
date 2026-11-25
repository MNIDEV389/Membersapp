'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, Check, ChevronsUpDown } from 'lucide-react'
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

export function Select({
  invalid,
  className,
  children,
  value,
  onChange,
  id,
  name,
  disabled,
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract options from React children
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child: any) => ({
      value: String(child.props.value ?? ''),
      label: String(child.props.children ?? child.props.value ?? ''),
    }))

  const selectedOption = options.find((o) => o.value === String(value)) ?? options[0]

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const select = (optValue: string) => {
    if (onChange) {
      const event = {
        target: { value: optValue, name: name ?? '' },
        currentTarget: { value: optValue, name: name ?? '' },
      } as unknown as React.ChangeEvent<HTMLSelectElement>
      onChange(event)
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for form data */}
      <input type="hidden" id={id} name={name} value={value} />

      {/* Apple Pop-up Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={cn(
          control,
          controlState(invalid),
          'flex h-11 sm:h-12 w-full items-center justify-between gap-2 pr-3.5 pl-3.5 text-left font-medium text-[14px] sm:text-[15px] select-none transition-all active:scale-[0.99]',
          open && 'border-[#007AFF] ring-[3.5px] ring-[#007AFF]/15 bg-white',
          className,
        )}
      >
        <span className="truncate text-[#1C1C1E]">{selectedOption ? selectedOption.label : 'Select an option'}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-[#8E8E93]" strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Floating Apple Menu List */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[240px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl animate-fade-in"
        >
          {options.map((opt) => {
            const isSelected = opt.value === String(value)
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => select(opt.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors',
                  isSelected
                    ? 'bg-[#007AFF]/10 font-semibold text-[#007AFF]'
                    : 'text-[#1C1C1E] hover:bg-[#F2F2F7] active:bg-[#E5E5EA]',
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-[#007AFF]" strokeWidth={2.5} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
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
