-- Migration: add simulation column to scans table.
-- Run this in the Supabase SQL Editor if you already created the table
-- with the original schema (without this column).
alter table public.scans
  add column if not exists simulation jsonb default '{}'::jsonb;
