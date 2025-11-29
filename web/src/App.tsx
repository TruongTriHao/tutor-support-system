import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import TutorsList from './pages/TutorsList'
import TutorProfile from './pages/TutorProfile'
import StudentDashboard from './pages/StudentDashboard'
import SessionPage from './pages/SessionPage'
import ResourceList from './pages/ResourceList'
import ResourceDetail from './pages/ResourceDetail'
import NavigationBar from './components/NavigationBar'

function requireAuth(){
  return !!localStorage.getItem('token');
}

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavigationBar />
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tutors" element={ requireAuth() ? <TutorsList /> : <Navigate to="/login" /> } />
          <Route path="/tutors/:id" element={ requireAuth() ? <TutorProfile /> : <Navigate to="/login" /> } />
          <Route path="/dashboard" element={ requireAuth() ? <StudentDashboard /> : <Navigate to="/login" /> } />
          <Route path="/sessions/:id" element={ requireAuth() ? <SessionPage /> : <Navigate to="/login" /> } />
          <Route path="/resources" element={ requireAuth() ? <ResourceList /> : <Navigate to="/login" /> } />
          <Route path="/resources/:id" element={ requireAuth() ? <ResourceDetail /> : <Navigate to="/login" /> } />
          <Route path="/" element={<Navigate to="/tutors" />} />
        </Routes>
      </main>
    </div>
  )
}
