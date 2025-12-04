import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function NotificationCenter(){
  const [notes, setNotes] = useState<any[]>([])
  const user = JSON.parse(localStorage.getItem('user')||'null')
  const navigate = useNavigate()

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
      <button
        onClick={()=> navigate('/notifications')}
        className="px-2 py-1 border rounded"
        aria-label="Open notifications"
      >
        Notifications ({notes.length})
      </button>
    </div>
  )
}
