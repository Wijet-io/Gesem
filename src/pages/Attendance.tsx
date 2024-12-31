import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceRecords } from '../services/attendance/attendanceService';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImportModal from '../components/ImportModal';
import { formatDate } from '../utils/date';
import { formatHours } from '../utils/hours';
import { AttendanceRecord } from '../types/attendance';

export default function Attendance() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [startDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });

  const [endDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['attendance', startDate, endDate],
    queryFn: () => getAttendanceRecords(startDate, endDate)
  });

  const columns = [
    { 
      header: 'Date',
      accessor: (row: AttendanceRecord) => formatDate(row.date)
    },
    { 
      header: 'Heures Normales',
      accessor: (row: AttendanceRecord) => formatHours(row.normalHours)
    },
    { 
      header: 'Heures Supp.',
      accessor: (row: AttendanceRecord) => formatHours(row.extraHours)
    },
    {
      header: 'Statut',
      accessor: (row: AttendanceRecord) => {
        const variants = {
          VALID: { variant: 'success', label: 'Valide' },
          NEEDS_CORRECTION: { variant: 'error', label: 'À Corriger' },
          CORRECTED: { variant: 'info', label: 'Corrigé' }
        };
        const { variant, label } = variants[row.status];
        return <Badge variant={variant as any}>{label}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: (row: AttendanceRecord) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log('View details', row.id)}
        >
          Détails
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des Pointages"
        description="Suivez et validez les pointages des employés"
        action={{
          label: "Importer",
          onClick: () => setIsImportModalOpen(true)
        }}
      />
      
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : (
          <Table
            columns={columns}
            data={records || []}
          />
        )}
      </Card>
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}