const activationTimeoutMs = 8_000
const controlTimeoutMs = 5_000

function normaliseScope(scope: string) {
  return scope.endsWith('/') ? scope : `${scope}/`
}

function isExpectedController(registration: ServiceWorkerRegistration | undefined, expectedPath: string, scope: string) {
  if (!registration?.active || !navigator.serviceWorker.controller) return false
  const registrationScope = normaliseScope(new URL(registration.scope).pathname)
  const activePath = new URL(registration.active.scriptURL).pathname
  const controllerPath = new URL(navigator.serviceWorker.controller.scriptURL).pathname
  return registrationScope === normaliseScope(scope) && activePath === expectedPath && controllerPath === expectedPath
}

async function waitForControl(registration: ServiceWorkerRegistration, expectedPath: string, scope: string) {
  if (isExpectedController(registration, expectedPath, scope)) return true
  return new Promise<boolean>((resolve) => {
    const finish = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      window.clearTimeout(timeout)
      resolve(isExpectedController(registration, expectedPath, scope))
    }
    const onControllerChange = () => finish()
    const timeout = window.setTimeout(finish, controlTimeoutMs)
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true })
  })
}

/**
 * Activates the exact worker for one surface and waits for its claim to finish.
 * Slower mobile browsers can report `activated` just before `controllerchange`; forcing
 * an immediate reload in that gap causes a reload loop, so control is verified first.
 */
export async function ensureScopedWorker(workerUrl: string, scope: string): Promise<'CONTROLLED' | 'RELOAD_REQUIRED'> {
  const expectedPath = new URL(workerUrl, location.origin).pathname
  const existingRegistration = await navigator.serviceWorker.getRegistration(new URL(scope, location.origin).href)
  if (isExpectedController(existingRegistration, expectedPath, scope)) return 'CONTROLLED'

  const nextRegistration = await navigator.serviceWorker.register(workerUrl, { scope })
  const candidate = nextRegistration.installing ?? nextRegistration.waiting ?? nextRegistration.active
  if (candidate?.state !== 'activated') {
    await new Promise<void>((resolve, reject) => {
      if (!candidate) { reject(new Error(`No worker candidate for ${scope}`)); return }
      const timeout = window.setTimeout(() => reject(new Error(`Worker activation timed out for ${scope}`)), activationTimeoutMs)
      const onStateChange = () => {
        if (candidate.state === 'activated') { window.clearTimeout(timeout); candidate.removeEventListener('statechange', onStateChange); resolve() }
        if (candidate.state === 'redundant') { window.clearTimeout(timeout); candidate.removeEventListener('statechange', onStateChange); reject(new Error(`Worker became redundant for ${scope}`)) }
      }
      candidate.addEventListener('statechange', onStateChange)
      onStateChange()
    })
  }
  return await waitForControl(nextRegistration, expectedPath, scope) ? 'CONTROLLED' : 'RELOAD_REQUIRED'
}
