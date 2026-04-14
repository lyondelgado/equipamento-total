import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";

interface Movement {
  id: string;
  created_at: string;
  from_location: string | null;
  to_location: string | null;
  notes: string | null;
  equipment_brand: string;
  equipment_model: string;
  equipment_type: string;
  from_person_name: string | null;
  to_person_name: string | null;
}

const typeLabels: Record<string, string> = {
  notebook: "Notebook",
  monitor: "Monitor",
  router: "Roteador",
  camera: "Câmera",
  printer: "Impressora",
};

export const Route = createFileRoute("/movements")({
  component: MovementsPage,
});

function MovementsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("equipment_movements")
      .select("id, created_at, from_location, to_location, notes, equipment:equipment(brand, model, type), from_person:profiles!equipment_movements_from_person_fkey(full_name), to_person:profiles!equipment_movements_to_person_fkey(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMovements(
          (data || []).map((m: any) => ({
            id: m.id,
            created_at: m.created_at,
            from_location: m.from_location,
            to_location: m.to_location,
            notes: m.notes,
            equipment_brand: m.equipment?.brand || "",
            equipment_model: m.equipment?.model || "",
            equipment_type: m.equipment?.type || "",
            from_person_name: m.from_person?.full_name || null,
            to_person_name: m.to_person?.full_name || null,
          }))
        );
        setLoading(false);
      });
  }, [user]);

  if (authLoading || !user) return null;

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.equipment_brand.toLowerCase().includes(q) ||
      m.equipment_model.toLowerCase().includes(q) ||
      (m.from_person_name || "").toLowerCase().includes(q) ||
      (m.to_person_name || "").toLowerCase().includes(q) ||
      (m.from_location || "").toLowerCase().includes(q) ||
      (m.to_location || "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Movimentações</h1>
          <p className="text-muted-foreground">Histórico completo de transferências</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por equipamento, pessoa ou local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma movimentação encontrada.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((m) => (
                  <div key={m.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {m.equipment_brand} {m.equipment_model}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({typeLabels[m.equipment_type] || m.equipment_type})
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">De:</span>{" "}
                        {m.from_person_name || m.from_location || "—"}
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Para:</span>{" "}
                        {m.to_person_name || m.to_location || "—"}
                      </div>
                    </div>
                    {m.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
