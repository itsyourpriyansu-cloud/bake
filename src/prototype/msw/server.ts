import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Used by Vitest/Node-side tests that need the same mock API the browser gets. */
export const server = setupServer(...handlers)
