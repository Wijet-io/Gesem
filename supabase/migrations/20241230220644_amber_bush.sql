/*
  # Initial Schema Setup

  1. Users and Authentication
    - `users` table for application users
    - Custom fields extending Supabase auth

  2. Core Tables
    - `employees` for employee management
    - `rate_change_logs` for tracking rate changes
    - `attendance_records` for storing attendance data
    - `advances` for managing salary advances
    - `audit_logs` for system-wide logging

  3. Security
    - RLS policies for each table
    - Role-based access control
*/

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Create custom types
create type user_role as enum ('ADMIN', 'MANAGER', 'PAYROLL', 'SUPERVISOR');
create type attendance_status as enum ('VALID', 'NEEDS_CORRECTION', 'CORRECTED');
create type advance_status as enum ('PENDING', 'APPROVED', 'REJECTED');

-- Create employees table
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  normal_rate numeric(10,2) not null,
  extra_rate numeric(10,2) not null,
  min_hours numeric(4,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create rate change logs
create table if not exists rate_change_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  user_id uuid references auth.users(id),
  normal_rate numeric(10,2),
  extra_rate numeric(10,2),
  created_at timestamptz default now()
);

-- Create attendance records
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  date date not null,
  normal_hours numeric(5,2) not null,
  extra_hours numeric(5,2) not null,
  status attendance_status not null default 'VALID',
  original_data jsonb not null,
  correction jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create advances table
create table if not exists advances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  amount numeric(10,2) not null,
  date date not null,
  status advance_status not null default 'PENDING',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  notes text
);

-- Create audit logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table employees enable row level security;
alter table rate_change_logs enable row level security;
alter table attendance_records enable row level security;
alter table advances enable row level security;
alter table audit_logs enable row level security;

-- Create policies
create policy "Users can view employees based on role"
  on employees for select
  using (
    auth.role() in ('ADMIN', 'MANAGER', 'PAYROLL', 'SUPERVISOR')
  );

create policy "Only admins and managers can modify employees"
  on employees for all
  using (auth.role() in ('ADMIN', 'MANAGER'));

-- Similar policies for other tables...

-- Create functions for audit logging
create or replace function log_employee_changes()
returns trigger as $$
begin
  insert into audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    case when TG_OP = 'DELETE' then row_to_json(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then row_to_json(new) else null end
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create triggers for audit logging
create trigger employee_audit
  after insert or update or delete on employees
  for each row execute function log_employee_changes();

-- Add similar triggers for other tables