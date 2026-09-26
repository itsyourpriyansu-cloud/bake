import { describe, expect, it } from 'vitest'
import { DemoPhonePeProvider } from './DemoPhonePeProvider'

describe('DemoPhonePeProvider', () => {
  it('rehydrates a success action after simulated provider memory is lost', async () => {
    const restartedProvider = new DemoPhonePeProvider()
    restartedProvider.succeedDemoPayment('MO-RESTORED', 299)
    const status = await restartedProvider.getStatus('MO-RESTORED')
    expect(status.status).toBe('CONFIRMED')
    expect(status.providerTransactionId).toBeTruthy()
  })

  it('rehydrates failure and pending demo actions without real credentials', async () => {
    const restartedProvider = new DemoPhonePeProvider()
    restartedProvider.failDemoPayment('MO-FAILED', 299)
    restartedProvider.keepDemoPaymentPending('MO-PENDING', 299)
    expect((await restartedProvider.getStatus('MO-FAILED')).status).toBe('FAILED')
    expect((await restartedProvider.getStatus('MO-PENDING')).status).toBe('PENDING')
  })
})
