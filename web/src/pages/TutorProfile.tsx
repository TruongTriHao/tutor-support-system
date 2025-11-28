import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function TutorProfile(){
  const { id } = useParams()
  const [tutor, setTutor] = useState<any>(null)
  useEffect(()=>{ if(id) api.get(`/tutors/${id}`).then(r=>setTutor(r)) },[id])
  if(!tutor) return <div>Loading...</div>
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl">{tutor.name}</h2>
      <p>{tutor.bio}</p>
      <p className="text-sm">Expertise: {tutor.expertise.join(', ')}</p>
      <h3 className="mt-4">Available Sessions</h3>
      <div className="space-y-2">
        {tutor.sessions.map((s:any)=> (
          <div key={s.id} className="p-2 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-xs">{new Date(s.start).toLocaleString()} - {new Date(s.end).toLocaleString()}</div>
                <div className="text-xs">Status: {s.status}</div>
              </div>
              <div>
                <a className="text-blue-600" href={`/sessions/${s.id}`}>View</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
