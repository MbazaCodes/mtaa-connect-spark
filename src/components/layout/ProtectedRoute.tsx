import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these roles can access the route. Redirects others. */
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, session } = useAuth();
  const navigate = useNavigate();
  const [graceExpired, setGraceExpired] = React.useState(false);

  // Give auth 2 seconds to settle before redirecting
  React.useEffect(() => {
    const timer = setTimeout(() => setGraceExpired(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !graceExpired) return;
    if (!user && !session) { navigate('/'); return; }
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/dashboard');
    }
  }, [user, session, isLoading, allowedRoles, navigate, graceExpired]);

  if (isLoading || !graceExpired) return null;
  if (!user && !session) return null;
  if (user && allowedRoles && !allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
};
