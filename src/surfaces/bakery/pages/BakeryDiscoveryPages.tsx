import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Baby, BriefcaseBusiness, CakeSlice, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Gift, Heart, Leaf, MapPin, Palette, PartyPopper, Pause, Play, Search, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useBakeryCartActions, useBakeryCatalog, useBakeryProduct } from '../../../features/bakery/useBakery'
import { bakeryAssets, getBakeryProductAsset } from '../../../shared/utils/bakeryAssets'
import { readBakeryCustomer } from '../../../shared/utils/bakerySession'
import { bakeryCategoryLabels } from '../../../prototype/bakery/bakery.seed'
import type { BakeryCategory, BakeryEvent, BakeryProduct, BakeryStyle } from '../../../domain/bakery/bakery.types'
import { BakeryProductCard, BakerySectionTitle, BakeryStatePanel } from '../components/BakeryUi'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const events: Array<{ id: BakeryEvent; label: string; icon: ReactNode; color: string }> = [
  { id: 'BIRTHDAY', label: 'Birthday', icon: <CakeSlice />, color: 'lemon' }, { id: 'ANNIVERSARY', label: 'Anniversary', icon: <Sparkles />, color: 'coral' },
  { id: 'WEDDING', label: 'Wedding', icon: <Heart />, color: 'lavender' }, { id: 'KIDS', label: 'Kids’ party', icon: <PartyPopper />, color: 'blue' },
  { id: 'BABY_SHOWER', label: 'Baby shower', icon: <Baby />, color: 'peach' }, { id: 'CORPORATE', label: 'Office event', icon: <BriefcaseBusiness />, color: 'green' },
]

const styles: Array<{ id: BakeryStyle; label: string; description: string; image: string }> = [
  { id: 'VINTAGE', label: 'Classic heart cake', description: 'Colourful borders, cherries and a heart shape.', image: bakeryAssets.product.vintage },
  { id: 'FLORAL', label: 'Flower cake', description: 'Soft colours with handcrafted flowers.', image: bakeryAssets.product.floral },
  { id: 'CHOCOLATE', label: 'Chocolate cake', description: 'Rich chocolate with a smooth finish.', image: bakeryAssets.product.chocolate },
]

const marqueeItems = ['MADE FRESH FOR YOUR ORDER', 'EGGLESS OPTION AVAILABLE', 'DELIVERY AND PICKUP', 'MADE WITH CARE IN CUTTACK']

const heroSlides = [
  { title: 'Birthday Celebration Cake', description: 'Bright colours for a joyful birthday.', price: 'From ₹899', image: bakeryAssets.hero, href: '/bakery/app/design/cake-vintage-heart' },
  { title: 'Heart-Shaped Cake', description: 'A classic choice for birthdays and anniversaries.', price: 'From ₹749', image: bakeryAssets.product.vintage, href: '/bakery/app/product/cake-vintage-heart' },
  { title: 'Flower Celebration Cake', description: 'Soft colours with handcrafted flowers.', price: 'From ₹999', image: bakeryAssets.product.floral, href: '/bakery/app/product/cake-floral-lavender' },
  { title: 'Chocolate Truffle Cake', description: 'Rich chocolate with a smooth, creamy finish.', price: 'From ₹849', image: bakeryAssets.product.chocolate, href: '/bakery/app/product/cake-chocolate-truffle' },
  { title: 'Dark Chocolate Cake', description: 'A full chocolate cake for family celebrations.', price: 'From ₹799', image: '/assets/bakery/gallery/dark-truffle.webp', href: '/bakery/app/product/cake-chocolate-truffle' },
  { title: 'Chocolate Birthday Cake', description: 'Simple, familiar and easy to personalise.', price: 'From ₹699', image: '/assets/bakery/gallery/minimal-white.webp', href: '/bakery/app/cakes' },
  { title: 'Layered Coffee Cake', description: 'Light layers for a small get-together.', price: 'From ₹549', image: '/assets/bakery/gallery/berry-layer.webp', href: '/bakery/app/cakes' },
  { title: 'Strawberry Cupcakes', description: 'Easy-to-share treats for parties and gifting.', price: 'From ₹299', image: '/assets/bakery/gallery/pastel-party.webp', href: '/bakery/app/bakes' },
] as const

const heroTitleWords = ['YOUR', 'CAKE,', 'MADE', 'YOUR', 'WAY.']

