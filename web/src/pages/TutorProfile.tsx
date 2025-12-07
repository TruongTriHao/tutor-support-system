import { useEffect, useRef, useState } from 'react'
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
  const [availDay, setAvailDay] = useState<number>(1)
  const [availStart, setAvailStart] = useState('09:00')
  const [availEnd, setAvailEnd] = useState('10:00')
  const [isSavingAvail, setIsSavingAvail] = useState(false)
  const availStartRef = useRef<HTMLInputElement | null>(null)
  const availEndRef = useRef<HTMLInputElement | null>(null)
  const availSubmitRef = useRef<HTMLButtonElement | null>(null)
  const [sessionTypes, setSessionTypes] = useState<string[]>([])
  const [isSavingTypes, setIsSavingTypes] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [expertiseDraft, setExpertiseDraft] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

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

  useEffect(()=>{
    if(tutor && Array.isArray(tutor.sessionTypes)){
      setSessionTypes(tutor.sessionTypes)
    }
  },[tutor])

  useEffect(()=>{
    if(tutor){
      setBioDraft(tutor.bio || '')
      setExpertiseDraft(Array.isArray(tutor.expertise) ? tutor.expertise.join(', ') : '')
    }
  },[tutor])

  const currentUser = JSON.parse(localStorage.getItem('user')||'null')
  const isOwner = !!(currentUser && tutor && currentUser.id === tutor.id && currentUser.role === 'tutor')

  async function handleAddSession(e:any){
    e.preventDefault()
    setError(null)
    if(!isOwner){ setError('Only the tutor may add sessions for this profile'); return }
    if(!title || !courseCode || !start || !end || !location){ setError('Please fill required fields'); return }
    if(new Date(start) >= new Date(end)){ setError('Start time must be before end time'); return }
    setIsSubmitting(true)
    try{
      const body = { tutorId: tutor.id, title, courseCode, start, end, location }
      const created = await api.post('/sessions', body)
      setTutor((t:any)=> ({ ...t, sessions: [...(t.sessions||[]), created] }))
      setTitle(''); setCourseCode(''); setStart(''); setEnd(''); setLocation('')
    }catch(e:any){
      setError(e?.message || 'Failed to add session')
    }finally{
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSession(sessionId:string){
    if(!isOwner) return setError('Only the tutor may delete sessions')
    if(!confirm('Delete this session?')) return
    try{
      await api.delete(`/sessions/${sessionId}`)
      setTutor((t:any)=> ({ ...t, sessions: (t.sessions||[]).filter((s:any)=>s.id!==sessionId) }))
    }catch(e:any){
      setError(e?.message || 'Failed to delete session')
    }
  }

  function formatDay(d:number){
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return names[d] || String(d)
  }

  async function handleAddAvailability(e:any){
    e.preventDefault()
    setError(null)
    if(!isOwner) return setError('Only tutor may edit availability')
    if(!availStart || !availEnd) return setError('Start and end required')
    const startDate = new Date(`1970-01-01T${availStart}:00`)
    const endDate = new Date(`1970-01-01T${availEnd}:00`)
    if(startDate >= endDate) return setError('Start time must be before end time')
    if(Array.isArray(tutor.availability)){
      const duplicate = tutor.availability.find((a:any)=>a.dayOfWeek===availDay && a.start_time===availStart && a.end_time===availEnd)
      if(duplicate) return setError(`Availability for ${formatDay(availDay)} ${availStart} - ${availEnd} already exists`)
    }
    if(Array.isArray(tutor.availability)){
      const overlap = tutor.availability.find((a:any)=>{
        if(a.dayOfWeek !== availDay) return false
        const aStart = new Date(`1970-01-01T${a.start_time}:00`)
        const aEnd = new Date(`1970-01-01T${a.end_time}:00`)
        return (startDate < aEnd && endDate > aStart)
      })
      if(overlap) return setError(`Availability overlaps with existing slot ${overlap.start_time} - ${overlap.end_time} on ${formatDay(availDay)}`)
    }
    const newAvail = [ ...(tutor.availability||[]), { dayOfWeek: availDay, start_time: availStart, end_time: availEnd } ]
    setIsSavingAvail(true)
    try{
      const updated = await api.patch(`/tutors/${tutor.id}`, { availability: newAvail })
      setTutor(updated)
    }catch(e:any){
      setError(e?.message || 'Failed to update availability')
    }finally{
      setIsSavingAvail(false)
    }
  }

  async function handleRemoveAvailability(idx:number){
    if(!isOwner) return setError('Only tutor may edit availability')
    if(!confirm('Remove this availability slot?')) return
    const newAvail = (tutor.availability||[]).filter((_:any,i:number)=>i!==idx)
    setIsSavingAvail(true)
    try{
      const updated = await api.patch(`/tutors/${tutor.id}`, { availability: newAvail })
      setTutor(updated)
    }catch(e:any){
      setError(e?.message || 'Failed to update availability')
    }finally{
      setIsSavingAvail(false)
    }
  }

  function toggleSessionType(t:string){
    setSessionTypes((prev)=>{
      if(prev.includes(t)) return prev.filter(x=>x!==t)
      return [...prev, t]
    })
  }

  async function handleSaveSessionTypes(){
    setError(null)
    if(!isOwner) return setError('Only the tutor may edit session types')
    setIsSavingTypes(true)
    try{
      const updated = await api.patch(`/tutors/${tutor.id}`, { sessionTypes })
      setTutor(updated)
    }catch(e:any){
      setError(e?.message || 'Failed to update session types')
    }finally{
      setIsSavingTypes(false)
    }
  }

  async function handleSaveProfile(){
    setError(null)
    if(!isOwner) return setError('Only the tutor may edit this profile')
    setIsSavingProfile(true)
    try{
      const expertiseArr = expertiseDraft.split(',').map(s=>s.trim()).filter(Boolean)
      const updated = await api.patch(`/tutors/${tutor.id}`, { bio: bioDraft, expertise: expertiseArr })
      setTutor(updated)
    }catch(e:any){
      setError(e?.message || 'Failed to save profile')
    }finally{
      setIsSavingProfile(false)
    }
  }

  if(isLoading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="page-title">{tutor.name}</h2>
          <p className="text-sm muted">{tutor.email}</p>
          <p className="mt-3 text-sm">{tutor.bio}</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="text-sm">Rating: <strong>{typeof tutor.averageRating === 'number' ? tutor.averageRating : (tutor.averageRating ?? 0)}</strong> <span className="text-xs text-gray-500">({tutor.ratingCount ?? 0})</span></div>
          <div className="text-sm">Types: <span className="font-medium">{(tutor.sessionTypes||[]).join(', ')}</span></div>
          <div className="text-sm">Expertise: <span className="text-gray-700">{Array.isArray(tutor.expertise)? tutor.expertise.join(', '): ''}</span></div>
        </div>
      </div>

      {/* Owner controls */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold">Edit Profile</h3>
            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-sm font-medium">Bio</label>
                <textarea className="border p-2 w-full" rows={4} value={bioDraft} onChange={e=>setBioDraft(e.target.value)} placeholder="Short bio about you"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium">Expertise (comma separated)</label>
                <input className="border p-2 w-full" value={expertiseDraft} onChange={e=>setExpertiseDraft(e.target.value)} placeholder="e.g. Calculus, Algorithms, Data Structures" />
                <div className="text-xs text-gray-500 mt-1">Separate topics with commas; these will be shown on your profile.</div>
              </div>
              <div>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Profile'}</button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold">Session Types</h3>
            <div className="mt-2 text-sm">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={sessionTypes.includes('one-on-one')} onChange={()=>toggleSessionType('one-on-one')} />
                  <span>One-on-one</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={sessionTypes.includes('group')} onChange={()=>toggleSessionType('group')} />
                  <span>Group</span>
                </label>
              </div>
              <div className="mt-3">
                <button className="btn btn-primary" onClick={handleSaveSessionTypes} disabled={isSavingTypes}>{isSavingTypes ? 'Saving...' : 'Save Types'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      <section>
        <h3 className="font-semibold">Availability</h3>
        <div className="mt-2">
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs text-center">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=> (
                <div key={d} className="font-medium p-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-sm mt-2">
              {[0,1,2,3,4,5,6].map(day=> (
                <div key={day} className="min-h-[64px] border rounded p-2 bg-white" onClick={()=>{ setAvailDay(day); setTimeout(()=>{ availStartRef.current?.focus() }, 0) }}>
                  <div className="flex flex-col items-start gap-2">
                    {(Array.isArray(tutor.availability) ? tutor.availability.filter((a:any)=>a.dayOfWeek===day) : []).length === 0 ? (
                      <div className="text-xs muted">No slots</div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        {(Array.isArray(tutor.availability) ? tutor.availability.filter((a:any)=>a.dayOfWeek===day) : []).map((a:any, idx:number)=>{
                          const globalIdx = (tutor.availability||[]).findIndex((x:any)=>x.dayOfWeek===a.dayOfWeek && x.start_time===a.start_time && x.end_time===a.end_time)
                          return (
                            <div key={idx} className="flex items-center justify-between w-full bg-blue-50 rounded px-3 py-1 text-sm">
                              <div className="whitespace-nowrap">{a.start_time} - {a.end_time}</div>
                              {isOwner ? (
                                <button onClick={(e)=>{ e.stopPropagation(); handleRemoveAvailability(globalIdx) }} className="text-red-600 text-xs" disabled={isSavingAvail} aria-label="Remove availability">✕</button>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(!Array.isArray(tutor.availability) || tutor.availability.length===0) && (
            <div className="text-sm text-gray-500 mt-2">No availability set</div>
          )}
          {isOwner && <div className="text-xs muted mt-2">Click a day to prefill the add-availability form.</div>}
        </div>
      </section>

      {/* Edit Availability form (owner) */}
      {isOwner && (
        <div className="mt-2 card">
          <h4 className="font-semibold">Add Availability</h4>
          <form onSubmit={handleAddAvailability} className="space-y-2 mt-2">
            <div className="flex gap-2 items-center">
              <select value={availDay} onChange={e=>setAvailDay(Number(e.target.value))} className="border p-2">
                <option value={0}>Sun</option>
                <option value={1}>Mon</option>
                <option value={2}>Tue</option>
                <option value={3}>Wed</option>
                <option value={4}>Thu</option>
                <option value={5}>Fri</option>
                <option value={6}>Sat</option>
              </select>
              <input ref={availStartRef} type="time" value={availStart} onChange={e=>{ const v=e.target.value; setAvailStart(v); try{ const [h,m]=v.split(':').map(Number); if(!Number.isFinite(h)||!Number.isFinite(m)) return; const startMins=h*60+m; const propEnd=Math.min(startMins+60,23*60+59); const ph=Math.floor(propEnd/60).toString().padStart(2,'0'); const pm=(propEnd%60).toString().padStart(2,'0'); const proposed=`${ph}:${pm}`; const [eh,em]=(availEnd||'').split(':').map(Number); const endMins=(Number.isFinite(eh)&&Number.isFinite(em))?eh*60+em:null; if(!availEnd||endMins===null||endMins<=startMins){ setAvailEnd(proposed) } }catch(_){ } }} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); availEndRef.current?.focus(); } }} className="border p-2" />
              <span className="text-sm">to</span>
              <input ref={availEndRef} type="time" value={availEnd} onChange={e=>setAvailEnd(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); availSubmitRef.current?.focus(); } }} className="border p-2" />
            </div>
            <div>
              <button ref={availSubmitRef} className="btn" style={{background:'#16a34a', color:'white'}} type="submit" disabled={isSavingAvail}>{isSavingAvail ? 'Saving...' : 'Add Availability'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions */}
      <section>
        <h3 className="font-semibold">Sessions</h3>
        {isOwner && (
          <div className="mt-3 card">
            <h4 className="font-medium">Create Session</h4>
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
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Session'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {(tutor.sessions||[]).sort((a:any, b:any) => new Date(b.start).getTime() - new Date(a.start).getTime()).map((s:any)=> (
            <div key={s.id} className="card">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs muted">{new Date(s.start).toLocaleString()} - {new Date(s.end).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <Link className="text-blue-600" to={`/sessions/${s.id}`}>View</Link>
                  {isOwner && (
                    <button className="text-red-600" onClick={()=>handleDeleteSession(s.id)}>Delete</button>
                  )}
                </div>
              </div>
              <div className="text-xs muted mt-1">Status: {s.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
