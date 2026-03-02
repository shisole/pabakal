-- ─── Storage Buckets ───────────────────────────────────────────

-- Product images: public read, admin write
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and (select is_admin()));

create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and (select is_admin()));

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and (select is_admin()));

-- Payment proofs: private, customer write own, admin read all
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false);

create policy "Admins can view all payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and (select is_admin()));

create policy "Users can view own payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload payment proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars: public read, user write own
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
