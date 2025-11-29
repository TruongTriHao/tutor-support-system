import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import TutorsList from './pages/TutorsList'
import TutorProfile from './pages/TutorProfile'
import StudentDashboard from './pages/StudentDashboard'
import SessionPage from './pages/SessionPage'
import ResourceList from './pages/ResourceList'
import ResourceDetail from './pages/ResourceDetail'
import NavigationBar from './components/NavigationBar'
import ProtectedRoute from './components/ProtectedRoute'
import Notifications from './pages/Notifications'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavigationBar />
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tutors" element={ <ProtectedRoute><TutorsList /></ProtectedRoute> } />
          <Route path="/tutors/:id" element={ <ProtectedRoute><TutorProfile /></ProtectedRoute> } />
          <Route path="/dashboard" element={ <ProtectedRoute><StudentDashboard /></ProtectedRoute> } />
          <Route path="/sessions/:id" element={ <ProtectedRoute><SessionPage /></ProtectedRoute> } />
          <Route path="/resources" element={ <ProtectedRoute><ResourceList /></ProtectedRoute> } />
          <Route path="/resources/:id" element={ <ProtectedRoute><ResourceDetail /></ProtectedRoute> } />
          <Route path="/notifications" element={ <ProtectedRoute><Notifications /></ProtectedRoute> } />
          <Route path="/" element={<ProtectedRoute><TutorsList /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
