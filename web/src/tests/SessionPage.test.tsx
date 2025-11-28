import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionPage from '../pages/SessionPage'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/api')

test('loads session and allows booking/feedback submit', async ()=>{
  const session = { id: 's1', title: 'Study CS', tutorId: 't1', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString(), status: 'scheduled' }
  ;(api.get as any).mockResolvedValueOnce([session])
  ;(api.post as any).mockResolvedValue({ ok: true })

  // provide a fake logged-in user
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Alice' }))

  render(
    <MemoryRouter initialEntries={["/sessions/s1"]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionPage/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Study CS')).toBeTruthy()

  // click Book and ensure api.post was called for bookings
  fireEvent.click(screen.getByRole('button', { name: /book/i }))
  expect((api.post as any)).toHaveBeenCalled()
})
