import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { BakeryDataBoundary } from '../../surfaces/bakery/layout/BakeryDataBoundary'
import BakeryRouteErrorPage from '../../surfaces/bakery/pages/BakeryRouteErrorPage'

const BakeryLandingPage = lazy(() => import('../../surfaces/bakery/pages/BakeryLandingPage'))
const BakeryCustomerLayout = lazy(() => import('../../surfaces/bakery/layout/BakeryCustomerLayout'))
const BakeryHomePage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryHomePage })))
const BakeryCatalogPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryCatalogPage })))
const BakerySearchPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakerySearchPage })))
const BakeryProductPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryProductPage })))
const BakeryBuilderPage = lazy(() => import('../../surfaces/bakery/pages/BakeryBuilderPage'))
const BakeryCartPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryCartPage })))
const BakeryAuthPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryAuthPage })))
const BakeryCheckoutPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryCheckoutPage })))
const BakeryPaymentPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryPaymentPage })))
const BakeryOrdersPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryOrdersPage })))
const BakeryOrderTrackingPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryOrderTrackingPage })))
const BakeryBespokePage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryBespokePage })))
const BakeryAccountPage = lazy(() => import('../../surfaces/bakery/pages/BakeryCommercePages').then((module) => ({ default: module.BakeryAccountPage })))
const BakeryOwnerPage = lazy(() => import('../../surfaces/bakery/owner/BakeryOwnerPage'))
const BakeryProductionShell = lazy(() => import('../../surfaces/bakery/production/BakeryProductionPages').then((module) => ({ default: module.BakeryProductionShell })))
const BakeryProductionQueuePage = lazy(() => import('../../surfaces/bakery/production/BakeryProductionPages').then((module) => ({ default: module.BakeryProductionQueuePage })))
const BakeryProductionOrderPage = lazy(() => import('../../surfaces/bakery/production/BakeryProductionPages').then((module) => ({ default: module.BakeryProductionOrderPage })))
const BakeryAvailabilityPage = lazy(() => import('../../surfaces/bakery/production/BakeryProductionPages').then((module) => ({ default: module.BakeryAvailabilityPage })))

const loading = <main className="bakery-boot"><div className="bakery-loader-cake" /><strong>WARMING THE OVENS…</strong><span>Preparing your bakery</span></main>

const router = createBrowserRouter([
  { path: '/', element: <BakeryLandingPage />, errorElement: <BakeryRouteErrorPage /> },
  { path: '/bakery', element: <BakeryLandingPage />, errorElement: <BakeryRouteErrorPage /> },
  {
    path: '/bakery/app',
    element: <BakeryDataBoundary><BakeryCustomerLayout /></BakeryDataBoundary>,
    errorElement: <BakeryRouteErrorPage />,
    children: [
      { index: true, element: <BakeryHomePage /> },
      { path: 'cakes', element: <BakeryCatalogPage /> },
      { path: 'bakes', element: <BakeryCatalogPage /> },
      { path: 'events/:eventSlug', element: <BakeryCatalogPage /> },
      { path: 'styles/:styleSlug', element: <BakeryCatalogPage /> },
      { path: 'search', element: <BakerySearchPage /> },
      { path: 'product/:productId', element: <BakeryProductPage /> },
      { path: 'design/:productId', element: <BakeryBuilderPage /> },
      { path: 'bespoke', element: <BakeryBespokePage /> },
      { path: 'cart', element: <BakeryCartPage /> },
      { path: 'auth', element: <BakeryAuthPage /> },
      { path: 'checkout', element: <BakeryCheckoutPage /> },
      { path: 'payment/:paymentId', element: <BakeryPaymentPage /> },
      { path: 'orders', element: <BakeryOrdersPage /> },
      { path: 'orders/:orderId', element: <BakeryOrderTrackingPage /> },
      { path: 'profile', element: <BakeryAccountPage /> },
      { path: 'rewards', element: <BakeryAccountPage view="rewards" /> },
      { path: 'celebrations', element: <BakeryAccountPage view="celebrations" /> },
      { path: 'support', element: <BakeryAccountPage view="support" /> },
      { path: 'saved-designs', element: <BakeryAccountPage view="saved-designs" /> },
      { path: 'refer', element: <BakeryAccountPage view="refer" /> },
      { path: '*', element: <BakeryRouteErrorPage notFound /> },
    ],
  },
  { path: '/bakery/owner', element: <BakeryDataBoundary><BakeryOwnerPage /></BakeryDataBoundary>, errorElement: <BakeryRouteErrorPage /> },
  {
    path: '/bakery/production',
    element: <BakeryDataBoundary><BakeryProductionShell /></BakeryDataBoundary>,
    errorElement: <BakeryRouteErrorPage />,
    children: [
      { index: true, element: <BakeryProductionQueuePage /> },
      { path: 'order/:orderId', element: <BakeryProductionOrderPage /> },
      { path: 'availability', element: <BakeryAvailabilityPage /> },
      { path: '*', element: <BakeryRouteErrorPage notFound /> },
    ],
  },
  { path: '*', element: <BakeryRouteErrorPage notFound /> },
])

export function AppRouter() {
  return <Suspense fallback={loading}><RouterProvider router={router} /></Suspense>
}
