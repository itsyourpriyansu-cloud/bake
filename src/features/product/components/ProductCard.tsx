import { Plus } from 'lucide-react'
import type { CartItem, Product } from '../../../shared/types/domain'
import { IconButton, QuantityStepper } from '../../../shared/components'
import { getProductAsset } from '../../../shared/utils/assets'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ProductCard({ product, cartItem, cartCount = cartItem?.quantity ?? 0, onAdd, onQuantity }: { product: Product; cartItem?: CartItem; cartCount?: number; onAdd: () => void; onQuantity: (value: number) => void }) {
  const [failed, setFailed] = useState(false)
  const asset = getProductAsset(product.id, product.image)
  return <motion.article className="product-card" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
    <Link className={`product-art art-${product.category}`} to={`/app/product/${product.id}`} aria-label={`View ${product.name}`}>
      {!failed ? <img src={asset.src} alt={product.name} width="1024" height="1024" loading="lazy" decoding="async" draggable="false" onError={() => setFailed(true)} /> : <div className="food-fallback" role="img" aria-label={`${product.name} branded placeholder`}><span>{asset.fallbackLabel}</span><i /></div>}
      <div className="product-badges">{product.badges.filter((badge) => !['Veg', 'Customizable'].includes(badge)).slice(0, 2).map((badge) => <span className={`product-badge badge-${badge.toLowerCase().replace(' ', '-')}`} key={badge}>{badge}</span>)}</div>
    </Link>
    <div className="product-copy">
      <div className={`veg-marker ${product.veg ? 'veg' : 'non-veg'}`} aria-label={product.veg ? 'Vegetarian' : 'Non-vegetarian'}><span /></div>
      <h3><Link to={`/app/product/${product.id}`}>{product.name}</Link></h3><p>{product.description}</p>
      <div className="product-foot"><strong>₹{product.price}</strong><AnimatePresence mode="wait" initial={false}>{!product.available ? <motion.span key="unavailable" className="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Unavailable</motion.span> : product.modifierGroups?.length ? <motion.div className="customizable-add" key="customize" initial={{ opacity: 0, scale: .82 }} animate={{ opacity: 1, scale: 1 }}><span>{cartCount > 0 ? `${cartCount} in cart` : 'Customize'}</span><IconButton aria-label={`Customize and add ${product.name}`} onClick={onAdd}><Plus /></IconButton></motion.div> : cartItem ? <motion.div key="stepper" initial={{ opacity: 0, scale: .82 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .82 }}><QuantityStepper value={cartItem.quantity} onChange={onQuantity} /></motion.div> : <motion.div key="add" initial={{ opacity: 0, scale: .82 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: .86 }}><IconButton aria-label={`Add ${product.name}`} onClick={onAdd}><Plus /></IconButton></motion.div>}</AnimatePresence></div>
    </div>
  </motion.article>
}
