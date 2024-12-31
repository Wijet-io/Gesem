export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  normalHours: number;
  extraHours: number;
  status: 'VALID' | 'NEEDS_CORRECTION' | 'CORRECTED';
  originalData: {
    startTime: string;
    endTime: string;
    totalHours: number;
  };
  correction?: {
    userId: string;
    timestamp: string;
    reason: string;
    newNormalHours: number;
    newExtraHours: number;
  };
}

export interface AttendanceImport {
  startDate: string;
  endDate: string;
  employeeIds: string[];
}