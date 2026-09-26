import { useMutation } from '@tanstack/react-query'
import { api } from '../../../services/api'

export function useCustomerAuthActions() {
  const requestOtp = useMutation({ mutationFn: (phone: string) => api.auth.requestCustomerOtp(phone) })
  const verifyOtp = useMutation({ mutationFn: ({ phone, otp }: { phone: string; otp: string }) => api.auth.verifyCustomerOtp(phone, otp) })
  return { requestOtp, verifyOtp }
}
