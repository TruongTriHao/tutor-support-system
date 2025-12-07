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

async function updatePastSessions(){
  let changed = false
  const now = new Date()
  for(const s of sessions){
    try{
      if(s.status !== 'COMPLETED'){
        const end = new Date(s.end)
        if(!isNaN(end.getTime()) && now > end){
          s.status = 'COMPLETED'
          changed = true
        }
      }
    }catch(e){
    }
  }
  if(changed){
    await writeBackToFile('sessions.json', sessions)
  }
}

const app = express()
app.use(cors())
app.use(express.json())

updatePastSessions().catch(()=>{})
setInterval(()=>{
  updatePastSessions().catch(err=>{
    console.error('Error updating past sessions:', err)
  })
}, 60000)

// helper
function findUserByEmail(email){ return users.find(u=>u.email.toLowerCase()===email.toLowerCase()); }

function validateAvailability(av){
  if(!Array.isArray(av)) return { ok: false, message: 'availability must be an array' }
  const timeRe = /^([01]?\d|2[0-3]):([0-5]\d)$/
  for(let i=0;i<av.length;i++){
    const a = av[i]
    if(typeof a !== 'object' || a === null) return { ok: false, message: `availability[${i}] must be an object` }
    const { dayOfWeek, start_time, end_time } = a
    if(typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6){
      return { ok: false, message: `availability[${i}].dayOfWeek must be integer 0-6` }
    }
    if(typeof start_time !== 'string' || !timeRe.test(start_time)){
      return { ok: false, message: `availability[${i}].start_time must be HH:MM` }
    }
    if(typeof end_time !== 'string' || !timeRe.test(end_time)){
      return { ok: false, message: `availability[${i}].end_time must be HH:MM` }
    }
    const [sh, sm] = start_time.split(':').map(Number)
    const [eh, em] = end_time.split(':').map(Number)
    const smins = sh*60 + sm
    const emins = eh*60 + em
    if(smins >= emins) return { ok: false, message: `availability[${i}] end_time must be after start_time` }
  }
  return { ok: true }
}

const ALLOWED_SESSION_TYPES = ['one-on-one','group']
function validateSessionTypes(st){
  if(!Array.isArray(st)) return { ok: false, message: 'sessionTypes must be an array' }
  for(let i=0;i<st.length;i++){
    const v = st[i]
    if(typeof v !== 'string' || !ALLOWED_SESSION_TYPES.includes(v.toString().toLowerCase())){
      return { ok: false, message: `sessionTypes[${i}] must be one of: ${ALLOWED_SESSION_TYPES.join(',')}` }
    }
  }
  return { ok: true }
}

function computeRatingsForTutor(tutorId){
  const list = feedbacks.filter(f=>f.tutorId===tutorId)
  const count = list.length
  const avg = count ? (list.reduce((a,b)=>a+b.rating,0)/count) : 0
  return { averageRating: Number(avg.toFixed(2)), ratingCount: count }
}

// Auth
app.post('/api/auth/register', (req,res)=>{
  const { name, email, role, password } = req.body
  if(!name) return res.status(400).json({error:'Name required'})
  if(!email) return res.status(400).json({error:'Email required'})
  if(!role || (role!=='student' && role!=='tutor' && role!=='admin')) return res.status(400).json({error:'Valid role required'})
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
      const newTutor = { id: newUser.id, name: newUser.name, email: newUser.email, expertise: [], bio: '', availability: [], averageRating: 0, ratingCount: 0, sessionTypes: [] }
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
  const adminId = req.query.adminId
  if(!adminId) return res.status(400).json({ error: 'adminId required' })
  const adminUser = users.find(u=>u.id===adminId)
  if(!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Admin privileges required' })
  if(adminId === userId){
    return res.status(400).json({ error: 'Admins cannot delete themselves' })
  }
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
  const out = tutors.map(t=> ({ ...t, ...computeRatingsForTutor(t.id) }))
  res.json(out)
})

app.get('/api/tutors/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase()
  const course = (req.query.course || '').toString().toLowerCase()
  const dayOfWeek = req.query.dayOfWeek !== undefined ? parseInt(req.query.dayOfWeek, 10) : undefined
  const sessionType = (req.query.sessionType || '').toString().toLowerCase().trim()
  const start = (req.query.start || '').toString()
  const end = (req.query.end || '').toString()
  const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10)||10) : 10

  const defaultFullDay = (typeof dayOfWeek === 'number' && !isNaN(dayOfWeek) && !start && !end)
  const finalStart = defaultFullDay ? '00:00' : start
  const finalEnd = defaultFullDay ? '23:59' : end

  const checkAllDays = (dayOfWeek === undefined && (start || end))

  function timeToMins(t){
    if(!t || typeof t !== 'string') return null
    const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    if(!m) return null
    return Number(m[1])*60 + Number(m[2])
  }

  const reqStart = timeToMins(finalStart)
  const reqEnd = timeToMins(finalEnd)

  let scored = tutors.map(t => {
    let score = 0
    const lowerName = (t.name||'').toString().toLowerCase()
    const bio = (t.bio||'').toString().toLowerCase()
    const expertise = Array.isArray(t.expertise) ? t.expertise.map(e=>e.toString().toLowerCase()) : []

    if(q){
      if(lowerName.includes(q)) score += 20
      if(bio.includes(q)) score += 20
      if(expertise.some(e=>e.includes(q))) score += 20
    }

    if(course){
      if(expertise.includes(course)) score += 50
      else if(expertise.some(e=>e.includes(course))) score += 20
    }

    if (sessionType && Array.isArray(t.sessionTypes)) {
      if (t.sessionTypes.map(x=>x.toString().toLowerCase()).includes(sessionType)) {
        score += 30
      }
    }

    if(typeof dayOfWeek === 'number' && !isNaN(dayOfWeek) && Array.isArray(t.availability)){
      for(const a of t.availability){
        if(a && typeof a.dayOfWeek === 'number' && a.dayOfWeek === dayOfWeek){
          const slotStart = timeToMins(a.start_time)
          const slotEnd = timeToMins(a.end_time)
          if(slotStart !== null && slotEnd !== null && reqStart !== null && reqEnd !== null){
            if(slotStart <= reqStart && slotEnd >= reqEnd){ score += 40; break }
            if(!(slotEnd <= reqStart || slotStart >= reqEnd)) { score += 10 }
          }
        }
      }
    }
    else if(checkAllDays && Array.isArray(t.availability)){
      for(const a of t.availability){
        const slotStart = timeToMins(a.start_time)
        const slotEnd = timeToMins(a.end_time)
        if(slotStart !== null && slotEnd !== null && reqStart !== null && reqEnd !== null){
          if(slotStart <= reqStart && slotEnd >= reqEnd){ score += 20; break }
          if(!(slotEnd <= reqStart || slotStart >= reqEnd)) { score += 5 }
        }
      }
    }

    return { tutor: t, score }
  })
  let filtered = scored
  if(q || course || typeof dayOfWeek === 'number' || reqStart !== null || reqEnd !== null || sessionType){
    filtered = filtered.filter(s=>s.score>0)
  }
  filtered.sort((a,b)=>b.score - a.score)
  res.json(filtered.slice(0, limit).map(s=> ({ ...s.tutor, ...computeRatingsForTutor(s.tutor.id), _score: s.score })))
})

