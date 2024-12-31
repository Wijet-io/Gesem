import { JibblePerson, JibbleResponse, TimesheetSummary } from './types';
import { supabase } from '../../lib/supabase';

interface JibbleApiRequest {
  endpoint: string;
  params?: Record<string, any>;
}

async function fetchJibble<T>(endpoint: string, params = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('jibble-proxy', {
    body: {
      endpoint,
      params
    }
  });

  if (error) {
    console.error('Jibble API error:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No data received from Jibble API');
  }

  return data;
}

export async function getEmployees(): Promise<JibblePerson[]> {
  const response = await fetchJibble<JibbleResponse<JibblePerson>>('/people');
  return response.value.filter(person => 
    person.status === 'Joined' && person.role !== 'Owner'
  );
}

export async function getAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetSummary[]> {
  const response = await fetchJibble<JibbleResponse<TimesheetSummary>>(
    '/timesheets',
    {
      period: 'Custom',
      date: startDate,
      endDate: endDate,
      personId: employeeId,
      $filter: "total ne duration'PT0S'"
    }
  );
  return response.value;
}