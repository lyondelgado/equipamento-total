import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EquipmentList } from "@/components/EquipmentList";

export const Route = createFileRoute("/equipment/routers")({
  component: RoutersPage,
});

function RoutersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);
  if (loading || !user) return null;
  return <DashboardLayout><EquipmentList type="router" title="Roteadores" /></DashboardLayout>;
}
