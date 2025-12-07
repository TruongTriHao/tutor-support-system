import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminUsers(){
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student'|'tutor'|'admin'>('student')
  const [password, setPassword] = useState('')

  const currentUser = JSON.parse(localStorage.getItem('user')||'null')
  const isAdmin = currentUser && currentUser.role === 'admin'

  useEffect(()=>{
    if(!isAdmin){ setLoading(false); return }
    api.get('/users').then((list:any[])=>{
      setUsers(list)
      setLoading(false)
    }).catch(e=>{ setError(e?.message||'Failed to load users'); setLoading(false) })
  },[])

  async function register(){
    if(!isAdmin) return alert('Only admins may register users')
    if(!name || !email || !password) return alert('Please fill name, email, password')
    try{
      const u = await api.post('/auth/register', { name, email, role, password })
      const list = await api.get('/users')
      setUsers(list)
      setName(''); setEmail(''); setPassword(''); setRole('student')
      alert('User registered')
    }catch(e:any){ alert('Failed to register: ' + (e?.message||'')) }
  }

  async function remove(id:string){
    if(!isAdmin) return alert('Only admins may delete users')
    if(!confirm('Delete this user?')) return
    try{
      await api.delete(`/users/${id}?adminId=${currentUser.id}`)
      setUsers(prev=>prev.filter(u=>u.id!==id))
      alert('User deleted')
    }catch(e:any){ alert('Failed to delete user: ' + (e?.message||'')) }
  }

  if(!isAdmin) return <div className="text-red-600">Access denied: admin only</div>
  if(loading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">{error}</div>

  const grouped = users.reduce((acc:any, u:any)=>{ (acc[u.role] = acc[u.role]||[]).push(u); return acc }, {})

  return (
    <div className="max-w-3xl">
      <h2 className="page-title">Admin — Users</h2>

      <div className="mb-6 card">
        <h3 className="font-semibold">Register New User</h3>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2" />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2" />
          <select value={role} onChange={e=>setRole(e.target.value as any)} className="border p-2">
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2" />
          <div>
            <button onClick={register} className="btn btn-primary">Register</button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {['admin','tutor','student'].map((r:any)=> (
          <div key={r} className="card">
            <h4 className="font-semibold">{r.charAt(0).toUpperCase()+r.slice(1)}s ({(grouped[r]||[]).length})</h4>
            <ul className="mt-3 space-y-2">
              {(grouped[r]||[]).map((u:any)=> (
                <li key={u.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-gray-600">{u.email} — {u.id}</div>
                  </div>
                  <div>
                    <button onClick={()=>remove(u.id)} className="btn" style={{background:'#ef4444', color:'white'}}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
