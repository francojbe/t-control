-- Add column for Card/Link Fee Percentage to User Settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS card_fee_pct numeric DEFAULT 3.5;

-- Add column for Link Payment Amount to Jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS link_payment numeric DEFAULT 0;
