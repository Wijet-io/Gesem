import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatMoney } from '../utils/money';
import { getEmployees } from '../services/employee/employeeService';
import { syncEmployeesFromJibble } from '../services/employee/syncService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Employee } from '../types/employee';
import toast from 'react-hot-toast';

export default function Employees() {
  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  const handleJibbleSync = async () => {
    try {
      toast.loading('Synchronisation en cours...');
      const count = await syncEmployeesFromJibble();
      toast.dismiss();
      toast.success(`${count} employés synchronisés depuis Jibble`);
      refetch();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.dismiss();
      toast.error('Erreur lors de la synchronisation avec Jibble');
    }
  };

  const columns = [
    { header: 'Nom', accessor: (row: Employee) => `${row.firstName} ${row.lastName}` },
    { 
      header: 'Taux Horaire Normal',
      accessor: (row: Employee) => formatMoney(row.normalRate)
    },
    { 
      header: 'Taux Horaire Supp.',
      accessor: (row: Employee) => formatMoney(row.extraRate)
    },
    { 
      header: 'Heures Min.',
      accessor: (row: Employee) => `${row.minHours}h`
    },
    {
      header: 'Actions',
      accessor: (row: Employee) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => console.log('Edit', row.id)}
          >
            Modifier
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => console.log('Archive', row.id)}
          >
            Archiver
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des Employés"
        description="Gérez les informations et les taux horaires des employés"
      />
      
      <Card className="p-6">
        <div className="mb-4 flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={handleJibbleSync}
          >
            Synchroniser avec Jibble
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : (
          <Table
            columns={columns}
            data={employees || []}
          />
        )}
      </Card>
    </div>
  );
}