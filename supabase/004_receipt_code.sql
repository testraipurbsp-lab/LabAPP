-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor, before the Payments module goes live.
-- Same idea as 002/003: adds a friendly, DB-generated receipt number
-- (e.g. RC0001) for display, while the real primary key stays a UUID.
-- ============================================================================

create sequence if not exists receipt_code_seq;

alter table payments add column if not exists receipt_code text;

alter table payments
  alter column receipt_code set default ('RC' || lpad(nextval('receipt_code_seq')::text, 4, '0'));

update payments set receipt_code = 'RC' || lpad(nextval('receipt_code_seq')::text, 4, '0')
  where receipt_code is null;

alter table payments add constraint payments_receipt_code_key unique (receipt_code);