it('creates notifications after booking and feedback', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')
  // create a new student and book a scheduled session
  const login = await request(app).post('/api/auth/login').send({ email: 'notify-student@example.com' })
  const student = login.body.user
  const sessionsRes = await request(app).get('/api/sessions')
  const sched = sessionsRes.body.find(s=>s.status==='SCHEDULED')
  // book
  const b = await request(app).post('/api/bookings').send({ sessionId: sched.id, studentId: student.id })
  expect(b.status).toBe(200)
  // check notifications for tutor
  const notes = await request(app).get(`/api/notifications?userId=${sched.tutorId}`)
  expect(notes.status).toBe(200)
  expect(Array.isArray(notes.body)).toBe(true)
  const found = notes.body.find(n=>n.message && n.message.includes('New booking'))
  expect(found).toBeTruthy()
  // if there is a completed session for this student, submit feedback to trigger notification
  const completed = sessionsRes.body.find(s=>s.status==='COMPLETED')
  if(completed && completed.attendees.includes(student.id)){
    const fb = await request(app).post('/api/feedback').send({ sessionId: completed.id, tutorId: completed.tutorId, studentId: student.id, rating: 5 })
    // check notifications
    const notes2 = await request(app).get(`/api/notifications?userId=${completed.tutorId}`)
    expect(notes2.status).toBe(200)
  }
})
