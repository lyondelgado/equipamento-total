ALTER TABLE public.equipment 
ADD COLUMN assigned_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_assigned_employee ON public.equipment(assigned_employee_id);

ALTER TABLE public.equipment_movements
ADD COLUMN from_employee uuid REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN to_employee uuid REFERENCES public.employees(id) ON DELETE SET NULL;