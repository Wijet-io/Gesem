import { JibblePerson, JibbleTimesheet } from '../../types/api/jibble';
import { supabase } from '../../lib/supabase'; 
import { ERROR_MESSAGES } from './constants';
import { APIError } from '../../utils/api';

export async function getEmployees(): Promise<JibblePerson[]> {
  console.log('Getting employees from Jibble...');
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      body: { action: 'getEmployees' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw new APIError(error.message, 'JIBBLE_API_ERROR');

    if (!data?.value) {
      throw new APIError(ERROR_MESSAGES.INVALID_RESPONSE, 'INVALID_RESPONSE');
    }

    console.log('Got employees from Jibble:', data.value.length);
    return data.value;
  } catch (error) {
    console.error('getEmployees error:', error);
    throw error instanceof APIError ? error : new APIError(ERROR_MESSAGES.FETCH_ERROR, 'FETCH_ERROR');
  }
}

// Cette fonction n'est pas utilisée pour l'instant, mais gardons-la pour plus tard
export async function getAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<JibbleTimesheet[]> {
  console.log('Getting attendance for period:', { employeeId, startDate, endDate });
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy', {
      body: {
        action: 'getTimesheets',
        params: {
          period: 'Custom',
          date: startDate,
          endDate: endDate,
          personId: employeeId,
          filter: "total ne duration'PT0S'"
        }
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw new APIError(error.message, 'JIBBLE_API_ERROR');
    
    if (!data?.value) {
      throw new APIError(ERROR_MESSAGES.INVALID_RESPONSE, 'INVALID_RESPONSE');
    }

    console.log('Got attendance data:', data.value.length, 'records');
    return data.value;
  } catch (error) {
    console.error('getAttendanceForPeriod error:', error);
    throw error instanceof APIError ? error : new APIError(ERROR_MESSAGES.FETCH_ERROR, 'FETCH_ERROR');
  }
}