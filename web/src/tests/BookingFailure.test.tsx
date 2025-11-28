import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// ensure api is mocked before importing modules that use it
vi.mock('../services/api')
import SessionPage from '../pages/SessionPage'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

test('shows alert on booking failure and does not crash', async ()=>{
  const session = { id: 'sX', title: 'Fail Book', tutorId: 'tX', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString(), status: 'scheduled' }
  ;(api.get as any).mockResolvedValueOnce([session])
  ;(api.post as any).mockRejectedValueOnce(new Error('Booking failed'))

  localStorage.setItem('user', JSON.stringify({ id: 'uX', name: 'Failer' }))
  ;(window as any).alert = vi.fn()

  render(
    <MemoryRouter initialEntries={["/sessions/sX"]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionPage/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Fail Book')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /book/i }))
  // alert should be called with error (wait for async handler)
  await waitFor(()=> expect((window as any).alert).toHaveBeenCalled())
})
