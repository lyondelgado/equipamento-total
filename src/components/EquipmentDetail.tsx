import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
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

const statusLabels: Record<string, string> = {
  active: "Ativo",
  maintenance: "Manutenção",
  inactive: "Desativado",
  discarded: "Descartado",
};

export function EquipmentDetail({ open, onClose, equipment }: { open: boolean; onClose: () => void; equipment: Equipment }) {
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    if (open && equipment) {
      supabase
        .from("equipment_movements")
        .select("id, created_at, from_location, to_location, notes, from_person:profiles!equipment_movements_from_person_fkey(full_name), to_person:profiles!equipment_movements_to_person_fkey(full_name)")
        .eq("equipment_id", equipment.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setMovements(
            (data || []).map((m: any) => ({
              id: m.id,
              created_at: m.created_at,
              from_location: m.from_location,
              to_location: m.to_location,
              from_person_name: m.from_person?.full_name || null,
              to_person_name: m.to_person?.full_name || null,
              notes: m.notes,
            }))
          );
        });
    }
  }, [open, equipment]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment.brand} {equipment.model}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Nº Série:</span> {equipment.serial_number || "—"}</div>
            <div><span className="text-muted-foreground">Patrimônio:</span> {equipment.asset_tag || "—"}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{statusLabels[equipment.status]}</Badge></div>
            <div><span className="text-muted-foreground">Localização:</span> {[equipment.location_branch, equipment.location_department, equipment.location_room].filter(Boolean).join(" / ") || "—"}</div>
          </div>
          {equipment.notes && (
            <div><span className="text-muted-foreground">Obs:</span> {equipment.notes}</div>
          )}
        </div>

        <Separator className="my-4" />
        <h3 className="font-semibold mb-3">Histórico de Movimentações</h3>
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
      </DialogContent>
    </Dialog>
  );
}
