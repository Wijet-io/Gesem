import { z } from 'zod';

export const attendanceRecordSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  normalHours: z.number().min(0).max(24),
  extraHours: z.number().min(0).max(24),
  status: z.enum(['VALID', 'NEEDS_CORRECTION', 'CORRECTED', 'TO_VERIFY']),
  originalData: z.object({
    startTime: z.string(),
    endTime: z.string(),
    totalHours: z.number(),
    source: z.enum(['JIBBLE', 'MANUAL'])
  })
});

export function validateAttendanceRecord(data: unknown) {
  return attendanceRecordSchema.parse(data);
}