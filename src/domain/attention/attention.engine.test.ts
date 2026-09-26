import { describe, expect, it } from 'vitest'
import { createAttentionItem, getActiveAttentionQueue, resolveAttentionItem } from './attention.engine'

describe('attention.engine', () => {
  it('assigns a sensible default severity per type', () => {
    expect(createAttentionItem('KDS_OFFLINE', 'x', 'y', 'z', new Date()).severity).toBe('CRITICAL')
    expect(createAttentionItem('AVAILABILITY_CONFLICT', 'x', 'y', 'z', new Date()).severity).toBe('LOW')
  })

  it('getActiveAttentionQueue excludes resolved items and sorts by severity then age', () => {
    const now = new Date('2026-09-08T00:00:00.000Z')
    const low = createAttentionItem('AVAILABILITY_CONFLICT', 'low', 's', 'a', now)
    const critical = createAttentionItem('KDS_OFFLINE', 'critical', 's', 'a', new Date(now.getTime() + 1000))
    const resolvedHigh = resolveAttentionItem(createAttentionItem('SEVERE_DELAY', 'resolved', 's', 'a', now), now)
    const queue = getActiveAttentionQueue([low, critical, resolvedHigh])
    expect(queue.map((item) => item.title)).toEqual(['critical', 'low'])
  })
})
