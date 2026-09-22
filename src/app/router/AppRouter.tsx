import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { CustomerDataBoundary } from '../../surfaces/customer/layout/CustomerDataBoundary'
import { CustomerLayout } from '../../surfaces/customer/layout/CustomerLayout'
import { CustomerSessionGate } from '../../surfaces/customer/layout/CustomerSessionGate'
import { OwnerDataBoundary } from '../../surfaces/owner/layout/OwnerDataBoundary'
import { KdsDataBoundary } from '../../surfaces/kds/layout/KdsDataBoundary'
import { BrandedBootLoader, type BootSurface } from '../../shared/components'
import { BakeryDataBoundary } from '../../surfaces/bakery/layout/BakeryDataBoundary'
import BakeryRouteErrorPage from '../../surfaces/bakery/pages/BakeryRouteErrorPage'

const LandingPage = lazy(() => import('../../surfaces/landing/pages/LandingPage'))
const HomePage = lazy(() => import('../../surfaces/customer/pages/HomePage'))
const MenuPage = lazy(() => import('../../surfaces/customer/pages/MenuPage'))
const SearchPage = lazy(() => import('../../surfaces/customer/pages/SearchPage'))
const ProductDetailPage = lazy(() => import('../../surfaces/customer/pages/ProductDetailPage'))
const BuildPizzaPage = lazy(() => import('../../surfaces/customer/pages/BuildPizzaPage'))
const CartPage = lazy(() => import('../../surfaces/customer/pages/CartPage'))
const AuthPage = lazy(() => import('../../surfaces/customer/pages/AuthPage'))
const CheckoutPage = lazy(() => import('../../surfaces/customer/pages/CheckoutPage'))
const PaymentPage = lazy(() => import('../../surfaces/customer/pages/PaymentPage'))
const OrdersPage = lazy(() => import('../../surfaces/customer/pages/OrdersPage'))
const OrderTrackingPage = lazy(() => import('../../surfaces/customer/pages/OrderTrackingPage'))
const RewardsPage = lazy(() => import('../../surfaces/customer/pages/RewardsPage'))
const RewardsHistoryPage = lazy(() => import('../../surfaces/customer/pages/RewardsHistoryPage'))
const WaveIdPage = lazy(() => import('../../surfaces/customer/pages/WaveIdPage'))
const SavedOrdersPage = lazy(() => import('../../surfaces/customer/pages/SavedOrdersPage'))
const FavouritesPage = lazy(() => import('../../surfaces/customer/pages/FavouritesPage'))
const ProfilePage = lazy(() => import('../../surfaces/customer/pages/ProfilePage'))
const PreferencesPage = lazy(() => import('../../surfaces/customer/pages/PreferencesPage'))
const FamilyPage = lazy(() => import('../../surfaces/customer/pages/FamilyPage'))
const CelebrationsPage = lazy(() => import('../../surfaces/customer/pages/CelebrationsPage'))
const NotificationsPage = lazy(() => import('../../surfaces/customer/pages/NotificationsPage'))
const SupportPage = lazy(() => import('../../surfaces/customer/pages/SupportPage'))
const ReferralPage = lazy(() => import('../../surfaces/customer/pages/ReferralPage'))
const StagePlaceholderPage = lazy(() => import('../../surfaces/customer/pages/StagePlaceholderPage'))
const OwnerPage = lazy(() => import('../../surfaces/owner/pages/OwnerPage'))
const KdsPage = lazy(() => import('../../surfaces/kds/pages/KdsPage'))
const KdsQueuePage = lazy(() => import('../../surfaces/kds/pages/KdsQueuePage'))
const KdsOrderPage = lazy(() => import('../../surfaces/kds/pages/KdsOrderPage'))
const KdsAvailabilityPage = lazy(() => import('../../surfaces/kds/pages/KdsAvailabilityPage'))
const TeamPage = lazy(() => import('../../surfaces/landing/pages/TeamPage'))
const BakeryLandingPage = lazy(() => import('../../surfaces/bakery/pages/BakeryLandingPage'))
const BakeryCustomerLayout = lazy(() => import('../../surfaces/bakery/layout/BakeryCustomerLayout'))
const BakeryHomePage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryHomePage })))
const BakeryCatalogPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryCatalogPage })))
const BakerySearchPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakerySearchPage })))
const BakeryFinderPage = lazy(() => import('../../surfaces/bakery/pages/BakeryDiscoveryPages').then((module) => ({ default: module.BakeryFinderPage })))
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

const initialSurface: BootSurface = location.pathname.startsWith('/owner') ? 'owner' : location.pathname.startsWith('/kds') ? 'kds' : 'customer'
const loading = location.pathname.startsWith('/bakery')
  ? <main className="bakery-boot"><div className="bakery-loader-cake" /><strong>WARMING THE OVENS…</strong><span>Preparing your bakery</span></main>
  : <BrandedBootLoader surface={initialSurface} />
