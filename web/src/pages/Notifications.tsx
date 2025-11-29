import React, { useEffect, useState } from 'react'
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
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>
      {notes.length === 0 ? (
        <p className="text-gray-600">You have no notifications.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n=> (
            <li key={n.id} className="p-3 border rounded bg-white">
              <div className="text-sm">{n.message}</div>
              {n.createdAt && <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
