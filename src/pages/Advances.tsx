import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdvances } from '../services/advance/advanceService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/date';
import { formatMoney } from '../utils/money';
import { Advance } from '../types/advance';

export default function Advances() {
  const [startDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });

  const [endDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: advances, isLoading } = useQuery({
    queryKey: ['advances', startDate, endDate],
    queryFn: () => getAdvances(startDate, endDate)
  });

  const columns = [
    { 
      header: 'Date',
      accessor: (row: Advance) => formatDate(row.date)
    },
    { 
      header: 'Montant',
      accessor: (row: Advance) => formatMoney(row.amount)
    },
    {
      header: 'Statut',
      accessor: (row: Advance) => {
        const variants = {
          PENDING: { variant: 'warning', label: 'En Attente' },
          APPROVED: { variant: 'success', label: 'Approuvé' },
          REJECTED: { variant: 'error', label: 'Refusé' }
        };
        const { variant, label } = variants[row.status];
        return <Badge variant={variant as any}>{label}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: (row: Advance) => (
        <div className="flex space-x-2">
          {row.status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => console.log('Approve', row.id)}
              >
                Approuver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => console.log('Reject', row.id)}
              >
                Refuser
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des Acomptes"
        description="Gérez les demandes d'acomptes des employés"
        action={{
          label: "Nouvel Acompte",
          onClick: () => console.log('New advance')
        }}
      />
      
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : (
          <Table
            columns={columns}
            data={advances || []}
          />
        )}
      </Card>
    </div>
  );
}