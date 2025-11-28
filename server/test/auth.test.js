it('login creates token', async () => {
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')
  const res = await request(app).post('/api/auth/login').send({ email: 'testuser@example.com' })
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('token')
  expect(res.body).toHaveProperty('user')
})
