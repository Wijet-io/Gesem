import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '../services/employee/employeeService';
import { syncEmployeesFromJibble } from '../services/employee/syncService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EditableCell from '../components/EditableCell';
import type { Employee } from '../types/employee';
import { updateEmployee } from '../services/employee/employeeService';
import toast from 'react-hot-toast';

export default function Employees() {
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  const handleJibbleSync = async () => {
    const loadingToast = toast.loading('Synchronisation en cours...');
    try {
      await syncEmployeesFromJibble();
      await refetch();
      toast.success('Synchronisation réussie');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const columns = [
    {
      header: 'Nom & Prénom',
      accessor: (row: Employee) => (
        <div className="text-left">
          <div className="font-medium whitespace-nowrap">{row.lastName}</div>
          <div className="text-sm text-gray-500 whitespace-nowrap">{row.firstName}</div>
        </div>
      )
    },
    {
      header: 'Taux Horaire Normal',
      accessor: (row: Employee) => (
        <EditableCell
          value={row.normalRate}
          suffix=" €"
          onSave={async (value) => {
            await updateEmployee(row.id, { normal_rate: value });
            refetch();
            toast.success('Taux horaire normal mis à jour');
          }}
        />
      )
    },
    {
      header: 'Taux Horaire Supp.',
      accessor: (row: Employee) => (
        <EditableCell
          value={row.extraRate}
          suffix=" €"
          onSave={async (value) => {
            await updateEmployee(row.id, { extra_rate: value });
            refetch();
            toast.success('Taux horaire supplémentaire mis à jour');
          }}
        />
      )
    },
    {
      header: 'Heures Min.',
      accessor: (row: Employee) => (
        <EditableCell
          value={row.minHours}
          suffix="h"
          step="0.5"
          max={12}
          onSave={async (value) => {
            await updateEmployee(row.id, { min_hours: value });
            refetch();
            toast.success('Heures contractuelles mises à jour');
          }}
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des Employés"
        description="Synchronisez et gérez les informations des employés"
      />
      
      <Card className="p-6">
        <div className="mb-4">
          <Button onClick={handleJibbleSync} disabled={isLoading}>
            Synchroniser avec Jibble
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-4">
            Aucun employé. Synchronisez pour commencer.
          </div>
        ) : (
          <Table 
            columns={columns} 
            data={employees} 
          />
        )}
      </Card>
    </div>
  );
}