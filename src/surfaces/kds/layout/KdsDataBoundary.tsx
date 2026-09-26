import { useEffect, useState, type PropsWithChildren } from 'react'
import { env } from '../../../app/config/env'
import { BrandedBootLoader, ErrorState } from '../../../shared/components'
import { ensureScopedWorker } from '../../../services/pwa/ensureScopedWorker'

let kdsBootPromise: Promise<void> | null = null

async function bootKdsRuntime() {
  if (kdsBootPromise) return kdsBootPromise
  kdsBootPromise = (async () => {
    if (!env.VITE_ENABLE_MSW) return
    const workerUrl = '/kdsMockServiceWorker.js'
    if ('serviceWorker' in navigator && await ensureScopedWorker(workerUrl, '/kds/') === 'RELOAD_REQUIRED') {
      location.reload()
      return new Promise<void>(() => undefined)
    }
    const { kdsWorker } = await import('../../../prototype/msw/kds-browser')
    await kdsWorker.start({ serviceWorker: { url: workerUrl, options: { scope: '/kds/' } }, onUnhandledRequest: 'bypass', quiet: true })
  })()
  return kdsBootPromise
}

export function KdsDataBoundary({ children }: PropsWithChildren) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    if (location.pathname === '/kds') history.replaceState(null, '', `/kds/${location.search}${location.hash}`)
    bootKdsRuntime().then(() => setState('ready')).catch(() => setState('error'))
  }, [])
  if (state === 'error') return <main className="boot-state"><ErrorState retry={() => location.reload()} /></main>
  if (state === 'loading') return <BrandedBootLoader surface="kds" />
  return children
}
