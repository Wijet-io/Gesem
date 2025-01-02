import { createClient } from '@supabase/supabase-js';
import { getEmployees as getJibbleEmployees } from '../jibble/api';

// Client admin pour les opérations de synchronisation
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export async function syncEmployeesFromJibble() {
  try {
    const jibbleEmployees = await getJibbleEmployees();
    console.log('Jibble employees:', jibbleEmployees);
    
    if (!Array.isArray(jibbleEmployees) || !jibbleEmployees.length) {
      throw new Error('No employees received from Jibble');
    }

    let syncedCount = 0;
    const errors: string[] = [];
    
    // Créer un Set des IDs des employés actifs de Jibble
    const activeEmployeeIds = new Set(jibbleEmployees.map(emp => emp.id));

    // 1. Supprimer les employés qui ne sont plus dans Jibble
    const { error: deleteError } = await supabaseAdmin
      .from('employees')
      .delete()
      .not('id', 'in', `(${Array.from(activeEmployeeIds).map(id => `'${id}'`).join(',')})`);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      errors.push(`Failed to remove inactive employees: ${deleteError.message}`);
    }

    for (const jibbleEmployee of jibbleEmployees) {
      console.log('Processing employee:', jibbleEmployee);
      const [firstName, ...lastNameParts] = jibbleEmployee.fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      try {
        // Vérifier si l'employé existe déjà
        const { data: existingEmployee } = await supabaseAdmin
          .from('employees')
          .select('*')
          .eq('id', jibbleEmployee.id)
          .maybeSingle();

        if (!existingEmployee) {
          // Nouvel employé : insérer avec les taux par défaut
          const { error: insertError } = await supabaseAdmin
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
            console.error('Insert error:', insertError);
            errors.push(`Failed to insert employee ${jibbleEmployee.fullName}: ${insertError.message}`);
            continue;
          }
        } else {
          // Employé existant : mettre à jour uniquement le nom
          const { error: updateError } = await supabaseAdmin
            .from('employees')
            .update({
              first_name: firstName,
              last_name: lastName
            })
            .eq('id', jibbleEmployee.id);

          if (updateError) {
            console.error('Update error:', updateError);
            errors.push(`Failed to update employee ${jibbleEmployee.fullName}: ${updateError.message}`);
            continue;
          }
        }
        syncedCount++;
      } catch (error: any) {
        console.error('Processing error:', error);
        errors.push(`Error processing employee ${jibbleEmployee.fullName}: ${error.message}`);
        continue;
      }
    }

    if (errors.length > 0) {
      console.error('Sync completed with errors:', errors);
    }
    return syncedCount;
  } catch (error: any) {
    console.error('Sync failed:', error);
    throw new Error(error.message || 'Failed to synchronize employees');
  }
}