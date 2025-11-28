import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// ensure api is mocked before importing modules that use it
vi.mock('../services/api')
import SessionPage from '../pages/SessionPage'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

test('handles duplicate feedback response from server gracefully', async ()=>{
  // reset mocks to avoid previous tests consuming mockResolvedValueOnce
  vi.resetAllMocks()
  const session = { id: 'sDup', title: 'Dup Session', tutorId: 'tDup', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString(), status: 'COMPLETED' }
  ;(api.get as any).mockResolvedValueOnce([session])
  // first post succeeds, second returns 400 duplicate
  ;(api.post as any).mockResolvedValueOnce({ id: 'fb1' })
  ;(api.post as any).mockRejectedValueOnce(new Error('duplicate feedback'))

  localStorage.setItem('user', JSON.stringify({ id: 'uDup', name: 'DupUser' }))
  ;(window as any).alert = vi.fn()

  render(
    <MemoryRouter initialEntries={["/sessions/sDup"]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionPage/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Dup Session')).toBeTruthy()
  // submit feedback twice
  fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
  expect((api.post as any)).toHaveBeenCalled()
  // second attempt
  fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
  // should call alert for error (wait for async handler)
  await waitFor(()=> expect((window as any).alert).toHaveBeenCalled())
})
