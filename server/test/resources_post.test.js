it('creates resource and notifies uploader', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')

  const login = await request(app).post('/api/auth/login').send({ email: 'uploader@example.com' })
  const uploader = login.body.user
  const payload = { title: 'New Resource Test', courseCode: 'CS999', type: 'slides', url: 'http://example.com/res.pdf', uploaderId: uploader.id }
  const res = await request(app).post('/api/resources').send(payload)
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('id')

  // check notification for uploader
  const notes = await request(app).get(`/api/notifications?userId=${uploader.id}`)
  expect(notes.status).toBe(200)
  const found = notes.body.find(n=>n.message && n.message.includes('uploaded'))
  expect(found).toBeTruthy()
})
