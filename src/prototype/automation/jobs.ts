import { demoClock } from '../../domain/shared/clock'
import { runAutomationSweep } from './automation.engine'

let intervalHandle: ReturnType<typeof setInterval> | null = null

/** Call once from app bootstrap (browser only). No-op if already running. */
export function startAutomationJobs(intervalMs = 30_000): void {
  if (intervalHandle) return
  intervalHandle = setInterval(() => { void runAutomationSweep(demoClock.now()) }, intervalMs)
}

export function stopAutomationJobs(): void {
  if (intervalHandle) clearInterval(intervalHandle)
  intervalHandle = null
}
