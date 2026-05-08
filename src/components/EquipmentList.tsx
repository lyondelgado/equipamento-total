import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EquipmentDetail } from "@/components/EquipmentDetail";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
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
import type { Tables, Enums } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment"> & {
  profiles?: { full_name: string } | null;
  employees?: { full_name: string } | null;
  sim_card?: { phone_number: string; serial_number: string } | null;
};
type EquipmentType = Enums<"equipment_type">;

const statusLabels: Record<string, string> = {
  active: "Ativo",
  maintenance: "Manutenção",
  inactive: "Inativo",
  discarded: "Descartado",
};

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  maintenance: "bg-warning text-warning-foreground",
  inactive: "bg-destructive text-destructive-foreground",
  discarded: "bg-muted text-muted-foreground",
};

interface EquipmentListProps {
  type: EquipmentType;
  title: string;
}

export function EquipmentList({ type, title }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [viewing, setViewing] = useState<Equipment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment")
      .select("*, profiles(full_name), employees:assigned_employee_id(full_name)")
      .eq("type", type)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar equipamentos");
      setEquipment([]);
      setLoading(false);
      return;
    }

    let rows = (data || []) as Equipment[];

    // Para roteadores, buscamos os chips vinculados para exibir Linha e permitir filtro
    if (type === "router") {
      const ids = Array.from(
        new Set(rows.map((r) => (r as any).sim_card_id).filter(Boolean))
      ) as string[];
      if (ids.length > 0) {
        const { data: sims } = await supabase
          .from("sim_cards")
          .select("id, phone_number, serial_number")
          .in("id", ids);
        const map = new Map((sims || []).map((s) => [s.id, s]));
        rows = rows.map((r) => ({
          ...r,
          sim_card: map.get((r as any).sim_card_id) || null,
        }));
      }
    }

    setEquipment(rows);
    setLoading(false);
  }, [type]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("equipment").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Equipamento excluído");
      fetchEquipment();
    }
    setDeleteId(null);
  };

  const isMonitor = type === "monitor";
  const isRouter = type === "router";

  const filtered = equipment.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const responsible = (e.employees?.full_name || e.profiles?.full_name || "").toLowerCase();
    const location = [e.location_branch, e.location_department, e.location_room]
      .filter(Boolean).join(" ").toLowerCase();
    if (isMonitor) {
      return (
        (e.serial_number || "").toLowerCase().includes(q) ||
        (e.service_tag || "").toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        responsible.includes(q)
      );
    }
    if (isRouter) {
      return (
        e.brand.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        (e.technology || "").toLowerCase().includes(q) ||
        (e.sim_card?.phone_number || "").toLowerCase().includes(q) ||
        (e.sim_card?.serial_number || "").toLowerCase().includes(q) ||
        responsible.includes(q) ||
        location.includes(q)
      );
    }
    return (
      e.brand.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q) ||
      (e.serial_number || "").toLowerCase().includes(q) ||
      (e.service_tag || "").toLowerCase().includes(q) ||
      (e.asset_tag || "").toLowerCase().includes(q) ||
      responsible.includes(q) ||
      location.includes(q)
    );
  });

  const counts = {
    active: equipment.filter((e) => e.status === "active").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
    inactive: equipment.filter((e) => e.status === "inactive").length,
    discarded: equipment.filter((e) => e.status === "discarded").length,
    total: equipment.length,
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            <span className="px-2 py-1 rounded-md bg-success/10 text-success font-medium">Ativos: {counts.active}</span>
            <span className="px-2 py-1 rounded-md bg-warning/10 text-warning font-medium">Manutenção: {counts.maintenance}</span>
            <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-medium">Inativos: {counts.inactive}</span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">Descartados: {counts.discarded}</span>
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Total: {counts.total}</span>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isMonitor
                  ? "Buscar por série, service tag, modelo ou responsável..."
                  : isRouter
                    ? "Buscar por marca, modelo, tecnologia, linha, série do chip, responsável ou localização..."
                    : "Buscar por marca, modelo, série, patrimônio, responsável ou localização..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="discarded">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(search || statusFilter !== "all") && !loading && (
            <div className="text-xs text-muted-foreground mb-3">
              Resultado: {filtered.length} de {equipment.length}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "Nenhum resultado encontrado" : "Nenhum equipamento cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca / Modelo</TableHead>
                    {isRouter && <TableHead>Tecnologia</TableHead>}
                    {isRouter ? (
                      <TableHead>Linha</TableHead>
                    ) : !isMonitor ? (
                      <TableHead>Patrimônio</TableHead>
                    ) : null}
                    <TableHead>Status</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.brand}</div>
                        <div className="text-sm text-muted-foreground">{item.model}</div>
                      </TableCell>
                      {isRouter && <TableCell>{item.technology || "—"}</TableCell>}
                      {isRouter ? (
                        <TableCell>{item.sim_card?.phone_number || "—"}</TableCell>
                      ) : !isMonitor ? (
                        <TableCell>{item.asset_tag || "—"}</TableCell>
                      ) : null}
                      <TableCell>
                        <Badge className={statusColors[item.status] || ""}>
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {[item.location_branch, item.location_department, item.location_room].filter(Boolean).join(" / ") || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{item.employees?.full_name || item.profiles?.full_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewing(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EquipmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchEquipment}
        equipmentType={type}
        equipment={editing}
      />

      {viewing && (
        <EquipmentDetail
          open={!!viewing}
          onClose={() => setViewing(null)}
          equipment={viewing}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O equipamento e todo o histórico de movimentações serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
