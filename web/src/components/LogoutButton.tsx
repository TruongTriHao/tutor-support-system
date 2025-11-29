import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
    const navigate = useNavigate();

    function logout() {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }
    
    return localStorage.getItem('token') ? <button className="px-2 py-1 border rounded" onClick={logout}>Log out</button> : null;
}