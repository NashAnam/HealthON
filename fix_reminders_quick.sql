-- Quick fix for reminders table
ALTER TABLE reminders ALTER COLUMN reminder_type DROP NOT NULL;
ALTER TABLE reminders ALTER COLUMN reminder_type SET DEFAULT 'medication';
