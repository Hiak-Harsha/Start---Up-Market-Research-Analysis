import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProtectedRoute() {
  const { user } = useAuth()

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
