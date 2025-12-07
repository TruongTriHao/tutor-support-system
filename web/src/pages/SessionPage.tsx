import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export default function SessionPage(){
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [resources, setResources] = useState<any[]>([])
  const [canViewResources, setCanViewResources] = useState(false)
  const [attendeesDetails, setAttendeesDetails] = useState<any[]>([])
  const [sessionFeedback, setSessionFeedback] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState({rating:5, comment:'', isAnonymous:false})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [booked, setBooked] = useState(false)

  useEffect(()=>{ 
    if(id) {
      api.get('/sessions')
      .then(list=>{
        const found = list.find((s:any)=>s.id===id)
        setSession(found)
        if (!found) setError('Error: Session not found')
        else {
          const user = JSON.parse(localStorage.getItem('user')||'null')
          setBooked(found.attendees?.includes(user.id))
          const canView = user && (user.id === found.tutorId || (found.attendees || []).includes(user.id))
          setCanViewResources(!!canView)
          if(canView){
            api.get('/resources').then((all:any[])=>{
              const sessionResources = all.filter(r=>r.sessionId===found.id)
              setResources(sessionResources)
            }).catch(()=>{
              setResources([])
            })
          } else {
            setResources([])
          }
          api.get('/users').then((users:any[])=>{
            setAllUsers(users)
            const attendees = (found.attendees||[]).map((aid:any)=> users.find((u:any)=>u.id===aid)).filter(Boolean)
            setAttendeesDetails(attendees)
          }).catch(()=>{
            setAttendeesDetails([])
          })
          api.get(`/feedback/${found.id}`).then((all:any[])=>{
            setSessionFeedback(all)
          }).catch(()=>{
            setSessionFeedback([])
          })
        }
        setIsLoading(false)
      })
    }},[id, booked])

  const currentUser = JSON.parse(localStorage.getItem('user')||'null')
  const isTutor = session && currentUser && (currentUser.id === session.tutorId)

  async function uploadResource(){
    if(!session) return
    if(!currentUser) return alert('You must be logged in')
    if(!isTutor) return alert('Only the tutor can upload resources')
    if(!newTitle) return alert('Please provide a title')
    setIsUploading(true)
    try{
      let created
      if(newFile){
        const fd = new FormData()
        fd.append('file', newFile)
        fd.append('title', newTitle)
        fd.append('sessionId', session.id)
        fd.append('tutorId', currentUser.id)
        fd.append('courseCode', session.courseCode || '')
        const resp = await fetch(`${API_BASE}/resources/upload`, { method: 'POST', body: fd })
        if(!resp.ok) throw new Error('Upload failed')
        created = await resp.json()
      } else {
        const url = newUrl
        const body = { title: newTitle, sessionId: session.id, tutorId: currentUser.id, courseCode: session.courseCode, type: '', url }
        created = await api.post('/resources', body)
      }
      setResources(prev=>[...prev, created])
      setNewTitle('')
      setNewUrl('')
      setNewFile(null)
      alert('Resource added')
    }catch(e:any){
      alert('Failed to add resource: ' + (e?.message || ''))
    }finally{
      setIsUploading(false)
    }
  }

  async function submitFeedback(){
    if(!session) return
    const user = JSON.parse(localStorage.getItem('user')||'null')
    try{
      await api.post('/feedback', { sessionId: session.id, tutorId: session.tutorId, studentId: user.id, rating: feedback.rating, comment: feedback.comment, isAnonymous: true })
      alert('Feedback saved')
    }catch(e:any){ setError('Error: ' + (e?.message || '')) }
  }

  async function book(){
    const user = JSON.parse(localStorage.getItem('user')||'null')
    try{
      await api.post('/bookings', { sessionId: session.id, studentId: user.id })
      alert('Booked')
      setBooked(true)
    }catch(e:any){
      setError('Error: ' + (e?.message || ''))
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  return (
    <div>
      <h2 className="page-title">{session.title}</h2>
      <div className="text-sm muted">{new Date(session.start).toLocaleString()} — {new Date(session.end).toLocaleString()}</div>
      <div className="mt-1 muted">Status: {session.status}</div>
      { !isTutor && 
      <div>
        <div className="mt-2">
          <button onClick={book} className="btn btn-primary" aria-pressed={booked}>{booked ? 'Booked' : 'Book'}</button>
        </div>

        <div className="mt-4 card">
          <h3 className="font-semibold">Submit Feedback</h3>
          <div>
            <label className="block">Rating</label>
            <input type="number" min={1} max={5} value={feedback.rating} className='border-2' onChange={e=>setFeedback({...feedback, rating: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block">Comment</label>
            <textarea value={feedback.comment} onChange={e=>setFeedback({...feedback, comment: e.target.value})} className="w-full h-20 border" />
          </div>
          <button onClick={submitFeedback} className="mt-2 btn btn-primary">Submit Feedback</button>
        </div>
      </div>
      }

      <div className="mt-4 card">
        <h3 className="font-semibold">Resources for this session</h3>
        {!canViewResources && (
          <div className="text-sm text-red-600">You must attend this session to view its resources.</div>
        )}
        {canViewResources && (
          <>
            {resources.length === 0 && <div className="text-sm muted">No resources uploaded for this session.</div>}
            {resources.length > 0 && (
              <ul className="mt-2 space-y-2">
                {resources.map(r=> (
                  <li key={r.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-gray-600">{r.courseCode}</div>
                    </div>
                      <div>
                          <Link to={`/resources/${r.id}`} className="text-blue-600">View</Link>
                          {isTutor && currentUser && currentUser.id === r.tutorId && (
                            <button onClick={async ()=>{
                            const ok = window.confirm('Delete this resource? This cannot be undone.')
                            if(!ok) return
                            try{
                              await api.delete(`/resources/${r.id}?tutorId=${currentUser.id}`)
                              setResources(prev=>prev.filter(x=>x.id!==r.id))
                              alert('Resource deleted')
                            }catch(e:any){
                              alert('Failed to delete resource: ' + (e?.message || ''))
                            }
                            }} className="ml-2 btn" style={{background:'#ef4444', color:'white'}}>Delete</button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isTutor && (
                <div className="mt-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-indigo-700">Upload Resource</h4>
                      <div className="text-xs text-indigo-600">Upload a file for students of this session.</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-indigo-700">Title</label>
                      <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="mt-1 border p-2 w-full rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-700">Choose a file</label>
                      <input type="file" onChange={e=>setNewFile(e.target.files?.[0]||null)} className="mt-1" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={uploadResource} disabled={isUploading} className="btn btn-primary">{isUploading ? 'Uploading...' : 'Upload'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Attendees (visible to tutor) */}
      {isTutor && (
        <div className="mt-4 card">
          <h3 className="font-semibold">Attendees</h3>
          {attendeesDetails.length === 0 ? (
            <div className="text-sm muted mt-2">No attendees for this session.</div>
          ) : (
            <ul className="mt-2 space-y-2">
              {attendeesDetails.map(a=> (
                <li key={a.id} className="text-sm">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-600">{a.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Feedback for tutor to review */}
      {isTutor && (
        <div className="mt-4 card">
          <h3 className="font-semibold">Feedback for this session</h3>
          {sessionFeedback.length === 0 && <div className="text-sm muted mt-2">No feedback yet.</div>}
          {sessionFeedback.map(f=>{
            return (
              <div key={f.id} className="mt-3 border-t pt-2">
                <div className="text-sm font-medium">Rating: {f.rating}</div>
                <div className="text-sm mt-1">{f.comment || <span className="text-gray-500">(no comment)</span>}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
