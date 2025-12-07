import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminTutorsPerformance(){
  const [tutors, setTutors] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    Promise.all([api.get('/tutors'), api.get('/sessions'), api.get('/bookings')])
      .then(([t,s,b])=>{
        setTutors(t || [])
        setSessions(s || [])
        setBookings(b || [])
      })
      .catch(e=> setError(e?.message || 'Failed to load data'))
      .finally(()=> setIsLoading(false))
  },[])

  if(isLoading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">Error: {error}</div>

  const rows = tutors.map(t=>{
    const tSessions = sessions.filter(s=>s.tutorId===t.id)
    const total = tSessions.length
    const completed = tSessions.filter(s=>s.status === 'COMPLETED').length
    const attendeesCounts = tSessions.map(s=> bookings.filter(b=>b.sessionId===s.id).length )
    const avgAttendees = attendeesCounts.length ? (attendeesCounts.reduce((a,b)=>a+b,0)/attendeesCounts.length) : 0
    return {
      id: t.id,
      name: t.name || t.email || 'Unknown',
      email: t.email || '',
      averageRating: t.averageRating ?? 0,
      ratingCount: t.ratingCount ?? 0,
      totalSessions: total,
      completedSessions: completed,
      avgAttendees: Number(avgAttendees.toFixed(2))
    }
  })

  return (
    <div className="max-w-6xl">
      <h2 className="page-title">Tutors Performance</h2>
      <div className="mt-4 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Tutor</th>
              <th className="p-2">Email</th>
              <th className="p-2">Avg Rating</th>
              <th className="p-2"># Ratings</th>
              <th className="p-2">Total Sessions</th>
              <th className="p-2">Completed</th>
              <th className="p-2">Avg Attendees</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id} className="border-b">
                <td className="p-2 align-top">{r.name}</td>
                <td className="p-2 align-top">{r.email}</td>
                <td className="p-2 align-top">{r.averageRating}</td>
                <td className="p-2 align-top">{r.ratingCount}</td>
                <td className="p-2 align-top">{r.totalSessions}</td>
                <td className="p-2 align-top">{r.completedSessions}</td>
                <td className="p-2 align-top">{r.avgAttendees}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-3 text-sm muted">No tutors found.</div>}
      </div>
    </div>
  )
}
