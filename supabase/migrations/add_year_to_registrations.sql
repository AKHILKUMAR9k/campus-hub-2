-- Add year and phone columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;
