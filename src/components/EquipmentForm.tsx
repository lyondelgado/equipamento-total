import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaintenanceDialog } from "@/components/MaintenanceDialog";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";

type Equipment = Tables<"equipment">;
type EquipmentType = Enums<"equipment_type">;
type EquipmentStatus = Enums<"equipment_status">;

interface Profile {
  id: string;
  full_name: string;
}

interface Employee {
  id: string;
  full_name: string;
  branch: string | null;
  department: string | null;
  linked_user_id: string | null;
}

interface SimCard {
  id: string;
  chip_id: number;
  serial_number: string;
  phone_number: string;
  carrier: string;
  status: string;
  in_use: boolean;
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
  inactive: "Inativo",
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
  const [simCardId, setSimCardId] = useState<string>("");
  const [cameraType, setCameraType] = useState<string>("");
  const [serviceTag, setServiceTag] = useState("");
  const [technology, setTechnology] = useState<string>("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [pendingProblem, setPendingProblem] = useState<string | null>(null);

  const isRouter = equipmentType === "router";
  const isCamera = equipmentType === "camera";
  const isPrinter = equipmentType === "printer";
  const isMonitor = equipmentType === "monitor";
  const isNotebook = equipmentType === "notebook";
  const showServiceTag = isNotebook || isMonitor;
  const hideExtras = isRouter || isCamera;
  const hideAssetTag = hideExtras || isPrinter || isMonitor;
  const hideProcessor = hideExtras || isPrinter || isMonitor;
  const hideDepartment = hideExtras || isPrinter || isMonitor;
  const hideRoom = hideExtras;
  const hideInvoice = hideExtras;

  useEffect(() => {
    if (open) {
      supabase.from("profiles").select("id, full_name").then(({ data }) => {
        if (data) setProfiles(data);
      });
      supabase.from("employees").select("id, full_name, branch, department, linked_user_id").eq("status", "active").order("full_name").then(({ data }) => {
        if (data) setEmployees(data as Employee[]);
      });
      if (isRouter) {
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sb = supabase as any;
          const [{ data: chipsData }, { data: usedData }] = await Promise.all([
            sb.from("sim_cards").select("id, chip_id, serial_number, phone_number, carrier, status").order("chip_id"),
            sb.from("equipment").select("id, sim_card_id").not("sim_card_id", "is", null),
          ]);
          const usedMap = new Map<string, string>();
          (usedData || []).forEach((r: any) => { if (r.sim_card_id) usedMap.set(r.sim_card_id, r.id); });
          const currentSimId = (equipment as any)?.sim_card_id || "";
          const list = (chipsData || []).map((c: any) => ({
            ...c,
            in_use: !!usedMap.get(c.id) && usedMap.get(c.id) !== (equipment as any)?.id,
          })) as SimCard[];
          // hide cancelled (except the one currently selected, so we don't break the form)
          const filtered = list.filter((c) => c.status !== "cancelled" || c.id === currentSimId);
          // available first, then in use
          filtered.sort((a, b) => Number(a.in_use) - Number(b.in_use) || a.chip_id - b.chip_id);
          setSimCards(filtered);
        })();
      }
      setPendingProblem(null);
      if (equipment) {
        setBrand(equipment.brand);
        setModel(equipment.model);
        setSerialNumber(equipment.serial_number || "");
        setAssetTag(equipment.asset_tag || "");
        setStatus(equipment.status);
        setLocationBranch(equipment.location_branch);
        setLocationDepartment(equipment.location_department);
        setLocationRoom(equipment.location_room);
        setAssignedTo((equipment as any).assigned_employee_id || equipment.assigned_to || "");
        setNotes(equipment.notes || "");
        setInvoiceNumber(equipment.invoice_number || "");
        setPurchaseDate(equipment.purchase_date || "");
        setProcessor(equipment.processor || "");
        setSimCardId((equipment as any).sim_card_id || "");
        setCameraType((equipment as any).camera_type || "");
        setServiceTag((equipment as any).service_tag || "");
        setTechnology((equipment as any).technology || "");
      } else {
        setBrand(""); setModel(""); setSerialNumber(""); setAssetTag("");
        setStatus("active"); setLocationBranch(""); setLocationDepartment("");
        setLocationRoom(""); setAssignedTo(""); setNotes("");
        setInvoiceNumber(""); setPurchaseDate(""); setProcessor("");
        setSimCardId("");
        setCameraType("");
        setServiceTag("");
        setTechnology("");
      }
    }
  }, [open, equipment, isRouter]);

  const performSave = async (problemDescription: string | null) => {
    setSaving(true);
    const payload: any = {
      type: equipmentType,
      brand: brand.trim(),
      model: model.trim(),
      serial_number: serialNumber.trim() || null,
      asset_tag: hideAssetTag ? null : (assetTag.trim() || null),
      status,
      location_branch: locationBranch.trim(),
      location_department: hideDepartment ? "" : locationDepartment.trim(),
      location_room: hideRoom ? "" : locationRoom.trim(),
      assigned_employee_id: assignedTo || null,
      assigned_to: null,
      notes: notes.trim() || null,
      invoice_number: hideInvoice ? null : (invoiceNumber.trim() || null),
      purchase_date: hideInvoice ? null : (purchaseDate || null),
      processor: hideProcessor ? null : (processor.trim() || null),
      sim_card_id: isRouter ? (simCardId || null) : null,
      camera_type: isCamera ? (cameraType || null) : null,
      service_tag: showServiceTag ? (serviceTag.trim() || null) : null,
      technology: isRouter ? (technology || null) : null,
      created_by: user?.id || null,
    };

    let error;
    let equipmentId: string | null = equipment?.id || null;
    if (isEdit) {
      const oldEquipment = equipment as any;
      ({ error } = await supabase.from("equipment").update(payload).eq("id", oldEquipment.id));

      const oldEmpId = oldEquipment.assigned_employee_id || null;
      const newEmpId = assignedTo || null;
      if (!error && (oldEmpId !== newEmpId ||
          `${oldEquipment.location_branch}/${oldEquipment.location_department}/${oldEquipment.location_room}` !==
          `${locationBranch.trim()}/${locationDepartment.trim()}/${locationRoom.trim()}`)) {
        await supabase.from("equipment_movements").insert({
          equipment_id: oldEquipment.id,
          from_employee: oldEmpId,
          to_employee: newEmpId,
          from_location: [oldEquipment.location_branch, oldEquipment.location_department, oldEquipment.location_room].filter(Boolean).join(" / ") || null,
          to_location: [locationBranch.trim(), locationDepartment.trim(), locationRoom.trim()].filter(Boolean).join(" / ") || null,
          moved_by: user?.id || null,
          notes: "Atualização de cadastro",
        } as any);
      }
    } else {
      const { data, error: insertError } = await supabase.from("equipment").insert(payload).select("id").single();
      error = insertError;
      if (data) equipmentId = data.id;
    }

    if (!error && problemDescription && equipmentId) {
      await supabase.from("equipment_maintenance").insert({
        equipment_id: equipmentId,
        problem_description: problemDescription,
        status: "open",
        created_by: user?.id || null,
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      toast.error("Marca é obrigatória");
      return;
    }
    if (!isRouter && !model.trim()) {
      toast.error("Modelo é obrigatório");
      return;
    }
    const wasNotMaintenance = !equipment || equipment.status !== "maintenance";
    if (status === "maintenance" && wasNotMaintenance) {
      setMaintenanceOpen(true);
      return;
    }
    await performSave(null);
  };

  const handleMaintenanceConfirm = async (problem: string) => {
    setPendingProblem(problem);
    setMaintenanceOpen(false);
    await performSave(problem);
  };

  const handleAssignedToChange = (value: string) => {
    const id = value === "__none__" ? "" : value;
    setAssignedTo(id);
    if (id) {
      const emp = employees.find((e) => e.id === id);
      if (emp) {
        if (emp.branch) setLocationBranch(emp.branch);
        if (emp.department) setLocationDepartment(emp.department);
      }
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
              <Label>Modelo {!isRouter && "*"}</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Latitude 5520" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº de Série</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            {!hideAssetTag && (
              <div className="space-y-2">
                <Label>Patrimônio</Label>
                <Input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} />
              </div>
            )}
          </div>
          {showServiceTag && (
            <div className="space-y-2">
              <Label>Service Tag</Label>
              <Input value={serviceTag} onChange={(e) => setServiceTag(e.target.value)} />
            </div>
          )}
          {!hideProcessor && (
            <div className="space-y-2">
              <Label>Processador</Label>
              <Input value={processor} onChange={(e) => setProcessor(e.target.value)} placeholder="Ex: Intel Core i5-1135G7" />
            </div>
          )}
          {isCamera && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={cameraType || "__none__"} onValueChange={(v) => setCameraType(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione o tipo</SelectItem>
                  <SelectItem value="ConstructIN">ConstructIN</SelectItem>
                  <SelectItem value="Câmera Wi-Fi">Câmera Wi-Fi</SelectItem>
                  <SelectItem value="DVR">DVR</SelectItem>
                  <SelectItem value="Câmera de Segurança">Câmera de Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isRouter && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chip</Label>
                <ChipCombobox
                  chips={simCards}
                  value={simCardId}
                  onChange={setSimCardId}
                />
              </div>
              <div className="space-y-2">
                <Label>Linha</Label>
                <Input
                  value={formatPhone(simCards.find((s) => s.id === simCardId)?.phone_number || "")}
                  readOnly
                  disabled
                  placeholder="Selecione um chip"
                />
              </div>
            </div>
          )}
          {isRouter && (
            <div className="space-y-2">
              <Label>Tecnologia</Label>
              <Select value={technology || "__none__"} onValueChange={(v) => setTechnology(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  <SelectItem value="4G">4G</SelectItem>
                  <SelectItem value="5G">5G</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {!hideExtras && (
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
          )}
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
          <div className={hideExtras || isMonitor ? "space-y-2" : isPrinter ? "grid grid-cols-2 gap-4" : "grid grid-cols-3 gap-4"}>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Input value={locationBranch} onChange={(e) => setLocationBranch(e.target.value)} />
            </div>
            {!hideDepartment && (
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input value={locationDepartment} onChange={(e) => setLocationDepartment(e.target.value)} />
              </div>
            )}
            {!hideRoom && (
              <div className="space-y-2">
                <Label>Sala</Label>
                <Input value={locationRoom} onChange={(e) => setLocationRoom(e.target.value)} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assignedTo || "__none__"} onValueChange={handleAssignedToChange}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
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
      <MaintenanceDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        onConfirm={handleMaintenanceConfirm}
      />
    </Dialog>
  );
}

function ChipCombobox({
  chips,
  value,
  onChange,
}: {
  chips: SimCard[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = chips.find((c) => c.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            selected && chips.find((c) => c.id === value)?.in_use && "border-success ring-1 ring-success"
          )}
        >
          <span className="truncate">
            {selected
              ? `${selected.serial_number} — ${selected.carrier} (${formatPhone(selected.phone_number)})`
              : "Nenhum"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue is composed of serial + phone digits + carrier (lowercased)
            const q = search.toLowerCase().replace(/\s+/g, "");
            return itemValue.toLowerCase().includes(q) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar por serial ou número..." />
          <CommandList>
            <CommandEmpty>Nenhum chip encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="nenhum"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                Nenhum
              </CommandItem>
              {chips.map((c) => {
                const phoneFmt = formatPhone(c.phone_number);
                const phoneDigits = (c.phone_number || "").replace(/\D/g, "");
                const itemValue = `${c.serial_number} ${phoneFmt} ${phoneDigits} ${c.carrier}`;
                return (
                  <CommandItem
                    key={c.id}
                    value={itemValue}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "border border-transparent",
                      c.in_use && "border-success/60"
                    )}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">{c.serial_number || "(sem série)"}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.carrier} · {phoneFmt}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium",
                        c.in_use ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.in_use ? "Em uso" : "Disponível"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

