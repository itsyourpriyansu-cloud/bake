import { ArrowRight, Bike, Clock3, Gift, Heart, MapPin, Pizza, RotateCcw, Sparkles, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getProductAssetById, pizzaWaveAssets } from '../../../shared/utils/assets'
import { CustomerAsset } from '../../customer/components/CustomerAsset'

import { Logo } from '../../../shared/components'

const foodPreview = [
  { id: 'PIZZA-PANEER-001', name: 'Paneer Cheese Pizza', note: 'A Puri favourite', price: 249 },
  { id: 'KULHAD-001', name: 'Signature Kulhad Pizza', note: 'Only at The Wave', price: 199 },
  { id: 'SHAKE-001', name: 'Oreo Thick Shake', note: 'Cool, thick, joyful', price: 149 },
]

const returnBenefits = [
  { icon: RotateCcw, title: 'Your usual', copy: 'Reorder familiar favourites in a tap.' },
  { icon: Sparkles, title: 'Made for you', copy: 'Useful picks shaped by what you enjoy.' },
  { icon: Clock3, title: 'Live updates', copy: 'Know exactly where your order is.' },
  { icon: Heart, title: 'Saved your way', copy: 'Keep favourites and family choices close.' },
]

export default function LandingPage() {
  return <main className="landing-page stage-ten-landing">
    <nav className="landing-nav" aria-label="Pizza Wave introduction"><Link className="brand-lockup-link" to="/" aria-label="The Pizza Wave home"><Logo variant="full" size="md" /></Link><a href="#visit"><MapPin /> Grand Road, Puri</a><Link className="button button-primary" to="/app/">ORDER NOW</Link></nav>

    <section className="landing-hero">
      <motion.div className="landing-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}>
        <span className="eyebrow">FRESH FROM GRAND ROAD · PURI</span>
        <h1>YOUR PIZZA.<br /><em>YOUR WAVE.</em></h1>
        <p>Big flavour, playful choices and a smoother way to order—made for pizza nights in Puri.</p>
        <div className="landing-actions"><Link className="button button-primary" to="/app/">ORDER NOW <ArrowRight /></Link><Link className="button landing-secondary" to="/app/menu">VIEW MENU</Link></div>
        <div className="landing-proof"><span><Bike /> Delivery</span><span><Store /> Pickup</span><span><Gift /> Wave Points</span></div>
      </motion.div>
      <motion.div className="landing-art" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .52, delay: .08, ease: [0.22, 1, 0.36, 1] }}>
        <div className="landing-art-frame">
          <div className="pizza-orbit"><CustomerAsset src={pizzaWaveAssets.hero.mainPizza} alt="Fresh Pizza Wave pizza with a dramatic cheese pull" eager fallbackLabel="The Pizza Wave" /></div>
          <span className="art-stamp"><small>HOT</small><strong>NOW</strong></span>
          <div className="art-label"><span>BAKED IN PURI</span><strong>SERVED WITH A WAVE</strong></div>
        </div>
      </motion.div>
    </section>

    <section className="landing-brag" aria-label="The Pizza Wave introduction video">
      <video
        className="landing-brag-video"
        src="/assets/video/pizza-wave-brag.mp4"
        poster="/assets/video/pizza-wave-brag.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="The Pizza Wave — own the wave, not the aggregator"
      />
    </section>

    <section className="landing-strip" aria-label="Pizza Wave menu highlights"><span>PIZZA</span><i /> <span>KULHAD</span><i /> <span>SHAKES</span><i /> <span>QUICK BITES</span></section>

    <section className="landing-food" aria-labelledby="food-preview-title">
      <header><div><span className="eyebrow">FOOD FIRST</span><h2 id="food-preview-title">Meet the favourites.</h2></div><Link to="/app/menu">EXPLORE THE MENU <ArrowRight /></Link></header>
      <div className="landing-food-grid">{foodPreview.map((item, index) => { const asset = getProductAssetById(item.id); return <motion.article key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25, delay: .05 * index }}>
        <Link to={`/app/product/${item.id}`}><div><CustomerAsset src={asset.src} alt={item.name} fallbackLabel={asset.fallbackLabel} /></div><span>{item.note}</span><h3>{item.name}</h3><strong>FROM ₹{item.price}</strong></Link>
      </motion.article> })}</div>
    </section>

    <section className="landing-builder">
      <div className="landing-builder-art"><CustomerAsset src={pizzaWaveAssets.macro.crust} alt="Freshly baked pizza crust close-up" /></div>
      <div><span className="eyebrow">BUILD YOUR PIZZA</span><h2>Seven simple steps.<br />One very personal pizza.</h2><p>Choose the size, base, sauce, cheese, toppings, spice and the perfect side. The live total keeps every choice clear.</p><Link className="button button-primary" to="/app/build/PIZZA-VEG-001">START BUILDING <ArrowRight /></Link></div>
    </section>

    <section className="landing-loyalty">
      <div className="landing-loyalty-copy"><span className="eyebrow">WAVE REWARDS</span><h2>Good pizza should bring you back.</h2><p>Rewards stay simple, visible and useful.</p><div className="loyalty-steps"><span><b>1</b>Order</span><span><b>2</b>Earn Wave Points</span><span><b>3</b>Move through membership levels</span><span><b>4</b>Get more reasons to come back</span></div><Link className="button landing-secondary" to="/app/rewards">START YOUR WAVE <ArrowRight /></Link></div>
      <motion.div className="landing-tier-showcase" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}>
        <motion.article className="landing-reward-pass" whileHover={{ y: -4 }} transition={{ duration: .2 }} aria-label="Example Gold Wave membership with 182 points ready">
          <header><Logo variant="full" theme="light" size="sm" /><strong><Sparkles /> GOLD WAVE</strong></header>
          <div className="reward-pass-balance"><small>AVAILABLE BALANCE</small><div><strong>182</strong><span>WAVE POINTS<em>₹182 order value</em></span></div></div>
          <svg className="reward-pass-waves" viewBox="0 0 260 120" aria-hidden="true"><path d="M-12 82 Q52 18 116 82 T244 82 T372 82" /><path d="M-12 112 Q52 48 116 112 T244 112 T372 112" /></svg>
          <div className="reward-pass-utility"><span><Gift /> Ready to use</span><b>1 POINT = ₹1</b></div>
          <footer><span><small>EXAMPLE MEMBER</small><b>YOUR WAVE</b></span><span><small>HOME STORE</small><b>GRAND ROAD · PURI</b></span></footer>
        </motion.article>
        <div className="landing-tier-guide"><span><Gift /><b>Use from 50 points</b><small>Apply safely at cart</small></span><span><Sparkles /><b>Gold benefits active</b><small>More reasons to return</small></span></div>
      </motion.div>
    </section>

    <section className="landing-fulfilment">
      <article><CustomerAsset src={pizzaWaveAssets.lifestyle.pickup} alt="A Pizza Wave customer collecting a fresh order" /><div><Store /><span>PICKUP</span><h2>Skip the wait.</h2><p>Choose a live pickup slot and collect fresh from Grand Road.</p></div></article>
      <article><CustomerAsset src={pizzaWaveAssets.lifestyle.puriEvening} alt="A Pizza Wave delivery arriving on a Puri evening" /><div><Bike /><span>DELIVERY</span><h2>We’ll bring the wave.</h2><p>See availability, a system ETA and live order progress.</p></div></article>
    </section>

    <section className="landing-return">
      <header><span className="eyebrow">BETTER WHEN YOU COME BACK</span><h2>The app remembers the helpful bits.</h2></header>
      <div>{returnBenefits.map(({ icon: Icon, title, copy }) => <article key={title}><Icon /><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="visit-section" id="visit">
      <CustomerAsset src={pizzaWaveAssets.hero.familySharing} alt="Family sharing Pizza Wave favourites" />
      <div><span className="eyebrow">COME FIND US</span><h2>Grand Road,<br />Puri.</h2><p><MapPin /> The Pizza Wave · Grand Road · Puri, Odisha</p><div className="service-options"><div><Bike /><strong>Delivery</strong><span>Choose your address in the app</span></div><div><Store /><strong>Pickup</strong><span>Grab a system-generated slot</span></div></div><Link className="button button-primary" to="/app/">ORDER FROM GRAND ROAD <ArrowRight /></Link></div>
    </section>

    <section className="landing-final-cta"><Pizza /><span>READY WHEN YOU ARE</span><h2>Catch your pizza wave.</h2><div><Link className="button button-primary" to="/app/">ORDER NOW <ArrowRight /></Link><Link className="button landing-secondary" to="/app/menu">VIEW MENU</Link></div></section>
    <footer><div className="brand-lockup"><Logo variant="full" size="md" /></div><p>Brand loud. Commerce quiet.</p></footer>
  </main>
}
