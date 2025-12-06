import { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function StudentRoute({ children }: { children: JSX.Element }) {
  const isStudent = JSON.parse(localStorage.getItem('user') || '{}').role === 'student';
  return isStudent ? children : <Navigate to="/tutors" replace />;
}
