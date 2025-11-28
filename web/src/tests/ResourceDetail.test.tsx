import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ResourceDetail from '../pages/ResourceDetail'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/api')

test('streams resource and bookmarks it', async ()=>{
  const res = { id: 'r1', title: 'Lecture 1', courseCode: 'CS101' }
  ;(api.get as any).mockResolvedValueOnce([res])
  ;(api.getRaw as any).mockResolvedValueOnce('This is the lecture content')

  render(
    <MemoryRouter initialEntries={["/resources/r1"]}>
      <Routes>
        <Route path="/resources/:id" element={<ResourceDetail/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Lecture 1')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /open \/ stream/i }))
  expect(await screen.findByText('This is the lecture content')).toBeTruthy()
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks')||'[]')
  expect(bookmarks).toContain('r1')
})
