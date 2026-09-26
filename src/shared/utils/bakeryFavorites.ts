import { useCallback, useEffect, useState } from 'react'

export interface BakeryCollection {
  id: string
  name: string
  productIds: string[]
}

const favouritesKey = 'bakery-wave:favourites'
const collectionsKey = 'bakery-wave:collections'
const savedEvent = 'bakery-wave:saved-updated'

function readList(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value as string[] : []
  } catch {
    return []
  }
}

function readCollections() {
  try {
    const value = JSON.parse(localStorage.getItem(collectionsKey) ?? '[]')
    return Array.isArray(value) ? value as BakeryCollection[] : []
  } catch {
    return []
  }
}

function announceSavedChange() {
  window.dispatchEvent(new Event(savedEvent))
}

export function bakeryHaptic(duration = 8) {
  if ('vibrate' in navigator) navigator.vibrate(duration)
}

export function useBakerySavedItems() {
  const [favouriteIds, setFavouriteIds] = useState<string[]>(readList(favouritesKey))
  const [collections, setCollections] = useState<BakeryCollection[]>(readCollections)

  useEffect(() => {
    const sync = () => {
      setFavouriteIds(readList(favouritesKey))
      setCollections(readCollections())
    }
    window.addEventListener(savedEvent, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(savedEvent, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggleFavourite = useCallback((productId: string) => {
    const current = readList(favouritesKey)
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    localStorage.setItem(favouritesKey, JSON.stringify(next))
    bakeryHaptic()
    announceSavedChange()
    return next.includes(productId)
  }, [])

  const createCollection = useCallback((name: string, productIds: string[]) => {
    const cleanName = name.trim()
    if (!cleanName || !productIds.length) return false
    const next = [...readCollections(), { id: `COL-${Date.now()}`, name: cleanName, productIds: [...new Set(productIds)] }]
    localStorage.setItem(collectionsKey, JSON.stringify(next))
    bakeryHaptic(12)
    announceSavedChange()
    return true
  }, [])

  const deleteCollection = useCallback((collectionId: string) => {
    localStorage.setItem(collectionsKey, JSON.stringify(readCollections().filter((collection) => collection.id !== collectionId)))
    announceSavedChange()
  }, [])

  return {
    favouriteIds,
    collections,
    isFavourite: (productId: string) => favouriteIds.includes(productId),
    toggleFavourite,
    createCollection,
    deleteCollection,
  }
}
