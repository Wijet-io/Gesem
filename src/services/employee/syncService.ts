import { supabase } from '../../lib/supabase';
import { getEmployees } from '../jibble/api';

interface SyncResult {
  syncedCount: number;
  errors?: string[];
}

export async function syncEmployeesFromJibble(): Promise<SyncResult> {
  console.log('Starting employee synchronization with Jibble...');

  try {
    const jibbleEmployees = await getEmployees();
    console.log('Received employees from Jibble:', jibbleEmployees.length);

    if (!jibbleEmployees.length) {
      throw new Error('No employees received from Jibble');
    }

    const activeEmployees = jibbleEmployees.filter(emp => 
      emp.status === "Joined" && emp.role !== "Owner"
    );
    console.log('Active employees to sync:', activeEmployees.length);

    const activeEmployeeIds = new Set(activeEmployees.map(emp => emp.id));
    let syncedCount = 0;
    const errors: string[] = [];

    for (const employee of activeEmployees) {
      try {
        const [firstName, ...lastNameParts] = employee.fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { error: upsertError } = await supabase
          .from('employees')
          .upsert({
            id: employee.id,
            first_name: firstName,
            last_name: lastName,
            normal_rate: 0,
            extra_rate: 0,
            min_hours: 8
          });

        if (upsertError) {
          console.error('Failed to upsert employee:', employee.fullName, upsertError);
          errors.push(`Failed to update/insert ${employee.fullName}: ${upsertError.message}`);
          continue;
        }

        syncedCount++;
        console.log('Synced employee:', employee.fullName);

      } catch (err) {
        const error = err as Error;
        console.error('Error processing employee:', employee.fullName, error);
        errors.push(`Error processing ${employee.fullName}: ${error.message}`);
      }
    }

    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .not('id', 'in', Array.from(activeEmployeeIds));

    if (deleteError) {
      console.error('Error removing inactive employees:', deleteError);
      errors.push(`Failed to remove inactive employees: ${deleteError.message}`);
    }

    if (errors.length > 0) {
      console.warn('Sync completed with errors:', errors);
    }
    console.log('Sync completed. Synced:', syncedCount, 'Errors:', errors.length);

    return {
      syncedCount,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (err) {
    const error = err as Error;
    console.error('Sync failed:', error);
    throw error;
  }
}