export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  createdBy: string;
  createdAt: string;
  status: AdvanceStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}