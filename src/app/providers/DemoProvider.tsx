import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/api/client'
import { endpoints } from '../../services/api/endpoints'
import type { CustomerSession } from '../../domain/auth/auth.types'
import { useAppStore } from '../../stores/app.store'
import { env } from '../config/env'

const CUSTOMER_SESSION_KEY = 'pizza-wave:customer-session:v2'
const readCustomerSession = (): CustomerSession | undefined => {
  try {
    const stored = localStorage.getItem(CUSTOMER_SESSION_KEY)
    if (!stored) return undefined
    const session = JSON.parse(stored) as CustomerSession
    if (session.realm !== 'CUSTOMER' || new Date(session.expiresAt) <= new Date()) { localStorage.removeItem(CUSTOMER_SESSION_KEY); return undefined }
    return session
  } catch { localStorage.removeItem(CUSTOMER_SESSION_KEY); return undefined }
}

interface DemoContextValue {
  customerLoggedIn: boolean
  customerSession?: CustomerSession
  authenticateCustomer: (session: CustomerSession) => void
  setCustomerLoggedIn: (value: boolean) => Promise<void>
  reset: () => Promise<void>
}
const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [customerSession, setCustomerSession] = useState<CustomerSession | undefined>(readCustomerSession)
  const customerLoggedIn = Boolean(customerSession)
  const authenticateCustomer = useCallback((session: CustomerSession) => {
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session))
    setCustomerSession(session)
    void queryClient.invalidateQueries({ queryKey: ['loyalty'] })
    void queryClient.invalidateQueries({ queryKey: ['cart-quote'] })
  }, [queryClient])
  const setCustomerLoggedIn = useCallback(async (value: boolean) => {
    const response = await apiClient.patch<{ loggedIn: boolean; session?: CustomerSession }>(endpoints.demoSession, { loggedIn: value })
    if (value && response.data.session) authenticateCustomer(response.data.session)
    if (!value) { localStorage.removeItem(CUSTOMER_SESSION_KEY); setCustomerSession(undefined); useAppStore.getState().setCheckoutPointsRequested(0) }
    await queryClient.invalidateQueries()
  }, [authenticateCustomer, queryClient])
  const reset = useCallback(async () => {
    await apiClient.post(endpoints.demoReset)
    localStorage.removeItem('pizza-wave:app')
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    localStorage.removeItem('pizza-wave:customer-session')
    localStorage.removeItem('pizza-wave:demo:customer')
    useAppStore.setState({ fulfillmentMode: 'DELIVERY', checkoutPointsRequested: 0 })
    setCustomerSession(undefined)
    await queryClient.invalidateQueries()
  }, [queryClient])
  useEffect(() => {
    if (!env.VITE_PITCH_MODE) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.code === 'KeyR') {
        event.preventDefault()
        void reset()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [reset])
  const value = useMemo(() => ({ customerLoggedIn, customerSession, authenticateCustomer, setCustomerLoggedIn, reset }), [authenticateCustomer, customerLoggedIn, customerSession, reset, setCustomerLoggedIn])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo must be used inside DemoProvider')
  return value
}
