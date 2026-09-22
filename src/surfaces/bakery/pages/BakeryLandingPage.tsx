import { ArrowRight, CakeSlice, CalendarHeart, Gift, Sparkles, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { bakeryAssets } from '../../../shared/utils/bakeryAssets'
import { BakeryLogo } from '../components/BakeryUi'

export default function BakeryLandingPage() {
  useEffect(() => { const previousTitle = document.title; document.title = 'Bakery Wave · Cakes Made for Your Moment'; return () => { document.title = previousTitle } }, [])
  return <div className="bakery-site">
    <div className="bakery-promo">15% OFF ON ₹1000+ PURCHASE <span>✦</span> BAKED FRESH FOR YOUR MOMENT</div>
    <header className="bakery-site-header"><Link to="/bakery"><BakeryLogo /></Link><nav><a href="#cakes">CAKES</a><a href="#how">HOW IT WORKS</a><a href="#daily">DAILY BAKES</a><a href="#visit">VISIT</a></nav><Link className="bakery-button primary" to="/bakery/app/design/cake-vintage-heart">START DESIGNING</Link></header>
    <main>
      <section className="bakery-landing-hero">
        <motion.div className="bakery-hero-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}><span className="bakery-kicker">CUSTOM CAKES · DAILY BAKES · HAPPY PEOPLE</span><h1>MAKE IT THE CAKE THEY REMEMBER.</h1><p>Choose a style, make it personal, and let our bakers bring your celebration to life.</p><div><Link className="bakery-button primary" to="/bakery/app/design/cake-vintage-heart">DESIGN A CAKE <ArrowRight /></Link><Link className="bakery-button secondary" to="/bakery/app/cakes">SHOP READY CAKES</Link></div></motion.div>
        <motion.div className="bakery-hero-art" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .08 }}><img src={bakeryAssets.hero} alt="Colourful handcrafted celebration cake" /><span className="bakery-sticker tasty">HANDMADE</span><span className="bakery-sticker fresh">FRESH</span><span className="bakery-sticker joyful">PURE JOY</span></motion.div>
      </section>
      <section className="bakery-marquee" aria-label="Bakery services"><span>READY TODAY</span><b>•</b><span>EGGLESS AVAILABLE</span><b>•</b><span>DESIGNED FOR YOU</span><b>•</b><span>DELIVERY & PICKUP</span></section>
      <section className="bakery-landing-section" id="cakes"><span className="bakery-kicker">ONE BAKERY · FOUR EASY WAYS</span><h2>HOW DO YOU WANT TO CELEBRATE?</h2><div className="bakery-business-grid">
        <article className="lemon"><CakeSlice /><b>01</b><h3>READY-MADE</h3><p>Beautiful finished cakes when the celebration cannot wait.</p><Link to="/bakery/app/cakes">SHOP NOW →</Link></article>
        <article className="lavender"><Sparkles /><b>02</b><h3>PERSONALISE A STYLE</h3><p>Start with a popular design and change the details that matter.</p><Link to="/bakery/app/styles/vintage">EXPLORE STYLES →</Link></article>
        <article className="blue"><CalendarHeart /><b>03</b><h3>DESIGN YOURS</h3><p>Build the flavour, finish, colour and message step by step.</p><Link to="/bakery/app/design/cake-vintage-heart">OPEN THE STUDIO →</Link></article>
        <article className="coral"><Gift /><b>04</b><h3>BESPOKE & EVENTS</h3><p>Wedding, tiered, sculpted and corporate cake requests.</p><Link to="/bakery/app/bespoke">REQUEST A QUOTE →</Link></article>
      </div></section>
      <section className="bakery-editorial-band" id="how"><div><span className="bakery-kicker">THE CAKE STUDIO</span><h2>YOUR IDEA.<br />OUR HANDS.</h2><p>Pick an occasion, choose a style, set the servings and flavour, then watch the design come together.</p><Link className="bakery-button primary" to="/bakery/app/design/cake-floral-lavender">TRY THE BUILDER</Link></div><ol><li><b>1</b><span>Choose a style</span></li><li><b>2</b><span>Make it personal</span></li><li><b>3</b><span>Pick your date</span></li><li><b>4</b><span>We bake the happy</span></li></ol></section>
      <section className="bakery-landing-section" id="daily"><span className="bakery-kicker">NOT JUST BIG OCCASIONS</span><h2>BAKED HERE. LOVED DAILY.</h2><div className="bakery-category-cloud"><Link to="/bakery/app/bakes">PASTRIES <b>12</b></Link><Link to="/bakery/app/bakes">BROWNIES <b>8</b></Link><Link to="/bakery/app/bakes">BREADS <b>6</b></Link><Link to="/bakery/app/bakes">SAVOURIES <b>9</b></Link><Link to="/bakery/app/cakes">CAKES <b>27</b></Link></div></section>
      <section className="bakery-visit" id="visit"><Truck /><div><span className="bakery-kicker">GRAND ROAD · CUTTACK</span><h2>PICK UP FRESH OR LET US BRING IT.</h2><p>Same-day favourites, scheduled celebration cakes and careful delivery.</p></div><Link className="bakery-button secondary" to="/bakery/app/">START AN ORDER</Link></section>
    </main>
    <footer className="bakery-site-footer"><BakeryLogo /><p>Prototype bakery experience · Grand Road, Cuttack</p><Link to="/">Back to Pizza Wave</Link></footer>
  </div>
}
