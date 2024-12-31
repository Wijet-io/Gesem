export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  createdBy: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}