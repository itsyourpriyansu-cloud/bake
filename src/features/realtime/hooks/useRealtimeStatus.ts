import { useSyncExternalStore } from 'react'
import { demoRealtimeTransport } from '../../../services/realtime/DemoRealtimeTransport'

export const useRealtimeStatus = () => useSyncExternalStore(
  (listener) => demoRealtimeTransport.subscribeStatus(listener),
  () => demoRealtimeTransport.isConnected(),
  () => false,
)
