import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function SessionPage(){
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [feedback, setFeedback] = useState({rating:5, comment:'', isAnonymous:false})

  useEffect(()=>{ if(id) api.get('/sessions').then(list=>setSession(list.find((s:any)=>s.id===id))) },[id])

  async function submitFeedback(){
    if(!session) return
    const user = JSON.parse(localStorage.getItem('user')||'null')
    try{
      await api.post('/feedback', { sessionId: session.id, tutorId: session.tutorId, studentId: user.id, rating: feedback.rating, comment: feedback.comment, isAnonymous: feedback.isAnonymous })
      alert('Feedback saved')
    }catch(e:any){ alert('Error: ' + (e?.message || '')) }
  }

  async function book(){
    const user = JSON.parse(localStorage.getItem('user')||'null')
    try{
      await api.post('/bookings', { sessionId: session.id, studentId: user.id })
      alert('Booked')
    }catch(e:any){
      alert('Error: ' + (e?.message || ''))
    }
  }

  if(!session) return <div>Loading...</div>
  return (
    <div>
      <h2 className="text-2xl">{session.title}</h2>
      <div className="text-sm">{new Date(session.start).toLocaleString()} - {new Date(session.end).toLocaleString()}</div>
      <div>Status: {session.status}</div>
      <div className="mt-2">
        <button onClick={book} className="px-3 py-1 bg-green-600 text-white rounded">Book</button>
      </div>

      <div className="mt-4 p-3 bg-white rounded shadow">
        <h3 className="font-semibold">Submit Feedback</h3>
        <div>
          <label className="block">Rating</label>
          <input type="number" min={1} max={5} value={feedback.rating} onChange={e=>setFeedback({...feedback, rating: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block">Comment</label>
          <textarea value={feedback.comment} onChange={e=>setFeedback({...feedback, comment: e.target.value})} className="w-full h-20 border" />
        </div>
        <div>
          <label><input type="checkbox" checked={feedback.isAnonymous} onChange={e=>setFeedback({...feedback, isAnonymous: e.target.checked})} /> Submit anonymously</label>
        </div>
        <button onClick={submitFeedback} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Submit Feedback</button>
      </div>
    </div>
  )
}
