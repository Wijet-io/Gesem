/*
  # Rename columns to match application naming

  1. Changes
    - Rename snake_case columns to camelCase
    - Update all related tables and policies
*/

-- Rename columns in users table
alter table users
  rename column first_name to firstName;

alter table users
  rename column last_name to lastName;

-- Rename columns in employees table
alter table employees
  rename column first_name to firstName;

alter table employees
  rename column last_name to lastName;

alter table employees
  rename column normal_rate to normalRate;

alter table employees
  rename column extra_rate to extraRate;

alter table employees
  rename column min_hours to minHours;

-- Rename columns in rate_change_logs table
alter table rate_change_logs
  rename column normal_rate to normalRate;

alter table rate_change_logs
  rename column extra_rate to extraRate;

-- Rename columns in attendance_records table
alter table attendance_records
  rename column normal_hours to normalHours;

alter table attendance_records
  rename column extra_hours to extraHours;

alter table attendance_records
  rename column original_data to originalData;