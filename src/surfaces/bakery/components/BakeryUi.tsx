import { AlertCircle, ArrowRight, CakeSlice, Check, Heart, Minus, Plus, RefreshCw, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BakeryProduct } from '../../../domain/bakery/bakery.types'
import { getBakeryProductAsset } from '../../../shared/utils/bakeryAssets'
import { useBakeryCartActions } from '../../../features/bakery/useBakery'
import { bakeryHaptic, useBakerySavedItems } from '../../../shared/utils/bakeryFavorites'

export function BakeryLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`bakery-logo ${compact ? 'compact' : ''}`}><CakeSlice aria-hidden="true" /><span><b>BAKERY</b><i>WAVE</i></span></span>
}

export function BakeryProductCard({ product }: { product: BakeryProduct }) {
  const actions = useBakeryCartActions()
  const saved = useBakerySavedItems()
  const [added, setAdded] = useState(false)
  const quickAdd = () => actions.add.mutate({ productId: product.id }, { onSuccess: () => { setAdded(true); bakeryHaptic(12) } })
  const favourite = saved.isFavourite(product.id)
  return <article className={`bakery-product-card ${!product.available ? 'unavailable' : ''}`}>
    <div className="bakery-product-media"><Link to={`/bakery/app/product/${product.id}`} className="bakery-product-visual">
      <img src={getBakeryProductAsset(product.id)} alt={product.name} loading="lazy" />
      <div className="bakery-card-tags">{product.bestseller && <span className="tag yellow">LOVED</span>}{product.new && <span className="tag blue">NEW</span>}{product.readyToday && <span className="tag green">READY TODAY</span>}</div>
    </Link><button type="button" className={`bakery-favourite-button ${favourite ? 'saved' : ''}`} aria-label={`${favourite ? 'Remove' : 'Save'} ${product.name} ${favourite ? 'from' : 'to'} favourites`} aria-pressed={favourite} onClick={() => saved.toggleFavourite(product.id)}><Heart fill={favourite ? 'currentColor' : 'none'} /></button></div>
    <div className="bakery-product-copy"><div><span className="bakery-product-meta">{product.servingLabel} · {product.leadHours ? `${product.leadHours}h` : 'Now'}</span><h3><Link to={`/bakery/app/product/${product.id}`}>{product.name}</Link></h3><p>{product.description}</p></div>
      <div className="bakery-product-footer"><strong>₹{product.basePrice}<small> onwards</small></strong><div className="bakery-card-actions">{product.customisable && product.available && <Link className="bakery-text-link" to={`/bakery/app/design/${product.id}`}><span className="bakery-desktop-label">PERSONALISE</span><span className="bakery-mobile-label">EDIT</span></Link>}<button type="button" onClick={quickAdd} disabled={!product.available || actions.add.isPending} aria-label={`${!product.available ? 'Unavailable' : added ? 'Added' : 'Add'} ${product.name}`} aria-live="polite">{!product.available ? <><AlertCircle /> PAUSED</> : added ? <><Check /> ADDED</> : <><Plus /> ADD</>}</button></div></div>
    </div>
  </article>
}

export function BakeryQuantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="bakery-quantity"><button type="button" aria-label="Decrease" onClick={() => onChange(value - 1)}><Minus /></button><strong>{value}</strong><button type="button" aria-label="Increase" onClick={() => onChange(value + 1)}><Plus /></button></div>
}

export function BakerySectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { label: string; to: string } }) {
  return <div className="bakery-section-title"><div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>{action && <Link to={action.to}><span>{action.label}</span><ArrowRight /></Link>}</div>
}

export function BakeryEmptyCart() {
  return <section className="bakery-empty"><ShoppingBag /><h2>YOUR BOX IS EMPTY</h2><p>Start with a ready favourite or design something completely yours.</p><Link className="bakery-button primary" to="/bakery/app/cakes">SHOP CAKES</Link></section>
}

export function BakeryStatePanel({ title, description, actionLabel, onAction, link }: { title: string; description: string; actionLabel?: string; onAction?: () => void; link?: string }) {
  return <section className="bakery-state-panel" role="status">
    <span><AlertCircle /></span>
    <h2>{title}</h2>
    <p>{description}</p>
    {actionLabel && onAction && <button type="button" className="bakery-button primary" onClick={onAction}><RefreshCw /> {actionLabel}</button>}
    {actionLabel && link && <Link className="bakery-button primary" to={link}>{actionLabel}</Link>}
  </section>
}
