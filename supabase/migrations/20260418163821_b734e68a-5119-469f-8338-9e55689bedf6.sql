-- Create maintenance history table
CREATE TABLE public.equipment_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  problem_description text NOT NULL,
  resolution_notes text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  status text NOT NULL DEFAULT 'open',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance"
  ON public.equipment_maintenance FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert maintenance"
  ON public.equipment_maintenance FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance"
  ON public.equipment_maintenance FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_equipment_maintenance_equipment_id ON public.equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_movements_equipment_id ON public.equipment_movements(equipment_id);