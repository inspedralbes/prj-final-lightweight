import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'COACH' | 'CLIENT';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Mientras restauramos la sesión desde localStorage, no redirigir
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sin sesión → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rol incorrecto → redirigir a su página correcta
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'CLIENT') return <Navigate to="/client-home" replace />;
    if (user.role === 'COACH') return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
