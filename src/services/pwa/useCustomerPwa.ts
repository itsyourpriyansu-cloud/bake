import { useEffect, useState } from 'react'

export function useCustomerPwa() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'manifest'; link.href = '/app.webmanifest'; link.dataset.pizzaWaveManifest = 'true'; document.head.appendChild(link)
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => { window.removeEventListener('beforeinstallprompt', handler); link.remove() }
  }, [])
  return { canInstall: Boolean(installPrompt) }
}
