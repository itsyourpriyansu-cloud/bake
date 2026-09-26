/// <reference lib="webworker" />
export {}
const sw = globalThis as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> }

importScripts('/mockServiceWorker.js')
const shellCache = `bakery-wave-shell-v1-${new URL(sw.registration.scope).pathname.replaceAll('/', '-') || 'root'}`
const shellAssets = (self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> }).__WB_MANIFEST.map((entry) => entry.url).filter((url) => !url.startsWith('/api/'))

sw.addEventListener('install', (event: ExtendableEvent) => { event.waitUntil(Promise.all([caches.open(shellCache).then((cache) => cache.addAll(shellAssets)), sw.skipWaiting()])) })
sw.addEventListener('activate', (event: ExtendableEvent) => { event.waitUntil(sw.clients.claim()) })
sw.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)
  if (event.request.mode !== 'navigate' || (url.pathname !== '/' && !url.pathname.startsWith('/bakery'))) return
  event.respondWith(fetch(event.request).catch(async () => (await caches.match('/index.html')) ?? Response.error()))
})
