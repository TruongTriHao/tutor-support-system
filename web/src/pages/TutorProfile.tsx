import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

export default function TutorProfile(){
  const { id } = useParams()
  const [tutor, setTutor] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
  if(isLoading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">Error: {error}</div>
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
                <Link className="text-blue-600" to={`/sessions/${s.id}`}>View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
