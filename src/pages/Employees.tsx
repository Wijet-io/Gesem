import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '../services/employee/employeeService';
import { syncEmployeesFromJibble } from '../services/employee/syncService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmployeeEditModal from '../components/EmployeeEditModal';
import type { Employee } from '../types/employee';
import toast from 'react-hot-toast';

export default function Employees() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
        <div>
          <div className="font-medium">{row.lastName}</div>
          <div className="text-sm text-gray-500">{row.firstName}</div>
        </div>
      )
    },
    {
      header: 'Taux Horaire Normal',
      accessor: (row: Employee) => (
        <div className="text-right">
          {row.normalRate ? `${row.normalRate.toFixed(2)} €` : '-'}
        </div>
      )
    },
    {
      header: 'Taux Horaire Supp.',
      accessor: (row: Employee) => (
        <div className="text-right">
          {row.extraRate ? `${row.extraRate.toFixed(2)} €` : '-'}
        </div>
      )
    },
    {
      header: 'Heures Min.',
      accessor: (row: Employee) => (
        <div className="text-right">
          {row.minHours}h
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row: Employee) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedEmployee(row);
            }}
          >
            Modifier
          </Button>
        </div>
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
        
        <EmployeeEditModal
          employee={selectedEmployee}
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSuccess={refetch}
        />
      </Card>
    </div>
  );
}