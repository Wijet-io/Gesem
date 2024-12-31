/*
  # Add settings data

  1. Changes
    - Insert default Jibble configuration with API credentials
*/

-- First, ensure the settings table exists and is empty
truncate table settings;

-- Insert Jibble configuration
insert into settings (key, value)
values (
  'jibble_config',
  jsonb_build_object(
    'apiKey', '70ee9d49-920c-47a8-94fb-3e82bc0edaf0',
    'apiSecret', '2dlOwCgFItcutiLbthzlAkMUP6q6pjuaRsWyCT6cBBvly7pL'
  )
);