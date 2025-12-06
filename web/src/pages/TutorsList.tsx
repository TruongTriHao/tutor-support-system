import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'

export default function TutorsList(){
  const [list, setList] = useState<any[]>([])
  const navigate = useNavigate()
  useEffect(()=>{ api.get('/tutors').then(r=>setList(r)) },[])
  const role = JSON.parse(localStorage.getItem('user') || '{}').role;
  if (role && role === 'tutor') {
    navigate(`/tutors/${JSON.parse(localStorage.getItem('user') || '{}').id}`)
  }
  if (role && role === 'admin') {
    navigate('/admin/users')
  }
  if (list.length === 0) {
    return <div>
      <h1 className="text-2xl mb-4">Tutors</h1>
      <p>No tutors found.</p>
    </div>
  }
  return (
    <div>
      <h1 className="text-2xl mb-4">Tutors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(t=> (
          <div key={t.id} className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm">{t.bio}</p>
            <p className="text-xs">Expertise: {t.expertise.join(', ')}</p>
            <Link to={`/tutors/${t.id}`} className="text-blue-600">View profile</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
