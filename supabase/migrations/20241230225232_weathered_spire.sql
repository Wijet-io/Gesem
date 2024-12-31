/*
  # Add users table and policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique)
      - `role` (user_role enum)
      - `first_name` (text)
      - `last_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policies for user access
*/

-- Create users table
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table users enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Admins can view all users"
  on users for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Admins can insert users"
  on users for insert
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Admins can update users"
  on users for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

-- Create trigger for updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row
  execute function update_updated_at();