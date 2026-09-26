import { db } from '../database/db'
import { resetDemoDatabase } from './reset-demo'
import { loadScenario, scenarioIds, type ScenarioId, type ScenarioSummary } from '../scenarios'
import { eventBus } from '../events/event-bus'
import type { AppEvent } from '../events/event-types'

/**
 * Single façade the frontend's demo control panel should talk to instead of importing
 * scenarios/db directly. Keeps "what is the demo doing right now" in one place.
 */
export const demoController = {
  scenarioIds,
  async reset(): Promise<void> {
    await resetDemoDatabase()
  },
  async loadScenario(id: ScenarioId): Promise<ScenarioSummary> {
    return loadScenario(id)
  },
  async activeScenario(): Promise<ScenarioId | 'none'> {
    const record = await db.config.get('activeScenario')
    return (record?.value as ScenarioId | 'none') ?? 'none'
  },
  subscribe(listener: (event: AppEvent) => void): () => void {
    return eventBus.subscribe(listener)
  },
  recentEvents(limit = 50): AppEvent[] {
    return eventBus.recent(limit)
  },
}
