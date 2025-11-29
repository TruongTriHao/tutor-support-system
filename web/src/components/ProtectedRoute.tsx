import { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function Protected({ children }: { children: JSX.Element }) {
  const isAuth = !!localStorage.getItem('token');
  return isAuth ? children : <Navigate to="/login" replace />;
}
