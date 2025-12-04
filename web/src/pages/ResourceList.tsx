import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function ResourceList(){
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{ api.get('/resources').then(r=>setItems(r)) },[])
  return (
    <div>
      <h1 className="text-2xl mb-4">Resources</h1>
      <div className="space-y-2">
        {items.map(it=> (
          <div key={it.id} className="p-3 bg-white rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs">{it.courseCode} — {it.type}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/resources/${it.id}`} className="text-blue-600">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
