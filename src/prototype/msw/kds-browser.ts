import { setupWorker } from 'msw/browser'
import { kdsAuthSurfaceHandlers } from './handlers/kds-auth.handlers'
import { kdsHandlers } from './handlers/kds.handlers'
import { kdsAvailabilityHandlers } from './handlers/availability.handlers'

/** KDS transport deliberately exposes only chef authentication and kitchen operations. */
export const kdsWorker = setupWorker(...kdsAuthSurfaceHandlers, ...kdsHandlers, ...kdsAvailabilityHandlers)