const customerChildren = [
  'offers',
].map((path) => ({ path, element: <StagePlaceholderPage /> }))
const protectedPage = (page: ReactNode) => <CustomerSessionGate>{page}</CustomerSessionGate>

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/app', element: <CustomerDataBoundary><CustomerLayout /></CustomerDataBoundary>, children: [
    { index: true, element: <HomePage /> }, { path: 'menu', element: <MenuPage /> }, { path: 'search', element: <SearchPage /> },
    { path: 'product/:productId', element: <ProductDetailPage /> }, { path: 'build/:productId', element: <BuildPizzaPage /> }, { path: 'cart', element: <CartPage /> },
    { path: 'auth', element: <AuthPage /> }, { path: 'checkout', element: protectedPage(<CheckoutPage />) }, { path: 'payment/:paymentId', element: protectedPage(<PaymentPage />) }, { path: 'payment', element: protectedPage(<PaymentPage />) },
    { path: 'orders', element: protectedPage(<OrdersPage />) }, { path: 'orders/:orderId', element: protectedPage(<OrderTrackingPage />) },
    { path: 'rewards', element: protectedPage(<RewardsPage />) }, { path: 'rewards/history', element: protectedPage(<RewardsHistoryPage />) }, { path: 'wave-id', element: protectedPage(<WaveIdPage />) },
    { path: 'saved-orders', element: protectedPage(<SavedOrdersPage />) }, { path: 'favourites', element: protectedPage(<FavouritesPage />) },
    { path: 'profile', element: protectedPage(<ProfilePage />) }, { path: 'profile/preferences', element: protectedPage(<PreferencesPage />) }, { path: 'profile/addresses', element: protectedPage(<StagePlaceholderPage />) },
    { path: 'family', element: protectedPage(<FamilyPage />) }, { path: 'celebrations', element: protectedPage(<CelebrationsPage />) },
    { path: 'profile/notifications', element: protectedPage(<NotificationsPage />) }, { path: 'notifications', element: protectedPage(<NotificationsPage />) }, { path: 'support', element: protectedPage(<SupportPage />) },
    { path: 'refer', element: protectedPage(<ReferralPage />) },
    ...customerChildren,
  ] },
  { path: '/owner', element: <OwnerDataBoundary><OwnerPage /></OwnerDataBoundary> },
  { path: '/kds', element: <KdsDataBoundary><KdsPage /></KdsDataBoundary>, children: [
    { index: true, element: <KdsQueuePage /> },
    { path: 'order/:orderId', element: <KdsOrderPage /> },
    { path: 'availability', element: <KdsAvailabilityPage /> },
  ] },
  { path: '/team', element: <TeamPage /> },
  { path: '/bakery', element: <BakeryLandingPage />, errorElement: <BakeryRouteErrorPage /> },
  { path: '/bakery/app', element: <BakeryDataBoundary><BakeryCustomerLayout /></BakeryDataBoundary>, errorElement: <BakeryRouteErrorPage />, children: [
    { index: true, element: <BakeryHomePage /> },
    { path: 'cakes', element: <BakeryCatalogPage /> }, { path: 'bakes', element: <BakeryCatalogPage /> },
    { path: 'events/:eventSlug', element: <BakeryCatalogPage /> }, { path: 'styles/:styleSlug', element: <BakeryCatalogPage /> },
    { path: 'search', element: <BakerySearchPage /> }, { path: 'discover', element: <BakeryFinderPage /> }, { path: 'product/:productId', element: <BakeryProductPage /> },
    { path: 'design/:productId', element: <BakeryBuilderPage /> }, { path: 'bespoke', element: <BakeryBespokePage /> },
    { path: 'cart', element: <BakeryCartPage /> }, { path: 'auth', element: <BakeryAuthPage /> },
    { path: 'checkout', element: <BakeryCheckoutPage /> }, { path: 'payment/:paymentId', element: <BakeryPaymentPage /> },
    { path: 'orders', element: <BakeryOrdersPage /> }, { path: 'orders/:orderId', element: <BakeryOrderTrackingPage /> },
    { path: 'profile', element: <BakeryAccountPage /> }, { path: 'rewards', element: <BakeryAccountPage view="rewards" /> },
    { path: 'celebrations', element: <BakeryAccountPage view="celebrations" /> }, { path: 'support', element: <BakeryAccountPage view="support" /> },
    { path: 'saved-designs', element: <BakeryAccountPage view="saved-designs" /> }, { path: 'refer', element: <BakeryAccountPage view="refer" /> },
    { path: '*', element: <BakeryRouteErrorPage notFound /> },
  ] },
  { path: '/bakery/owner', element: <BakeryDataBoundary><BakeryOwnerPage /></BakeryDataBoundary>, errorElement: <BakeryRouteErrorPage /> },
  { path: '/bakery/production', element: <BakeryDataBoundary><BakeryProductionShell /></BakeryDataBoundary>, errorElement: <BakeryRouteErrorPage />, children: [
    { index: true, element: <BakeryProductionQueuePage /> }, { path: 'order/:orderId', element: <BakeryProductionOrderPage /> }, { path: 'availability', element: <BakeryAvailabilityPage /> },
    { path: '*', element: <BakeryRouteErrorPage notFound /> },
  ] },
  { path: '/bakery/*', element: <BakeryRouteErrorPage notFound /> },
  { path: '*', element: <TeamPage /> },
])

export function AppRouter() { return <Suspense fallback={loading}><RouterProvider router={router} /></Suspense> }
