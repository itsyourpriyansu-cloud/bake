export interface BakeryCustomerSession {
  name: string
  phone: string
  expiresAt: string
}

const customerSessionKey = 'bakery-wave:session:customer'

export function readBakeryCustomer() {
  try {
    const value = JSON.parse(localStorage.getItem(customerSessionKey) ?? 'null') as BakeryCustomerSession | null
    if (!value || new Date(value.expiresAt).getTime() <= Date.now()) return null
    return value
  } catch {
    return null
  }
}

export function writeBakeryCustomer(value: BakeryCustomerSession) {
  localStorage.setItem(customerSessionKey, JSON.stringify(value))
}

export function clearBakeryCustomer() {
  localStorage.removeItem(customerSessionKey)
}
