import { supabase } from '../../lib/supabase';
import type { JibbleResponse } from './types';

interface TimesheetSummary {
  daily: {
    date: string;
    firstIn: string;
    lastOut: string;
    payrollHours: string;
  }[];
}

export async function getAttendanceForPeriod(employeeId: string, startDate: string, endDate: string) {
  try {
    const { data } = await supabase.functions.invoke('jibble', {
      body: {
        endpoint: `/TimesheetsSummary`,
        params: {
          period: 'Custom',
          date: startDate,
          endDate: endDate,
          personIds: employeeId,
          $filter: "total ne duration'PT0S'"
        }
      }
    });

    return (data as JibbleResponse<TimesheetSummary>).value;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw new Error('Failed to fetch attendance data');
  }
}