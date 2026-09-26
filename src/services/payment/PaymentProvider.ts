export interface PaymentInitiateInput { merchantOrderId: string; amount: number }
export interface PaymentInitiateResult { redirectUrl: string; providerReferenceId: string }
export interface PaymentStatusResult { status: 'PENDING' | 'CONFIRMED' | 'FAILED'; providerTransactionId?: string; failureReason?: string }
export interface PaymentRefundResult { status: 'SUCCESS' | 'FAILED' | 'PROCESSING'; providerRefundId?: string }

/** Replaceable boundary. Production implementation talks to PhonePe; the prototype uses DemoPhonePeProvider. */
export interface PaymentProvider {
  initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult>
  getStatus(merchantOrderId: string): Promise<PaymentStatusResult>
  refund(providerTransactionId: string, amount: number): Promise<PaymentRefundResult>
}
