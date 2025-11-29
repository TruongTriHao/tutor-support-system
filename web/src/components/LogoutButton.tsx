function logout() { 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

export default function LogoutButton() {
    return <button className="px-2 py-1 border rounded" onClick={logout}>Log out</button>;
}