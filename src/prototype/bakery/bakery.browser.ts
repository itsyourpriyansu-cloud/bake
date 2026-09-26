import { setupWorker } from 'msw/browser'
import { bakeryHandlers } from './bakery.handlers'

export const bakeryWorker = setupWorker(...bakeryHandlers)

