import { JibblePerson } from './types';
import { JIBBLE_API } from './constants';
import { supabase } from '../../lib/supabase';
import { TimesheetSummary } from './types';

export async function getEmployees(): Promise<JibblePerson[]> {
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      body: { endpoint: JIBBLE_API.ENDPOINTS.PEOPLE }
    });

    if (error) throw error;
    if (!data) throw new Error('No data received from Jibble API');

    return data.value;
  } catch (error) {
    console.error('getEmployees error:', error);
    throw error;
  }
}

export async function getAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetSummary[]> {
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      body: {
        endpoint: JIBBLE_API.ENDPOINTS.TIMESHEETS,
        params: {
          period: 'Custom',
          date: startDate,
          endDate: endDate,
          personId: employeeId,
          $filter: "total ne duration'PT0S'"
        }
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No data received from Jibble API');

    return data.value;
  } catch (error) {
    console.error('getAttendanceForPeriod error:', error);
    throw error;
  }
}