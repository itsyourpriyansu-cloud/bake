import { useEffect, useState, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorState } from '../../../shared/components'
import { ensureScopedWorker } from '../../../services/pwa/ensureScopedWorker'

let bootPromise: Promise<void> | null = null

const bakeryWorkerScope = '/bakery/'
const legacyBakeryScopes = new Set(['/bakery/app/', '/bakery/owner/', '/bakery/production/'])
const recoveryKey = 'bakery-wave:worker-recovery'

function canonicalBakeryPath(pathname: string) {
  if (pathname === '/bakery/app') return '/bakery/app/'
  if (pathname === '/bakery/owner') return '/bakery/owner/'
  if (pathname === '/bakery/production') return '/bakery/production/'
  return pathname
}

async function bootBakeryRuntime() {
  if (bootPromise) return bootPromise
  bootPromise = (async () => {
    const { bakeryWorker } = await import('../../../prototype/bakery/bakery.browser')
    const workerUrl = import.meta.env.PROD ? '/sw.js' : '/mockServiceWorker.js'
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.filter((registration) => legacyBakeryScopes.has(new URL(registration.scope).pathname)).map((registration) => registration.unregister()))
    }
    if ('serviceWorker' in navigator && await ensureScopedWorker(workerUrl, bakeryWorkerScope) === 'RELOAD_REQUIRED') {
      const previousAttempt = sessionStorage.getItem(recoveryKey)
      if (previousAttempt === workerUrl) {
        sessionStorage.removeItem(recoveryKey)
        throw new Error('The bakery worker could not take control after one recovery reload.')
      }
      sessionStorage.setItem(recoveryKey, workerUrl)
      location.replace(location.href)
      return new Promise<void>(() => undefined)
    }
    sessionStorage.removeItem(recoveryKey)
    await bakeryWorker.start({ serviceWorker: { url: workerUrl, options: { scope: bakeryWorkerScope } }, onUnhandledRequest: 'bypass', quiet: true })
  })().catch((error) => {
    bootPromise = null
    throw error
  })
  return bootPromise
}

export function BakeryDataBoundary({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const canonicalPath = canonicalBakeryPath(pathname)
    if (canonicalPath !== pathname) history.replaceState(null, '', `${canonicalPath}${location.search}${location.hash}`)
    const previousTitle = document.title
    document.title = pathname.startsWith('/bakery/owner') ? 'Bakery Wave · Founder' : pathname.startsWith('/bakery/production') ? 'Bakery Wave · Production' : 'Bakery Wave · Order Cakes'
    bootBakeryRuntime().then(() => setState('ready')).catch(() => setState('error'))
    return () => { document.title = previousTitle }
  }, [pathname])
  if (state === 'error') return <main className="bakery-boot"><ErrorState retry={() => location.reload()} /></main>
  if (state === 'loading') return <main className="bakery-boot"><div className="bakery-loader-cake" /><strong>WARMING THE OVENS…</strong><span>Preparing your bakery</span></main>
  return children
}
