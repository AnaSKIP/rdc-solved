-- Add column to track positive interactions from Z-API webhook
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS has_positive_interaction boolean DEFAULT false;
