/*
  # Fix column names to follow PostgreSQL conventions
  
  1. Changes
    - Rename camelCase columns back to snake_case
    - Update policies to use snake_case column names
*/

-- Rename columns in users table
alter table users
  rename column firstName to first_name;

alter table users
  rename column lastName to last_name;

-- Rename columns in employees table
alter table employees
  rename column firstName to first_name;

alter table employees
  rename column lastName to last_name;

alter table employees
  rename column normalRate to normal_rate;

alter table employees
  rename column extraRate to extra_rate;

alter table employees
  rename column minHours to min_hours;

-- Rename columns in rate_change_logs table
alter table rate_change_logs
  rename column normalRate to normal_rate;

alter table rate_change_logs
  rename column extraRate to extra_rate;

-- Rename columns in attendance_records table
alter table attendance_records
  rename column normalHours to normal_hours;

alter table attendance_records
  rename column extraHours to extra_hours;

alter table attendance_records
  rename column originalData to original_data;