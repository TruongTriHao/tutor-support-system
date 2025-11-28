it('creates booking and session attendee is updated', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')
  // use a new student email to ensure fresh user
  const login = await request(app).post('/api/auth/login').send({ email: 'student2@example.com' })
  const student = login.body.user
  // pick a session that exists
  const sessionsRes = await request(app).get('/api/sessions')
  const s = sessionsRes.body.find(s=>s.id && s.status === 'SCHEDULED')
  const res = await request(app).post('/api/bookings').send({ sessionId: s.id, studentId: student.id })
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('id')
  // verify session now includes student
  const updatedSessions = await request(app).get('/api/sessions')
  const updated = updatedSessions.body.find(x=>x.id===s.id)
  expect(updated.attendees).toContain(student.id)
})
