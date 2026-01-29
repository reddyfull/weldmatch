-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create daily cron job to check for expiring trials and send reminder emails
-- Runs at 9:00 AM UTC every day
SELECT cron.schedule(
  'daily-trial-expiration-check',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://guichrsakxtfglxnvvrg.supabase.co/functions/v1/send-trial-expiration-reminder',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aWNocnNha3h0ZmdseG52dnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTkxNjIsImV4cCI6MjA4NDY3NTE2Mn0.UieLQ6by10VPe1NXnkSBbeJMz415VwlSHxiHAet6t3g"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);