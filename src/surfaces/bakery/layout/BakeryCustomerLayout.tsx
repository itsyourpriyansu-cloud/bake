import { CalendarHeart, Home, PackageCheck, Search, ShoppingBag, Sparkles, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { bakeryKeys, useBakeryCart } from '../../../features/bakery/useBakery'
import { subscribeBakeryEvents } from '../../../prototype/bakery/bakery.events'
import { BakeryLogo } from '../components/BakeryUi'

export default function BakeryCustomerLayout() {
  const cart = useBakeryCart(); const queryClient = useQueryClient()
  const items = Array.isArray(cart.data?.items) ? cart.data.items : []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  useEffect(() => subscribeBakeryEvents(() => { void queryClient.invalidateQueries({ queryKey: bakeryKeys.all }) }), [queryClient])
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'manifest'; link.href = '/bakery-app.webmanifest'; link.dataset.bakeryManifest = 'true'; document.head.appendChild(link)
    return () => link.remove()
  }, [])
  return <div className="bakery-app">
    <div className="bakery-promo">ORDER ₹1000+ & GET 15% OFF <span>•</span> FRESHLY MADE IN CUTTACK</div>
    <header className="bakery-app-header"><Link to="/bakery/app/"><BakeryLogo /></Link><nav><NavLink to="/bakery/app/cakes">CAKES</NavLink><NavLink to="/bakery/app/bakes">DAILY BAKES</NavLink><NavLink to="/bakery/app/celebrations">CELEBRATIONS</NavLink></nav><div className="bakery-head-actions"><Link aria-label="Search" to="/bakery/app/search"><Search /></Link><Link className="bakery-cart-head" aria-label={`${count} items in cart`} to="/bakery/app/cart"><ShoppingBag /><b>{count}</b></Link></div></header>
    <main className="bakery-app-main"><Outlet /></main>
    <nav className="bakery-bottom-nav" aria-label="Bakery navigation">
      <NavLink end to="/bakery/app/"><Home /><span>Home</span></NavLink><NavLink to="/bakery/app/cakes"><CakeNavIcon /><span>Shop</span></NavLink><NavLink className="design" to="/bakery/app/design/cake-vintage-heart"><Sparkles /><span>Design</span></NavLink><NavLink to="/bakery/app/orders"><PackageCheck /><span>Orders</span></NavLink><NavLink to="/bakery/app/profile"><UserRound /><span>You</span></NavLink>
    </nav>
    {count > 0 && <Link className="bakery-floating-cart" to="/bakery/app/cart"><span>{count} {count === 1 ? 'item' : 'items'}</span><strong>VIEW BOX · ₹{cart.data?.quote?.subtotal ?? 0}</strong></Link>}
  </div>
}

function CakeNavIcon() { return <CalendarHeart /> }
