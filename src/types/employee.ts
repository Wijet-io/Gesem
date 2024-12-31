export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  normalRate: number;
  extraRate: number;
  minHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeUpdate {
  normalRate?: number;
  extraRate?: number;
  minHours?: number;
}

export interface RateChangeLog {
  id: string;
  employeeId: string;
  userId: string;
  normalRate: number | null;
  extraRate: number | null;
  timestamp: string;
}