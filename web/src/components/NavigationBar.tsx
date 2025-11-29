import { Link } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";
import LogoutButton from "./LogoutButton";

export default function NavigationBar() {
    return ( 
        <nav className="p-4 bg-white shadow-sm flex justify-between">
            <div><Link to="/">TutorMVP</Link></div>
            <div className="space-x-4">
                <Link to="/tutors">Tutors</Link>
                <Link to="/resources">Resources</Link>
                <Link to="/dashboard">Dashboard</Link>
                <NotificationCenter />
                <Link to="/login"><LogoutButton /></Link>
            </div>
        </nav>
    )
}