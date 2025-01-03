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
  first_name?: string;
  last_name?: string;
  normal_rate?: number;
  extra_rate?: number;
  min_hours?: number;
}

export interface RateChangeLog {
  id: string;
  employee_id: string;
  old_normal_rate: number;
  new_normal_rate: number;
  old_extra_rate: number;
  new_extra_rate: number;
  reason: string;
  created_at: string;
  created_by: string;
}