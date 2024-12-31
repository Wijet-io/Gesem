import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import ProgressBar from './ui/ProgressBar';
import { useAttendanceImport } from '../hooks/useAttendanceImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { progress, importAttendance } = useAttendanceImport();

  const handleImport = async () => {
    try {
      await importAttendance(startDate, endDate);
      onSuccess();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const isImporting = progress.status === 'processing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importer les Pointages"
    >
      <div className="space-y-4">
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
            disabled={!startDate || !endDate || isImporting}
          >
            {isImporting ? 'Importation...' : 'Importer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}