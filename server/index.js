import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import mime from 'mime-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const CONTENT_DIR = path.join(__dirname, 'content')

if(!fs.existsSync(CONTENT_DIR)){
  fs.mkdirSync(CONTENT_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, CONTENT_DIR)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ''
    cb(null, uuidv4() + ext)
  }
})
const upload = multer({ storage })

function load(name){
  try{ return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name))); }catch(e){ return []; }
}

async function writeBackToFile(filename, data){
  try {
    await fs.promises.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
    return {"ok": true}
  } catch (e) {
    return {"ok": false, "error": e.message}
  }
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
app.post('/api/auth/register', (req,res)=>{
  const { name, email, role, password } = req.body
  if(!name) return res.status(400).json({error:'Name required'})
  if(!email) return res.status(400).json({error:'Email required'})
  if(!role || (role!=='student' && role!=='tutor')) return res.status(400).json({error:'Valid role required'})
  if(!password) return res.status(400).json({error:'Password required'})
  let existing = findUserByEmail(email)
  if(existing){return res.status(400).json({error:'Email already registered'})}
  bcrypt.hash(password, 10, async (err, hashedPassword)=>{
    if(err){ return res.status(500).json({error:'Error processing password'}) }
    const newUser = { id: uuidv4(), name, email, role, hashedPassword }
    users.push(newUser)
    if (await writeBackToFile('users.json', users).ok === false) {
      return res.status(500).json({error:'Failed to update users'})
    }
    if (role === 'tutor') {
      const newTutor = { id: newUser.id, name: newUser.name, email: newUser.email, expertise: [], bio: '' }
      tutors.push(newTutor)
      if (await writeBackToFile('tutors.json', tutors).ok === false) {
        return res.status(500).json({error:'Failed to update tutors'})
      }
    }
    res.json(newUser)
  })
})

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
    const token = 'mock-token-' + user.id
    res.json({ token, user })
  })
})

// Users
app.get('/api/users', (req,res)=>{
  res.json(users.map(u=>({ id: u.id, name: u.name, email: u.email, role: u.role })))
})

app.delete('/api/users/:id', async (req,res)=>{
  const userId = req.params.id
  const userIndex = users.findIndex(u=>u.id===userId)
  if(userIndex===-1) return res.status(404).json({error:'User not found'})
  const user = users[userIndex]
  users.splice(userIndex, 1)
  if (await writeBackToFile('users.json', users).ok === false) {
    return res.status(500).json({error:'Failed to update users'})
  }
  if(user.role==='tutor'){
    const tutorIndex = tutors.findIndex(t=>t.id===userId)
    if(tutorIndex!==-1){
      tutors.splice(tutorIndex, 1)
      if (await writeBackToFile('tutors.json', tutors).ok === false) {
        return res.status(500).json({error:'Failed to update tutors'})
      }
    }
    sessions = sessions.filter(s=>s.tutorId!==userId)
    if (await writeBackToFile('sessions.json', sessions).ok === false) {
      return res.status(500).json({error:'Failed to update sessions'})
    }
    bookings = bookings.filter(b=>{
      const s = sessions.find(sess=>sess.id===b.sessionId)
      return s && s.tutorId!==userId
    })
    if (await writeBackToFile('bookings.json', bookings).ok === false) {
      return res.status(500).json({error:'Failed to update bookings'})
    }
    feedbacks = feedbacks.filter(f=>f.tutorId!==userId)
    if (await writeBackToFile('feedback.json', feedbacks).ok === false) {
      return res.status(500).json({error:'Failed to update feedback data'})
    }
    resources = resources.filter(r=>r.uploaderId!==userId)
    if (await writeBackToFile('resources.json', resources).ok === false) {
      return res.status(500).json({error:'Failed to update resources'})
    }
  }
  res.json({ ok: true })
})

// Tutors
app.get('/api/tutors', (req,res)=>{
  res.json(tutors)
})

