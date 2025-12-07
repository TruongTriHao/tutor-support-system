import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function StudentDashboard(){
  const [sessions, setSessions] = useState<any[]>([])
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id || ''
  useEffect(()=>{ api.get(`/sessions?studentId=${userId}`).then(r=>setSessions(r.filter((s: { status: string })=>s.status==='SCHEDULED'))) },[])
  return (
    <div>
      <h1 className="page-title">My Sessions</h1>
      <div className="space-y-3">
        {sessions.length === 0 ? <div className="muted">No scheduled sessions</div> : sessions.map(s=> (
          <div key={s.id} className="card flex justify-between items-center">
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-xs muted">{new Date(s.start).toLocaleString()}</div>
              <div className="text-xs muted">Status: {s.status}</div>
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
