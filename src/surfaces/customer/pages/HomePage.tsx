import { ArrowRight, Bike, CakeSlice, Clock3, CookingPot, CupSoda, Gift, Pizza, Popcorn, Search, Sandwich, Sparkles, Store, Utensils, UsersRound, Waves, type LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCapabilities } from '../../../features/availability/hooks/useCapabilities'
import { useMenu, useRecommendations } from '../../../features/catalog/hooks/useCatalog'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { useLoyalty } from '../../../features/loyalty/hooks/useLoyalty'
import { useOrders } from '../../../features/orders/hooks/useOrders'
import { ProductCard } from '../../../features/product/components/ProductCard'
import { filterMenuProducts } from '../../../domain/catalog/filterMenuProducts'
import type { LegacyProductView } from '../../../domain/catalog/catalog.types'
import type { CartItem } from '../../../shared/types/domain'
import { EmptyState, ErrorState, PointsBadge, Skeleton } from '../../../shared/components'
import { useAppStore } from '../../../stores/app.store'
import { useDemo } from '../../../app/providers/DemoProvider'
import { CustomerAsset } from '../components/CustomerAsset'
import { getCustomerOrderView, isActiveCustomerOrder } from '../../../domain/orders/customer-order.view'
import { useRetentionSummary } from '../../../features/retention/hooks/useRetention'
import { getProductAsset, pizzaWaveAssets } from '../../../shared/utils/assets'
import { motion } from 'framer-motion'

const categoryIcons: Record<string, LucideIcon> = { pizza: Pizza, kulhad: CookingPot, burger: Sandwich, wrap: Utensils, sides: Popcorn, shakes: CupSoda, desserts: CakeSlice }
type ProductAction = { cartItem?: CartItem; cartCount?: number; onAdd: () => void; onQuantity: (quantity: number) => void }

function SectionHeading({ eyebrow, title, to, link = 'See all' }: { eyebrow: string; title: string; to?: string; link?: string }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{to && <Link to={to}>{link} <ArrowRight /></Link>}</div>
}

function ProductRail({ eyebrow, title, products, actionFor, to }: { eyebrow: string; title: string; products: LegacyProductView[]; actionFor: (id: string) => ProductAction; to?: string }) {
  return <section className="home-section"><SectionHeading eyebrow={eyebrow} title={title} to={to} /><div className="product-scroll">{products.length ? products.map((product) => <ProductCard key={product.id} product={product} {...actionFor(product.id)} />) : <EmptyState title="Fresh batch incoming" message="These picks will be back in a moment." />}</div></section>
}