app.get('/api/tutors/:id', (req,res)=>{
  const t = tutors.find(x=>x.id===req.params.id)
  if(!t) return res.status(404).json({error:'Tutor not found'})
  const avail = sessions.filter(s=>s.tutorId===t.id)
  res.json({ ...t, sessions: avail })
})

app.patch('/api/tutors/:id', async (req,res)=>{
  const t = tutors.find(x=>x.id===req.params.id)
  if(!t) return res.status(404).json({error:'Tutor not found'})
  const { expertise, bio } = req.body
  if(expertise!==undefined) t.expertise = expertise
  if(bio!==undefined) t.bio = bio
  if (await writeBackToFile('tutors.json', tutors).ok === false) {
    return res.status(500).json({error:'Failed to update tutors'})
  }
  res.json(t)
})

// Sessions
app.get('/api/sessions', (req,res)=>{
  const tutorId = req.query.tutorId
  if(tutorId){
    return res.json(sessions.filter(s=>s.tutorId===tutorId))
  }
  const studentId = req.query.studentId
  if(studentId){
    return res.json(sessions.filter(s=>s.attendees.includes(studentId)))
  }
  res.json(sessions)
})

app.patch('/api/sessions/:id/status', async (req,res)=>{
  const { status } = req.body
  const s = sessions.find(x=>x.id===req.params.id)
  if(!s) return res.status(404).json({error:'Session not found'})
  s.status = status
  if (await writeBackToFile('sessions.json', sessions).ok === false) {
    return res.status(500).json({error:'Failed to update session data'})
  }
  res.json(s)
})

app.post('/api/sessions', async (req,res)=>{
  const { tutorId, title, courseCode, start, end, location } = req.body
  if(!tutorId || !title || !start || !end || !location) return res.status(400).json({error:'Missing fields'})
  const s = { id: uuidv4(), tutorId, title, courseCode, start, end, location, status: 'SCHEDULED', attendees: [] }
  sessions.push(s)
  if (await writeBackToFile('sessions.json', sessions).ok === false) {
    return res.status(500).json({error:'Failed to update sessions'})
  }
  res.json(s)
})

app.delete('/api/sessions/:id', async (req,res)=>{
  const sessionId = req.params.id
  const sessionIndex = sessions.findIndex(s=>s.id===sessionId)
  if(sessionIndex===-1) return res.status(404).json({error:'Session not found'})
  sessions.splice(sessionIndex, 1)
  if (await writeBackToFile('sessions.json', sessions).ok === false) {
    return res.status(500).json({error:'Failed to update sessions'})
  }
  bookings = bookings.filter(b=>b.sessionId!==sessionId)
  if (await writeBackToFile('bookings.json', bookings).ok === false) {
    return res.status(500).json({error:'Failed to update bookings'})
  }
  feedbacks = feedbacks.filter(f=>f.sessionId!==sessionId)
  if (await writeBackToFile('feedback.json', feedbacks).ok === false) {
    return res.status(500).json({error:'Failed to update feedback data'})
  }
  resources = resources.filter(r=>r.sessionId!==sessionId)
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'})
  }
  res.json({ ok: true })
})

// Bookings
app.get('/api/bookings', (req,res)=>{
  const studentId = req.query.studentId
  if(studentId){
    return res.json(bookings.filter(b=>b.studentId===studentId))
  }
  res.json(bookings)
})

