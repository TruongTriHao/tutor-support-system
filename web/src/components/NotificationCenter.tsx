import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function NotificationCenter(){
  const [notes, setNotes] = useState<any[]>([])
  const user = JSON.parse(localStorage.getItem('user')||'null')
  useEffect(()=>{
    let mounted = true
    async function poll(){
      if(!user) return
      const res = await api.get(`/notifications?userId=${user.id}`)
      if(mounted) setNotes(res)
    }
    poll()
    const t = setInterval(poll, 5000)
    return ()=>{ mounted=false; clearInterval(t) }
  },[])
  return (
    <div className="inline-block">
      <button className="px-2 py-1 border rounded">Notifications ({notes.length})</button>
    </div>
  )
}
