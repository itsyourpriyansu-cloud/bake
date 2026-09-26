import { createId } from '../../domain/shared/ids'
import { demoClock } from '../../domain/shared/clock'
import { DEMO_CREDENTIALS } from '../../domain/auth/auth.types'
import type { CustomerAuthProvider, OtpRequestResult, OtpVerifyResult } from './CustomerAuthProvider'

/** Fake WhatsApp OTP: any phone number receives a request, but only the frozen demo OTP (123456) verifies. */
export class DemoCustomerAuthProvider implements CustomerAuthProvider {
  async requestOtp(_phone?: string): Promise<OtpRequestResult> {
    return { requestId: createId('OTP'), expiresAt: new Date(demoClock.now().getTime() + 5 * 60_000).toISOString() }
  }

  async verifyOtp(phone: string, otp: string): Promise<OtpVerifyResult> {
    const normalizedPhone = phone.replace(/^\+?91/, '')
    if (normalizedPhone !== DEMO_CREDENTIALS.customer.phone || otp !== DEMO_CREDENTIALS.customer.otp) return { verified: false }
    return { verified: true, customerId: 'CUST001' }
  }
}

export const demoCustomerAuthProvider = new DemoCustomerAuthProvider()