app.post('/api/bookings', async (req,res)=>{
  const { sessionId, studentId } = req.body
  if(!sessionId || !studentId) return res.status(400).json({error:'Missing fields'})
  const s = sessions.find(x=>x.id===sessionId)
  if(!s) return res.status(404).json({error:'Session not found'})
  if(!s.attendees.includes(studentId)) s.attendees.push(studentId)
  else return res.status(400).json({error:'Student already booked'})
  if (await writeBackToFile('sessions.json', sessions).ok === false) {
    return res.status(500).json({error:'Failed to update session data'})
  }
  const booking = { id: uuidv4(), sessionId, studentId, createdAt: new Date().toISOString() }
  bookings.push(booking)
  if (await writeBackToFile('bookings.json', bookings).ok === false) {
    return res.status(500).json({error:'Failed to update bookings'})
  }
  notifications.push({ id: uuidv4(), userId: s.tutorId, message: `New booking for session ${s.id}`, createdAt: new Date().toISOString() })
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
  res.json(booking)
})

app.delete('/api/bookings/:id', async (req,res)=>{
  const bookingId = req.params.id
  const bookingIndex = bookings.findIndex(b=>b.id===bookingId)
  if(bookingIndex===-1) return res.status(404).json({error:'Booking not found'})
  const booking = bookings[bookingIndex]
  const s = sessions.find(x=>x.id===booking.sessionId)
  if(s){
    s.attendees = s.attendees.filter(a=>a!==booking.studentId)
    if (await writeBackToFile('sessions.json', sessions).ok === false) {
      return res.status(500).json({error:'Failed to update session data'})
    }
  }
  bookings.splice(bookingIndex, 1)
  if (await writeBackToFile('bookings.json', bookings).ok === false) {
    return res.status(500).json({error:'Failed to update bookings'})
  }
  res.json({ ok: true })
})

// Feedback
app.post('/api/feedback', async (req,res)=>{
  const { sessionId, tutorId, studentId, rating, comment, isAnonymous } = req.body
  if(!sessionId || !studentId || !tutorId || !rating) return res.status(400).json({error:'Missing fields'})
  const s = sessions.find(x=>x.id===sessionId)
  if(!s) return res.status(404).json({error:'Session not found'})
  if(s.status !== 'COMPLETED') return res.status(400).json({error:'Session not completed'})
  if(!s.attendees.includes(studentId)) return res.status(400).json({error:'Student did not attend'})
  const dup = feedbacks.find(f=>f.sessionId===sessionId && f.studentId===studentId)
  if(dup) return res.status(400).json({error:'Duplicate feedback'})
  const fb = { id: uuidv4(), sessionId, tutorId, studentId, rating, comment, isAnonymous: !!isAnonymous, createdAt: new Date().toISOString() }
  feedbacks.push(fb)
  if (await writeBackToFile('feedback.json', feedbacks).ok === false) {
    return res.status(500).json({error:'Failed to update feedback data'})
  }
  notifications.push({ id: uuidv4(), userId: tutorId, message: `You received new feedback for session ${sessionId}`, createdAt: new Date().toISOString() })
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
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

app.get('/api/resources/:id/stream', async (req,res)=>{
  const r = resources.find(x=>x.id===req.params.id)
  if(!r) return res.status(404).json({error:'Resource not found'})
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString() }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
  const filePath = path.join(__dirname, 'content', path.basename(r.url))
  if(fs.existsSync(filePath)){
    res.sendFile(filePath)
  } else {
    res.json({ message: `Simulated stream for resource ${r.id}`, url: r.url })
  }
})

app.get('/api/resources/:id/download', (req,res)=>{
  const r = resources.find(x=>x.id===req.params.id)
  if(!r) return res.status(404).json({error:'Resource not found'})
  const filePath = path.join(__dirname, 'content', path.basename(r.url))
  if(fs.existsSync(filePath)){
    res.download(filePath, r.title)
  } else {
    res.json({ message: `Simulated download for resource ${r.id}`, url: r.url })
  }
})

app.post('/api/resources', async (req,res)=>{
  const { title, sessionId, tutorId, courseCode, type, url } = req.body
  if(!title || !sessionId || !tutorId) return res.status(400).json({error:'Missing fields'})
  const sess = sessions.find(s=>s.id===sessionId)
  if(!sess) return res.status(404).json({ error: 'Session not found' })
  if(sess.tutorId !== tutorId) return res.status(403).json({ error: 'Only the session tutor may add resources' })
  let finalType = type
  if(!finalType && url){
    try{
      finalType = mime.lookup(path.basename(url)) || ''
    }catch(e){ finalType = '' }
  }
  const r = { id: uuidv4(), sessionId, tutorId, title, courseCode, type: finalType, url, createdAt: new Date().toISOString() }
  resources.push(r)
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'}) 
  }
  for (const attendeeId of sess.attendees) {
    notifications.push({ id: uuidv4(), userId: attendeeId, message: `New resource ${r.title} added to ${sess.courseCode}`, createdAt: new Date().toISOString() })
  }
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
  res.json(r)
})

