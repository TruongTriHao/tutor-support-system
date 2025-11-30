import { Link } from "react-router-dom";
import NavigationLink from "./NavigationLink";

export default function NavigationBar() {
    return ( 
        <nav className="p-4 bg-white shadow-sm flex justify-between">
            <div><Link to="/tutors">TutorMVP</Link></div>
            <NavigationLink />
        </nav>
    )
}