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

interface StockMovementConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StockMovementConfirmDialog({
  open,
  onConfirm,
  onCancel
}: StockMovementConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-testid="dialog-stock-movement-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>Voorraad Bewegingen Aanmaken?</AlertDialogTitle>
          <AlertDialogDescription>
            Er zijn nog geen voorraadmutaties aangemaakt voor deze verkoop.
            Wilt u deze nu aanmaken voordat de status wordt gewijzigd naar INVOICED?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} data-testid="button-cancel-stock">
            Nee, alleen status wijzigen
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="button-confirm-stock">
            Ja, voorraad verlagen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
