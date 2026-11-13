import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerEmail: string;
  onSend: (subject: string, body: string) => void;
  isSending: boolean;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerEmail,
  onSend,
  isSending
}: SendInvoiceDialogProps) {
  const [subject, setSubject] = useState(`Factuur ${invoiceNumber} - Kruze`);
  const [body, setBody] = useState(
    `Beste,\n\nBedankt voor je bestelling. In bijlage vind je de factuur.\n\nMet vriendelijke groet,\nTeam Kruze`
  );

  // Reset state when dialog opens or invoice number changes
  useEffect(() => {
    if (open) {
      setSubject(`Factuur ${invoiceNumber} - Kruze`);
      setBody(`Beste,\n\nBedankt voor je bestelling. In bijlage vind je de factuur.\n\nMet vriendelijke groet,\nTeam Kruze`);
    }
  }, [open, invoiceNumber]);

  const handleSend = () => {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    
    if (!trimmedSubject || !trimmedBody || !customerEmail.trim()) {
      return;
    }
    
    onSend(trimmedSubject, trimmedBody);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-send-invoice">
        <DialogHeader>
          <DialogTitle>Factuur Verzenden</DialogTitle>
          <DialogDescription>
            Factuur wordt verzonden naar {customerEmail} met CC naar boekhouding
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Factuur onderwerp"
              data-testid="input-subject"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Bericht</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email bericht"
              rows={8}
              data-testid="textarea-body"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            data-testid="button-cancel-send"
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !body.trim() || !customerEmail.trim()}
            data-testid="button-confirm-send"
          >
            {isSending ? "Verzenden..." : "Verzenden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
