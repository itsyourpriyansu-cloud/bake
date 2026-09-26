import { useEffect, useState, type PropsWithChildren } from 'react'
import { env } from '../../../app/config/env'
import { BrandedBootLoader, ErrorState } from '../../../shared/components'
import { ensureScopedWorker } from '../../../services/pwa/ensureScopedWorker'

let ownerBootPromise: Promise<void> | null = null
async function bootOwnerRuntime() {
  if (ownerBootPromise) return ownerBootPromise
  ownerBootPromise = (async () => {
    if (!env.VITE_ENABLE_MSW) return
    const ownerWorkerUrl = '/ownerMockServiceWorker.js'
    if ('serviceWorker' in navigator && await ensureScopedWorker(ownerWorkerUrl, '/owner/') === 'RELOAD_REQUIRED') {
      location.reload()
      return new Promise<void>(() => undefined)
    }
    const { ownerWorker } = await import('../../../prototype/msw/owner-browser')
    await ownerWorker.start({
      serviceWorker: { url: ownerWorkerUrl, options: { scope: '/owner/' } },
      onUnhandledRequest: 'bypass', quiet: true,
    })
  })()
  return ownerBootPromise
}

export function OwnerDataBoundary({ children }: PropsWithChildren) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    if (location.pathname === '/owner') history.replaceState(null, '', `/owner/${location.search}${location.hash}`)
    bootOwnerRuntime().then(() => setState('ready')).catch(() => setState('error'))
  }, [])
  if (state === 'error') return <main className="boot-state"><ErrorState retry={() => location.reload()} /></main>
  if (state === 'loading') return <BrandedBootLoader surface="owner" />
  return children
}
