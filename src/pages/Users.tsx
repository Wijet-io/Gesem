import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, createUser, updateUserRole, deleteUser } from '../services/auth/adminService';
import { UserRole } from '../types/user';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import toast from 'react-hot-toast';

export default function Users() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.SUPERVISOR
  });

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      createUser(data.email, data.password, data.role, data.firstName, data.lastName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'utilisateur');
      console.error('Error creating user:', error);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du rôle');
      console.error('Error updating role:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
      console.error('Error deleting user:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const roleOptions = Object.values(UserRole).map(role => ({
    value: role,
    label: role
  }));

  const columns = [
    { 
      header: 'Nom',
      accessor: row => `${row.firstName} ${row.lastName}`
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Rôle',
      accessor: row => (
        <Select
          value={row.role}
          options={roleOptions}
          onChange={(e) => updateRoleMutation.mutate({
            userId: row.id,
            role: e.target.value as UserRole
          })}
        />
      )
    },
    {
      header: 'Actions',
      accessor: row => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
              deleteMutation.mutate(row.id);
            }
          }}
        >
          Supprimer
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Gérez les utilisateurs et leurs rôles"
        action={{
          label: "Nouvel Utilisateur",
          onClick: () => setIsCreateModalOpen(true)
        }}
      />
      
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : (
          <Table
            columns={columns}
            data={users || []}
          />
        )}
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un nouvel utilisateur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          
          <Input
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          
          <Input
            label="Prénom"
            value={formData.firstName}
            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
          
          <Input
            label="Nom"
            value={formData.lastName}
            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
          
          <Select
            label="Rôle"
            value={formData.role}
            options={roleOptions}
            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
          />
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}