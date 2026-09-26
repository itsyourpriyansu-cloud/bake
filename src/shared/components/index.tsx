import { Minus, Plus, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type PropsWithChildren, type ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
export const PrimaryButton = ({ className = '', ...props }: ButtonProps) => <button className={`button button-primary ${className}`} {...props} />
export const SecondaryButton = ({ className = '', ...props }: ButtonProps) => <button className={`button button-secondary ${className}`} {...props} />
export const IconButton = ({ className = '', 'aria-label': label, ...props }: ButtonProps) => <button className={`icon-button ${className}`} aria-label={label} {...props} />

export function QuantityStepper({ value, onChange, onIncrement, onDecrement, disabled }: { value: number; onChange: (value: number) => void; onIncrement?: () => void; onDecrement?: () => void; disabled?: boolean }) {
  return <div className="stepper" aria-label="Quantity"><IconButton aria-label="Decrease quantity" onClick={() => onDecrement ? onDecrement() : onChange(value - 1)} disabled={disabled}><Minus size={16} /></IconButton><output aria-live="polite">{value}</output><IconButton aria-label="Increase quantity" onClick={() => onIncrement ? onIncrement() : onChange(value + 1)} disabled={disabled}><Plus size={16} /></IconButton></div>
}

export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string; disabled?: boolean }>; onChange: (value: T) => void; label: string }) {
  return <div className="segmented" role="radiogroup" aria-label={label}>{options.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} disabled={option.disabled} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
}

export const Chip = ({ active, children, ...props }: ButtonProps & { active?: boolean }) => <button type="button" className={`chip ${active ? 'active' : ''}`} {...props}>{children}{active && <motion.span className="chip-active-mark" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: .16 }} />}</button>

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="switch-row"><span>{label}</span><button type="button" className={`switch ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span /></button></label>
}

export function RadioCard({ checked, title, description, onChange, disabled }: { checked: boolean; title: string; description?: string; onChange: () => void; disabled?: boolean }) { return <button type="button" role="radio" aria-checked={checked} className={`radio-card ${checked ? 'active' : ''}`} onClick={onChange} disabled={disabled}><strong>{title}</strong>{description && <span>{description}</span>}</button> }
export function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="checkbox-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label> }
export function TextInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { const id = useId(); return <label className="field" htmlFor={id}><span>{label}</span><input id={id} {...props} /></label> }
export function OTPInput({ value = '', onChange }: { value?: string; onChange?: (value: string) => void }) { return <TextInput label="6-digit OTP" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={value} onChange={(event) => onChange?.(event.target.value.replace(/\D/g, ''))} /> }

function Modal({ open, onClose, className, title, children }: { open: boolean; onClose: () => void; className: string; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close() }, [open])
  const offset = className.includes('bottom-sheet') ? 32 : 8
  return <dialog ref={ref} className={className} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><motion.div className="dialog-panel" initial={{ opacity: 0, y: offset }} animate={{ opacity: open ? 1 : 0, y: open ? 0 : offset }} transition={{ duration: .26, ease: [0.22, 1, 0.36, 1] }} onClick={(event) => event.stopPropagation()}><div className="dialog-head"><h2>{title}</h2><IconButton aria-label="Close" onClick={onClose}><X /></IconButton></div>{children}</motion.div></dialog>
}
export const BottomSheet = (props: Omit<Parameters<typeof Modal>[0], 'className'>) => <Modal {...props} className="modal bottom-sheet" />
export const CenterDialog = (props: Omit<Parameters<typeof Modal>[0], 'className'>) => <Modal {...props} className="modal center-dialog" />
export const Drawer = (props: Omit<Parameters<typeof Modal>[0], 'className'>) => <Modal {...props} className="modal drawer" />

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden="true" />
export const EmptyState = ({ title, message }: { title: string; message: string }) => <div className="state-card"><span className="state-mark">○</span><h3>{title}</h3><p>{message}</p></div>
export const ErrorState = ({ retry }: { retry?: () => void }) => <div className="state-card error"><h3>Something went off course</h3><p>Please try that again.</p>{retry && <SecondaryButton onClick={retry}>Try again</SecondaryButton>}</div>
export const TierPill = ({ children }: PropsWithChildren) => <span className="tier-pill">{children}</span>
export const PointsBadge = ({ points }: { points: number }) => <span className="points-badge">+{points} pts</span>
export const PageHeader = ({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) => <header className="page-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1></div>{action}</header>
export const StickyBottomAction = ({ children }: PropsWithChildren) => <div className="sticky-action">{children}</div>
export const FloatingCartPill = ({ count, total, onClick }: { count: number; total: number; onClick: () => void }) => <motion.button className="floating-cart" onClick={onClick} initial={{ opacity: 0, y: 18, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} whileTap={{ scale: .98 }} transition={{ duration: .2 }}><motion.span key={`${count}-${total}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>{count} {count === 1 ? 'item' : 'items'} · ₹{total}</motion.span><strong>VIEW CART →</strong></motion.button>

export { Logo, type LogoProps } from './Logo'
export { BrandedBootLoader, type BootSurface } from './BrandedBootLoader'
