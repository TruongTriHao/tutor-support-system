import { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function StudentTutorRoute({ children }: { children: JSX.Element }) {
  const role = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isStudentTutor = role === 'student' || role === 'tutor';
  return isStudentTutor ? children : <Navigate to="/tutors" replace />;
}
