import { useEffect, useState, type PropsWithChildren } from 'react'
import { env } from '../../../app/config/env'
import { BrandedBootLoader, ErrorState } from '../../../shared/components'
import { startAutomationJobs } from '../../../prototype/automation/jobs'
import { ensureScopedWorker } from '../../../services/pwa/ensureScopedWorker'

let bootPromise: Promise<void> | null = null
async function bootCustomerRuntime() {
  if (bootPromise) return bootPromise
  bootPromise = (async () => {
    if (env.VITE_ENABLE_MSW) {
      const workerUrl = import.meta.env.PROD ? '/sw.js' : '/mockServiceWorker.js'
      if ('serviceWorker' in navigator && await ensureScopedWorker(workerUrl, '/app/') === 'RELOAD_REQUIRED') {
        location.reload()
        return new Promise<void>(() => undefined)
      }
      const { worker } = await import('../../../prototype/msw/browser')
      await worker.start({ serviceWorker: { url: workerUrl, options: { scope: '/app/' } }, onUnhandledRequest: 'bypass', quiet: true })
      startAutomationJobs()
    } else if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/app/' })
    }
  })()
  return bootPromise
}

export function CustomerDataBoundary({ children }: PropsWithChildren) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    if (location.pathname === '/app') history.replaceState(null, '', `/app/${location.search}${location.hash}`)
    bootCustomerRuntime().then(() => setState('ready')).catch(() => setState('error'))
  }, [])
  if (state === 'error') return <main className="boot-state"><ErrorState retry={() => location.reload()} /></main>
  if (state === 'loading') return <BrandedBootLoader surface="customer" />
  return children
}
