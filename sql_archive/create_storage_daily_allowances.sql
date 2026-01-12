-- Create the storage bucket for Daily Allowances
insert into storage.buckets (id, name, public)
values ('daily-allowances', 'daily-allowances', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (good practice, though usually enabled by default)


-- Policy: Allow public read access to the bucket
create policy "Public Access Daily Allowances"
  on storage.objects for select
  using ( bucket_id = 'daily-allowances' );

-- Policy: Allow authenticated users to upload files
create policy "Authenticated Upload Daily Allowances"
  on storage.objects for insert
  with check ( bucket_id = 'daily-allowances' AND auth.role() = 'authenticated' );

-- Policy: Allow authenticated users to update their own files (optional depending on need)
create policy "Authenticated Update Daily Allowances"
  on storage.objects for update
  using ( bucket_id = 'daily-allowances' AND auth.role() = 'authenticated' );

-- Policy: Allow authenticated users to delete files (optional)
create policy "Authenticated Delete Daily Allowances"
  on storage.objects for delete
  using ( bucket_id = 'daily-allowances' AND auth.role() = 'authenticated' );
