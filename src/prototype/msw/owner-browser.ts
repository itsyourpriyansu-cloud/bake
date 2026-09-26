import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** Owner gets its own mock transport scope; it never registers or inherits the customer PWA worker. */
export const ownerWorker = setupWorker(...handlers)

