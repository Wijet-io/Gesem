import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { Employee } from '../types/employee';
import ProgressBar from './ui/ProgressBar';
import { useAttendanceImport } from '../hooks/useAttendanceImport';
import toast from 'react-hot-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
}

export default function ImportModal({ isOpen, onClose, onSuccess, employees }: ImportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { progress, importAttendance } = useAttendanceImport();

  const handleImport = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Veuillez sélectionner au moins un employé');
      return;
    }

    try {
      await importAttendance(startDate, endDate, selectedEmployees);
      onSuccess();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Erreur lors de l\'importation');
    }
  };

  const handleSelectAll = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const handleUnselectAll = () => {
    setSelectedEmployees([]);
  };

  const isImporting = progress.status === 'processing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importer les Pointages"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          {startDate && endDate ? (
            `Période du ${startDate} au ${endDate}`
          ) : (
            'Sélectionnez une période'
          )}
        </div>

        <Input
          type="date"
          label="Date de début"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isImporting}
          required
        />

        <Input
          type="date"
          label="Date de fin"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isImporting}
          required
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Employés ({selectedEmployees.length} sélectionnés)
            </label>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSelectAll}
                disabled={isImporting}
              >
                Tout sélectionner
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUnselectAll}
                disabled={isImporting}
              >
                Tout désélectionner
              </Button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {employees.map((employee) => (
              <label
                key={employee.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(employee.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEmployees([...selectedEmployees, employee.id]);
                    } else {
                      setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                    }
                  }}
                  disabled={isImporting}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm">
                  {employee.lastName} {employee.firstName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {progress.status !== 'pending' && (
          <ProgressBar
            progress={progress.current}
            total={progress.total}
            status={progress.status}
            message={progress.message}
          />
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isImporting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={!startDate || !endDate || selectedEmployees.length === 0 || isImporting}
          >
            {isImporting ? 'Importation...' : 'Importer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}