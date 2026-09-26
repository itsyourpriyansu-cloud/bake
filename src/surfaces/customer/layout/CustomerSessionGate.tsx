import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDemo } from '../../../app/providers/DemoProvider'

/** Keeps personal customer screens private while menu browsing and cart building stay open. */
export function CustomerSessionGate({ children }: PropsWithChildren) {
  const { customerLoggedIn, customerSession } = useDemo()
  const location = useLocation()
  if (!customerLoggedIn || !customerSession) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/app/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  return children
}
