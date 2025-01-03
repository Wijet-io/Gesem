import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/domain/user';
import Button from './ui/Button';
import ProfileModal from './ProfileModal';

const baseNavigation = [
  { name: 'Employés', path: '/employees' },
  { name: 'Pointages', path: '/attendance' },
  { name: 'Génération Salaires', path: '/payroll' },
  { name: 'Acomptes', path: '/advances' },
  { name: 'Utilisateurs', path: '/users', roles: [UserRole.ADMIN] },
];

export default function Navigation() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = useMemo(() => {
    return baseNavigation.filter(item => {
      // Si pas de restriction de rôle ou si l'utilisateur a le rôle requis
      return !item.roles || (user && item.roles.includes(user.role));
    });
  }, [user]);

  return (
    <>
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex h-16 justify-between">
            <div className="flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-4 text-sm font-medium ${
                      isActive
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
              >
                Mon Profil
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}