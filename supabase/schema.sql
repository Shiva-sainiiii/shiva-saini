-- Supabase SQL Editor me poora paste karke Run karo.
-- Admin = sirf ye email (apna email yahan rakho).
create or replace function is_admin() returns boolean language sql stable as
$$ select coalesce(auth.jwt() ->> 'email', '') = 'shivasaini.5666@gmail.com' $$;

create table projects (id uuid primary key default gen_random_uuid(), title text not null, description text, tech text, category text, image text, live_url text, code_url text, position int default 0, created_at timestamptz default now());
create table skills (id uuid primary key default gen_random_uuid(), name text not null, position int default 0, created_at timestamptz default now());
create table certificates (id uuid primary key default gen_random_uuid(), title text not null, issuer text, image text, link text, position int default 0, created_at timestamptz default now());
create table links (id uuid primary key default gen_random_uuid(), label text not null, url text not null, position int default 0, created_at timestamptz default now());
create table settings (key text primary key, value text, updated_at timestamptz default now());
create table messages (id uuid primary key default gen_random_uuid(), name text, email text, message text not null, created_at timestamptz default now());

-- Content tables: sab padh sakte hain, likh sirf admin
do $$ declare t text; begin
  foreach t in array array['projects','skills','certificates','links','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "admin write" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Contact messages: sab bhej sakte hain, padh/delete sirf admin
alter table messages enable row level security;
create policy "anyone sends" on messages for insert with check (char_length(message) between 1 and 2000);
create policy "admin reads" on messages for select using (is_admin());
create policy "admin deletes" on messages for delete using (is_admin());

-- Image storage (public bucket, upload sirf admin)
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict do nothing;
create policy "public files" on storage.objects for select using (bucket_id = 'portfolio');
create policy "admin upload" on storage.objects for insert with check (bucket_id = 'portfolio' and is_admin());
create policy "admin delete files" on storage.objects for delete using (bucket_id = 'portfolio' and is_admin());
