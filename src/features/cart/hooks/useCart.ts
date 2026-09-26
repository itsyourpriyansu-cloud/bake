import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { FulfillmentMode } from '../../../domain/customer/customer.types'
import type { CartItemPatch, CartItemWrite } from '../../../services/api/cart.api'

export const useCart = () => useQuery({ queryKey: ['cart'], queryFn: api.cart.getCart })
export const useCartQuote = (mode: FulfillmentMode = 'DELIVERY', pointsRequested = 0) => useQuery({ queryKey: ['cart-quote', mode, pointsRequested], queryFn: () => api.cart.quoteCart(mode, pointsRequested) })

export function useCartActions() {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['cart'] }), client.invalidateQueries({ queryKey: ['cart-quote'] })]) }
  const add = useMutation({
    mutationFn: (input: string | CartItemWrite) => api.cart.addCartItem(typeof input === 'string' ? { productId: input } : input),
    onSuccess: refresh,
  })
  const update = useMutation({ mutationFn: ({ id, ...patch }: { id: string } & CartItemPatch) => api.cart.updateCartItem(id, patch), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (id: string) => api.cart.removeCartItem(id), onSuccess: refresh })
  const requote = useMutation({
    mutationFn: (mode: FulfillmentMode) => api.cart.quoteCart(mode),
    onSuccess: (quote, mode) => client.setQueryData(['cart-quote', mode, 0], quote),
  })
  return { add, update, remove, requote }
}
