import type { PropsWithChildren } from 'react'
import { MotionProvider } from './MotionProvider'
import { QueryProvider } from './QueryProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryProvider><MotionProvider>{children}</MotionProvider></QueryProvider>
}
