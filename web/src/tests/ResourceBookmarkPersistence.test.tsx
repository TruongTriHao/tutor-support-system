import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
// ensure api is mocked before importing modules that use it
vi.mock('../services/api')
import ResourceDetail from '../pages/ResourceDetail'
import api from '../services/api'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

test('bookmark persists across unmount/remount', async ()=>{
  const res = { id: 'rPersist', title: 'Persist Res', courseCode: 'CS200' }
  // return value for all calls (mount + remount)
  ;(api.get as any).mockResolvedValue([res])
  ;(api.getRaw as any).mockResolvedValue('persist content')

  // clear any existing bookmarks
  localStorage.setItem('bookmarks', JSON.stringify([]))

  const { unmount } = render(
    <MemoryRouter initialEntries={["/resources/rPersist"]}>
      <Routes>
        <Route path="/resources/:id" element={<ResourceDetail/>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('Persist Res')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /open \/ stream/i }))
  expect(await screen.findByText('persist content')).toBeTruthy()
  unmount()

  // remount and ensure bookmark still present in localStorage
  render(
    <MemoryRouter initialEntries={["/resources/rPersist"]}>
      <Routes>
        <Route path="/resources/:id" element={<ResourceDetail/>} />
      </Routes>
    </MemoryRouter>
  )

  const bookmarks = JSON.parse(localStorage.getItem('bookmarks')||'[]')
  expect(bookmarks).toContain('rPersist')
  cleanup()
})
