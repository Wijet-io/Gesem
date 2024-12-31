import { supabase } from '../../lib/supabase';
import type { JibblePerson, JibbleResponse, TimesheetSummary } from './types';
import { JIBBLE_API } from './constants';

async function fetchJibble<T>(endpoint: string, params = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('jibble', {
    body: { endpoint, params }
  });

  if (error) throw error;
  return data;
}

export async function getEmployees(): Promise<JibblePerson[]> {
  const response = await fetchJibble<JibbleResponse<JibblePerson>>(JIBBLE_API.ENDPOINTS.PEOPLE);
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
    JIBBLE_API.ENDPOINTS.TIMESHEETS,
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