export function BakeryHomePage() {
  const catalog = useBakeryCatalog(); const customer = readBakeryCustomer(); const products = catalog.data?.products ?? []
  const [fulfillment, setFulfillment] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY'); const [fulfillmentOpen, setFulfillmentOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0); const [carouselPaused, setCarouselPaused] = useState(false); const [carouselHovering, setCarouselHovering] = useState(false); const [carouselFocused, setCarouselFocused] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null); const pointerStartX = useRef(0)
  const best = products.filter((product) => product.bestseller).slice(0, 4); const ready = products.filter((product) => product.readyToday && product.category !== 'CAKES').slice(0, 4)

  const showSlide = (index: number) => setActiveSlide((index + heroSlides.length) % heroSlides.length)
  useEffect(() => {
    if (carouselPaused || carouselHovering || carouselFocused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 4800)
    return () => window.clearInterval(timer)
  }, [activeSlide, carouselFocused, carouselHovering, carouselPaused])

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.bakery-hero-title-word', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: .06, duration: .55, ease: 'power2.out' })
      gsap.utils.toArray<HTMLElement>('[data-home-reveal]').forEach((section) => {
        gsap.fromTo(section, { opacity: .55, y: 28, scale: .985 }, { opacity: 1, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 94%', end: 'top 72%', scrub: .55 } })
        const heading = section.querySelector('.bakery-section-title h2')
        if (heading) gsap.fromTo(heading, { opacity: .2 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: heading, start: 'top 92%', end: 'bottom 65%', scrub: .5 } })
      })
      gsap.utils.toArray<HTMLElement>('[data-home-media]').forEach((mediaItem) => {
        gsap.fromTo(mediaItem, { opacity: .45, scale: .92 }, { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: mediaItem, start: 'top 94%', end: 'center 62%', scrub: .65 } })
      })
    })
    return () => media.revert()
  }, { scope: homeRef })

  useGSAP(() => {
    const active = homeRef.current?.querySelector('.bakery-cake-slide.is-active')
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(active.querySelector('img'), { opacity: .55, scale: 1.08 }, { opacity: 1, scale: 1, duration: .85, ease: 'power2.out' })
    gsap.fromTo(active.querySelector('figcaption'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .55, delay: .12, ease: 'power2.out' })
  }, { scope: homeRef, dependencies: [activeSlide] })

  const activeCake = heroSlides[activeSlide]
  return <div ref={homeRef} className="bakery-home">
    <section className="bakery-fulfillment"><button type="button" aria-haspopup="dialog" onClick={() => setFulfillmentOpen(true)}><MapPin /><span><small>{fulfillment === 'DELIVERY' ? 'DELIVERY TO' : 'PICKUP FROM'}</small><b>Grand Road, Cuttack</b></span><ChevronRight /></button><Link to="/bakery/app/celebrations"><CalendarDays /><span><small>NEXT CELEBRATION</small><b>Add a date</b></span></Link></section>
    <section className="bakery-app-hero" aria-labelledby="bakery-home-title">
      <div className="bakery-app-hero-copy">
        <span className="bakery-kicker">CAKES FOR EVERY CELEBRATION</span>
        <h1 id="bakery-home-title" aria-label="Your cake, made your way.">{heroTitleWords.map((word, index) => <span className="bakery-hero-title-word" key={`${word}-${index}`}>{word}{' '}</span>)}</h1>
        <p>Choose a ready cake or customise the size, flavour, colour and message.</p>
        <div className="bakery-hero-actions"><Link className="bakery-button primary" to="/bakery/app/design/cake-vintage-heart">DESIGN A CAKE <ArrowRight /></Link><Link className="bakery-button secondary" to="/bakery/app/cakes">SHOP ALL CAKES</Link></div>
        <div className="bakery-hero-assurance" aria-label="Ordering information"><span><Check />Eggless option available</span><span><Clock3 />Preparation time shown clearly</span></div>
      </div>
      <div className="bakery-app-hero-art bakery-cake-carousel" role="region" aria-roledescription="carousel" aria-label="Featured cakes" onMouseEnter={() => setCarouselHovering(true)} onMouseLeave={() => setCarouselHovering(false)} onFocusCapture={() => setCarouselFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCarouselFocused(false) }} onPointerDown={(event) => { pointerStartX.current = event.clientX }} onPointerUp={(event) => { const distance = event.clientX - pointerStartX.current; if (Math.abs(distance) > 42) showSlide(activeSlide + (distance < 0 ? 1 : -1)) }}>
        <Link className="bakery-cake-slide-link" to={activeCake.href} aria-label={`View ${activeCake.title}`}>
          {heroSlides.map((slide, index) => <figure className={`bakery-cake-slide ${index === activeSlide ? 'is-active' : ''}`} aria-hidden={index !== activeSlide} key={slide.title}><img src={slide.image} alt={index === activeSlide ? slide.title : ''} loading={index === 0 ? 'eager' : 'lazy'} /><figcaption><span>{slide.price}</span><strong>{slide.title}</strong><small>{slide.description}</small></figcaption></figure>)}
        </Link>
        <div className="bakery-cake-carousel-controls"><button type="button" onClick={() => showSlide(activeSlide - 1)} aria-label="Show previous cake"><ChevronLeft /></button><span aria-live="polite"><b>{String(activeSlide + 1).padStart(2, '0')}</b> / {String(heroSlides.length).padStart(2, '0')}</span><button type="button" onClick={() => showSlide(activeSlide + 1)} aria-label="Show next cake"><ChevronRight /></button><button className="bakery-carousel-toggle" type="button" aria-pressed={carouselPaused} onClick={() => setCarouselPaused((value) => !value)}>{carouselPaused ? <Play /> : <Pause />}<span>{carouselPaused ? 'Play' : 'Pause'}</span></button></div>
        <div className="bakery-cake-thumbnails" aria-label="Choose a featured cake">{heroSlides.map((slide, index) => <button type="button" className={index === activeSlide ? 'active' : ''} aria-current={index === activeSlide ? 'true' : undefined} aria-label={`Show ${slide.title}`} onClick={() => showSlide(index)} key={slide.title}><img src={slide.image} alt="" /></button>)}</div>
        {!carouselPaused && !carouselHovering && !carouselFocused && <span className="bakery-carousel-progress" key={activeSlide} aria-hidden="true" />}
      </div>
    </section>
    <div className="bakery-trust-marquee" aria-label="Bakery promises"><div>{[...marqueeItems, ...marqueeItems].map((item, index) => <span key={`${item}-${index}`}><i aria-hidden="true" />{item}</span>)}</div></div>
    <section className="bakery-home-section" data-home-reveal><BakerySectionTitle eyebrow="FIND THE RIGHT CAKE" title="CHOOSE YOUR CELEBRATION" /><div className="bakery-event-grid">{events.map((event) => <Link className={event.color} to={`/bakery/app/events/${event.id.toLowerCase()}`} key={event.id}><span aria-hidden="true">{event.icon}</span><b>{event.label}</b></Link>)}</div></section>
    <section className="bakery-order-paths" data-home-reveal><BakerySectionTitle eyebrow="ORDER IN THE WAY YOU PREFER" title="HOW WOULD YOU LIKE TO ORDER?" /><div><Link to="/bakery/app/cakes"><b>01</b><span><strong>SHOP READY CAKES</strong><small>Choose a finished design and order quickly</small></span><ArrowRight /></Link><Link to="/bakery/app/styles/vintage"><b>02</b><span><strong>CUSTOMISE A DESIGN</strong><small>Change the size, flavour, colour and message</small></span><ArrowRight /></Link><Link to="/bakery/app/design/cake-vintage-heart"><b>03</b><span><strong>CREATE YOUR OWN CAKE</strong><small>Build your cake step by step</small></span><ArrowRight /></Link><Link to="/bakery/app/bespoke"><b>04</b><span><strong>SHARE A REFERENCE PHOTO</strong><small>Upload a cake photo for the bakery to review</small></span><ArrowRight /></Link></div></section>
    <section className="bakery-home-section" data-home-reveal><BakerySectionTitle eyebrow="POPULAR CAKE STYLES" title="CHOOSE A LOOK YOU LIKE" action={{ label: 'See all styles', to: '/bakery/app/styles/vintage' }} /><div className="bakery-style-grid">{styles.map((style) => <Link to={`/bakery/app/styles/${style.id.toLowerCase()}`} key={style.id}><img data-home-media src={style.image} alt={style.label} loading="lazy" /><span><b>{style.label}</b><small>{style.description}</small></span></Link>)}</div></section>
    <section className="bakery-home-section" data-home-reveal><BakerySectionTitle eyebrow="MOST ORDERED" title="CAKES OUR CUSTOMERS LOVE" action={{ label: 'See all cakes', to: '/bakery/app/cakes' }} />{catalog.isError ? <BakeryStatePanel title="WE COULDN’T LOAD THE CAKES" description="Please try again in a moment." actionLabel="TRY AGAIN" onAction={() => void catalog.refetch()} /> : catalog.isLoading ? <div className="bakery-loading-row">Loading popular cakes…</div> : <div className="bakery-product-grid">{best.map((product) => <BakeryProductCard product={product} key={product.id} />)}</div>}</section>
    <section className="bakery-builder-banner" data-home-reveal><div><Sparkles /><span className="bakery-kicker">CUSTOMISE YOUR CAKE</span><h2>CHOOSE THE SIZE, FLAVOUR, COLOUR AND MESSAGE.</h2><p>See the price and preparation time update while you make your choices.</p><Link className="bakery-button primary" to="/bakery/app/design/cake-floral-lavender">START CUSTOMISING</Link></div><img data-home-media src={bakeryAssets.product.floral} alt="Flower celebration cake" loading="lazy" /></section>
    <section className="bakery-home-section" data-home-reveal><BakerySectionTitle eyebrow="AVAILABLE TODAY" title="FRESH BAKES YOU CAN ORDER NOW" action={{ label: 'See today’s bakes', to: '/bakery/app/bakes' }} />{catalog.isError ? <BakeryStatePanel title="WE COULDN’T LOAD TODAY’S BAKES" description="Please try again in a moment." actionLabel="TRY AGAIN" onAction={() => void catalog.refetch()} /> : <div className="bakery-product-grid">{ready.map((product) => <BakeryProductCard product={product} key={product.id} />)}</div>}</section>
    {customer ? <section className="bakery-points-card" data-home-reveal><div><Star /><span>REWARD POINTS</span><h2>182</h2><p>Gold member · ₹880 more to reach Platinum</p></div><div><strong>YOUR NEXT ORDER EARNS MORE POINTS</strong><p>Keep your saved cake designs and celebration details together.</p><Link to="/bakery/app/rewards">VIEW YOUR REWARDS <ArrowRight /></Link></div></section> : <section className="bakery-points-card guest" data-home-reveal><div><Gift /><span>REWARD POINTS</span><h2>EARN POINTS ON EVERY ORDER.</h2></div><div><strong>SIGN IN WHEN YOU ARE READY TO ORDER</strong><p>You can browse without signing in. Sign in at checkout to earn points and save cake designs.</p><Link to="/bakery/app/auth?returnTo=/bakery/app/rewards">LEARN ABOUT REWARDS <ArrowRight /></Link></div></section>}
    {fulfillmentOpen && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setFulfillmentOpen(false)}><section className="bakery-choice-sheet" role="dialog" aria-modal="true" aria-labelledby="bakery-fulfillment-title" onMouseDown={(event) => event.stopPropagation()}><span className="bakery-kicker">CHOOSE HOW TO RECEIVE YOUR ORDER</span><h2 id="bakery-fulfillment-title">DELIVERY OR PICKUP</h2><p>Select delivery to your address or pickup from our Grand Road store. The fee and time are shown before checkout.</p><button type="button" className={fulfillment === 'DELIVERY' ? 'selected' : ''} onClick={() => { setFulfillment('DELIVERY'); setFulfillmentOpen(false) }}><MapPin /><span><b>Delivery</b><small>Delivered carefully to your address</small></span>{fulfillment === 'DELIVERY' && <Check />}</button><button type="button" className={fulfillment === 'PICKUP' ? 'selected' : ''} onClick={() => { setFulfillment('PICKUP'); setFulfillmentOpen(false) }}><CalendarDays /><span><b>Pickup</b><small>Collect from Grand Road, Cuttack</small></span>{fulfillment === 'PICKUP' && <Check />}</button><button className="bakery-sheet-close" type="button" onClick={() => setFulfillmentOpen(false)}>KEEP {fulfillment}</button></section></div>}
  </div>
}

