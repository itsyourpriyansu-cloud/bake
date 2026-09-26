/**
 * DemoClock — abstraction so engines/scenarios/tests never read Date.now() directly.
 * Production backend would use real server time; the prototype lets scenarios and
 * tests advance time deterministically instead of depending on wall-clock timing.
 */
export interface Clock {
  now(): Date
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export class DemoClock implements Clock {
  private offsetMs = 0
  private frozenAt: Date | null = null

  now(): Date {
    if (this.frozenAt) return this.frozenAt
    return new Date(Date.now() + this.offsetMs)
  }

  advanceMinutes(minutes: number): void {
    this.offsetMs += minutes * 60_000
  }

  setOffsetMinutes(minutes: number): void {
    this.offsetMs = minutes * 60_000
    this.frozenAt = null
  }

  offsetMinutes(): number {
    return Math.round(this.offsetMs / 60_000)
  }

  freeze(at: Date = new Date()): void {
    this.frozenAt = at
  }

  unfreeze(): void {
    this.frozenAt = null
  }

  reset(): void {
    this.offsetMs = 0
    this.frozenAt = null
  }
}

export const demoClock = new DemoClock()
