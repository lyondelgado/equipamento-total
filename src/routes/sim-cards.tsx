import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/sim-cards")({
  component: SimCardsPage,
});

type SimCardRow = {
  id: string;
  chip_id: number;
  phone_number: string;
  serial_number: string;
  carrier: string;
  plan_limit: string;
  renewal_day: number | null;
  notes: string | null;
  status: string;
  in_use?: boolean;
};

const CARRIERS = ["Vivo", "Claro", "TIM", "Oi", "Algar", "Sercomtel", "Nextel", "Outra"];

function formatPhone(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function SimCardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [chips, setChips] = useState<SimCardRow[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SimCardRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [planLimit, setPlanLimit] = useState("");
  const [renewalDay, setRenewalDay] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("active");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) void fetchChips();
  }, [user]);

  async function fetchChips() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [{ data, error }, { data: usedData }] = await Promise.all([
      sb.from("sim_cards").select("*").order("chip_id", { ascending: true }),
      sb.from("equipment").select("sim_card_id").not("sim_card_id", "is", null),
    ]);
    if (error) {
      toast.error("Erro ao carregar chips");
      return;
    }
    const usedIds = new Set<string>((usedData || []).map((r: any) => r.sim_card_id));
    setChips(((data as SimCardRow[]) || []).map((c) => ({ ...c, in_use: usedIds.has(c.id) })));
  }

  function resetForm() {
    setEditing(null);
    setPhoneNumber("");
    setSerialNumber("");
    setCarrier("");
    setPlanLimit("");
    setRenewalDay("");
    setNotes("");
    setStatus("active");
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  function openEdit(chip: SimCardRow) {
    setEditing(chip);
    setPhoneNumber(formatPhone(chip.phone_number));
    setSerialNumber(chip.serial_number);
    setCarrier(chip.carrier);
    setPlanLimit(chip.plan_limit);
    setRenewalDay(chip.renewal_day ? String(chip.renewal_day) : "");
    setNotes(chip.notes || "");
    setStatus(chip.status || "active");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error("Informe o número da linha");
      return;
    }
    let renewal: number | null = null;
    if (renewalDay.trim()) {
      const n = parseInt(renewalDay, 10);
      if (isNaN(n) || n < 1 || n > 31) {
        toast.error("Dia de renovação deve ser entre 1 e 31");
        return;
      }
      renewal = n;
    }
    setSaving(true);
    const payload = {
      phone_number: phoneNumber.replace(/\D/g, ""),
      serial_number: serialNumber.trim(),
      carrier: carrier.trim(),
      plan_limit: planLimit.trim(),
      renewal_day: renewal,
      notes: notes.trim(),
      status,
      created_by: user?.id ?? null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = editing
      ? await sb.from("sim_cards").update(payload).eq("id", editing.id)
      : await sb.from("sim_cards").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Chip atualizado" : "Chip cadastrado");
    setOpen(false);
    resetForm();
    void fetchChips();
  }

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("sim_cards").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Chip removido");
    void fetchChips();
  }

  const filtered = chips.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(c.chip_id).includes(q) ||
      formatPhone(c.phone_number).toLowerCase().includes(q) ||
      c.phone_number.toLowerCase().includes(q) ||
      c.serial_number.toLowerCase().includes(q) ||
      c.carrier.toLowerCase().includes(q)
    );
  });

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chips de Operadoras</h1>
            <p className="text-muted-foreground">
              Cadastro e gestão de chips/linhas corporativas
            </p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" /> Novo Chip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Chip" : "Novo Chip"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? `ID #${editing.chip_id}`
                    : "O ID será gerado automaticamente."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número da linha *</Label>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial">Nº de série do chip</Label>
                    <Input
                      id="serial"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="ICCID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Operadora</Label>
                    <Select value={carrier} onValueChange={setCarrier}>
                      <SelectTrigger id="carrier">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARRIERS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Limite do plano</Label>
                    <Input
                      id="plan"
                      value={planLimit}
                      onChange={(e) => setPlanLimit(e.target.value)}
                      placeholder="Ex: 20GB"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal">Dia de renovação do plano</Label>
                  <Input
                    id="renewal"
                    type="number"
                    min={1}
                    max={31}
                    value={renewalDay}
                    onChange={(e) => setRenewalDay(e.target.value)}
                    placeholder="Ex: 15 (todo dia 15 do mês)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Chips cadastrados ({filtered.length})
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, linha, série ou operadora..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Linha</TableHead>
                    <TableHead>Nº de série</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Renovação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum chip cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">#{c.chip_id}</TableCell>
                        <TableCell>{formatPhone(c.phone_number) || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.serial_number || "—"}
                        </TableCell>
                        <TableCell>{c.carrier || "—"}</TableCell>
                        <TableCell>{c.plan_limit || "—"}</TableCell>
                        <TableCell>
                          {c.renewal_day ? `Dia ${c.renewal_day}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover chip #{c.chip_id}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(c.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
