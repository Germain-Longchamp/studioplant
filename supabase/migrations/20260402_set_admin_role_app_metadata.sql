-- Set admin role in app_metadata for the admin account (studiohub@test.com)
-- app_metadata is only writable via service_role, never from the client
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'studiohub@test.com';
