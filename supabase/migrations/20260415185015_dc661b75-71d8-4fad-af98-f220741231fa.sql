
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('funcionario', 'administrador', 'visitante');

-- Tabela de papéis de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função segura para verificar papéis
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas de user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

-- Tabela de cadastro de funcionários
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  cpf TEXT DEFAULT '',
  position TEXT DEFAULT '',
  department TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT DEFAULT '',
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view employees"
ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees"
ON public.employees FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
ON public.employees FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete employees"
ON public.employees FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atribuir papel padrão 'funcionario' para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();