const dailyCategories: BakeryCategory[] = ['PASTRIES', 'BROWNIES', 'BREADS', 'SAVOURIES', 'GIFTING']

export function BakeryCatalogPage() {
  const catalog = useBakeryCatalog(); const location = useLocation(); const params = useParams(); const all = catalog.data?.products ?? []
  const isBakes = location.pathname.endsWith('/bakes'); const style = params.styleSlug?.toUpperCase() as BakeryStyle | undefined; const event = params.eventSlug?.toUpperCase() as BakeryEvent | undefined
  const [category, setCategory] = useState<string>(isBakes ? 'PASTRIES' : 'ALL'); const [readyOnly, setReadyOnly] = useState(false); const [egglessOnly, setEgglessOnly] = useState(false); const [under500, setUnder500] = useState(false)
  useEffect(() => { setCategory(isBakes ? 'PASTRIES' : 'ALL'); setReadyOnly(false); setEgglessOnly(false); setUnder500(false) }, [isBakes, style, event])
  const products = all.filter((product) => style ? product.style === style : event ? product.events.includes(event) : isBakes ? dailyCategories.includes(product.category) && (category === 'ALL' || product.category === category) : (product.category === 'CAKES' || product.category === 'BENTO') && (category === 'ALL' || product.category === category)).filter((product) => !readyOnly || product.readyToday).filter((product) => !egglessOnly || product.egglessAvailable).filter((product) => !under500 || product.basePrice < 500)
  const title = style ? `${style.replaceAll('_', ' ')} CAKES` : event ? `${event.replaceAll('_', ' ')} CAKES` : isBakes ? 'BAKED FRESH TODAY' : 'CAKES FOR EVERY KIND OF HAPPY'
  const categoryOptions: string[] = isBakes ? ['ALL', ...dailyCategories] : ['ALL', 'CAKES', 'BENTO']
  return <div className="bakery-catalog-page"><header className="bakery-page-intro"><span className="bakery-kicker">HANDMADE IN CUTTACK</span><h1>{title}</h1><p>{isBakes ? 'Fresh sweet and savoury items you can enjoy today.' : 'Choose a ready cake or customise the size, flavour, colour and message.'}</p></header>
    {!style && !event && <div className="bakery-category-tabs">{categoryOptions.map((item) => <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>{item === 'ALL' ? 'All' : bakeryCategoryLabels[item]}</button>)}</div>}
    <div className="bakery-catalog-tools"><div className="bakery-filter-chips" aria-label="Filter the bakery"><button type="button" aria-pressed={readyOnly} className={readyOnly ? 'active' : ''} onClick={() => setReadyOnly((value) => !value)}><Clock3 /> Ready today</button><button type="button" aria-pressed={egglessOnly} className={egglessOnly ? 'active' : ''} onClick={() => setEgglessOnly((value) => !value)}><Leaf /> Eggless</button><button type="button" aria-pressed={under500} className={under500 ? 'active' : ''} onClick={() => setUnder500((value) => !value)}>Under ₹500</button></div><div className="bakery-filter-note"><Clock3 /><span><b>{products.filter((product) => product.readyToday).length} ready today</b><small>Preparation times are shown before checkout</small></span></div></div>
    <div className="bakery-mobile-shop-summary" role="status" aria-live="polite"><span><b>{products.length}</b> {products.length === 1 ? 'bake' : 'bakes'} to explore</span><Link to="/bakery/app/search" aria-label="Search the bakery"><Search /> SEARCH</Link></div>
    {catalog.isError ? <BakeryStatePanel title="WE COULDN’T LOAD THE CAKES" description="Your filters are still selected. Please try again." actionLabel="TRY AGAIN" onAction={() => void catalog.refetch()} /> : catalog.isLoading ? <div className="bakery-loading-row">Loading today’s cakes…</div> : products.length ? <div className="bakery-product-grid">{products.map((product) => <BakeryProductCard product={product} key={product.id} />)}</div> : <BakeryStatePanel title="NO CAKES MATCH THESE FILTERS" description="Clear a filter, choose another category or send a custom cake request." actionLabel="VIEW ALL CAKES" link="/bakery/app/cakes" />}
  </div>
}

