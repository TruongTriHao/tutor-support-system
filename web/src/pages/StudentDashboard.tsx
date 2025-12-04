import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function StudentDashboard(){
  const [sessions, setSessions] = useState<any[]>([])
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id || ''
  useEffect(()=>{ api.get(`/sessions?studentId=${userId}`).then(r=>setSessions(r.filter((s: { status: string })=>s.status==='SCHEDULED'))) },[])
  return (
    <div>
      <h1 className="text-2xl mb-4">My Sessions</h1>
      <div className="space-y-2">
        {sessions.length === 0 ? <div>No scheduled sessions</div> : sessions.map(s=> (
          <div key={s.id} className="p-3 bg-white rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-xs">{new Date(s.start).toLocaleString()}</div>
              <div className="text-xs">Status: {s.status}</div>
            </div>
            <div className="flex flex-col space-y-1">
              <Link to={`/sessions/${s.id}`} className="text-blue-600">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
