import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { categorySeed as categories, productSeed, smartCollectionSeed as smartCollections } from '../../../prototype/seed/catalog.seed'
import { primaryCustomerSeed as demoCustomer } from '../../../prototype/seed/customers.seed'
import { storeConfigSeed } from '../../../prototype/seed/store.seed'
import { orderHistorySeed } from '../../../prototype/seed/orders.seed'
import { deriveCapabilities } from '../../../domain/store/capability.engine'
import type { LegacyProductView } from '../../../domain/catalog/catalog.types'

const demoCapabilities = deriveCapabilities(storeConfigSeed)
const products: LegacyProductView[] = productSeed.map((p) => ({
  id: p.id, name: p.name, description: p.shortDescription, category: p.categoryId,
  price: p.basePrice, veg: p.veg, available: p.available, prepMinutes: p.prepMinutes,
  complexity: p.complexity, station: p.station, image: `/assets/products/${p.imageKey}`,
  badges: p.badges, modifierGroups: p.modifierGroups,
}))
import HomePage from './HomePage'
import MenuPage from './MenuPage'
import SearchPage from './SearchPage'
import ProductDetailPage from './ProductDetailPage'
import BuildPizzaPage from './BuildPizzaPage'
import CartPage from './CartPage'

const mocks = vi.hoisted(() => ({
  menu: {} as Record<string, unknown>,
  recommendations: {} as Record<string, unknown>,
  capabilities: {} as Record<string, unknown>,
  cart: {} as Record<string, unknown>,
  loyalty: {} as Record<string, unknown>,
  orders: {} as Record<string, unknown>,
  customerLoggedIn: false,
  search: {} as Record<string, unknown>,
  detail: {} as Record<string, unknown>,
  quote: {} as Record<string, unknown>,
  retention: {} as Record<string, unknown>,
}))

vi.mock('../../../features/catalog/hooks/useCatalog', () => ({ useMenu: () => mocks.menu, useRecommendations: () => mocks.recommendations, useProductSearch: () => mocks.search, useProduct: () => mocks.detail }))
vi.mock('../../../features/availability/hooks/useCapabilities', () => ({ useCapabilities: () => mocks.capabilities }))
vi.mock('../../../features/cart/hooks/useCart', () => ({
  useCart: () => mocks.cart,
  useCartQuote: () => mocks.quote,
  useCartActions: () => ({ add: { mutate: vi.fn(), mutateAsync: vi.fn() }, update: { mutate: vi.fn(), mutateAsync: vi.fn() }, remove: { mutate: vi.fn() } }),
}))
vi.mock('../../../features/loyalty/hooks/useLoyalty', () => ({ useLoyalty: () => mocks.loyalty }))
vi.mock('../../../features/orders/hooks/useOrders', () => ({ useOrders: () => mocks.orders }))
vi.mock('../../../app/providers/DemoProvider', () => ({ useDemo: () => ({ customerLoggedIn: mocks.customerLoggedIn }) }))
vi.mock('../../../features/retention/hooks/useRetention', () => ({ useRetentionSummary: () => mocks.retention }))

const query = <T,>(data: T, overrides: Record<string, unknown> = {}) => ({ data, isPending: false, isError: false, refetch: vi.fn(), ...overrides })
const renderPage = (page: ReactNode, route = '/app/') => render(<MemoryRouter initialEntries={[route]}>{page}</MemoryRouter>)

beforeEach(() => {
  mocks.menu = query({ categories, products, collections: smartCollections })
  mocks.recommendations = query(products.slice(0, 2))
  mocks.capabilities = query(demoCapabilities)
  mocks.cart = query({ items: [] })
  mocks.loyalty = query({ customer: demoCustomer, nextTier: 'PLATINUM', ordersNeeded: 2, spendNeeded: 880 })
  mocks.orders = query([])
  mocks.customerLoggedIn = false
  mocks.search = query([])
  mocks.detail = query({ product: products[0], pairings: products.slice(7, 9), pointsPreview: 4 })
  mocks.quote = query({ itemCount: 0, subtotal: 0, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, pointsRedeemed: 0, deliveryFee: 0, eligibleSpend: 0, pointsToEarn: 0, total: 0, availabilityIssues: [], warnings: [], valid: false })
  mocks.retention = query({ favouriteCategory: 'Pizza', usualProductIds: ['PIZZA-PANEER-001', 'COFFEE-001'], recommendedProductIds: ['PIZZA-PANEER-001', 'PIZZA-VEG-001'], savedOrderId: 'SAVED-USUAL', savedOrderName: 'My Usual', secondOrderLoop: null, method: 'RULE_BASED' })
  localStorage.clear()
})
afterEach(cleanup)

