import { JibblePerson, JibbleResponse, TimesheetSummary } from './types';
import { getJibbleToken } from './auth';
import { JIBBLE_API } from './constants';

async function fetchJibble<T>(endpoint: string, params = {}): Promise<T> {
  const token = await getJibbleToken();
  const url = new URL(endpoint, JIBBLE_API.BASE_URL);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Jibble API error: ${response.status}`);
  }

  return response.json();
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