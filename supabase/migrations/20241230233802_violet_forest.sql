/*
  # Add settings table

  1. New Tables
    - `settings`
      - `key` (text, primary key)
      - `value` (jsonb, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `settings` table
    - Add policies for authenticated users
*/

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table settings enable row level security;

-- Create policies
create policy "Enable read access for all authenticated users"
  on settings for select
  using (auth.role() = 'authenticated');

create policy "Enable insert/update for authenticated admin users only"
  on settings for all
  using (
    auth.jwt() ->> 'role' = 'authenticated' and
    exists (
      select 1 from users
      where id = auth.uid()
      and role = 'ADMIN'
    )
  );

-- Create trigger for updated_at
create trigger settings_updated_at
  before update on settings
  for each row
  execute function update_updated_at();