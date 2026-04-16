import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;
type EquipmentType = Enums<"equipment_type">;
type EquipmentStatus = Enums<"equipment_status">;

interface Profile {
  id: string;
  full_name: string;
}

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  equipmentType: EquipmentType;
  equipment?: Equipment | null;
}

const statusLabels: Record<EquipmentStatus, string> = {
  active: "Ativo",
  maintenance: "Manutenção",
  inactive: "Desativado",
  discarded: "Descartado",
};

export function EquipmentForm({ open, onClose, onSaved, equipmentType, equipment }: EquipmentFormProps) {
  const { user } = useAuth();
  const isEdit = !!equipment;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("active");
  const [locationBranch, setLocationBranch] = useState("");
  const [locationDepartment, setLocationDepartment] = useState("");
  const [locationRoom, setLocationRoom] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [processor, setProcessor] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("profiles").select("id, full_name").then(({ data }) => {
        if (data) setProfiles(data);
      });
      if (equipment) {
        setBrand(equipment.brand);
        setModel(equipment.model);
        setSerialNumber(equipment.serial_number || "");
        setAssetTag(equipment.asset_tag || "");
        setStatus(equipment.status);
        setLocationBranch(equipment.location_branch);
        setLocationDepartment(equipment.location_department);
        setLocationRoom(equipment.location_room);
        setAssignedTo(equipment.assigned_to || "");
        setNotes(equipment.notes || "");
        setInvoiceNumber(equipment.invoice_number || "");
        setPurchaseDate(equipment.purchase_date || "");
        setProcessor(equipment.processor || "");
      } else {
        setBrand(""); setModel(""); setSerialNumber(""); setAssetTag("");
        setStatus("active"); setLocationBranch(""); setLocationDepartment("");
        setLocationRoom(""); setAssignedTo(""); setNotes("");
        setInvoiceNumber(""); setPurchaseDate(""); setProcessor("");
      }
    }
  }, [open, equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      toast.error("Marca e modelo são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      type: equipmentType,
      brand: brand.trim(),
      model: model.trim(),
      serial_number: serialNumber.trim() || null,
      asset_tag: assetTag.trim() || null,
      status,
      location_branch: locationBranch.trim(),
      location_department: locationDepartment.trim(),
      location_room: locationRoom.trim(),
      assigned_to: assignedTo || null,
      notes: notes.trim() || null,
      invoice_number: invoiceNumber.trim() || null,
      purchase_date: purchaseDate || null,
      processor: processor.trim() || null,
      created_by: user?.id || null,
    };

    let error;
    if (isEdit) {
      const oldEquipment = equipment!;
      ({ error } = await supabase.from("equipment").update(payload).eq("id", oldEquipment.id));

      // Record movement if assignment or location changed
      if (!error && (oldEquipment.assigned_to !== (assignedTo || null) ||
          `${oldEquipment.location_branch}/${oldEquipment.location_department}/${oldEquipment.location_room}` !==
          `${locationBranch.trim()}/${locationDepartment.trim()}/${locationRoom.trim()}`)) {
        await supabase.from("equipment_movements").insert({
          equipment_id: oldEquipment.id,
          from_person: oldEquipment.assigned_to || null,
          to_person: assignedTo || null,
          from_location: [oldEquipment.location_branch, oldEquipment.location_department, oldEquipment.location_room].filter(Boolean).join(" / ") || null,
          to_location: [locationBranch.trim(), locationDepartment.trim(), locationRoom.trim()].filter(Boolean).join(" / ") || null,
          moved_by: user?.id || null,
          notes: "Atualização de cadastro",
        });
      }
    } else {
      ({ error } = await supabase.from("equipment").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(isEdit ? "Equipamento atualizado!" : "Equipamento cadastrado!");
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Novo"} Equipamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Dell" />
            </div>
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Latitude 5520" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº de Série</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Patrimônio</Label>
              <Input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Processador</Label>
            <Input value={processor} onChange={(e) => setProcessor(e.target.value)} placeholder="Ex: Intel Core i5-1135G7" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nota Fiscal</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de Compra</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EquipmentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Input value={locationBranch} onChange={(e) => setLocationBranch(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input value={locationDepartment} onChange={(e) => setLocationDepartment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sala</Label>
              <Input value={locationRoom} onChange={(e) => setLocationRoom(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assignedTo || "__none__"} onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
