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
            <div className="space-x-4">
                {user && user.role === 'student' && <Link to="/tutors">Tutors</Link>}
                                {user && user.role === 'admin' && (
                                        <>
                                            <Link to="/admin/users">Users</Link>
                                            <Link to="/admin/logs">Logs</Link>
                                            <Link to="/admin/tutors-performance">Performance</Link>
                                        </>
                                )}
                {user && user.role === 'student' && <Link to="/dashboard">Dashboard</Link>}
                {user && user.role === 'tutor' && <Link to={`/tutors/${user.id}`}>Dashboard</Link>}
                {user && (user.role === 'student' || user.role === 'tutor') && (
                    <>
                        <Link to="/bookmarks">Bookmarks</Link>
                        <NotificationCenter />
                    </>
                )}
                <button className="px-2 py-1 border rounded" onClick={logout}>Log out</button>
            </div>  
        );
    }
    return null;
}