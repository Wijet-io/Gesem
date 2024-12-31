import { supabase } from '../../lib/supabase';
import { getEmployees as getJibbleEmployees } from '../jibble/api';
import type { Employee } from '../../types/employee';

export async function syncEmployeesFromJibble() {
  try {
    const jibbleEmployees = await getJibbleEmployees();
    if (!Array.isArray(jibbleEmployees) || !jibbleEmployees.length) {
      throw new Error('No employees received from Jibble');
    }

    let syncedCount = 0;
    const errors = [];

    for (const jibbleEmployee of jibbleEmployees) {
      const [firstName, ...lastNameParts] = jibbleEmployee.fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      try {
        const { data: existingEmployee, error: selectError } = await supabase
          .from('employees')
          .select()
          .eq('id', jibbleEmployee.id)
          .single();

        // PGRST116 means no rows returned, which is fine for new employees
        const isNewEmployee = selectError?.code === 'PGRST116';

        if (isNewEmployee) {
          const { error: insertError } = await supabase
            .from('employees')
            .insert({
              id: jibbleEmployee.id,
              first_name: firstName,
              last_name: lastName,
              normal_rate: 0,
              extra_rate: 0,
              min_hours: 8
            });

          if (insertError) {
            errors.push(`Failed to insert employee ${jibbleEmployee.fullName}: ${insertError.message}`);
            continue;
          }
        } else {
          const { error: updateError } = await supabase
            .from('employees')
            .update({
              first_name: firstName,
              last_name: lastName
            })
            .eq('id', jibbleEmployee.id);

          if (updateError) {
            errors.push(`Failed to update employee ${jibbleEmployee.fullName}: ${updateError.message}`);
            continue;
          }
        }
        syncedCount++;
      } catch (error) {
        errors.push(`Error processing employee ${jibbleEmployee.fullName}: ${error.message}`);
        continue;
      }
    }

    if (errors.length > 0) {
      console.error('Sync completed with errors:', errors);
    }
    return syncedCount;
  } catch (error) {
    console.error('Sync failed:', error);
    throw new Error(error.message || 'Failed to synchronize employees');
  }
}