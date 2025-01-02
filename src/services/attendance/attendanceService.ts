import { AttendanceRecord, AttendanceImport } from '../../types/attendance';
import { supabase } from '../../lib/supabase';
import { getAttendanceForPeriod } from '../jibble/api';
import { parseISO, format } from 'date-fns';
import { parseHours } from '../../utils/hours';

export async function importAttendance({ startDate, endDate, employeeIds }: AttendanceImport) {
  const importedRecords: AttendanceRecord[] = [];
  const importId = crypto.randomUUID(); // Identifiant unique pour cet import

  for (const employeeId of employeeIds) {
    try {
      const timesheets = await getAttendanceForPeriod(
        employeeId,
        format(parseISO(startDate), 'yyyy-MM-dd'),
        format(parseISO(endDate), 'yyyy-MM-dd')
      );

      // Récupérer les informations de l'employé
      const { data: employee } = await supabase
        .from('employees')
        .select('first_name, last_name, min_hours')
        .eq('id', employeeId)
        .single();

      for (const timesheet of timesheets) {
        const daily = timesheet.daily[0];
        const totalHours = parseHours(daily.payrollHours);
        const minHours = employee?.min_hours || 8;

        // Déterminer le statut
        let status: AttendanceRecord['status'] = 'VALID';
        if (totalHours > 13) {
          status = 'NEEDS_CORRECTION';
        } else if (totalHours < minHours) {
          status = 'TO_VERIFY';
        }

        const record: Partial<AttendanceRecord> = {
          employeeId,
          employeeName: `${employee?.first_name} ${employee?.last_name}`,
          date: daily.date,
          normalHours: Math.min(totalHours, 8),
          extraHours: Math.max(0, totalHours - 8),
          status,
          originalData: {
            startTime: daily.firstIn,
            endTime: daily.lastOut,
            totalHours,
            source: 'JIBBLE'
          },
          lastImportId: importId
        };

        // Ne pas écraser les enregistrements corrigés
        const { data: existing } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('employeeId', employeeId)
          .eq('date', daily.date)
          .single();

        if (!existing || existing.status !== 'CORRECTED') {
          const { data, error } = await supabase
            .from('attendance_records')
            .upsert(record)
            .select()
            .single();

          if (error) throw error;
          importedRecords.push(data);
        }
      }
    } catch (error) {
      console.error(`Error importing attendance for employee ${employeeId}:`, error);
      continue;
    }
  }

  return importedRecords;
}

export async function getAttendanceRecords(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data as AttendanceRecord[];
}

export async function updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>) {
  const { data, error } = await supabase
    .from('attendance_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AttendanceRecord;
}