-- Migration: extend scans table with routine, preferences, and qwen_plan.
-- Run this in the Supabase SQL Editor if you already created the table
-- with the original schema (without these columns).
alter table public.scans
  add column if not exists routine text,
  add column if not exists preferences jsonb,
  add column if not exists qwen_plan text;
