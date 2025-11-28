import React from 'react'
import { render, screen } from '@testing-library/react'
import TutorProfile from '../pages/TutorProfile'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/api')

test('renders tutor info and sessions', async ()=>{
  const tutor = { id: 't1', name: 'Bob Tutor', bio: 'Experienced', expertise: ['CS101'], sessions: [ { id: 's1', title: 'Intro Session', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString(), status: 'scheduled' } ] }
  ;(api.get as any).mockResolvedValueOnce(tutor)

  render(
    <MemoryRouter initialEntries={["/tutors/t1"]}>
      <Routes>
        <Route path="/tutors/:id" element={<TutorProfile/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Bob Tutor')).toBeTruthy()
  expect(await screen.findByText('Intro Session')).toBeTruthy()
})
