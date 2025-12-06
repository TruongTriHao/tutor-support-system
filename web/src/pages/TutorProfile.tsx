import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

export default function TutorProfile(){
  const { id } = useParams()
  const [tutor, setTutor] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [location, setLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(()=>{ 
    if(id) {
      api.get(`/tutors/${id}`)
        .then(r=>{
          setTutor(r)
          setIsLoading(false)
        })
        .catch(e=>{
          setError(e?.message || 'Failed to load tutor')
          setIsLoading(false)
        })
    }
  },[id])

  const currentUser = JSON.parse(localStorage.getItem('user')||'null')
  const isOwner = !!(currentUser && tutor && currentUser.id === tutor.id && currentUser.role === 'tutor')

  async function handleAddSession(e:any){
    e.preventDefault()
    setError(null)
    if(!isOwner){
      setError('Only the tutor may add sessions for this profile')
      return
    }
    if(!title || !courseCode || !start || !end || !location){
      setError('Please fill required fields')
      return
    }
    if(new Date(start) >= new Date(end)){
      setError('Start time must be before end time')
      return
    }
    setIsSubmitting(true)
    try{
      const body = { tutorId: tutor.id, title, courseCode, start, end, location }
      const created = await api.post('/sessions', body)
      setTutor((t:any)=> ({ ...t, sessions: [...(t.sessions||[]), created] }))
      setTitle('')
      setCourseCode('')
      setStart('')
      setEnd('')
      setLocation('')
    }catch(e:any){
      setError(e?.message || 'Failed to create session')
    }finally{
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSession(sessionId:string){
    setError(null)
    if(!isOwner){
      setError('Only the tutor may remove sessions')
      return
    }
    if(!confirm('Delete this session?')) return
    try{
      await api.delete(`/sessions/${sessionId}`)
      setTutor((t:any)=> ({ ...t, sessions: (t.sessions||[]).filter((s:any)=>s.id!==sessionId) }))
    }catch(e:any){
      setError(e?.message || 'Failed to delete session')
    }
  }

  if(isLoading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">Error: {error}</div>
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl">{tutor.name}</h2>
      <p>{tutor.bio}</p>
      <p className="text-sm">Expertise: {Array.isArray(tutor.expertise)? tutor.expertise.join(', '): ''}</p>
      <p className="text-sm">Email: {tutor.email}</p>

      <h3 className="mt-4">Available Sessions</h3>
      <div className="space-y-2">
        {(tutor.sessions||[]).map((s:any)=> (
          <div key={s.id} className="p-2 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-xs">{new Date(s.start).toLocaleString()} - {new Date(s.end).toLocaleString()}</div>
                <div className="text-xs">Status: {s.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-blue-600" to={`/sessions/${s.id}`}>View</Link>
                {isOwner && (
                  <button className="text-red-600" onClick={()=>handleDeleteSession(s.id)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold">Add Session</h3>
          <form onSubmit={handleAddSession} className="space-y-2 mt-2">
            <div>
              <input className="border p-2 w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div>
              <input className="border p-2 w-full" placeholder="Course code" value={courseCode} onChange={e=>setCourseCode(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="border p-2" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
              <input className="border p-2" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <div>
              <input className="border p-2 w-full" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Session'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
