import { JibblePerson, JibbleResponse, TimesheetSummary } from './types';
import { supabase } from '../../lib/supabase';
import { JIBBLE_API } from './constants';

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
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy');
    
    console.log('Response from Edge Function:', { hasData: !!data, error });

    if (error) {
      console.error('Error from Edge Function:', error);
      throw error;
    }

    if (!data || !data.value) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Jibble API');
    }

    return data.value.filter((emp: JibblePerson) => emp.status === "Joined" && emp.role !== "Owner");
    
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
  console.log('Getting attendance for:', { employeeId, startDate, endDate });
  try {
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
    
    console.log('Got attendance response:', response);
    
    if (!response.value || !Array.isArray(response.value)) {
      throw new Error('Invalid response format from Jibble');
    }

    return response.value;
  } catch (error) {
    console.error('getAttendanceForPeriod error:', error);
    throw error;
  }
}