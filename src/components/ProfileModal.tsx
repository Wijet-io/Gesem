import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, updatePassword } from '../services/auth/profileService';
import { useAuthStore } from '../stores/authStore';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    confirmPassword: ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      updateProfile(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profil mis à jour avec succès');
      onClose();
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès');
      onClose();
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du mot de passe');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update profile if name changed
    if (formData.firstName !== user?.firstName || formData.lastName !== user?.lastName) {
      await updateProfileMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
    }

    // Update password if provided
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      await updatePasswordMutation.mutateAsync(formData.password);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mon Profil"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <div className="border-t border-gray-200 my-4 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Changer le mot de passe
          </h4>
          
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={formData.password}
            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
          
          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={formData.confirmPassword}
            onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending || updatePasswordMutation.isPending}
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}