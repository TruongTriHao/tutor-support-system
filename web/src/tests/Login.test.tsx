import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Login from '../pages/Login'
import api from '../services/api'
import { MemoryRouter } from 'react-router-dom'
// use Vitest globals (test/expect/vi) provided by the test runner

vi.mock('../services/api')

test('login calls API and stores token/user', async ()=>{
  const fake = { token: 'mock-token-u1', user: { id: 'u1', name: 'Alice', email: 'alice@example.com' } }
  ;(api.post as any).mockResolvedValueOnce(fake)

  render(<MemoryRouter><Login /></MemoryRouter>)

  const input = screen.getByPlaceholderText('email')
  fireEvent.change(input, { target: { value: 'alice@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: /login/i }))

  // wait for localStorage to be set via the component's async call
  await screen.findByText(/tutormvp/i, { exact: false, timeout: 1000 }).catch(()=>null)

  expect(localStorage.getItem('token')).toBe('mock-token-u1')
  const stored = JSON.parse(localStorage.getItem('user') || '{}')
  expect(stored.email).toBe('alice@example.com')
})
