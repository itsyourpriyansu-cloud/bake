let counter = 0

/** Deterministic-enough demo IDs: prefixed, monotonic within a session. Avoids relying on crypto.randomUUID for readability in demo data dumps. */
export function createId(prefix: string): string {
  counter += 1
  const time = Date.now().toString(36).toUpperCase()
  const seq = counter.toString(36).toUpperCase().padStart(4, '0')
  return `${prefix}-${time}-${seq}`
}

export function createPublicOrderNumber(sequence: number): string {
  return `PW-${String(sequence).padStart(5, '0')}`
}
