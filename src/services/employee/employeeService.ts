import { Employee, EmployeeUpdate, RateChangeLog } from '../../types/employee';
import { supabase } from '../../lib/supabase';

export async function getEmployees() {
  console.log('Fetching employees from Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('employees') 
      .select('*, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!data) {
      console.log('No employees found');
      return [];
    }

    console.log('Found employees:', data.length);

    // Transformer les données en format Employee
    return data.map(employee => ({
      id: employee.id,
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      normalRate: Number(employee.normal_rate || 0),
      extraRate: Number(employee.extra_rate || 0),
      minHours: Number(employee.min_hours || 8),
      createdAt: employee.created_at || new Date().toISOString(),
      updatedAt: employee.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error;
  }
}

export async function updateEmployee(id: string, updates: EmployeeUpdate) {
  console.log('Updating employee:', id, updates);
  
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    throw new Error('No active session');
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned after update');
    }

    console.log('Update successful:', data);

    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      normalRate: Number(data.normal_rate || 0),
      extraRate: Number(data.extra_rate || 0),
      minHours: Number(data.min_hours || 8),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as Employee;
  } catch (error) {
    console.error('Failed to update employee:', error);
    throw error;
  }
}

export async function getRateChangeLogs(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('rate_change_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch rate change logs:', error);
      throw error;
    }

    return data as RateChangeLog[];
  } catch (error) {
    console.error('Failed to get rate change logs:', error);
    throw error;
  }
}