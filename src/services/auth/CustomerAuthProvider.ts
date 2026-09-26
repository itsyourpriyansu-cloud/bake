export interface OtpRequestResult { requestId: string; expiresAt: string }
export interface OtpVerifyResult { verified: boolean; customerId?: string }

/** Replaceable boundary. Production implementation talks to an SMS/OTP gateway; prototype checks a fixed demo OTP. */
export interface CustomerAuthProvider {
  requestOtp(phone: string): Promise<OtpRequestResult>
  verifyOtp(phone: string, otp: string): Promise<OtpVerifyResult>
}
