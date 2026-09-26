import type { KdsSession, OwnerSession } from '../../shared/types/domain'

export const sessionKeys = { customer: 'pizza-wave:session:customer', owner: 'pizza-wave:session:owner', kds: 'pizza-wave:session:kds' } as const
export function readOwnerSession(): OwnerSession | null { try { const value = JSON.parse(sessionStorage.getItem(sessionKeys.owner) ?? 'null') as OwnerSession | null; return value?.realm === 'owner' && new Date(value.expiresAt).getTime() > Date.now() ? value : null } catch { return null } }
export function readKdsSession(): KdsSession | null { try { const value = JSON.parse(sessionStorage.getItem(sessionKeys.kds) ?? 'null') as KdsSession | null; return value?.realm === 'kds' && new Date(value.expiresAt).getTime() > Date.now() ? value : null } catch { return null } }
