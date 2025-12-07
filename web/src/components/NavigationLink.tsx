import { Link, useNavigate } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";

export default function NavigationLink() {
    const navigate = useNavigate();

    function logout() {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }
    
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user')||'null')
    if (token) {
        return (
            <div className="flex items-center gap-3">
                <nav className="flex items-center gap-3 text-sm">
                    {(user && (user.role==='student')) && <Link className="text-gray-700 hover:text-gray-900" to="/tutors">Tutors</Link>}
                    {user && user.role === 'student' && <Link className="text-gray-700 hover:text-gray-900" to="/dashboard">Dashboard</Link>}
                    {user && user.role === 'tutor' && <Link className="text-gray-700 hover:text-gray-900" to={`/tutors/${user.id}`}>My Profile</Link>}
                    {(user && (user.role === 'student' || user.role === 'tutor')) && <Link className="text-gray-700 hover:text-gray-900" to="/bookmarks">Bookmarks</Link>}
                    {user && user.role === 'admin' && (
                        <>
                          <Link className="text-gray-700 hover:text-gray-900" to="/admin/users">Users</Link>
                          <Link className="text-gray-700 hover:text-gray-900" to="/admin/logs">Logs</Link>
                          <Link className="text-gray-700 hover:text-gray-900" to="/admin/tutors-performance">Performance</Link>
                        </>
                    )}
                </nav>
                {(user && (user.role === 'student' || user.role === 'tutor')) && <NotificationCenter />}
                <button className="btn btn-ghost" onClick={logout}>Log out</button>
            </div>
        );
    }
    return (
        <div>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
        </div>
    );
}