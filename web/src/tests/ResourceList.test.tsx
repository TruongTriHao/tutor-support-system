import React from 'react'
import { render, screen } from '@testing-library/react'
import ResourceList from '../pages/ResourceList'
import api from '../services/api'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/api')

test('renders resources and view links', async ()=>{
  const items = [ { id: 'r1', title: 'Lecture A', courseCode: 'CS101', type: 'slides' }, { id: 'r2', title: 'Lecture B', courseCode: 'CS102', type: 'video' } ]
  ;(api.get as any).mockResolvedValueOnce(items)

  render(
    <MemoryRouter>
      <ResourceList />
    </MemoryRouter>
  )

  expect(await screen.findByText('Lecture A')).toBeTruthy()
  expect(await screen.findByText('Lecture B')).toBeTruthy()
  expect(screen.getAllByText(/View/i).length).toBeGreaterThanOrEqual(2)
})
