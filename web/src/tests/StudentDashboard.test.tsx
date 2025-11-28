import React from 'react'
import { render, screen } from '@testing-library/react'
import StudentDashboard from '../pages/StudentDashboard'
import api from '../services/api'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/api')

test('renders sessions and links to details', async ()=>{
  const sessions = [ { id: 's1', title: 'Session One', start: new Date().toISOString(), status: 'scheduled' }, { id: 's2', title: 'Session Two', start: new Date().toISOString(), status: 'completed' } ]
  ;(api.get as any).mockResolvedValueOnce(sessions)

  render(
    <MemoryRouter>
      <StudentDashboard />
    </MemoryRouter>
  )

  expect(await screen.findByText('Session One')).toBeTruthy()
  expect(await screen.findByText('Session Two')).toBeTruthy()
  expect(screen.getAllByText(/Details/i).length).toBeGreaterThanOrEqual(2)
})
