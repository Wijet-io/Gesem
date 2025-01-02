import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '../services/employee/employeeService';
import { syncEmployeesFromJibble } from '../services/employee/syncService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Employee } from '../types/employee';
import toast from 'react-hot-toast';

export default function Employees() {
  const queryResult = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('Fetching employees list');
      const data = await getEmployees();
      console.log('Employees fetched:', data?.length);
      return data;
    }
  });

  const { data: employees, isLoading, refetch } = queryResult;

  // Gérer l'erreur avec un effet
  React.useEffect(() => {
    if (queryResult.error) {
      console.error('Error fetching employees:', queryResult.error);
      toast.error('Erreur lors du chargement des employés');
    }
  }, [queryResult.error]);

  const handleJibbleSync = async () => {
    try {
      const loadingToast = toast.loading('Synchronisation avec Jibble en cours...');
      console.log('Starting Jibble sync...');
      
      const result = await syncEmployeesFromJibble();
      console.log('Sync result:', result);

      toast.dismiss(loadingToast);
      
      if (result.errors?.length) {
        toast.error(`Synchronisation terminée avec ${result.errors.length} erreurs`);
      } else {
        toast.success(`${result.syncedCount} employés synchronisés avec succès`);
      }

      await refetch();
      
    } catch (err) {
      const error = err as Error;
      console.error('Sync failed:', error);
      toast.error('Erreur lors de la synchronisation avec Jibble');
    }
  };

  const columns = [
    { 
      header: 'Nom',
      accessor: (row: Employee) => (
        <div className="text-sm">
          <div className="font-medium">{row.lastName}</div>
          <div className="text-gray-500">{row.firstName}</div>
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
              console.log('Edit employee:', row);
              toast.error('Fonctionnalité en développement');
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Employés"
        description="Synchronisez et gérez les informations des employés"
      />
      
      <Card>
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="primary"
            onClick={handleJibbleSync}
            disabled={isLoading}
          >
            Synchroniser avec Jibble
          </Button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement des employés...
            </div>
          ) : !employees?.length ? (
            <div className="text-center py-8 text-gray-500">
              Aucun employé trouvé. Synchronisez avec Jibble pour importer la liste.
            </div>
          ) : (
            <Table
              columns={columns}
              data={employees}
            />
          )}
        </div>
      </Card>
    </div>
  );
}