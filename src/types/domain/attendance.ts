export type AttendanceStatus = 'VALID' | 'NEEDS_CORRECTION' | 'CORRECTED' | 'TO_VERIFY';

export interface AttendanceImport {
  startDate: string;
  endDate: string;
  employeeIds: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  normalHours: number;
  extraHours: number;
  status: AttendanceStatus;
  originalData: {
    startTime: string;
    endTime: string;
    totalHours: number;
    source: 'JIBBLE' | 'MANUAL';
  };
  correction?: {
    userId: string;
    timestamp: string;
    reason: string;
    newNormalHours: number;
    newExtraHours: number;
    syncedToJibble: boolean;
  };
  lastImportId: string;
}