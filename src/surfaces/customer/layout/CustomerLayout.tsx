import { Home, Menu as MenuIcon, Gift, ReceiptText, UserRound, MapPin, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCart, useCartQuote } from '../../../features/cart/hooks/useCart'
import { useLoyalty } from '../../../features/loyalty/hooks/useLoyalty'
import { FloatingCartPill, TierPill } from '../../../shared/components'
import { useAppStore } from '../../../stores/app.store'
import { useCustomerPwa } from '../../../services/pwa/useCustomerPwa'
import { DemoToolbar } from '../components/DemoToolbar'
import { useDemo } from '../../../app/providers/DemoProvider'
import { usePizzaWaveTools } from '../../../services/webmcp/usePizzaWaveTools'
import { useCapabilities } from '../../../features/availability/hooks/useCapabilities'
import { FulfillmentSheet } from '../components/FulfillmentSheet'

const nav = [
  { to: '/app/', label: 'Home', icon: Home, end: true }, { to: '/app/menu', label: 'Menu', icon: MenuIcon },
  { to: '/app/rewards', label: 'Rewards', icon: Gift }, { to: '/app/orders', label: 'Orders', icon: ReceiptText },
  { to: '/app/profile', label: 'You', icon: UserRound },
]

export function CustomerLayout() {
  useCustomerPwa()
  usePizzaWaveTools()
  const location = useLocation()
  const navigate = useNavigate(); const storedMode = useAppStore((state) => state.fulfillmentMode); const mode = storedMode === 'STORE' ? 'DELIVERY' : storedMode
  const { customerLoggedIn } = useDemo(); const { data: cart } = useCart(); const { data: quote } = useCartQuote(mode); const { data: loyalty } = useLoyalty(customerLoggedIn); const { data: capabilities } = useCapabilities()
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false)
  const commerceFlow = /^\/app\/(product|build|cart)(\/|$)/.test(location.pathname)
  const fullFlow = /^\/app\/(auth|checkout|payment)(\/|$)/.test(location.pathname) || /^\/app\/orders\/[^/]+$/.test(location.pathname)
  const pillVisible = Boolean(quote && quote.itemCount > 0 && !commerceFlow && !fullFlow)
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  return <div className="customer-shell">
    {!fullFlow && <header className="customer-topbar">
      <button className="location-block" type="button" onClick={() => setFulfillmentOpen(true)} aria-haspopup="dialog"><span>{mode === 'DELIVERY' ? 'DELIVERY TO' : 'PICKUP FROM'}</span><strong><MapPin size={15} />{mode === 'DELIVERY' ? 'Grand Road, Puri' : 'Pizza Wave · Grand Road'}<ChevronDown size={15} /></strong></button>
      {customerLoggedIn && loyalty?.customer ? <TierPill>GOLD · {loyalty.customer.pointsAvailable}</TierPill> : <NavLink className="join-link" to="/app/auth">JOIN WAVE</NavLink>}
    </header>}
    {!fullFlow && <nav className="bottom-nav" aria-label="Customer navigation">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}><Icon /><span>{label}</span></NavLink>)}</nav>}
    <main className="customer-main"><Outlet /></main>
    {pillVisible && <FloatingCartPill count={quote!.itemCount} total={quote!.total} onClick={() => navigate('/app/cart')} />}
    <FulfillmentSheet open={fulfillmentOpen} onClose={() => setFulfillmentOpen(false)} cart={cart} capabilities={capabilities} />
    {!fullFlow && <DemoToolbar pillVisible={pillVisible} />}
  </div>
}
