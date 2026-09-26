import { useState } from 'react'
import { pizzaWaveAssets } from '../utils/assets'
import { Logo } from './Logo'

export type BootSurface = 'customer' | 'owner' | 'kds'

const messages: Record<BootSurface, { eyebrow: string; title: string; status: string }> = {
  customer: { eyebrow: 'FRESH FROM GRAND ROAD · PURI', title: 'Heating up your wave.', status: 'Loading menu, rewards and your cart' },
  owner: { eyebrow: 'FOUNDER CONTROL CENTRE', title: 'Bringing the store into view.', status: 'Loading live operations and attention' },
  kds: { eyebrow: 'KITCHEN TABLET #1', title: 'Preparing the kitchen queue.', status: 'Connecting orders and availability' },
}

export function BrandedBootLoader({ surface = 'customer' }: { surface?: BootSurface }) {
  const [imageFailed, setImageFailed] = useState(false)
  const copy = messages[surface]

  return <main className={`boot-state branded-boot branded-boot-${surface}`} role="status" aria-live="polite" aria-busy="true">
    <section className="branded-boot-card" aria-label={copy.status}>
      <div className="branded-boot-art" aria-hidden="true">
        {!imageFailed
          ? <img src={pizzaWaveAssets.hero.mainPizza} alt="" width="1024" height="1024" loading="eager" fetchPriority="high" decoding="async" onError={() => setImageFailed(true)} />
          : <div className="branded-boot-fallback"><Logo variant="mark" size="xl" /></div>}
        <span className="branded-boot-stamp"><small>HOT</small><strong>NOW</strong></span>
        <i className="branded-boot-wave" />
      </div>
      <div className="branded-boot-copy">
        <Logo variant="full" size="md" />
        <div>
          <span>{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
        </div>
        <footer>
          <div className="branded-boot-progress"><i /><i /><i /></div>
          <span>{copy.status}</span>
        </footer>
      </div>
    </section>
  </main>
}
