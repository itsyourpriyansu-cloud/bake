const channelName = 'bakery-wave:events'

export function publishBakeryEvent(type: string, detail?: unknown) {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(channelName)
  channel.postMessage({ type, detail, at: new Date().toISOString() })
  channel.close()
}

export function subscribeBakeryEvents(listener: () => void) {
  if (typeof BroadcastChannel === 'undefined') return () => undefined
  const channel = new BroadcastChannel(channelName)
  channel.onmessage = listener
  return () => channel.close()
}
