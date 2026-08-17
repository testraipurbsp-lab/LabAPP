-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds a Referral Fee field — a commission amount for the referring doctor,
-- separate from the patient's Concession/discount. Matches the legacy
-- software's booking screen, which tracks this as its own field rather
-- than folding it into the patient's bill.
-- ============================================================================

alter table patients add column if not exists referral_fee numeric default 0;