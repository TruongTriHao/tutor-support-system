import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import TutorsList from './pages/TutorsList'
import TutorProfile from './pages/TutorProfile'
import StudentDashboard from './pages/StudentDashboard'
import SessionPage from './pages/SessionPage'
import ResourceDetail from './pages/ResourceDetail'
import AdminUsers from './pages/AdminUsers'
import AdminLogs from './pages/AdminLogs'
import AdminTutorsPerformance from './pages/AdminTutorsPerformance'
import Bookmarks from './pages/Bookmarks'
import NavigationBar from './components/NavigationBar'
import ProtectedRoute from './components/ProtectedRoute'
import Notifications from './pages/Notifications'
import StudentRoute from './components/StudentRoute'
import StudentTutorRoute from './components/StudentTutorRoute'
import AdminRoute from './components/AdminRoute'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavigationBar />
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tutors" element={ <ProtectedRoute><TutorsList /></ProtectedRoute> } />
          <Route path="/tutors/:id" element={ <ProtectedRoute><StudentTutorRoute><TutorProfile /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/dashboard" element={ <ProtectedRoute><StudentTutorRoute><StudentDashboard /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/sessions/:id" element={ <ProtectedRoute><StudentTutorRoute><SessionPage /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/resources/:id" element={ <ProtectedRoute><StudentTutorRoute><ResourceDetail /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><AdminUsers /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><AdminRoute><AdminLogs /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/tutors-performance" element={<ProtectedRoute><AdminRoute><AdminTutorsPerformance /></AdminRoute></ProtectedRoute>} />
          <Route path="/bookmarks" element={ <ProtectedRoute><StudentTutorRoute><Bookmarks /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/notifications" element={ <ProtectedRoute><StudentTutorRoute><Notifications /></StudentTutorRoute></ProtectedRoute> } />
          <Route path="/" element={<ProtectedRoute><TutorsList /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
