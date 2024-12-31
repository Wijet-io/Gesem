import { useState, useCallback } from 'react';
import { AttendanceImporter } from '../services/attendance/importService';
import { AttendanceRecord } from '../types/attendance';

interface ImportProgress {
  total: number;
  current: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export function useAttendanceImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    current: 0,
    status: 'pending'
  });

  const importAttendance = useCallback(async (
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ): Promise<AttendanceRecord[]> => {
    const importer = new AttendanceImporter(setProgress);
    return await importer.importForPeriod(startDate, endDate, employeeIds);
  }, []);

  return {
    progress,
    importAttendance
  };
}