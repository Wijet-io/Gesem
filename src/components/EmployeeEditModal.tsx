import React, { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { Employee } from '../types/employee';
import { updateEmployee } from '../services/employee/employeeService';
import toast from 'react-hot-toast';

interface EmployeeEditModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeEditModal({ 
  employee, 
  isOpen, 
  onClose,
  onSuccess 
}: EmployeeEditModalProps) {
  const [formData, setFormData] = useState({
    normalRate: employee?.normalRate || 0,
    extraRate: employee?.extraRate || 0,
    minHours: employee?.minHours || 8
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      await updateEmployee(employee.id, {
        normal_rate: formData.normalRate,
        extra_rate: formData.extraRate,
        min_hours: formData.minHours
      });
      toast.success('Employé mis à jour avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier ${employee.firstName} ${employee.lastName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Taux Horaire Normal (€)"
          type="number"
          step="0.01"
          min="0"
          value={formData.normalRate}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            normalRate: parseFloat(e.target.value) 
          }))}
          required
        />

        <Input
          label="Taux Horaire Supplémentaire (€)"
          type="number"
          step="0.01"
          min="0"
          value={formData.extraRate}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            extraRate: parseFloat(e.target.value) 
          }))}
          required
        />

        <Input
          label="Heures Contractuelles par Jour"
          type="number"
          step="0.5"
          min="0"
          max="12"
          value={formData.minHours}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            minHours: parseFloat(e.target.value) 
          }))}
          required
        />

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button type="submit">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}