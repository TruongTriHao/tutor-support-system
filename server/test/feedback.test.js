it('allows feedback only for completed sessions and prevents duplicates', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')
  // login as existing student u1 (from data)
  const login = await request(app).post('/api/auth/login').send({ email: 'alice@student.hcmut.edu.vn' })
  const student = login.body.user
  // Strategy: pick a scheduled session, book student, mark it COMPLETED, then submit feedback
  const sessionsRes = await request(app).get('/api/sessions')
  const scheduled = sessionsRes.body.find(s=>s.status==='SCHEDULED')
  expect(scheduled).toBeTruthy()
  // create booking so student is an attendee
  const book = await request(app).post('/api/bookings').send({ sessionId: scheduled.id, studentId: student.id })
  expect(book.status).toBe(200)
  // mark session completed
  const mark = await request(app).post(`/api/sessions/${scheduled.id}/status`).send({ status: 'COMPLETED' })
  expect(mark.status).toBe(200)
  // submit feedback (should succeed)
  const fbRes = await request(app).post('/api/feedback').send({ sessionId: scheduled.id, tutorId: scheduled.tutorId, studentId: student.id, rating: 4, comment: 'Good session', isAnonymous: false })
  expect(fbRes.status).toBe(200)
  expect(fbRes.body).toHaveProperty('id')
  // duplicate feedback should be rejected
  const dup = await request(app).post('/api/feedback').send({ sessionId: scheduled.id, tutorId: scheduled.tutorId, studentId: student.id, rating: 5 })
  expect(dup.status).toBe(400)
  // try to feedback for a non-completed session (pick another scheduled one if available)
  const other = (await request(app).get('/api/sessions')).body.find(s=>s.status==='SCHEDULED')
  if(other){
    const bad = await request(app).post('/api/feedback').send({ sessionId: other.id, tutorId: other.tutorId, studentId: student.id, rating: 3 })
    expect(bad.status).toBe(400)
  }
})
