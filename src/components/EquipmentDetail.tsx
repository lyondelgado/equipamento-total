import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;

interface Movement {
  id: string;
  created_at: string;
  from_location: string | null;
  to_location: string | null;
  from_person_name: string | null;
  to_person_name: string | null;
  notes: string | null;
}

interface Maintenance {
  id: string;
  problem_description: string;
  resolution_notes: string | null;
  sent_at: string;
  resolved_at: string | null;
  status: string;
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  maintenance: "Manutenção",
  inactive: "Inativo",
  discarded: "Descartado",
};

export function EquipmentDetail({ open, onClose, equipment }: { open: boolean; onClose: () => void; equipment: Equipment }) {
  const [simCardInfo, setSimCardInfo] = useState<{ phone_number: string; serial_number: string; carrier: string } | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchData = useCallback(async () => {
    if (!equipment) return;
    const [{ data: mov }, { data: maint }] = await Promise.all([
      supabase
        .from("equipment_movements")
        .select("id, created_at, from_location, to_location, notes, from_person:profiles!equipment_movements_from_person_fkey(full_name), to_person:profiles!equipment_movements_to_person_fkey(full_name), from_emp:employees!equipment_movements_from_employee_fkey(full_name), to_emp:employees!equipment_movements_to_employee_fkey(full_name)")
        .eq("equipment_id", equipment.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("equipment_maintenance")
        .select("id, problem_description, resolution_notes, sent_at, resolved_at, status")
        .eq("equipment_id", equipment.id)
        .order("sent_at", { ascending: false }),
    ]);
    setMovements(
      (mov || []).map((m: any) => ({
        id: m.id,
        created_at: m.created_at,
        from_location: m.from_location,
        to_location: m.to_location,
        from_person_name: m.from_emp?.full_name || m.from_person?.full_name || null,
        to_person_name: m.to_emp?.full_name || m.to_person?.full_name || null,
        notes: m.notes,
      }))
    );
    setMaintenances(maint || []);
  }, [equipment]);

  useEffect(() => {
    if (open && equipment) {
      fetchData();
      const simId = (equipment as any).sim_card_id;
      if (equipment.type === "router" && simId) {
        supabase
          .from("sim_cards")
          .select("phone_number, serial_number, carrier")
          .eq("id", simId)
          .maybeSingle()
          .then(({ data }) => setSimCardInfo(data || null));
      } else {
        setSimCardInfo(null);
      }
    }
  }, [open, equipment, fetchData]);

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from("equipment_maintenance")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes.trim() || null,
      })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao resolver: " + error.message);
    } else {
      toast.success("Manutenção marcada como resolvida");
      setResolvingId(null);
      setResolutionNotes("");
      fetchData();
    }
  };

  // Histórico de responsáveis: quando assumiu (to_person) e quando entregou (from_person)
  // movements vem ordenado desc; ordenamos asc para reconstruir a linha do tempo
  const ownersHistory = (() => {
    const asc = [...movements].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const map = new Map<string, { name: string; assumedAt: string; releasedAt: string | null }>();
    for (const m of asc) {
      if (m.to_person_name) {
        const key = m.to_person_name;
        if (!map.has(key)) {
          map.set(key, { name: key, assumedAt: m.created_at, releasedAt: null });
        } else {
          // reassumiu: atualiza assumedAt e limpa releasedAt
          map.set(key, { name: key, assumedAt: m.created_at, releasedAt: null });
        }
      }
      if (m.from_person_name) {
        const key = m.from_person_name;
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, releasedAt: m.created_at });
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.assumedAt).getTime() - new Date(a.assumedAt).getTime()
    );
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment.brand} {equipment.model}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Tipo:</span> {equipment.type}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{statusLabels[equipment.status]}</Badge></div>
            <div><span className="text-muted-foreground">Nº Série:</span> {equipment.serial_number || "—"}</div>
            {(equipment.type === "notebook" || equipment.type === "monitor") && (
              <div><span className="text-muted-foreground">Service Tag:</span> {(equipment as any).service_tag || "—"}</div>
            )}
            {equipment.type !== "router" && equipment.type !== "monitor" && equipment.type !== "camera" && equipment.type !== "printer" && (
              <div><span className="text-muted-foreground">Patrimônio:</span> {equipment.asset_tag || "—"}</div>
            )}
            {equipment.type === "notebook" && (
              <div><span className="text-muted-foreground">Processador:</span> {equipment.processor || "—"}</div>
            )}
            {equipment.type === "camera" && (
              <div><span className="text-muted-foreground">Tipo de câmera:</span> {(equipment as any).camera_type || "—"}</div>
            )}
            {equipment.type === "router" && (
              <>
                <div><span className="text-muted-foreground">Tecnologia:</span> {(equipment as any).technology || "—"}</div>
                <div><span className="text-muted-foreground">Linha:</span> {simCardInfo?.phone_number || "—"}</div>
                <div><span className="text-muted-foreground">Chip (Série):</span> {simCardInfo?.serial_number || "—"}</div>
                <div><span className="text-muted-foreground">Operadora:</span> {simCardInfo?.carrier || "—"}</div>
              </>
            )}
            {equipment.type !== "router" && equipment.type !== "camera" && (
              <>
                <div><span className="text-muted-foreground">Nota Fiscal:</span> {equipment.invoice_number || "—"}</div>
                <div><span className="text-muted-foreground">Data Compra:</span> {equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString("pt-BR") : "—"}</div>
              </>
            )}
            <div className="col-span-2"><span className="text-muted-foreground">Localização:</span> {[equipment.location_branch, equipment.location_department, equipment.location_room].filter(Boolean).join(" / ") || "—"}</div>
          </div>
          {equipment.notes && (
            <div><span className="text-muted-foreground">Obs:</span> {equipment.notes}</div>
          )}
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="movements">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="owners">Responsáveis ({ownersHistory.length})</TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-3 w-3 mr-1" /> Manutenção ({maintenances.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="mt-4">
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-3">
                {movements.map((m) => (
                  <div key={m.id} className="border rounded-lg p-3 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{m.from_person_name || m.from_location || "—"}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span>{m.to_person_name || m.to_location || "—"}</span>
                    </div>
                    {m.notes && <div className="text-xs text-muted-foreground mt-1">{m.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="owners" className="mt-4">
            {ownersHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum responsável no histórico.</p>
            ) : (
              <ul className="space-y-2">
                {ownersHistory.map((o) => (
                  <li key={o.name} className="border rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{o.name}</span>
                      {!o.releasedAt && <Badge variant="outline">Atual</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assumiu em {new Date(o.assumedAt).toLocaleString("pt-BR")}
                      {o.releasedAt && (
                        <> · Entregou em {new Date(o.releasedAt).toLocaleString("pt-BR")}</>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            {maintenances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
            ) : (
              <div className="space-y-3">
                {maintenances.map((m) => (
                  <div key={m.id} className="border rounded-lg p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={m.status === "resolved" ? "outline" : "default"}>
                        {m.status === "resolved" ? "Resolvida" : "Em aberto"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.sent_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Problema:</span> {m.problem_description}
                    </div>
                    {m.resolution_notes && (
                      <div>
                        <span className="text-muted-foreground">Resolução:</span> {m.resolution_notes}
                      </div>
                    )}
                    {m.resolved_at && (
                      <div className="text-xs text-muted-foreground">
                        Resolvida em {new Date(m.resolved_at).toLocaleString("pt-BR")}
                      </div>
                    )}
                    {m.status !== "resolved" && (
                      <div className="pt-2">
                        {resolvingId === m.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Notas da resolução (opcional)"
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleResolve(m.id)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setResolvingId(null); setResolutionNotes(""); }}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setResolvingId(m.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar como resolvida
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