app.get('/api/tutors/:id', (req,res)=>{
  const t = tutors.find(x=>x.id===req.params.id)
  if(!t) return res.status(404).json({error:'Tutor not found'})
  const avail = sessions.filter(s=>s.tutorId===t.id)
  const ratings = computeRatingsForTutor(t.id)
  res.json({ ...t, ...ratings, sessions: avail })
})

app.patch('/api/tutors/:id', async (req,res)=>{
  const t = tutors.find(x=>x.id===req.params.id)
  if(!t) return res.status(404).json({error:'Tutor not found'})
  const { expertise, bio, availability, sessionTypes } = req.body
  if(expertise!==undefined) t.expertise = expertise
  if(bio!==undefined) t.bio = bio
  if(availability!==undefined){
    const v = validateAvailability(availability)
    if(!v.ok) return res.status(400).json({ error: v.message })
    t.availability = availability
  }
  if(sessionTypes!==undefined){
    const vs = validateSessionTypes(sessionTypes)
    if(!vs.ok) return res.status(400).json({ error: vs.message })
    t.sessionTypes = sessionTypes
  }
  const ratings = computeRatingsForTutor(t.id)
  t.averageRating = ratings.averageRating
  t.ratingCount = ratings.ratingCount
  tutors = tutors.map(x=>x.id===t.id ? t : x)
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
  notifications.push({ id: uuidv4(), userId: s.tutorId, message: `New booking for session ${s.title}`, createdAt: new Date().toISOString() })
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
  notifications.push({ id: uuidv4(), userId: tutorId, message: `You received new feedback for session ${s.title}`, createdAt: new Date().toISOString() })
  if (await writeBackToFile('notifications.json', notifications).ok === false) {
    return res.status(500).json({error:'Failed to update notifications'})
  }
  try{
    const ratings = computeRatingsForTutor(tutorId)
    const tutorIndex = tutors.findIndex(t=>t.id===tutorId)
    if(tutorIndex !== -1){
      tutors[tutorIndex].averageRating = ratings.averageRating
      tutors[tutorIndex].ratingCount = ratings.ratingCount
      if (await writeBackToFile('tutors.json', tutors).ok === false) {
        return res.status(500).json({error:'Failed to update tutors'});
      }
    }
  }catch(e){
    console.error('Failed to persist tutor ratings after feedback:', e)
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

app.get('/api/feedback/:sessionId', (req,res)=>{
  const sessionId = req.params.sessionId
  const list = feedbacks.filter(f=>f.sessionId===sessionId).map(f=>({
    rating: f.rating,
    comment: f.comment,
  }))
  res.json(list)
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
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString(), action: 'stream' }
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

app.get('/api/resources/:id/download', async (req,res)=>{
  const r = resources.find(x=>x.id===req.params.id)
  if(!r) return res.status(404).json({error:'Resource not found'})
  const filePath = path.join(__dirname, 'content', path.basename(r.url))
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString(), action: 'download' }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
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
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString(), action: 'add' }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'}) 
  }
  for (const attendeeId of sess.attendees) {
    notifications.push({ id: uuidv4(), userId: attendeeId, message: `New resource ${r.title} added to ${sess.title}`, createdAt: new Date().toISOString() })
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
  const log = { id: uuidv4(), resourceId: r.id, timestamp: new Date().toISOString(), action: 'add' }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
  if (await writeBackToFile('resources.json', resources).ok === false) {
    return res.status(500).json({error:'Failed to update resources'}) 
  }
  for (const attendeeId of sess.attendees) {
    notifications.push({ id: uuidv4(), userId: attendeeId, message: `New resource ${r.title} added to ${sess.title}`, createdAt: new Date().toISOString() })
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
  const log = { id: uuidv4(), resourceId: resourceId, timestamp: new Date().toISOString(), action: 'delete' }
  logs.push(log)
  if (await writeBackToFile('logs.json', logs).ok === false) {
    return res.status(500).json({error:'Failed to update logs'})
  }
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
  const log = { id: uuidv4(), resourceId, timestamp: new Date().toISOString(), action: 'access' }
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
