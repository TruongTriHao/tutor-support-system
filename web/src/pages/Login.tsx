import { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e:any){
    e.preventDefault()
    try{
      const r = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', r.token)
      localStorage.setItem('user', JSON.stringify(r.user))
      nav('/tutors')
    }catch(e:any){ setErr(e?.message || 'Login failed') }
  }

  return (
    <div className="max-w-md mx-auto p-6 card">
      <h2 className="page-title">Login</h2>
      <form onSubmit={submit}>
        <input className="w-full p-2 border mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-2 border mb-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary">Login</button>
        { err && <div className="text-red-600 mt-2">{err}</div> }
      </form>
    </div>
  )
}
