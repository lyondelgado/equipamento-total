import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (problem: string) => void | Promise<void>;
}

export function MaintenanceDialog({ open, onClose, onConfirm }: MaintenanceDialogProps) {
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!problem.trim()) return;
    setSubmitting(true);
    await onConfirm(problem.trim());
    setSubmitting(false);
    setProblem("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar para manutenção</DialogTitle>
          <DialogDescription>
            Descreva o problema apresentado pelo equipamento. Esta informação ficará registrada no histórico de manutenção.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Descrição do problema *</Label>
          <Textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            placeholder="Ex: Tela com manchas, não liga, teclado com teclas falhando..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!problem.trim() || submitting}>
            {submitting ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
