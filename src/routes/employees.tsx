import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeForm } from "@/components/EmployeeForm";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const statusLabels: Record<string, string> = {
  active: "Em atividade",
  inactive: "Desligado",
  on_leave: "Afastado",
};

const statusIcons: Record<string, typeof UserCheck> = {
  active: UserCheck,
  inactive: UserX,
  on_leave: Clock,
};

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  inactive: "bg-destructive text-destructive-foreground",
  on_leave: "bg-warning text-warning-foreground",
};

function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar funcionários");
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user, fetchEmployees]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("employees").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Funcionário excluído");
      fetchEmployees();
    }
    setDeleteId(null);
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.cpf || "").toLowerCase().includes(q) ||
      (e.position || "").toLowerCase().includes(q) ||
      (e.department || "").toLowerCase().includes(q)
    );
  });

  if (authLoading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Cadastro e gestão de funcionários</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Lista de Funcionários</CardTitle>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF, cargo ou setor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? "Nenhum resultado encontrado" : "Nenhum funcionário cadastrado"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((emp) => {
                      const StatusIcon = statusIcons[emp.status] || UserCheck;
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="font-medium">{emp.full_name}</div>
                            {emp.cpf && <div className="text-xs text-muted-foreground">{emp.cpf}</div>}
                          </TableCell>
                          <TableCell className="text-sm">{emp.email}</TableCell>
                          <TableCell className="text-sm">{emp.position || "—"}</TableCell>
                          <TableCell className="text-sm">{emp.department || "—"}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[emp.status] || ""}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabels[emp.status] || emp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {emp.linked_user_id ? (
                              <Badge variant="outline" className="text-xs">Vinculado</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem conta</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditing(emp); setFormOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(emp.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchEmployees}
        employee={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro do funcionário será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
