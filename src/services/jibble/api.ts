import { JibblePerson, JibbleResponse, TimesheetSummary } from './types';
import { supabase } from '../../lib/supabase';

interface JibbleApiRequest {
  endpoint: string;
  params?: Record<string, any>;
}

async function fetchJibble<T>(endpoint: string, params = {}): Promise<T> {
  console.log('Calling Jibble API with:', { endpoint, params });
  
  try {
    const { data, error } = await supabase.functions.invoke<T>('jibble-proxy', {
      body: {
        endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
        params
      },
      headers: {
        'Content-Type': 'application/json'
      },
    });

    console.log('Edge Function Response:', { data, error });

    if (error) {
      console.error('Jibble API error:', error);
      throw new Error(error.message || 'Failed to fetch from Jibble API');
    }

    if (!data) {
      throw new Error('No data received from Jibble API');
    }

    return data;
  } catch (error) {
    console.error('Full error details:', error);
    throw error;
  }
}

export async function getEmployees(): Promise<JibblePerson[]> {
  console.log('Getting employees...');
  const response = await fetchJibble<JibbleResponse<JibblePerson>>('/People');
  console.log('Got employees response:', response);
  return response.value.filter(person => 
    person.status === 'Joined' && person.role !== 'Owner'
  );
}

export async function getAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetSummary[]> {
  console.log('Getting attendance for:', { employeeId, startDate, endDate });
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
  console.log('Got attendance response:', response);
  return response.value;
}