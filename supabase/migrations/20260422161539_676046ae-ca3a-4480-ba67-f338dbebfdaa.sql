-- Tabela de chips de operadoras
CREATE TABLE public.sim_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chip_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1) UNIQUE NOT NULL,
  phone_number TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  carrier TEXT NOT NULL DEFAULT '',
  plan_limit TEXT NOT NULL DEFAULT '',
  renewal_date DATE,
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sim_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sim_cards"
ON public.sim_cards FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sim_cards"
ON public.sim_cards FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sim_cards"
ON public.sim_cards FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete sim_cards"
ON public.sim_cards FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_sim_cards_updated_at
BEFORE UPDATE ON public.sim_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();