const recentSearchKey = 'bakery-wave:recent-searches'

export function BakerySearchPage() {
  const catalog = useBakeryCatalog(); const [query, setQuery] = useState(''); const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(recentSearchKey) ?? '[]') as string[] } catch { return [] } })
  const normalized = query.toLowerCase().trim()
  const results = useMemo(() => { if (!normalized) return []; const products = catalog.data?.products ?? []; if (/under\s*(₹|rs\.?\s*)?500/.test(normalized)) return products.filter((product) => product.basePrice < 500); if (normalized.includes('ready today')) return products.filter((product) => product.readyToday); if (normalized.includes('eggless')) return products.filter((product) => product.egglessAvailable); const words = normalized.split(/\s+/).filter(Boolean); return products.filter((product) => words.every((word) => `${product.name} ${product.description} ${product.category} ${product.style ?? ''} ${product.events.join(' ')}`.toLowerCase().includes(word))) }, [catalog.data, normalized])
  const popular = ['chocolate', 'birthday', 'eggless', 'ready today', 'floral', 'under 500']
  const commitSearch = (term = query) => { const clean = term.trim(); if (!clean) return; const next = [clean, ...recent.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 4); setRecent(next); localStorage.setItem(recentSearchKey, JSON.stringify(next)) }
  const submit = (event: FormEvent) => { event.preventDefault(); commitSearch() }
  return <div className="bakery-search-page"><header className="bakery-page-intro"><span className="bakery-kicker">FIND THE RIGHT CAKE</span><h1>SEARCH THE BAKERY</h1></header><form className="bakery-search-box" onSubmit={submit}><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cake, flavour, event or budget" /><button type="submit">SEARCH</button></form>{recent.length > 0 && <div className="bakery-popular-search recent"><b>RECENT SEARCHES</b><div>{recent.map((term) => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}</div></div>}<div className="bakery-popular-search"><b>POPULAR RIGHT NOW</b><div>{popular.map((term) => <button type="button" key={term} onClick={() => { setQuery(term); commitSearch(term) }}>{term}</button>)}</div></div>{catalog.isError ? <BakeryStatePanel title="SEARCH IS NOT AVAILABLE" description="Please check your connection and try again." actionLabel="TRY AGAIN" onAction={() => void catalog.refetch()} /> : normalized && <section><BakerySectionTitle eyebrow={`${results.length} MATCHES`} title={results.length ? `FOR “${query.toUpperCase()}”` : 'NO MATCHES FOUND'} />{results.length ? <div className="bakery-product-grid">{results.map((product) => <BakeryProductCard product={product} key={product.id} />)}</div> : <BakeryStatePanel title="TRY A SIMPLE SEARCH" description="Search chocolate, birthday, eggless, ready today or under 500." actionLabel="BROWSE ALL CAKES" link="/bakery/app/cakes" />}</section>}</div>
}

