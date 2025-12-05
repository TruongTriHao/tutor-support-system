import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function ResourceDetail(){
  const { id } = useParams()
  const [res, setRes] = useState<any>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [streamingMime, setStreamingMime] = useState<string | null>(null)
  useEffect(()=>{
    if(!id) return
    api.get('/resources').then(list=>{
      const item = list.find((r:any)=>r.id===id)
      setRes(item)
      setBookmarked(JSON.parse(localStorage.getItem('bookmarks')||'[]').includes(id))
      setIsLoading(false)
    })
  },[id])

  useEffect(()=>{
    return ()=>{
      if(streamingUrl) URL.revokeObjectURL(streamingUrl)
    }
  },[streamingUrl])

  async function stream(){
    if(!id) return
    if(content || streamingUrl){
      if(streamingUrl){
        URL.revokeObjectURL(streamingUrl)
        setStreamingUrl(null)
      }
      setContent('')
      setStreamingMime(null)
      return
    }

    try{
      const resp = await api.getResponse(`/resources/${id}/stream`)
      if(!resp.ok) throw new Error('Network response was not ok')
      const contentType = (resp.headers.get('Content-Type') || '').toLowerCase()
      if(contentType.includes('application/json') || contentType.startsWith('text/') || contentType.includes('application/xml') || contentType.includes('application/javascript')){
        const txt = await resp.text()
        setContent(txt)
        setStreamingMime('text')
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      setStreamingUrl(url)
      setStreamingMime(contentType || 'application/octet-stream')
    }catch(err){
      alert('Failed to open/stream resource')
    }
  }

async function downloadResource(){
  if(!res) return
  try{
    const resp = await api.getResponse(`/resources/${res.id}/download`)
    if(!resp.ok) throw new Error('Network response was not ok')
    const contentType = (resp.headers.get('Content-Type') || '').toLowerCase()
    if(contentType.includes('application/json')){
      const j = await resp.json()
      if(j.url){
        window.open(j.url, '_blank')
      } else {
        alert('No downloadable URL provided')
      }
      return
    }
    const blob = await resp.blob()
    const disposition = resp.headers.get('Content-Disposition') || ''
    let filename = res.title || 'download'
    const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)|filename=\"?([^\";]+)\"?/)
    if(filenameMatch){
      filename = decodeURIComponent(filenameMatch[1] || filenameMatch[2])
    } else {
      try {
        const urlPath = new URL(res.url).pathname
        const base = urlPath.substring(urlPath.lastIndexOf('/') + 1)
        if(base) filename = base
      } catch {}
    }
    function extFromContentType(ct:string){
      if(ct.includes('application/pdf')) return '.pdf'
      if(ct.includes('image/png')) return '.png'
      if(ct.includes('image/jpeg')) return '.jpg'
      if(ct.includes('image/gif')) return '.gif'
      if(ct.includes('text/plain')) return '.txt'
      if(ct.includes('application/zip')) return '.zip'
      if(ct.startsWith('video/')) return '.' + ct.split('/')[1].split('+')[0]
      if(ct.startsWith('audio/')) return '.' + ct.split('/')[1].split('+')[0]
      return ''
    }
    if(!filename.includes('.')){
      const ext = extFromContentType(contentType)
      if(ext) filename = filename + ext
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(()=> URL.revokeObjectURL(url), 10000)
  }catch(err){
    alert('Download failed')
  }
}

  if(isLoading) return <div>Loading...</div>
  if(!res) return <div className="text-red-600">Error: Resource not found</div>
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl">{res.title}</h2>
      <div className="text-sm">Course: {res.courseCode}</div>
      <div className="mt-4">
        <button onClick={stream} className="px-3 py-1 bg-blue-600 text-white rounded">{(content || streamingUrl) ? 'Close' : 'Open / Stream'}</button>
        <button onClick={downloadResource} className="ml-2 px-3 py-1 bg-green-600 text-white rounded">Download</button>
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
      {content && <pre className="mt-4 bg-white p-3 rounded whitespace-pre-wrap">{content}</pre>}

      {streamingUrl && streamingMime && (
        <div className="mt-4 bg-white p-3 rounded">
          {/* PDF */}
          {streamingMime.includes('pdf') && (
            <iframe src={streamingUrl} title="resource-pdf" className="w-full h-96" />
          )}
          {/* Images */}
          {streamingMime.startsWith('image/') && (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            <img src={streamingUrl} alt={res?.title || 'resource-image'} className="max-w-full h-auto" />
          )}
          {/* Video */}
          {streamingMime.startsWith('video/') && (
            <video controls src={streamingUrl} className="w-full" />
          )}
          {/* Audio */}
          {streamingMime.startsWith('audio/') && (
            <audio controls src={streamingUrl} className="w-full" />
          )}
          {/* Fallback: link to open in new tab */}
          {(!streamingMime.includes('pdf') && !streamingMime.startsWith('image/') && !streamingMime.startsWith('video/') && !streamingMime.startsWith('audio/')) && (
            <div>
              <div>Preview not available for this file type.</div>
              <a onClick={downloadResource} className="text-blue-600 underline cursor-pointer">Please download to view</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
