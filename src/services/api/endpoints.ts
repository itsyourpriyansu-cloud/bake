export const endpoints = {
  capabilities: '/capabilities', categories: '/categories', products: '/products', menu: '/menu',
  recommendations: '/recommendations', search: '/search',
  availability: '/availability', ownerAvailability: '/owner/availability', kdsAvailability: '/kds/availability',
  cart: '/cart', cartItems: '/cart/items', cartQuote: '/cart/quote',
  checkoutOptions: '/checkout/options', checkoutSession: '/checkout/session', checkoutIntent: '/checkout/order-intent',
  paymentInitiate: '/payments/phonepe/initiate',
  orders: '/orders',
  customerProfile: '/customer/profile', customerPreferences: '/customer/preferences',
  notificationPreferences: '/customer/notification-preferences', notifications: '/notifications',
  savedOrders: '/saved-orders', favourites: '/favourites', family: '/family', celebrations: '/celebrations',
  ownerDashboard: '/owner/dashboard', ownerOrders: '/owner/orders', ownerLiveOrders: '/owner/orders/live', ownerAttention: '/owner/attention', ownerCustomers: '/owner/customers',
  ownerOpportunities: '/owner/opportunities', ownerSupport: '/owner/support', ownerStoreOrders: '/owner/store-orders', ownerAudit: '/owner/audit',
  ownerCampaignPreview: '/owner/campaigns/preview', ownerCampaignSimulate: '/owner/campaigns/simulate',
  ownerWhatsAppSimulate: '/owner/whatsapp/simulate',
  kdsQueue: '/kds/queue', kdsOrders: '/kds/orders', kdsHeartbeat: '/kds/heartbeat',
  loyalty: '/loyalty', loyaltyHistory: '/loyalty/history', loyaltyWallet: '/loyalty/wallet', waveId: '/wave-id',
  crmCustomers: '/crm/customers',
  chatMessage: '/chat/message', chatConversations: '/chat/conversations',
  conversations: '/conversations',
  supportCases: '/support/cases',
  refunds: '/refunds',
  authCustomerOtpRequest: '/auth/customer/request-otp', authCustomerOtpVerify: '/auth/customer/verify-otp',
  authOwnerLogin: '/auth/owner/login', authKdsLogin: '/auth/kds/login',
  configStore: '/config/store',
  demoReset: '/demo/reset', demoScenarios: '/demo/scenarios', demoScenario: '/demo/scenario',
  demoCapabilities: '/demo/capabilities', demoSession: '/demo/session', demoState: '/demo/state',
  demoAdvanceTime: '/demo/clock/advance', demoKitchenLoad: '/demo/kitchen-load',
  demoPaymentOutcome: '/demo/payment-outcome', demoCompleteOrder: '/demo/complete-order', demoKdsOffline: '/demo/kds-offline',
  customerRetention: '/customer/retention', referrals: '/referrals', celebrationAutomation: '/celebrations/automation',
} as const

export const paymentStatus = (paymentId: string) => `/payments/${paymentId}`
export const paymentConfirm = (paymentId: string) => `/demo/payments/${paymentId}/succeed`
export const paymentFail = (paymentId: string) => `/demo/payments/${paymentId}/fail`
export const paymentPending = (paymentId: string) => `/demo/payments/${paymentId}/pending`
export const orderById = (orderId: string) => `/orders/${orderId}`
export const orderEvents = (orderId: string) => `/orders/${orderId}/events`
export const orderComplete = (orderId: string) => `/orders/${orderId}/complete`
export const orderReorder = (orderId: string) => `/orders/${orderId}/reorder`
export const demoAdvanceOrder = (orderId: string) => `/demo/orders/${orderId}/advance`
export const ownerAcceptOrder = (orderId: string) => `/owner/orders/${orderId}/accept`
export const ownerRejectOrder = (orderId: string) => `/owner/orders/${orderId}/reject`
export const ownerResolveAttention = (attentionId: string) => `/owner/attention/${attentionId}/resolve`
export const ownerCustomerTimeline = (customerId: string) => `/owner/customers/${customerId}/timeline`
export const ownerCustomerPoints = (customerId: string) => `/owner/customers/${customerId}/points-adjustment`
export const ownerSupportAction = (caseId: string) => `/owner/support/${caseId}/action`
export const kdsStartPrep = (orderId: string) => `/kds/orders/${orderId}/start-prep`
export const kdsPrepTime = (orderId: string) => `/kds/orders/${orderId}/prep-time`
export const kdsReady = (orderId: string) => `/kds/orders/${orderId}/ready`
export const kdsProblem = (orderId: string) => `/kds/orders/${orderId}/problem`
export const kdsOrderById = (orderId: string) => `/kds/orders/${orderId}`
export const supportCaseResolve = (caseId: string) => `/support/cases/${caseId}/resolve`
export const refundProcess = (refundId: string) => `/refunds/${refundId}/process`
export const scenarioByName = (name: string) => `/demo/scenario/${name}`
export const referralAdvance = (id: string) => `/referrals/${id}/advance-demo`
export const celebrationScenario = (stage: string) => `/demo/celebrations/${stage}`