function presetSelections(product: BakeryProduct, kind: 'classic' | 'eggless' | 'party') {
  return product.modifierGroups.filter((group) => group.required).map((group) => {
    let option = group.options.find((item) => item.recommended) ?? group.options[0]
    if (kind === 'eggless' && group.id === 'sponge') option = group.options.find((item) => item.id === 'eggless') ?? option
    if (kind === 'party' && group.id === 'size') option = group.options.find((item) => item.id === 'one-kg') ?? option
    return { groupId: group.id, optionIds: [option.id] }
  })
}

export function BakeryProductPage() {
  const { productId } = useParams(); const productQuery = useBakeryProduct(productId); const catalog = useBakeryCatalog(); const actions = useBakeryCartActions(); const product = productQuery.data
  const [addedPreset, setAddedPreset] = useState<string | null>(null); const pageRef = useRef<HTMLDivElement>(null); const imageRef = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    if (!product || !pageRef.current || !imageRef.current) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => gsap.fromTo(imageRef.current, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .65, ease: 'power2.out' }))
    return () => media.revert()
  }, { scope: pageRef, dependencies: [product?.id] })
  if (productQuery.isLoading) return <div className="bakery-loading-row">Finishing the details…</div>
  if (productQuery.isError) return <BakeryStatePanel title="THAT CAKE DIDN’T LOAD" description="The design is still here—retry the bakery connection." actionLabel="TRY AGAIN" onAction={() => void productQuery.refetch()} />
  if (!product) return <BakeryStatePanel title="WE COULDN’T FIND THAT CAKE" description="It may not be available today." actionLabel="BROWSE CAKES" link="/bakery/app/cakes" />
  const addPreset = (kind: 'classic' | 'eggless' | 'party') => actions.add.mutate({ productId: product.id, selections: presetSelections(product, kind) }, { onSuccess: () => setAddedPreset(kind) })
  const related = (catalog.data?.products ?? []).filter((item) => item.id !== product.id && (item.style === product.style || item.category === product.category)).slice(0, 3)
  return <div ref={pageRef} className="bakery-product-story"><div className="bakery-product-page"><div ref={imageRef} className="bakery-detail-image"><img src={getBakeryProductAsset(product.id)} alt={product.name} /><span className="bakery-sticker tasty">{product.bestseller ? 'MOST LOVED' : 'HANDMADE'}</span>{!product.available && <div className="bakery-image-unavailable"><span>BAKING PAUSED</span><b>Temporarily unavailable</b></div>}</div><div className="bakery-detail-copy"><span className="bakery-kicker">{product.style?.replaceAll('_', ' ') ?? bakeryCategoryLabels[product.category]}</span><h1>{product.name}</h1><p>{product.description}</p><div className="bakery-detail-facts"><span><Clock3 /><b>{product.leadHours ? `Ready in ${product.leadHours} hours` : 'Ready now'}</b></span><span><Gift /><b>{product.servingLabel}</b></span>{product.egglessAvailable && <span><Leaf /><b>Eggless available</b></span>}</div><strong className="bakery-detail-price">FROM ₹{product.basePrice}</strong>
    {!product.available ? <BakeryStatePanel title="THIS CAKE IS NOT AVAILABLE TODAY" description="Please choose another cake that is ready to order." actionLabel="SEE AVAILABLE CAKES" link="/bakery/app/cakes" /> : product.customisable ? <><div className="bakery-quick-heading"><span>ORDER QUICKLY OR CUSTOMISE</span><h2>CHOOSE A POPULAR OPTION</h2><p>Select one of these three popular options, or customise the cake below.</p></div><div className="bakery-preset-grid"><button disabled={actions.add.isPending} onClick={() => addPreset('classic')}><span className="bakery-preset-icon">A</span><b>CLASSIC OPTION</b><span>0.5 kg · standard decoration</span><strong>{addedPreset === 'classic' ? 'ADDED ✓' : `₹${product.basePrice}`}</strong></button><button disabled={actions.add.isPending} onClick={() => addPreset('eggless')}><span className="bakery-preset-icon">E</span><b>EGGLESS OPTION</b><span>0.5 kg · eggless sponge</span><strong>{addedPreset === 'eggless' ? 'ADDED ✓' : `₹${product.basePrice + 60}`}</strong></button><button disabled={actions.add.isPending} onClick={() => addPreset('party')}><span className="bakery-preset-icon">P</span><b>PARTY SIZE</b><span>1 kg · serves 8–12</span><strong>{addedPreset === 'party' ? 'ADDED ✓' : `₹${product.basePrice + 380}`}</strong></button></div>{actions.add.isError && <p className="bakery-validation">We couldn’t add that option. Please try again.</p>}<Link className="bakery-button primary wide bakery-sticky-action" to={`/bakery/app/design/${product.id}`}>CUSTOMISE THIS CAKE <Sparkles /></Link></> : <button className="bakery-button primary wide" onClick={() => actions.add.mutate({ productId: product.id })}>ADD TO CART · ₹{product.basePrice}</button>}
    <small className="bakery-detail-note">Final appearance is handcrafted and may vary slightly—that is part of the charm.</small></div></div>
    {product.customisable && <section className="bakery-product-inspiration"><span className="bakery-kicker">CHOOSE A STYLE</span><h2>ONE CAKE, <span className="bakery-inline-cake"><img src={getBakeryProductAsset(product.id)} alt="" /></span> MADE FOR YOU.</h2><p>Choose another look before customising the size, flavour and message.</p><div className="bakery-style-accordion">{styles.map((style) => <Link key={style.id} to={`/bakery/app/styles/${style.id.toLowerCase()}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(45, 22, 18, .84)), url(${style.image})` }}><span><Palette />{style.label}</span><p>{style.description}</p></Link>)}</div></section>}
    {related.length > 0 && <section className="bakery-product-related"><BakerySectionTitle eyebrow="KEEP EXPLORING" title="MORE FOR THE MOMENT" /><div className="bakery-product-grid">{related.map((item) => <BakeryProductCard key={item.id} product={item} />)}</div></section>}
    <section className="bakery-product-assurance"><article><Check /><b>PRICE UPDATES LIVE</b><p>See the full customisation cost before checkout.</p></article><article><Clock3 /><b>PREPARATION TIME SHOWN EARLY</b><p>Check that the cake will be ready before your event.</p></article><article><Gift /><b>MADE BY HAND</b><p>Every cake is prepared and decorated by our bakery team.</p></article></section>
  </div>
}
