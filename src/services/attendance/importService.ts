import { supabase } from '../../lib/supabase';
import { getAttendanceForPeriod } from '../jibble/api';
import { Employee } from '../../types/employee';
import { AttendanceRecord } from '../../types/attendance';
import { parseHours } from '../../utils/hours';

interface ImportProgress {
  total: number;
  current: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export class AttendanceImporter {
  private progress: ImportProgress = {
    total: 0,
    current: 0,
    status: 'pending'
  };

  private onProgressUpdate?: (progress: ImportProgress) => void;

  constructor(callback?: (progress: ImportProgress) => void) {
    this.onProgressUpdate = callback;
  }

  private updateProgress(update: Partial<ImportProgress>) {
    this.progress = { ...this.progress, ...update };
    this.onProgressUpdate?.(this.progress);
  }

  async importForEmployee(
    employee: Employee,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    try {
      const timesheets = await getAttendanceForPeriod(
        employee.id,
        startDate,
        endDate
      );

      const records = await Promise.all(
        timesheets.value.map(async (timesheet) => {
          const daily = timesheet.daily[0];
          const totalHours = parseHours(daily.payrollHours);

          const record: Partial<AttendanceRecord> = {
            employeeId: employee.id,
            date: daily.date,
            normalHours: Math.min(totalHours, employee.minHours),
            extraHours: Math.max(0, totalHours - employee.minHours),
            status: totalHours > 13 ? 'NEEDS_CORRECTION' : 'VALID',
            originalData: {
              startTime: daily.firstIn,
              endTime: daily.lastOut,
              totalHours
            }
          };

          const { data, error } = await supabase
            .from('attendance_records')
            .upsert(record)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );
      
      return records;
    } catch (error) {
      console.error(`Import failed for employee ${employee.id}:`, error);
      throw error;
    }
  }

  async importForPeriod(
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ) {
    try {
      this.updateProgress({ status: 'processing', current: 0 });

      // Fetch employees
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .in('id', employeeIds || [])
        .order('last_name');

      if (!employees?.length) {
        throw new Error('No employees found');
      }

      this.updateProgress({ total: employees.length });

      // Import for each employee
      const results = [];
      for (const employee of employees) {
        try {
          const records = await this.importForEmployee(employee, startDate, endDate);
          results.push(...records);
          
          this.updateProgress({
            current: this.progress.current + 1,
            message: `Importé pour ${employee.first_name} ${employee.last_name}`
          });
        } catch (error) {
          console.error(`Failed to import for ${employee.id}:`, error);
          // Continue with next employee
        }
      }

      this.updateProgress({ 
        status: 'completed',
        message: `Import terminé pour ${results.length} pointages`
      });

      return results;
    } catch (error) {
      this.updateProgress({
        status: 'error',
        message: error.message
      });
      throw error;
    }
  }
}