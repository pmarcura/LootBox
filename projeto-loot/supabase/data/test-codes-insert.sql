-- Códigos de teste para resgate (1 vessel + 1 strain por código).
-- Execute no Supabase: SQL Editor > New query > colar e Run.

insert into redemption_codes (code_hash, batch_id, is_active)
values
  ('d3a7c518642a3a80583620bc8ab64dbb0f214b3611c458cfbb7c03d28d2cd618', 'test-codes', true),
  ('1135f258afb04db8b9489d1a6bb82f97e361a8fbceb7a08e9fb199e1e81832fd', 'test-codes', true),
  ('86f5604077b1e8ec5f4892220737d7c6e281ed5cd483bbd9ee6716fb4b135f61', 'test-codes', true),
  ('cec2ceedb58bb8a2997de0462a082126dcefb2c4b7a2fff417b12eabc7d6d29d', 'test-codes', true),
  ('6aaec26b918af2164f1335de8169529d1bd0598533193b386a815ed7380e75f7', 'test-codes', true),
  ('a891e8f7a70a0d6a56afc8fe6d289f715f7f27bc6d192a2366fa388b6a2e6599', 'test-codes', true),
  ('375f7665b02bffa85a495760c12f07e4b299d93cfca62f4dc165e161f1fcf7bb', 'test-codes', true),
  ('d631b127e55a7882a8bb893a9ee06d787c0384b140f7149ca43bf2762b7a0d0c', 'test-codes', true),
  ('4aaae40e677a11714395276edaf1bced0e12ba0e33f66aca6620feceda6de4d2', 'test-codes', true),
  ('0c2a8c96e090af1ee90359b5274c60701d894a71191873802f50f68646475859', 'test-codes', true)
on conflict (code_hash) do nothing;