describe('Home page query states', () => {
  it('shows loading skeletons while customer data starts', () => {
    mocks.menu = query(undefined, { isPending: true })
    const { container } = renderPage(<HomePage />)
    expect(container.querySelectorAll('.category-skeleton')).toHaveLength(7)
  })

  it('shows a recoverable error state', () => {
    mocks.menu = query(undefined, { isError: true })
    renderPage(<HomePage />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows intentional empty feedback', () => {
    mocks.menu = query({ categories: [], products: [], collections: [] })
    mocks.recommendations = query([])
    renderPage(<HomePage />)
    expect(screen.getByText('Menu is warming up')).toBeInTheDocument()
    expect(screen.getAllByText('Fresh batch incoming').length).toBeGreaterThan(0)
  })

  it('shows the complete guest discovery sequence', () => {
    renderPage(<HomePage />)
    expect(screen.getByText('POPULAR IN PURI')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza under ₹199' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Signature Kulhad Pizza', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Group deals' })).toBeInTheDocument()
  })

  it('personalizes the returning Priyanshu home', () => {
    mocks.customerLoggedIn = true
    mocks.orders = query(orderHistorySeed)
    renderPage(<HomePage />)
    expect(screen.getByRole('heading', { name: 'Hey, Priyanshu.' })).toBeInTheDocument()
    expect(screen.getByText('Gold Wave · 182 points')).toBeInTheDocument()
    expect(screen.getByText(/REORDER PREVIEW/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'My Usual' })).toBeInTheDocument()
  })
})

describe('Menu page query states', () => {
  it('shows product skeletons while loading', () => {
    mocks.menu = query(undefined, { isPending: true })
    const { container } = renderPage(<MenuPage />, '/app/menu')
    expect(container.querySelectorAll('.product-skeleton')).toHaveLength(6)
  })

  it('shows a recoverable error state', () => {
    mocks.menu = query(undefined, { isError: true })
    renderPage(<MenuPage />, '/app/menu')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows an empty state for an unmatched search', () => {
    mocks.menu = query({ categories, products: [], collections: smartCollections })
    renderPage(<MenuPage />, '/app/menu')
    expect(screen.getByText('No matches yet')).toBeInTheDocument()
  })
})

describe('Search page', () => {
  it('offers every supported popular search', () => {
    renderPage(<SearchPage />, '/app/search')
    for (const term of ['paneer', 'chicken', 'veg', 'spicy', 'cheese', 'shake', 'combo', 'under 200']) {
      expect(screen.getByRole('button', { name: term })).toBeInTheDocument()
    }
  })

  it('renders matching products returned by the typed search query', () => {
    mocks.search = query(products.filter((product) => product.name.includes('Paneer')))
    renderPage(<SearchPage />, '/app/search?q=paneer')
    expect(screen.getByRole('heading', { name: 'Paneer Cheese Pizza' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paneer Crunch Burger' })).toBeInTheDocument()
  })
})

describe('Stage 3 customer commerce', () => {
  it('shows product detail, seven modifier groups, pairings and points preview', () => {
    renderPage(<ProductDetailPage />, '/app/product/PIZZA-VEG-001')
    expect(screen.getByRole('heading', { name: 'Classic Veg Pizza' })).toBeInTheDocument()
    expect(screen.getByText('Earn +4 points')).toBeInTheDocument()
    expect(screen.getByText('Seven choices. One perfect pizza.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /customize & add/i })).toBeInTheDocument()
  })

  it('starts the pizza builder at step one and validates the required size', () => {
    renderPage(<BuildPizzaPage />, '/app/build/PIZZA-VEG-001')
    expect(screen.getByText('STEP 1 / 7')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Size' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add classic wave/i })).toBeInTheDocument()
    expect(screen.getByText('OR CUSTOMIZE IN 7 STEPS')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose 1 size option.')
  })

  it('renders a server-shaped bill and Gold Wave preview in cart', () => {
    mocks.customerLoggedIn = true
    mocks.cart = query({ id: 'CART-DEMO', status: 'ACTIVE', updatedAt: '', items: [{ id: 'line-1', cartId: 'CART-DEMO', productId: products[0].id, quantity: 2, modifiers: [], unitPriceSnapshot: 110, product: products[0] }] })
    mocks.quote = query({ itemCount: 2, subtotal: 220, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, pointsRedeemed: 0, deliveryFee: 0, eligibleSpend: 220, pointsToEarn: 8, total: 220, threshold: { target: 499, remaining: 279, label: 'Build a ₹499 feast' }, availabilityIssues: [], warnings: [], valid: true })
    renderPage(<CartPage />, '/app/cart')
    expect(screen.getByRole('heading', { name: "You'll earn +8 points" })).toBeInTheDocument()
    expect(screen.getAllByText('₹220')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /continue to checkout/i })).toBeEnabled()
  })

  it('keeps the seeded member identity and redemption control hidden from a guest cart', () => {
    mocks.cart = query({ id: 'CART-DEMO', status: 'ACTIVE', updatedAt: '', items: [{ id: 'line-1', cartId: 'CART-DEMO', productId: products[0].id, quantity: 1, modifiers: [], unitPriceSnapshot: 110, product: products[0] }] })
    mocks.quote = query({ itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, pointsRedeemed: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 2, total: 110, availabilityIssues: [], warnings: [], valid: true })
    renderPage(<CartPage />, '/app/cart')
    expect(screen.getByRole('heading', { name: 'Sign in to earn and use points' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /use 50 points/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/182 available/i)).not.toBeInTheDocument()
  })
})
