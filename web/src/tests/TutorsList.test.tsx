import React from 'react'
import { render, screen } from '@testing-library/react'
import TutorsList from '../pages/TutorsList'
import api from '../services/api'
import { MemoryRouter } from 'react-router-dom'
// use Vitest globals (test/expect/vi) provided by the test runner

vi.mock('../services/api')

test('renders tutors from API', async ()=>{
  const tutors = [
    { id: 't1', name: 'Bob Tutor', bio: 'Bio', expertise: ['CS251'] },
    { id: 't2', name: 'Carol Tutor', bio: 'Bio2', expertise: ['MATH101'] }
  ]
  ;(api.get as any).mockResolvedValueOnce(tutors)

  render(<MemoryRouter><TutorsList /></MemoryRouter>)

  expect(await screen.findByText('Bob Tutor')).toBeTruthy()
  expect(await screen.findByText('Carol Tutor')).toBeTruthy()
})
