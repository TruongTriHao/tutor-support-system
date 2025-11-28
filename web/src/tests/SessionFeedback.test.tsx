import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionPage from '../pages/SessionPage'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/api')

test('submits feedback via api.post with expected payload', async ()=>{
  const session = { id: 's2', title: 'Feedback Session', tutorId: 't9', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString(), status: 'completed' }
  ;(api.get as any).mockResolvedValueOnce([session])
  ;(api.post as any).mockResolvedValue({ ok: true })

  // ensure localStorage is available and returns our user
  ;(window as any).localStorage = { getItem: () => JSON.stringify({ id: 'u9', name: 'Tester' }), setItem: vi.fn() }

  // stub alert
  ;(window as any).alert = vi.fn()

  render(
    <MemoryRouter initialEntries={["/sessions/s2"]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionPage/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Feedback Session')).toBeTruthy()

  // change rating and comment
  const ratingInput = screen.getByRole('spinbutton')
  fireEvent.change(ratingInput, { target: { value: '4' } })
  const textarea = screen.getByRole('textbox')
  fireEvent.change(textarea, { target: { value: 'Good session' } })

  fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))

  // expect api.post called with '/feedback' as first arg
  expect((api.post as any)).toHaveBeenCalled()
  const callArgs = (api.post as any).mock.calls.find((c:any)=>c[0]==='/feedback')
  expect(callArgs).toBeTruthy()
  const payload = callArgs[1]
  expect(payload.sessionId).toBe('s2')
  expect(payload.studentId).toBe('u9')
  expect(payload.rating).toBe(4)
  expect(payload.comment).toBe('Good session')
})
