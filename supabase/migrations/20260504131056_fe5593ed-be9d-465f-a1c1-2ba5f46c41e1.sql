ALTER TABLE public.sim_cards DROP COLUMN IF EXISTS assigned_employee_id;
ALTER TABLE public.sim_cards DROP COLUMN IF EXISTS renewal_date;
ALTER TABLE public.sim_cards ADD COLUMN renewal_day smallint CHECK (renewal_day BETWEEN 1 AND 31);