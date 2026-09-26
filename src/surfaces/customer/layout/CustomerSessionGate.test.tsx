import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomerSessionGate } from './CustomerSessionGate'

const sessionState = { loggedIn: false, session: undefined as { realm: 'CUSTOMER' } | undefined }
vi.mock('../../../app/providers/DemoProvider', () => ({
  useDemo: () => ({ customerLoggedIn: sessionState.loggedIn, customerSession: sessionState.session }),
}))

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}`}</output>
}

describe('CustomerSessionGate', () => {
  beforeEach(() => { sessionState.loggedIn = false; sessionState.session = undefined })

  it('redirects a guest from personal screens and preserves the return path', () => {
    render(<MemoryRouter initialEntries={['/app/rewards?from=nav']}><Routes>
      <Route path="/app/rewards" element={<CustomerSessionGate><div>PRIVATE REWARDS</div></CustomerSessionGate>} />
      <Route path="/app/auth" element={<LocationProbe />} />
    </Routes></MemoryRouter>)
    expect(screen.queryByText('PRIVATE REWARDS')).not.toBeInTheDocument()
    expect(screen.getByText('/app/auth?returnTo=%2Fapp%2Frewards%3Ffrom%3Dnav')).toBeInTheDocument()
  })

  it('renders a personal screen only with a customer session', () => {
    sessionState.loggedIn = true
    sessionState.session = { realm: 'CUSTOMER' }
    render(<MemoryRouter><CustomerSessionGate><div>PRIVATE REWARDS</div></CustomerSessionGate></MemoryRouter>)
    expect(screen.getByText('PRIVATE REWARDS')).toBeInTheDocument()
  })
})
