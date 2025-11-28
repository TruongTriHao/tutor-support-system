it('streams resource content and creates access log', async ()=>{
  const { default: request } = await import('supertest')
  const { default: app } = await import('../index.js')
  // get resources
  const res = await request(app).get('/api/resources')
  expect(res.status).toBe(200)
  const item = res.body[0]
  // stream resource
  const stream = await request(app).get(`/api/resources/${item.id}/stream`)
  expect(stream.status).toBe(200)
  // check logs
  const logs = await request(app).get(`/api/logs?resourceId=${item.id}`)
  expect(logs.status).toBe(200)
  expect(Array.isArray(logs.body)).toBe(true)
  expect(logs.body.length).toBeGreaterThanOrEqual(1)
})
