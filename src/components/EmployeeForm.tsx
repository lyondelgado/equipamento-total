import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee: Employee | null;
}

export function EmployeeForm({ open, onClose, onSaved, employee }: EmployeeFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [role, setRole] = useState<string>("funcionario");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name);
      setEmail(employee.email);
      setPhone(employee.phone || "");
      setCpf(employee.cpf || "");
      setPosition(employee.position || "");
      setDepartment(employee.department || "");
      setBranch(employee.branch || "");
      setHireDate(employee.hire_date || "");
      setStatus(employee.status);
      setNotes(employee.notes || "");
      setCreateAccount(false);
      setPassword("");
      // Load role if linked
      if (employee.linked_user_id) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", employee.linked_user_id)
          .single()
          .then(({ data }) => {
            if (data) setRole(data.role);
          });
      } else {
        setRole("funcionario");
      }
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setCpf("");
      setPosition("");
      setDepartment("");
      setBranch("");
      setHireDate("");
      setStatus("active");
      setNotes("");
      setRole("funcionario");
      setPassword("");
      setCreateAccount(false);
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    setSaving(true);

    try {
      let linkedUserId = employee?.linked_user_id || null;

      // Create account if requested
      if (createAccount && password.length >= 6 && !employee?.linked_user_id) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) {
          toast.error("Erro ao criar conta: " + signUpError.message);
          setSaving(false);
          return;
        }
        linkedUserId = signUpData.user?.id || null;
      }

      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cpf: cpf.trim(),
        position: position.trim(),
        department: department.trim(),
        branch: branch.trim(),
        hire_date: hireDate || null,
        status,
        notes: notes.trim(),
        linked_user_id: linkedUserId,
      };

      if (employee) {
        const wasActive = employee.status === "active";
        const nowInactive = status === "inactive";
        const justTerminated = wasActive && nowInactive;

        const { error } = await supabase.from("employees").update(payload).eq("id", employee.id);
        if (error) throw error;

        // Update role if linked
        if (linkedUserId) {
          await supabase.from("user_roles").upsert(
            { user_id: linkedUserId, role: role as any },
            { onConflict: "user_id,role" }
          );
        }

        // On termination: release equipment + close custody
        if (justTerminated) {
          const profileId = linkedUserId
            ? (await supabase.from("profiles").select("id").eq("user_id", linkedUserId).maybeSingle()).data?.id
            : null;

          // Find equipment assigned via profile link
          const assignedIds: string[] = [];
          if (profileId) {
            const { data: eqs } = await supabase
              .from("equipment")
              .select("id, location_branch, location_department")
              .eq("assigned_to", profileId);
            if (eqs) {
              for (const eq of eqs) {
                assignedIds.push(eq.id);
                await supabase.from("equipment_movements").insert({
                  equipment_id: eq.id,
                  from_person: profileId,
                  to_person: null,
                  from_location: `${eq.location_branch} / ${eq.location_department}`.trim(),
                  to_location: "Estoque",
                  notes: `Funcionário ${fullName.trim()} desligado em ${new Date().toLocaleDateString("pt-BR")}`,
                });
              }
            }
            if (assignedIds.length > 0) {
              await supabase
                .from("equipment")
                .update({ status: "inactive", assigned_to: null })
                .in("id", assignedIds);
            }
          }

          toast.success(
            assignedIds.length > 0
              ? `Funcionário desligado. ${assignedIds.length} equipamento(s) marcados como Inativo.`
              : "Funcionário desligado."
          );
        } else {
          toast.success("Funcionário atualizado!");
        }
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;

        // Set role if linked
        if (linkedUserId) {
          await supabase.from("user_roles").upsert(
            { user_id: linkedUserId, role: role as any },
            { onConflict: "user_id,role" }
          );
        }

        toast.success("Funcionário cadastrado!");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome completo *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Analista de TI" />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ex: Tecnologia" />
            </div>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Ex: Matriz" />
            </div>
            <div className="space-y-2">
              <Label>Data de Admissão</Label>
              <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Em atividade</SelectItem>
                  <SelectItem value="inactive">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perfil de Acesso</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="visitante">Visitante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!employee?.linked_user_id && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-account"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="create-account" className="cursor-pointer">
                  Criar conta de acesso ao sistema
                </Label>
              </div>
              {createAccount && (
                <div className="space-y-2">
                  <Label>Senha (mín. 6 caracteres)</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    minLength={6}
                    required={createAccount}
                  />
                </div>
              )}
            </div>
          )}

          {employee?.linked_user_id && (
            <div className="space-y-3 rounded-lg border p-3">
              <Label>Redefinir senha do usuário</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha (deixe em branco para manter)"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={password.length < 6}
                  onClick={async () => {
                    if (password.length < 6) return;
                    const { error } = await supabase.auth.admin.updateUserById(
                      employee.linked_user_id!,
                      { password }
                    );
                    if (error) {
                      toast.error("Erro ao redefinir senha. Use a opção 'Esqueci a senha' do login.");
                    } else {
                      toast.success("Senha redefinida!");
                      setPassword("");
                    }
                  }}
                >
                  Redefinir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A redefinição de senha também pode ser feita pela tela de login.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : employee ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
