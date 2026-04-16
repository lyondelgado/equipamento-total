-- Add new columns to equipment table
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS invoice_number text DEFAULT NULL;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS purchase_date date DEFAULT NULL;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS processor text DEFAULT NULL;

-- Add 'discarded' to equipment_status enum
ALTER TYPE public.equipment_status ADD VALUE IF NOT EXISTS 'discarded';
