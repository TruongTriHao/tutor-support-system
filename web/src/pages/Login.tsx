import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e:any){
    e.preventDefault()
    try{
      const r = await api.post('/auth/login', { email })
      localStorage.setItem('token', r.token)
      localStorage.setItem('user', JSON.stringify(r.user))
      nav('/tutors')
    }catch(e:any){ setErr(e?.message || 'Login failed') }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Login (email only)</h2>
      <form onSubmit={submit}>
        <input className="w-full p-2 border mb-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
        { err && <div className="text-red-600 mt-2">{err}</div> }
      </form>
    </div>
  )
}