app.post('/api/resources/upload', upload.single('file'), async (req,res)=>{
  const file = req.file
  const { title, sessionId, tutorId, courseCode } = req.body
  if(!file) return res.status(400).json({ error: 'File required' })
  if(!title || !sessionId || !tutorId) return res.status(400).json({ error: 'Missing fields' })
  const sess = sessions.find(s=>s.id===sessionId)
  if(!sess) return res.status(404).json({ error: 'Session not found' })
  if(sess.tutorId !== tutorId) return res.status(403).json({ error: 'Only the session tutor may upload resources' })
  const mimeType = file.mimetype || mime.lookup(file.filename) || ''
  const r = { id: uuidv4(), sessionId, tutorId, title, courseCode, type: mimeType, url: file.filename, createdAt: new Date().toISOString() }
  resources.push(r)
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'}) 
  }
  for (const attendeeId of sess.attendees) {
    notifications.push({ id: uuidv4(), userId: attendeeId, message: `New resource ${r.title} added to ${sess.courseCode}`, createdAt: new Date().toISOString() })
  }
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
  res.json(r)
})

app.delete('/api/resources/:id', async (req,res)=>{
  const resourceId = req.params.id
  const resourceIndex = resources.findIndex(r=>r.id===resourceId)
  if(resourceIndex===-1) return res.status(404).json({error:'Resource not found'})
  const resource = resources[resourceIndex]
  const requesterTutorId = req.query.tutorId
  if(!requesterTutorId) return res.status(400).json({ error: 'tutorId required' })
  if(resource.tutorId !== requesterTutorId) return res.status(403).json({ error: 'Only the session tutor may delete this resource' })
  const filePath = path.join(__dirname, 'content', path.basename(resource.url))
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (err) {
    console.error('Failed to delete file', filePath, err)
    return res.status(500).json({ error: 'Failed to delete resource file' })
  }
  resources.splice(resourceIndex, 1)
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'})
  }
  res.json({ ok: true })
})

// Logs
app.get('/api/logs', (req,res)=>{
  const resourceId = req.query.resourceId
  if(resourceId) return res.json(logs.filter(l=>l.resourceId===resourceId))
  res.json(logs)
})

app.post('/api/logs', async (req,res)=>{
  const { resourceId } = req.body
  if(!resourceId) return res.status(400).json({error:'resourceId required'})
  const log = { id: uuidv4(), resourceId, timestamp: new Date().toISOString() }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
  res.json(log)
})

// Notifications
app.get('/api/notifications', (req,res)=>{
  const userId = req.query.userId
  if(userId) return res.json(notifications.filter(n=>n.userId===userId))
  res.json(notifications)
})

app.post('/api/notifications/clear', async (req,res)=>{
  const { userId } = req.body
  if(!userId) return res.status(400).json({error:'userId required'})
  notifications = notifications.filter(n=>n.userId!==userId)
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
  res.json({ ok: true })
})

// Simple health
app.get('/api/health', (req,res)=>res.json({ok:true}))

const PORT = process.env.PORT || 4000
if (process.argv[1] === fileURLToPath(import.meta.url)){
  app.listen(PORT, ()=>console.log('Mock server running on', PORT))
}

export default app
