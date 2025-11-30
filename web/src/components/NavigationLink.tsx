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
    
    if (localStorage.getItem('token')) {
        return (
            <div className="space-x-4">
                <Link to="/tutors">Tutors</Link>
                <Link to="/resources">Resources</Link>
                <Link to="/dashboard">Dashboard</Link>
                <NotificationCenter />
                <button className="px-2 py-1 border rounded" onClick={logout}>Log out</button>
            </div>  
        );
    }
    return null;
}