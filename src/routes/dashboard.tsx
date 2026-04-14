import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Monitor, Wifi, Camera, Printer, ArrowLeftRight } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

type EquipmentType = Enums<"equipment_type">;

const typeConfig: { type: EquipmentType; label: string; icon: typeof Laptop; color: string }[] = [
  { type: "notebook", label: "Notebooks", icon: Laptop, color: "text-chart-1" },
  { type: "monitor", label: "Monitores", icon: Monitor, color: "text-chart-2" },
  { type: "router", label: "Roteadores", icon: Wifi, color: "text-chart-3" },
  { type: "camera", label: "Câmeras", icon: Camera, color: "text-chart-4" },
  { type: "printer", label: "Impressoras", icon: Printer, color: "text-chart-5" },
];

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get counts per type
      const { data: equipment } = await supabase.from("equipment").select("type");
      const c: Record<string, number> = {};
      (equipment || []).forEach((e) => { c[e.type] = (c[e.type] || 0) + 1; });
      setCounts(c);

      // Get recent movements
      const { data: movements } = await supabase
        .from("equipment_movements")
        .select("id, created_at, notes, to_location, equipment:equipment(brand, model, type), to_person:profiles!equipment_movements_to_person_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMovements(movements || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos equipamentos</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {typeConfig.map(({ type, label, icon: Icon, color }) => (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate({ to: `/equipment/${type === "notebook" ? "notebooks" : type === "monitor" ? "monitors" : type === "router" ? "routers" : type === "camera" ? "cameras" : "printers"}` })}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold">{counts[type] || 0}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Últimas Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : recentMovements.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-3">
                {recentMovements.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {m.equipment?.brand} {m.equipment?.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        → {m.to_person?.full_name || m.to_location || "—"}
                        {m.notes && ` • ${m.notes}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </span>
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
