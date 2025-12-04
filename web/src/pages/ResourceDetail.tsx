import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function ResourceDetail(){
  const { id } = useParams()
  const [res, setRes] = useState<any>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  useEffect(()=>{
    if(!id) return
    api.get('/resources').then(list=>{
      const item = list.find((r:any)=>r.id===id)
      setRes(item)
      setBookmarked(JSON.parse(localStorage.getItem('bookmarks')||'[]').includes(id))
      setIsLoading(false)
    })
  },[id])

  async function stream(){
    const r = await api.getRaw(`/resources/${id}/stream`)
    setContent(typeof r === 'string' ? r : JSON.stringify(r))
  }

  if(isLoading) return <div>Loading...</div>
  if(!res) return <div className="text-red-600">Error: Resource not found</div>
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl">{res.title}</h2>
      <div className="text-sm">Course: {res.courseCode}</div>
      <div className="mt-4">
        <button onClick={stream} className="px-3 py-1 bg-blue-600 text-white rounded">Open / Stream</button>
        <button onClick={()=>window.open(res.downloadUrl, '_blank')} className="ml-2 px-3 py-1 bg-green-600 text-white rounded">Download</button>
        <button onClick={()=>{
          const b = JSON.parse(localStorage.getItem('bookmarks')||'[]')
          if(!b.includes(id)){
            b.push(id)
            alert('Bookmarked!')
          } else {
            const index = b.indexOf(id)
            b.splice(index, 1)
            alert('Bookmark removed!')
          }
          localStorage.setItem('bookmarks', JSON.stringify(b))
          setBookmarked(!bookmarked)
        }} className="ml-2 px-3 py-1 bg-yellow-600 text-white rounded">{bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
      </div>
      {content && <pre className="mt-4 bg-white p-3 rounded">{content}</pre>}
    </div>
  )
}
