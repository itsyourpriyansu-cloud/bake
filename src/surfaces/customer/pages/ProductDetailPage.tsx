import { ArrowLeft, ArrowRight, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProduct } from '../../../features/catalog/hooks/useCatalog'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { ErrorState, IconButton, PointsBadge, PrimaryButton, QuantityStepper, Skeleton, StickyBottomAction } from '../../../shared/components'
import { getProductAsset } from '../../../shared/utils/assets'
import { CustomerAsset } from '../components/CustomerAsset'

export default function ProductDetailPage() {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const detail = useProduct(productId)
  const cart = useCart()
  const { add, update } = useCartActions()

  if (detail.isPending) return <section className="commerce-page product-detail-page"><Skeleton className="detail-hero-skeleton" /><Skeleton className="detail-copy-skeleton" /></section>
  if (detail.isError || !detail.data) return <section className="commerce-page"><ErrorState retry={() => void detail.refetch()} /></section>

  const { product, pairings, pointsPreview } = detail.data
  const customizable = Boolean(product.modifierGroups?.length)
  const asset = getProductAsset(product.id, product.image)
  const addDirectly = async () => {
    await add.mutateAsync(product.id)
    navigate('/app/cart')
  }

  return <motion.section className="commerce-page product-detail-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="detail-visual">
      <IconButton className="page-back" aria-label="Back to menu" onClick={() => navigate(-1)}><ArrowLeft /></IconButton>
      <CustomerAsset src={asset.src} alt={product.name} eager fallbackLabel={asset.fallbackLabel} />
      <div className="detail-badges">{product.badges.filter((badge) => badge !== 'Veg').slice(0, 3).map((badge) => <span key={badge}>{badge}</span>)}</div>
    </div>

    <div className="detail-content">
      <div className="detail-title-row"><div><span className={`veg-status ${product.veg ? 'veg' : 'non-veg'}`}><i />{product.veg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}</span><h1>{product.name}</h1></div><strong>₹{product.price}</strong></div>
      <p className="detail-description">{product.description}</p>

      {customizable && <section className="detail-modifiers">
        <div className="section-heading"><div><span>MAKE IT YOURS</span><h2>Seven choices. One perfect pizza.</h2></div></div>
        <div className="modifier-preview-grid">{product.modifierGroups?.map((group, index) => <article key={group.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{group.name}</strong><small>{group.required ? 'Required' : `Choose up to ${group.maxSelections}`}</small></div></article>)}</div>
        <Link className="customize-link" to={`/app/build/${product.id}`}>OPEN PIZZA BUILDER <ArrowRight size={18} /></Link>
      </section>}

      <section className="points-preview"><Sparkles aria-hidden="true" /><div><span>GOLD WAVE PREVIEW</span><strong>Earn +{pointsPreview} points</strong><p>Points become available after your order is completed.</p></div><PointsBadge points={pointsPreview} /></section>

      {pairings.length > 0 && <section className="pairings-section"><div className="section-heading"><div><span>PAIR WITH</span><h2>Make it a meal</h2></div></div><div className="pairings-row">{pairings.map((pairing) => {
        const pairingAsset = getProductAsset(pairing.id, pairing.image)
        const cartItem = cart.data?.items.find((row) => row.productId === pairing.id)
        return <article key={pairing.id}><Link to={`/app/product/${pairing.id}`}><CustomerAsset src={pairingAsset.src} alt={pairing.name} fallbackLabel={pairingAsset.fallbackLabel} /></Link><div><strong>{pairing.name}</strong><span>₹{pairing.price}</span></div>{cartItem ? <QuantityStepper value={cartItem.quantity} onChange={(quantity) => update.mutate({ id: cartItem.id, quantity })} /> : <IconButton aria-label={`Add ${pairing.name}`} disabled={!pairing.available || add.isPending} onClick={() => add.mutate(pairing.id)}><Plus /></IconButton>}</article>
      })}</div></section>}
    </div>

    <StickyBottomAction><div><span>{customizable ? 'FROM' : 'PRICE'}</span><strong>₹{product.price}</strong></div><PrimaryButton disabled={!product.available || add.isPending} onClick={() => customizable ? navigate(`/app/build/${product.id}`) : void addDirectly()}>{product.available ? customizable ? 'CUSTOMIZE & ADD' : 'ADD TO CART' : 'CURRENTLY UNAVAILABLE'} <ArrowRight size={18} /></PrimaryButton></StickyBottomAction>
  </motion.section>
}
