export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PAYROLL = 'PAYROLL',
  SUPERVISOR = 'SUPERVISOR'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  view: boolean;
  edit: boolean;
  validate: boolean;
  generate: boolean;
}