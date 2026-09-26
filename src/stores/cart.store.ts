import { create } from 'zustand'
interface CartDraftState { editingItemId?: string; setEditingItemId: (id?: string) => void }
export const useCartDraftStore = create<CartDraftState>((set) => ({ setEditingItemId: (editingItemId) => set({ editingItemId }) }))
