import React from 'react'
import { render, screen } from '@testing-library/react'
import NotificationCenter from '../components/NotificationCenter'
import api from '../services/api'

vi.mock('../services/api')

test('shows notification count for the user', async ()=>{
  const notes = [ { id: 'n1', message: 'Booked confirmed' }, { id: 'n2', message: 'Feedback received' } ]
  ;(api.get as any).mockResolvedValueOnce(notes)
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Alice' }))

  render(<NotificationCenter />)

  expect(await screen.findByText(/Notifications \(2\)/)).toBeTruthy()
})
