import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { addCartItem } from '../api/cart.api'
import { getMenu } from '../api/catalog.api'

interface ModelContextTool {
  name: string
  title?: string
  description: string
  inputSchema: object
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
  execute(input: unknown): unknown | Promise<unknown>
}

declare global {
  interface Document {
    readonly modelContext?: { registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): void | Promise<void> }
  }
}

const inputSchema = z.object({ productId: z.string().min(1) }).strict()

export function usePizzaWaveTools() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    const tool: ModelContextTool = {
      name: 'add_menu_item_to_cart',
      title: 'Add menu item to cart',
      description: 'Add one available Pizza Wave menu product to the visible customer cart using its product ID.',
      inputSchema: { type: 'object', properties: { productId: { type: 'string', description: 'Exact product ID from the Pizza Wave menu.' } }, required: ['productId'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const { productId } = inputSchema.parse(input)
        const menu = await getMenu(); const product = menu.products.find((item: { id: string }) => item.id === productId)
        if (!product) throw new Error('Unknown Pizza Wave product ID')
        if (!product.available) throw new Error('This product is currently unavailable')
        const cart = await addCartItem(productId)
        await Promise.all([queryClient.invalidateQueries({ queryKey: ['cart'] }), queryClient.invalidateQueries({ queryKey: ['cart-quote'] })])
        return { productId, productName: product.name, cartItemCount: cart.items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0) }
      },
    }
    void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [queryClient])
}
