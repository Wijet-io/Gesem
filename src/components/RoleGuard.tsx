import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types/domain/user';
import { hasPermission } from '../services/auth/authService';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export default function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !hasPermission(user.role, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}