import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'

export default function TutorsList(){
  const [list, setList] = useState<any[]>([])
  const [results, setResults] = useState<any[] | null>(null)
  const [q, setQ] = useState('')
  const [course, setCourse] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const navigate = useNavigate()
  useEffect(()=>{ api.get('/tutors').then(r=>setList(r)) },[])
  function clearFilters(){
    setQ('')
    setCourse('')
    setDayOfWeek('')
    setSessionType('')
    setStart('')
    setEnd('')
    setResults(null)
  }
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
      <div className="mb-4 p-4 bg-white rounded shadow">
        <h3 className="font-semibold">Find Tutors</h3>
        <form onSubmit={async e=>{ e.preventDefault(); setIsSearching(true); setResults(null); try{
          const params = new URLSearchParams()
          if(q) params.set('q', q)
          if(course) params.set('course', course)
          if(dayOfWeek) params.set('dayOfWeek', dayOfWeek)
          if(sessionType) params.set('sessionType', sessionType)
          if(start) params.set('start', start)
          if(end) params.set('end', end)
          params.set('limit', '10')
          const path = `/tutors/search?${params.toString()}`
          const r = await api.get(path)
          setResults(r)
        }catch(err:any){
          setResults([])
        }finally{ setIsSearching(false) } }} className="space-y-2 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input placeholder="Name or keyword" value={q} onChange={e=>setQ(e.target.value)} className="border p-2" />
            <input placeholder="Course / expertise" value={course} onChange={e=>setCourse(e.target.value)} className="border p-2" />
            <select value={dayOfWeek} onChange={e=>setDayOfWeek(e.target.value)} className="border p-2">
              <option value="">Any day</option>
              <option value="0">Sun</option>
              <option value="1">Mon</option>
              <option value="2">Tue</option>
              <option value="3">Wed</option>
              <option value="4">Thu</option>
              <option value="5">Fri</option>
              <option value="6">Sat</option>
            </select>
            <select value={sessionType} onChange={e=>setSessionType(e.target.value)} className="border p-2">
              <option value="">Any type</option>
              <option value="one-on-one">One-on-one</option>
              <option value="group">Group</option>
            </select>
            <div className="flex gap-2">
              <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-2" />
              <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit" disabled={isSearching}>{isSearching ? 'Searching...' : 'Search'}</button>
            <button type="button" className="bg-gray-200 text-gray-800 px-3 py-1 rounded" onClick={clearFilters}>Clear</button>
          </div>
        </form>
      </div>
      {results !== null ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Best matches</h2>
          {results.length === 0 ? <div className="text-sm text-gray-500">No tutors match your criteria.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {results.map(t=> (
                <div key={t.id} className="p-4 bg-white rounded shadow">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="text-sm">{t.bio}</p>
                  <div className="flex gap-3 items-center">
                    <p className="text-xs">Expertise: {(t.expertise||[]).join(', ')}</p>
                    <p className="text-xs">Rating: {(t.averageRating ?? 0)} ({t.ratingCount ?? 0})</p>
                    <p className="text-xs">Types: {(t.sessionTypes||[]).join(', ')}</p>
                  </div>
                  <Link to={`/tutors/${t.id}`} className="text-blue-600">View profile</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null }
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(t=> (
          <div key={t.id} className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm">{t.bio}</p>
            <p className="text-xs">Expertise: {t.expertise.join(', ')}</p>
            <p className="text-xs">Rating: {(t.averageRating ?? 0)} ({t.ratingCount ?? 0})</p>
            <p className="text-xs">Types: {(t.sessionTypes||[]).join(', ')}</p>
            <p className="text-xs">Email: {t.email}</p>
            <Link to={`/tutors/${t.id}`} className="text-blue-600">View profile</Link>
          </div>
        ))}
      </div> */}
    </div>
  )
}
