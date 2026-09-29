import { CalendarHeart, Check, ChevronDown, Home, MapPin, PackageCheck, Search, ShoppingBag, Sparkles, Store, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { bakeryKeys, useBakeryCart } from '../../../features/bakery/useBakery'
import { subscribeBakeryEvents } from '../../../prototype/bakery/bakery.events'
import { BakeryLogo } from '../components/BakeryUi'

export default function BakeryCustomerLayout() {
  const cart = useBakeryCart(); const queryClient = useQueryClient()
  const [fulfillment, setFulfillment] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY'); const [fulfillmentOpen, setFulfillmentOpen] = useState(false)
  const items = Array.isArray(cart.data?.items) ? cart.data.items : []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  useEffect(() => subscribeBakeryEvents(() => { void queryClient.invalidateQueries({ queryKey: bakeryKeys.all }) }), [queryClient])
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'manifest'; link.href = '/bakery-app.webmanifest'; link.dataset.bakeryManifest = 'true'; document.head.appendChild(link)
    return () => link.remove()
  }, [])
  return <div className="bakery-app">
    <div className="bakery-offer-bar" role="region" aria-label="Current offer: get 15% off orders of ₹1000 or more">
      <div className="bakery-offer-window">
        <div className="bakery-offer-track">
          {[0, 1].map((group) => <div className="bakery-offer-group" aria-hidden={group === 1} key={group}>
            <span><strong>15% OFF</strong> ON ORDERS OF ₹1000 OR MORE</span><i aria-hidden="true" /><span>FRESHLY MADE IN HYDERABAD</span><i aria-hidden="true" />
          </div>)}
        </div>
      </div>
    </div>
    <header className="bakery-app-header"><Link to="/bakery/app/"><BakeryLogo /></Link><nav><NavLink to="/bakery/app/cakes">CAKES</NavLink><NavLink to="/bakery/app/bakes">DAILY BAKES</NavLink><NavLink to="/bakery/app/celebrations">CELEBRATIONS</NavLink></nav><div className="bakery-head-actions"><button className="bakery-header-location" type="button" aria-haspopup="dialog" aria-expanded={fulfillmentOpen} aria-label={`${fulfillment === 'DELIVERY' ? 'Delivery to' : 'Pickup from'} Grand Road, Hyderabad. Change order method.`} onClick={() => setFulfillmentOpen(true)}><MapPin /><span className="bakery-header-location-copy"><small>{fulfillment === 'DELIVERY' ? 'DELIVERY TO' : 'PICKUP FROM'}</small><b><span className="bakery-location-full">Grand Road, Hyderabad</span><span className="bakery-location-compact">Hyderabad</span></b></span><ChevronDown /></button><Link aria-label="Search" to="/bakery/app/search"><Search /></Link><Link className="bakery-cart-head" aria-label={`${count} items in cart`} to="/bakery/app/cart"><ShoppingBag /><b>{count}</b></Link></div></header>
    {fulfillmentOpen && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setFulfillmentOpen(false)}><section className="bakery-choice-sheet" role="dialog" aria-modal="true" aria-labelledby="bakery-fulfillment-title" onMouseDown={(event) => event.stopPropagation()}><span className="bakery-kicker">CHOOSE HOW TO RECEIVE YOUR ORDER</span><h2 id="bakery-fulfillment-title">DELIVERY OR PICKUP</h2><p>Select delivery to your address or pickup from our Grand Road store. The fee and time are shown before checkout.</p><button type="button" className={fulfillment === 'DELIVERY' ? 'selected' : ''} onClick={() => { setFulfillment('DELIVERY'); setFulfillmentOpen(false) }}><MapPin /><span><b>Delivery</b><small>Delivered carefully to your address</small></span>{fulfillment === 'DELIVERY' && <Check />}</button><button type="button" className={fulfillment === 'PICKUP' ? 'selected' : ''} onClick={() => { setFulfillment('PICKUP'); setFulfillmentOpen(false) }}><Store /><span><b>Pickup</b><small>Collect from Grand Road, Hyderabad</small></span>{fulfillment === 'PICKUP' && <Check />}</button><button className="bakery-sheet-close" type="button" onClick={() => setFulfillmentOpen(false)}>KEEP {fulfillment}</button></section></div>}
    <main className="bakery-app-main"><Outlet /></main>
    <nav className="bakery-bottom-nav" aria-label="Bakery navigation">
      <NavLink end to="/bakery/app/"><Home /><span>Home</span></NavLink><NavLink to="/bakery/app/cakes"><CakeNavIcon /><span>Shop</span></NavLink><NavLink className="design" to="/bakery/app/design/cake-vintage-heart"><Sparkles /><span>Design</span></NavLink><NavLink to="/bakery/app/orders"><PackageCheck /><span>Orders</span></NavLink><NavLink to="/bakery/app/profile"><UserRound /><span>You</span></NavLink>
    </nav>
    {count > 0 && <Link className="bakery-floating-cart" to="/bakery/app/cart"><span>{count} {count === 1 ? 'item' : 'items'}</span><strong>VIEW BOX · ₹{cart.data?.quote?.subtotal ?? 0}</strong></Link>}
  </div>
}

function CakeNavIcon() { return <CalendarHeart /> }
