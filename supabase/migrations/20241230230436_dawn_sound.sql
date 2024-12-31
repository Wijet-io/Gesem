/*
  # Fix users table RLS policies

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Add basic policies for CRUD operations
    - Add policy for admin operations

  2. Security
    - Enable RLS on users table
    - Add policies for viewing and managing users
*/

-- Drop existing policies
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "Admins can view all users" on users;
drop policy if exists "Admins can insert users" on users;
drop policy if exists "Admins can update users" on users;

-- Create new policies
create policy "Enable read access for all authenticated users"
  on users for select
  using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated admin users only"
  on users for insert
  with check (
    auth.jwt() ->> 'role' = 'authenticated' and
    (
      select role from users
      where id = auth.uid()
    ) = 'ADMIN'
  );

create policy "Enable update for authenticated admin users only"
  on users for update
  using (
    auth.jwt() ->> 'role' = 'authenticated' and
    (
      select role from users
      where id = auth.uid()
    ) = 'ADMIN'
  );

create policy "Enable delete for authenticated admin users only"
  on users for delete
  using (
    auth.jwt() ->> 'role' = 'authenticated' and
    (
      select role from users
      where id = auth.uid()
    ) = 'ADMIN'
  );