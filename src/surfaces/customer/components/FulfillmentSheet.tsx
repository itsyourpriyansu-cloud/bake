import { Bike, Store } from 'lucide-react'
import { useState } from 'react'
import type { FulfillmentMode } from '../../../domain/customer/customer.types'
import type { Capabilities, Cart } from '../../../shared/types/domain'
import { BottomSheet, PrimaryButton, RadioCard, SecondaryButton } from '../../../shared/components'
import { useCartActions } from '../../../features/cart/hooks/useCart'
import { useAppStore } from '../../../stores/app.store'

interface FulfillmentSheetProps {
  open: boolean
  onClose: () => void
  cart?: Cart
  capabilities?: Capabilities
}

export function FulfillmentSheet({ open, onClose, cart, capabilities }: FulfillmentSheetProps) {
  const currentMode = useAppStore((state) => state.fulfillmentMode)
  const setMode = useAppStore((state) => state.setFulfillmentMode)
  const { requote } = useCartActions()
  const [pendingMode, setPendingMode] = useState<FulfillmentMode | null>(null)
  const hasItems = Boolean(cart?.items.length)

  const switchMode = async (mode: FulfillmentMode) => {
    await requote.mutateAsync(mode)
    setMode(mode)
    setPendingMode(null)
    onClose()
  }

  const choose = (mode: FulfillmentMode) => {
    if (mode === currentMode) return onClose()
    if (hasItems) setPendingMode(mode)
    else void switchMode(mode)
  }

  const targetLabel = pendingMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY'

  return <BottomSheet open={open} onClose={() => { setPendingMode(null); onClose() }} title={pendingMode ? `SWITCH TO ${targetLabel}?` : 'HOW ARE WE EATING TODAY?'}>
    {pendingMode ? <div className="fulfillment-confirm">
      <p>Your cart stays the same, but delivery-only fees or offers may change.</p>
      <PrimaryButton onClick={() => void switchMode(pendingMode)} disabled={requote.isPending}>{requote.isPending ? 'UPDATING…' : `SWITCH TO ${targetLabel}`}</PrimaryButton>
      <SecondaryButton onClick={() => setPendingMode(null)}>KEEP {currentMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY'}</SecondaryButton>
    </div> : <div className="fulfillment-options" role="radiogroup" aria-label="Fulfillment mode">
      <div className="fulfillment-option"><Bike aria-hidden="true" /><RadioCard checked={currentMode === 'DELIVERY'} title="Delivery" description="We'll bring it to you." onChange={() => choose('DELIVERY')} disabled={!capabilities?.delivery.enabled} /><span className="mode-status">{capabilities?.delivery.enabled ? 'Available now' : 'Paused'}</span></div>
      <div className="fulfillment-option"><Store aria-hidden="true" /><RadioCard checked={currentMode === 'PICKUP'} title="Pickup" description="Skip the wait." onChange={() => choose('PICKUP')} disabled={!capabilities?.pickup.enabled} /><span className="mode-status">{capabilities?.pickup.enabled ? 'Ready at Grand Road' : 'Paused'}</span></div>
    </div>}
  </BottomSheet>
}
