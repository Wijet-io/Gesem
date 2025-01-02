import { JibblePerson, TimesheetSummary } from './types';
import { supabase } from '../../lib/supabase';

export async function getEmployees(): Promise<JibblePerson[]> {
  console.log('Getting employees from Jibble...');
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) {
      console.error('Jibble API error:', error);
      throw error;
    }

    if (!data || !data.value) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Jibble API');
    }

    console.log('Got employees from Jibble:', data.value.length);
    return data.value;
  } catch (error) {
    console.error('getEmployees error:', error);
    throw error;
  }
}

// Cette fonction n'est pas utilisée pour l'instant, mais gardons-la pour plus tard
export async function getAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetSummary[]> {
  console.log('Getting attendance for period:', { employeeId, startDate, endDate });
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      body: {
        endpoint: '/timesheets-summary',
        params: {
          period: 'Custom',
          date: startDate,
          endDate: endDate,
          personId: employeeId,
          $filter: "total ne duration'PT0S'"
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;
    if (!data || !data.value) {
      throw new Error('Invalid response from Jibble API');
    }

    console.log('Got attendance data:', data.value.length, 'records');
    return data.value;
  } catch (error) {
    console.error('getAttendanceForPeriod error:', error);
    throw error;
  }
}