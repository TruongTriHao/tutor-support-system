import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Notifications(){
  const [notes, setNotes] = useState<any[]>([])
  const user = JSON.parse(localStorage.getItem('user')||'null')

  useEffect(()=>{
    let mounted = true
    async function load(){
      if(!user) return
      const res = await api.get(`/notifications?userId=${user.id}`)
      if(mounted) setNotes(res)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      {notes.length === 0 ? (
        <p className="muted">You have no notifications.</p>
      ) : (
        <button className="btn" onClick={async ()=>{
          await api.post('/notifications/clear', { userId: user.id })
          setNotes([])
        }}>Mark all as read</button>
      )}
      {notes.length > 0 && (
        <ul className="space-y-2 mt-3">
          {notes.map(n=> (
            <li key={n.id} className="card">
              <div className="text-sm">{n.message}</div>
              {n.createdAt && <div className="text-xs muted mt-1">{new Date(n.createdAt).toLocaleString()}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
