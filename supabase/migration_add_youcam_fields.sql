-- Migration: extend scans table with YouCam analysis fields.
-- Run this in the Supabase SQL Editor if you already created the table
-- with the original schema (without these columns).
alter table public.scans
  add column if not exists masks jsonb default '{}'::jsonb,
  add column if not exists overall_score int,
  add column if not exists skin_age int,
  add column if not exists skin_types jsonb default '[]'::jsonb,
  add column if not exists mock boolean default false,
  add column if not exists resize_image text;
