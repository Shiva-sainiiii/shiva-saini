-- Agar tumne purana schema.sql pehle hi run kar diya hai, to sirf YE file Supabase SQL Editor me run karo.
-- (Dobara chalane se koi nuksaan nahi — ye safe hai.)

-- 1) Projects me tag (Web Game / AI / Website)
alter table projects add column if not exists category text;

-- 2) Settings table: chatbot ka on/off, naam, greeting, extra info yahan save hota hai
create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
drop policy if exists "public read" on settings;
drop policy if exists "admin write" on settings;
create policy "public read" on settings for select using (true);
create policy "admin write" on settings for all using (is_admin()) with check (is_admin());
