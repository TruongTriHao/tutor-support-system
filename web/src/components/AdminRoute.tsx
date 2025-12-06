import { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const isAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'admin';
  return isAdmin ? children : <Navigate to="/tutors" replace />;
}
