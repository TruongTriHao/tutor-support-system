const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

async function request(path:string, opts:any={}){
  const url = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if(res.headers.get('content-type')?.includes('application/json')){
    const json = await res.json()
    if(!res.ok) throw new Error(json?.error || json?.message || 'API error')
    return json
  }
  // raw text
  return res.text()
}

export default {
  get: (p:string)=> request(p, { method: 'GET' }),
  getRaw: (p:string)=> request(p, { method: 'GET' }),
  post: (p:string, body:any)=> request(p, { method: 'POST', body: JSON.stringify(body) })
}
