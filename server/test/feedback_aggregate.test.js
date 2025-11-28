it('returns aggregated feedback stats for a tutor', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')

  // create a tutor id by finding existing tutor
  const tutorsRes = await request(app).get('/api/tutors')
  const t = tutorsRes.body[0]
  expect(t).toBeTruthy()

  // ensure there is at least one feedback for this tutor by submitting one (use a completed session)
  const sessionsRes = await request(app).get('/api/sessions')
  const completed = sessionsRes.body.find(s=>s.status==='COMPLETED') || sessionsRes.body[0]
  // login student
  const login = await request(app).post('/api/auth/login').send({ email: 'agg-feedback@example.com' })
  const student = login.body.user
  // ensure student is attendee for completed session (book if needed)
  await request(app).post('/api/bookings').send({ sessionId: completed.id, studentId: student.id })
  // mark completed (idempotent)
  await request(app).post(`/api/sessions/${completed.id}/status`).send({ status: 'COMPLETED' })
  // submit feedback
  await request(app).post('/api/feedback').send({ sessionId: completed.id, tutorId: completed.tutorId, studentId: student.id, rating: 4, comment: 'Aggregate test' })

  // call aggregate
  const agg = await request(app).get(`/api/feedback/aggregate?tutorId=${completed.tutorId}`)
  expect(agg.status).toBe(200)
  expect(agg.body).toHaveProperty('tutorId')
  expect(agg.body).toHaveProperty('average')
  expect(typeof agg.body.average).toBe('number')
  expect(agg.body).toHaveProperty('count')
  expect(Array.isArray(agg.body.recent)).toBe(true)
})
