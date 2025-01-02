import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '../services/employee/employeeService';
import { syncEmployeesFromJibble } from '../services/employee/syncService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Employee } from '../types/employee';
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
      accessor: (row: Employee) => `${row.lastName} ${row.firstName}`
    }
  ];

  return (
    <div>
      <PageHeader
        title="Employés"
        description="Gestion des employés"
      />
      
      <Card className="p-6">
        <div className="mb-4">
          <Button onClick={handleJibbleSync} disabled={isLoading}>
            Synchroniser avec Jibble
          </Button>
        </div>

        {isLoading ? (
          <div>Chargement...</div>
        ) : employees.length === 0 ? (
          <div>Aucun employé. Synchronisez pour commencer.</div>
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