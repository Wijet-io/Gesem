export interface JibblePerson {
  id: string;
  fullName: string;
  email: string;
  status: string;
  role: string;
}

export interface TimesheetSummary {
  daily: {
    date: string;
    firstIn: string;
    lastOut: string;
    payrollHours: string;
  }[];
}

export interface JibbleResponse<T> {
  value: T[];
}