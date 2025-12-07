import { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function AdminLogs(){
  const [logs, setLogs] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    Promise.all([api.get('/logs'), api.get('/resources')])
      .then(([l, r])=>{
        setLogs(l || [])
        setResources(r || [])
      })
      .catch((e)=> setError(e?.message || 'Failed to load logs'))
      .finally(()=> setIsLoading(false))
  },[])

  const findResource = (id:string)=> resources.find(r=>r.id===id)

  if(isLoading) return <div>Loading...</div>
  if(error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="max-w-4xl">
      <h2 className="page-title">Logs</h2>
      <div className="mt-4 card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Timestamp</th>
              <th className="p-2">Resource</th>
              <th className="p-2">Resource ID</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l=> (
              <tr key={l.id} className="border-b">
                <td className="p-2 align-top">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="p-2 align-top">{findResource(l.resourceId)?.title || <em>Unknown</em>}</td>
                <td className="p-2 align-top"><Link className="text-blue-600" to={`/resources/${l.resourceId}`}>{l.resourceId}</Link></td>
                <td className="p-2 align-top">{l.action || <em>Unknown</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="p-3 text-sm muted">No logs yet.</div>}
      </div>
    </div>
  )
}
