import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function Bookmarks(){
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{
    const b = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[]
    api.get('/resources').then((list:any[])=>{
      const found = list.filter(r=> b.includes(r.id))
      setItems(found)
    })
  },[])

  return (
    <div>
      <h1 className="page-title">My Bookmarks</h1>
      <div className="space-y-3">
        {items.length === 0 ? <div className="muted">No bookmarks yet</div> : items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(it=> (
          <div key={it.id} className="card flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs muted">{it.courseCode} — {it.type}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/resources/${it.id}`} className="text-blue-600">View</Link>
              <button onClick={() => {
                try {
                  const b = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[]
                  const idx = b.indexOf(it.id)
                  if (idx !== -1) {
                    b.splice(idx, 1)
                    localStorage.setItem('bookmarks', JSON.stringify(b))
                    setItems(prev => prev.filter(x => x.id !== it.id))
                  }
                } catch (e) {
                  console.error('Failed to update bookmarks', e)
                }
              }} className="ml-2 btn" style={{background:'#f59e0b', color:'white'}}>Unbookmark</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
