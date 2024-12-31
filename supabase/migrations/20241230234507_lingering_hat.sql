/*
  # Add default settings

  1. Changes
    - Insert default Jibble configuration
    - Add comment explaining the purpose
*/

comment on table settings is 'Stores application-wide settings and configurations';

-- Insert default Jibble configuration
insert into settings (key, value)
values (
  'jibble_config',
  '{
    "apiKey": "",
    "apiSecret": ""
  }'::jsonb
) on conflict (key) do nothing;