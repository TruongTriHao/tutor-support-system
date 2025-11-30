import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')

function load(name){
  try{ return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name))); }catch(e){ return []; }
}

let users = load('users.json')
let tutors = load('tutors.json')
let sessions = load('sessions.json')
let resources = load('resources.json')
let feedbacks = load('feedback.json')
let bookings = load('bookings.json')
let notifications = load('notifications.json')
let logs = load('logs.json')

const app = express()
app.use(cors())
app.use(express.json())

// helper
function findUserByEmail(email){ return users.find(u=>u.email.toLowerCase()===email.toLowerCase()); }
// Auth
app.post('/api/auth/login', (req,res)=>{
  const { email, password } = req.body
  if(!email) return res.status(400).json({error:'Email required'})
  if(!password) return res.status(400).json({error:'Password required'})
  let user = findUserByEmail(email)
  if(!user){return res.status(401).json({error:'Invalid credentials'})}
  bcrypt.compare(password, user.hashedPassword, (err, result)=>{
    if(err || !result){
      return res.status(401).json({error:'Invalid credentials'})
    } 
    else {
      const token = 'mock-token-' + user.id
      res.json({ token, user })
    }
  })
})

// Tutors
app.get('/api/tutors', (req,res)=>{
  res.json(tutors)
})
app.get('/api/tutors/:id', (req,res)=>{
  const t = tutors.find(x=>x.id===req.params.id)
  if(!t) return res.status(404).json({error:'not found'})
  const avail = sessions.filter(s=>s.tutorId===t.id)
  res.json({ ...t, sessions: avail })
})

// Sessions
app.get('/api/sessions', (req,res)=>{
  res.json(sessions)
})

app.post('/api/sessions/:id/status', (req,res)=>{
  const { status } = req.body
  const s = sessions.find(x=>x.id===req.params.id)
  if(!s) return res.status(404).json({error:'session not found'})
  s.status = status
  s.attendees.forEach(uid=>{
    notifications.push({ id: uuidv4(), userId: uid, message: `Session ${s.id} status changed to ${status}`, createdAt: new Date().toISOString() })
  })
  res.json(s)
})

// Bookings
app.post('/api/bookings', (req,res)=>{
  const { sessionId, studentId } = req.body
  if(!sessionId || !studentId) return res.status(400).json({error:'missing fields'})
  const s = sessions.find(x=>x.id===sessionId)
  if(!s) return res.status(404).json({error:'session not found'})
  if(!s.attendees.includes(studentId)) s.attendees.push(studentId)
  const booking = { id: uuidv4(), sessionId, studentId, createdAt: new Date().toISOString() }
  bookings.push(booking)
  notifications.push({ id: uuidv4(), userId: s.tutorId, message: `New booking for session ${s.id}`, createdAt: new Date().toISOString() })
  res.json(booking)
})

// Feedback
app.post('/api/feedback', (req,res)=>{
  const { sessionId, tutorId, studentId, rating, comment, isAnonymous } = req.body
  if(!sessionId || !studentId || !tutorId || !rating) return res.status(400).json({error:'missing fields'})
  const s = sessions.find(x=>x.id===sessionId)
  if(!s) return res.status(404).json({error:'session not found'})
  if(s.status !== 'COMPLETED') return res.status(400).json({error:'session not completed'})
  if(!s.attendees.includes(studentId)) return res.status(400).json({error:'student did not attend'})
  const dup = feedbacks.find(f=>f.sessionId===sessionId && f.studentId===studentId)
  if(dup) return res.status(400).json({error:'duplicate feedback'})
  const fb = { id: uuidv4(), sessionId, tutorId, studentId, rating, comment, isAnonymous: !!isAnonymous, createdAt: new Date().toISOString() }
  feedbacks.push(fb)
  notifications.push({ id: uuidv4(), userId: tutorId, message: `You received new feedback for session ${sessionId}`, createdAt: new Date().toISOString() })
  res.json(fb)
})

app.get('/api/feedback/aggregate', (req,res)=>{
  const tutorId = req.query.tutorId
  if(!tutorId) return res.status(400).json({error:'tutorId required'})
  const list = feedbacks.filter(f=>f.tutorId===tutorId)
  const count = list.length
  const avg = count ? (list.reduce((a,b)=>a+b.rating,0)/count) : 0
  const recent = list.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)).slice(0,10).map(f=>({ rating: f.rating, comment: f.comment, isAnonymous: f.isAnonymous }))
  res.json({ tutorId, average: avg, count, recent })
})

// Resources
app.get('/api/resources', (req,res)=>{
  const courseCode = req.query.courseCode
  if(courseCode){
    return res.json(resources.filter(r=>r.courseCode===courseCode))
  }
  res.json(resources)
})

app.get('/api/resources/:id/stream', (req,res)=>{
  const r = resources.find(x=>x.id===req.params.id)
  if(!r) return res.status(404).json({error:'not found'})
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString() }
  logs.push(log)
  const filePath = path.join(__dirname, 'content', path.basename(r.url))
  if(fs.existsSync(filePath)){
    res.sendFile(filePath)
  } else {
    res.json({ message: `Simulated stream for resource ${r.id}`, url: r.url })
  }
})

app.post('/api/resources', (req,res)=>{
  const { title, courseCode, type, url, uploaderId } = req.body
  const r = { id: uuidv4(), title, courseCode, type, url, uploaderId, createdAt: new Date().toISOString() }
  resources.push(r)
  notifications.push({ id: uuidv4(), userId: uploaderId, message: `Resource ${r.title} uploaded`, createdAt: new Date().toISOString() })
  res.json(r)
})

// Logs
app.get('/api/logs', (req,res)=>{
  const resourceId = req.query.resourceId
  if(resourceId) return res.json(logs.filter(l=>l.resourceId===resourceId))
  res.json(logs)
})

// Notifications
app.get('/api/notifications', (req,res)=>{
  const userId = req.query.userId
  if(userId) return res.json(notifications.filter(n=>n.userId===userId))
  res.json(notifications)
})

// Simple health
app.get('/api/health', (req,res)=>res.json({ok:true}))

const PORT = process.env.PORT || 4000
if (process.argv[1] === fileURLToPath(import.meta.url)){
  app.listen(PORT, ()=>console.log('Mock server running on', PORT))
}

export default app