export default function HomePage() {
  const navigate = useNavigate()
  const storedMode = useAppStore((state) => state.fulfillmentMode)
  const mode = storedMode === 'STORE' ? 'DELIVERY' : storedMode
  const { customerLoggedIn } = useDemo()
  const capabilities = useCapabilities()
  const menu = useMenu()
  const recommendations = useRecommendations('personalized', customerLoggedIn)
  const popularRecommendations = useRecommendations('popular')
  const cart = useCart()
  const loyalty = useLoyalty(customerLoggedIn)
  const orders = useOrders(customerLoggedIn ? loyalty.data?.customer.id : undefined)
  const retention = useRetentionSummary(customerLoggedIn)
  const { add, update } = useCartActions()

  if (menu.isError || capabilities.isError) return <ErrorState retry={() => { void menu.refetch(); void capabilities.refetch() }} />

  const products = menu.data?.products ?? []
  const productAction = (productId: string): ProductAction => {
    const rows = cart.data?.items.filter((item) => item.productId === productId) ?? []
    const cartItem = rows[0]
    const product = products.find((item) => item.id === productId)
    return { cartItem, cartCount: rows.reduce((total, item) => total + item.quantity, 0), onAdd: () => product?.modifierGroups?.length ? navigate(`/app/build/${productId}`) : add.mutate(productId), onQuantity: (quantity) => { if (cartItem) update.mutate({ id: cartItem.id, quantity }) } }
  }
  const bestSellers = filterMenuProducts(products, { category: 'all', collection: 'best-sellers', query: '' })
  const under199 = filterMenuProducts(products, { category: 'pizza', collection: 'under-199', query: '' })
  const kulhad = products.find((product) => product.category === 'kulhad')
  const lastOrder = orders.data?.find((order) => ['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED'].includes(order.fulfillmentStatus))
  const activeOrder = orders.data?.find(isActiveCustomerOrder)
  const activeOrderProduct = activeOrder ? products.find((product) => product.id === activeOrder.items[0]?.productId) : undefined
  const activeOrderAsset = activeOrderProduct ? getProductAsset(activeOrderProduct.id, activeOrderProduct.image) : getProductAsset('PIZZA-CHK-001')
  const rankedRecommendations = retention.data?.recommendedProductIds.map((id) => products.find((product) => product.id === id)).filter((product): product is LegacyProductView => Boolean(product)) ?? recommendations.data ?? []
  const usual = retention.data?.usualProductIds.map((id) => products.find((product) => product.id === id)).filter((product): product is LegacyProductView => Boolean(product)) ?? (lastOrder ? lastOrder.items.map((item) => products.find((product) => product.id === item.productId)).filter((product): product is LegacyProductView => Boolean(product)) : (recommendations.data ?? []).slice(0, 2))
  const customerName = loyalty.data?.customer.firstName ?? 'there'
  const hero = customerLoggedIn
    ? { eyebrow: `${mode === 'DELIVERY' ? 'DELIVERED' : 'READY'} YOUR WAY`, title: 'Your usual\nis calling.', cta: 'ADD YOUR USUAL' }
    : { eyebrow: mode === 'DELIVERY' ? 'HOT TO YOUR DOOR' : 'FRESH AT GRAND ROAD', title: mode === 'DELIVERY' ? 'Puri’s pizza.\nDelivered hot.' : 'Skip the wait.\nPick up fresh.', cta: 'ORDER NOW' }

  return <div className="home-page stage-two-home">
    {customerLoggedIn && <section className="home-greeting"><div><span>GOOD EVENING</span><h1>Hey, {customerName}.</h1></div>{loyalty.data && <Link className="greeting-tier" to="/app/rewards"><strong>Gold Wave · {loyalty.data.customer.pointsAvailable} points</strong><span>{loyalty.data.customer.pointsPending} pending</span></Link>}</section>}
    <Link className="search-entry" to="/app/search"><Search /><span>Search pizza, paneer, shake…</span><kbd>⌘ K</kbd></Link>

    {activeOrder ? (() => { const orderStatus = getCustomerOrderView(activeOrder); return <Link className="home-active-order" to={`/app/orders/${activeOrder.id}`}>
      <div className="home-order-art"><CustomerAsset src={activeOrderAsset.src} alt={`${activeOrderProduct?.name ?? 'Pizza'} order in the kitchen`} fallbackLabel={activeOrderAsset.fallbackLabel} /><span><Bike /></span></div>
      <div className="home-order-copy"><span>LIVE · {activeOrder.publicOrderNumber}</span><h2>{orderStatus.label}</h2><p>{orderStatus.detail}</p><div><Clock3 /><strong>{activeOrder.promisedAt ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(activeOrder.promisedAt)) : 'Updating'}</strong><em>TRACK ORDER <ArrowRight /></em></div><i><b style={{ width: `${orderStatus.progress}%` }} /></i></div>
    </Link> })() : <motion.section className="smart-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .36, ease: [0.22, 1, 0.36, 1] }}>
      <CustomerAsset src={pizzaWaveAssets.hero.mainPizza} alt="Fresh vegetable pizza with a cheese pull" className="smart-hero-image" eager />
      <div className="smart-hero-shade" />
      <div className="smart-hero-copy"><span className="eyebrow">{hero.eyebrow}</span><h2>{hero.title}</h2>{customerLoggedIn ? <button className="button hero-cta" onClick={() => lastOrder ? lastOrder.items.forEach((item) => add.mutate({ productId: item.productId, quantity: item.quantity, modifiers: item.modifiers })) : navigate('/app/menu')}>{hero.cta}<ArrowRight size={18} /></button> : <Link className="button hero-cta" to="/app/menu">{hero.cta}<ArrowRight size={18} /></Link>}</div>
      <span className="hero-mode"><Store size={15} />{mode === 'DELIVERY' ? 'Delivery from Grand Road' : 'Pickup at Grand Road'}</span>
    </motion.section>}

    {!customerLoggedIn && <section className="home-section"><SectionHeading eyebrow="QUICK PICKS" title="What are you craving?" to="/app/menu" link="Full menu" /><div className="category-row">{menu.isPending ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="category-skeleton" />) : menu.data?.categories.length ? menu.data.categories.map((category) => { const Icon = categoryIcons[category.id] ?? Pizza; return <Link className={`category-tile color-${category.color}`} to={`/app/menu?category=${category.id}`} key={category.id}><span><Icon aria-hidden="true" /></span><strong>{category.name}</strong></Link> }) : <EmptyState title="Menu is warming up" message="Fresh picks will appear here shortly." />}</div></section>}

    {customerLoggedIn ? <>
      <section className="home-section usual-section"><SectionHeading eyebrow="YOUR USUAL" title="Ready when you are" /><div className="usual-products">{usual.map((product) => <ProductCard key={product.id} product={product} {...productAction(product.id)} />)}</div></section>
      {retention.data?.secondOrderLoop && <section className="second-order-loop"><Sparkles /><div><span>NEXT WAVE MILESTONE</span><h2>{retention.data.secondOrderLoop.title}</h2><p>{retention.data.secondOrderLoop.message}</p></div><Link to="/app/menu">ORDER AGAIN <ArrowRight /></Link></section>}
      {lastOrder && <section className="reorder-preview"><div className="usual-mark"><Sparkles /></div><div><span>REORDER PREVIEW · {lastOrder.publicOrderNumber}</span><h2>{lastOrder.items.map((item) => item.name).join(' + ')}</h2><p>{lastOrder.items.length} items · ₹{lastOrder.financialSnapshot.total}</p></div><Link to="/app/orders" aria-label="View previous order"><ArrowRight /></Link></section>}
      {loyalty.data && <section className="points-card platinum-card"><div><span className="eyebrow">GOLD WAVE</span><h2><motion.span key={loyalty.data.customer.pointsAvailable} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}>{loyalty.data.customer.pointsAvailable}</motion.span> Wave Points</h2><p>{loyalty.data.ordersNeeded} orders + ₹{loyalty.data.spendNeeded} to Platinum</p></div><div className="points-visual"><div className="points-orbit"><CustomerAsset src={pizzaWaveAssets.loyalty.gold} alt="Gold Wave tier emblem" className="home-tier-emblem" fallbackLabel="Gold" /><Waves /></div><PointsBadge points={loyalty.data.customer.pointsPending} /></div><div className="tier-progress-label"><span>{loyalty.data.customer.rolling120Orders} orders</span><span>{loyalty.data.customer.rolling120Orders + loyalty.data.ordersNeeded} for Platinum</span></div><div className="progress-pair"><span style={{ width: `${Math.min(100, (loyalty.data.customer.rolling120Orders / (loyalty.data.customer.rolling120Orders + loyalty.data.ordersNeeded)) * 100)}%` }} /></div></section>}
      <ProductRail eyebrow={`${retention.data?.favouriteCategory.toUpperCase() ?? 'PIZZA'} LOVER · PICKED FOR ${customerName.toUpperCase()}`} title="You might love these" products={rankedRecommendations} actionFor={productAction} to="/app/menu" />
      <section className="relevant-offer"><div><span>YOUR GOLD-WAVE PICK</span><h2>A little extra for your next pizza night.</h2><Link to="/app/offers">SEE YOUR OFFER <ArrowRight /></Link></div><CustomerAsset src={pizzaWaveAssets.macro.cheesePull} alt="Pizza slice with melted cheese" /></section>
      <ProductRail eyebrow="THE CROWD AGREES" title="Best sellers" products={bestSellers} actionFor={productAction} to="/app/menu?collection=best-sellers" />
      <section className="saved-order-card"><div><span>RULE-BASED PERSONAL PICK</span><h2>{retention.data?.savedOrderName ?? 'Saturday Night'}</h2><p>{usual.map((product) => product.name).join(' · ')}</p></div><Link className="button button-secondary" to="/app/saved-orders">OPEN SAVED ORDER</Link></section>
    </> : <>
      <ProductRail eyebrow="POPULAR IN PURI" title="Local favourites" products={popularRecommendations.data ?? []} actionFor={productAction} to="/app/menu?collection=best-sellers" />
      <ProductRail eyebrow="VALUE PICKS" title="Pizza under ₹199" products={under199} actionFor={productAction} to="/app/menu?category=pizza&collection=under-199" />
      {kulhad && <section className="kulhad-feature"><CustomerAsset src={pizzaWaveAssets.hero.kulhadPizza} alt="Signature kulhad pizza with molten cheese" /><div><span>ONLY AT THE WAVE</span><h2>{kulhad.name}</h2><p>{kulhad.description}</p><div className="feature-price"><strong>₹{kulhad.price}</strong>{productAction(kulhad.id).cartItem ? <span>In your cart</span> : <button onClick={productAction(kulhad.id).onAdd}>ADD <ArrowRight /></button>}</div></div></section>}
      <section className="builder-card stage-two-builder"><div><span className="eyebrow">MAKE IT YOURS</span><h2>Build your pizza,<br />your way.</h2><p>Base, cheese, toppings, spice—your call.</p><Link className="button button-secondary" to="/app/build/PIZZA-VEG-001">START BUILDING <ArrowRight size={18} /></Link></div><CustomerAsset src={getProductAsset('PIZZA-VEG-001').src} alt="Classic vegetable pizza" /></section>
      <ProductRail eyebrow="MOST-ORDERED" title="Best sellers" products={bestSellers} actionFor={productAction} to="/app/menu?collection=best-sellers" />
      <section className="group-deals"><SectionHeading eyebrow="BETTER TOGETHER" title="Group deals" to="/app/menu?collection=family" link="See picks" /><div className="deal-grid"><Link to="/app/menu?collection=for-two"><CustomerAsset src={pizzaWaveAssets.hero.friendsSharing} alt="Friends sharing pizza" /><span>FOR TWO</span><h3>Pizza night, sorted.</h3></Link><Link to="/app/menu?collection=family"><CustomerAsset src={pizzaWaveAssets.lifestyle.familyCombo} alt="Family sharing pizza and sides" /><span>FEED THE CREW</span><h3>Big table energy.</h3></Link></div></section>
    </>}

    <section className="referral-card"><CustomerAsset src={pizzaWaveAssets.lifestyle.referralFriends} alt="Friends sharing pizza together" /><div><Gift /><span>SHARE THE WAVE</span><h2>Give ₹50.<br />Get 60 points.</h2><Link to="/app/refer">INVITE A FRIEND <ArrowRight /></Link></div></section>
    <section className="service-note"><div><Pizza /><span><strong>Fresh from Grand Road</strong>Puri, Odisha</span></div><div><UsersRound /><span><strong>Made for sharing</strong>Or keeping to yourself</span></div></section>
  </div>
}
