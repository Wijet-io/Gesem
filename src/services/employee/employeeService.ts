import { Employee, EmployeeUpdate, RateChangeLog } from '../../types/employee';
import { supabase } from '../../lib/supabase';

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true });

  if (error) throw error;
  return data.map(employee => ({
    id: employee.id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    normalRate: employee.normal_rate,
    extraRate: employee.extra_rate,
    minHours: employee.min_hours,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at
  })) as Employee[];
}

export async function updateEmployee(id: string, updates: EmployeeUpdate) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function getRateChangeLogs(employeeId: string) {
  const { data, error } = await supabase
    .from('rate_change_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as RateChangeLog[];
}