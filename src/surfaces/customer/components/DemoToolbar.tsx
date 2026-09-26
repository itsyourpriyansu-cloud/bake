import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { showDemoTools } from '../../../app/config/env'
import { api } from '../../../services/api'
import { IconButton, SecondaryButton, Switch } from '../../../shared/components'
import { useCapabilities } from '../../../features/availability/hooks/useCapabilities'
import { useDemo } from '../../../app/providers/DemoProvider'

export function DemoToolbar({ pillVisible = false }: { pillVisible?: boolean }) {
  const [open, setOpen] = useState(false); const [minutes, setMinutes] = useState(15); const [load, setLoad] = useState(25); const [result, setResult] = useState(''); const queryClient = useQueryClient(); const { data } = useCapabilities(); const { customerLoggedIn, setCustomerLoggedIn, reset } = useDemo()
  const demoState = useQuery({ queryKey: ['demo-state'], queryFn: api.demo.getDemoState, enabled: open })
  if (!showDemoTools) return null
  const setCapability = async (patch: Parameters<typeof api.config.patchDemoCapabilities>[0]) => { await api.config.patchDemoCapabilities(patch); await queryClient.invalidateQueries({ queryKey: ['capabilities'] }) }
  const triggerAvailabilityChange = async () => { await api.demo.loadScenario('unavailableItem'); await queryClient.invalidateQueries() }
  const run = async (action: () => Promise<unknown>, message: string) => { try { await action(); setResult(message) } catch { setResult('No matching demo state is available yet.') } }
  return <aside className={`demo-toolbar ${open ? 'open' : ''} ${pillVisible ? 'has-cart' : ''}`}>
    {!open ? <IconButton aria-label="Open demo tools" onClick={() => setOpen(true)}><SlidersHorizontal /></IconButton> : <><div className="dialog-head"><strong>DEMO TOOLS</strong><IconButton aria-label="Close demo tools" onClick={() => setOpen(false)}><X /></IconButton></div>
      <Switch label="Customer logged in" checked={customerLoggedIn} onChange={(value) => void setCustomerLoggedIn(value)} />
      <Switch label="Delivery enabled" checked={data?.delivery.enabled ?? true} onChange={(value) => void setCapability({ deliveryEnabled: value })} />
      <Switch label="Pickup enabled" checked={data?.pickup.enabled ?? true} onChange={(value) => void setCapability({ pickupEnabled: value })} />
      <div className="demo-control-row"><label><span>Advance time</span><select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={5}>5 min</option><option value={15}>15 min</option><option value={30}>30 min</option><option value={60}>1 hour</option></select></label><SecondaryButton onClick={() => void run(() => api.demo.advanceTime(minutes), `Advanced ${minutes} minutes`)}>ADVANCE</SecondaryButton></div>
      <div className="demo-control-row"><label><span>Kitchen load</span><select value={load} onChange={(event) => setLoad(Number(event.target.value))}><option value={25}>Light · 25%</option><option value={60}>Moderate · 60%</option><option value={85}>Heavy · 85%</option><option value={100}>Review · 100%</option></select></label><SecondaryButton onClick={() => void run(() => api.demo.setKitchenLoad(load), `Kitchen load set to ${load}%`)}>SET LOAD</SecondaryButton></div>
      <div className="demo-button-pair"><SecondaryButton disabled={!['PENDING', 'RECONCILING'].includes(demoState.data?.latestPayment?.status ?? '')} onClick={() => void run(() => api.demo.setLatestPaymentOutcome('SUCCESS'), 'Payment confirmed')}>PAYMENT SUCCESS</SecondaryButton><SecondaryButton disabled={!['PENDING', 'RECONCILING'].includes(demoState.data?.latestPayment?.status ?? '')} onClick={() => void run(() => api.demo.setLatestPaymentOutcome('FAILURE'), 'Payment failed')}>PAYMENT FAILURE</SecondaryButton></div>
      <SecondaryButton onClick={() => void run(() => api.demo.setKdsOffline(demoState.data?.kdsOnline ?? true), demoState.data?.kdsOnline ? 'KDS is offline' : 'KDS heartbeat restored')}>{demoState.data?.kdsOnline ? 'KDS OFFLINE' : 'RESTORE KDS'}</SecondaryButton>
      <SecondaryButton disabled={!demoState.data?.activeOrder} onClick={() => void run(api.demo.completeActiveOrder, 'Active order completed')}>COMPLETE ORDER</SecondaryButton>
      <SecondaryButton onClick={() => void triggerAvailabilityChange()}>Test item change</SecondaryButton>
      <SecondaryButton onClick={() => void run(reset, 'Demo reset complete')}><RotateCcw size={16} /> RESET DEMO</SecondaryButton>
      <p className="demo-live-state">{result || `Clock +${demoState.data?.offsetMinutes ?? 0}m · Load ${demoState.data?.kitchenLoadPercent ?? '—'}%`}</p>
    </>}
  </aside>
}
