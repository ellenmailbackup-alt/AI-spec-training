import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Custom dotted divider for KRUZE brand
const DottedDivider = () => (
  <div className="my-4 border-t border-dotted" style={{ borderColor: '#E0DAD2' }} />
);

// Dutch currency formatter with comma as decimal separator
const formatDutchCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `€ ${num.toFixed(2).replace('.', ',')}`;
};

interface ReceiptDialogProps {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
}

export function ReceiptDialog({ open, saleId, onClose }: ReceiptDialogProps) {
  // Fetch receipt data
  const { data: receipt, isLoading } = useQuery({
    queryKey: ["/api/pos/sales/:id/receipt", saleId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pos/sales/${saleId}/receipt`);
      return await res.json();
    },
    enabled: !!saleId && open,
  });

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="font-serif text-[#8A6959] font-semibold tracking-wide">BTW Kasticket</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Bon laden...</p>
          </div>
        ) : receipt ? (
          <div className="space-y-4">
            {/* Receipt Content */}
            <div style={{ backgroundColor: '#F9F8F5' }} className="p-6 rounded-lg border-[#E0DAD2] border print:border-0 print:p-0">
              {/* Header - BTW Kasticket (print only) */}
              <div className="hidden print:block text-center mb-4">
                <h2 className="font-serif font-semibold text-xl tracking-wide" style={{ color: '#8A6959' }}>BTW Kasticket</h2>
              </div>
              
              {/* Company Info */}
              <div className="text-center mb-4">
                <h3 className="font-serif font-bold text-lg" style={{ color: '#8A6959' }}>{receipt.companyName}</h3>
                {receipt.address && <p className="text-sm" style={{ color: '#6E625A' }}>{receipt.address}</p>}
                {receipt.phone && <p className="text-sm" style={{ color: '#6E625A' }}>{receipt.phone}</p>}
                {receipt.email && <p className="text-sm" style={{ color: '#6E625A' }}>{receipt.email}</p>}
                {receipt.vatNumber && <p className="text-sm" style={{ color: '#6E625A' }}>BTW: {receipt.vatNumber}</p>}
              </div>

              <DottedDivider />

              {/* Sale Info */}
              <div className="text-sm space-y-1 mb-4" style={{ color: '#6E625A' }}>
                <div className="flex justify-between">
                  <span>Bon #:</span>
                  <span className="font-mono">{saleId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Datum:</span>
                  <span className="font-mono">
                    {new Date(receipt.creationDate).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tijd:</span>
                  <span className="font-mono">
                    {new Date(receipt.creationDate).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Klant:</span>
                  <span>{receipt.customerName}</span>
                </div>
              </div>

              <DottedDivider />

              {/* Items */}
              <div className="space-y-2 mb-4">
                {receipt.items.map((item: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: '#6E625A' }}>{item.productName}</p>
                        <p className="text-xs" style={{ color: '#93887D' }}>
                          {item.amount}x {item.weight}{item.unit} @ {formatDutchCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-mono text-sm" style={{ color: '#4E3C32' }}>{formatDutchCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DottedDivider />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between" style={{ color: '#6E625A' }}>
                  <span>Subtotaal:</span>
                  <span className="font-mono" style={{ color: '#4E3C32' }}>{formatDutchCurrency(receipt.subtotalWithVat)}</span>
                </div>

                {receipt.vatBreakdown.map((vat: any, index: number) => (
                  <div key={index} className="flex justify-between" style={{ color: '#93887D' }}>
                    <span>{vat.className} ({vat.percentage.replace('.', ',')}%):</span>
                    <span className="font-mono">{formatDutchCurrency(vat.amount)}</span>
                  </div>
                ))}

                {parseFloat(receipt.discountAmount) > 0 && (
                  <div className="flex justify-between" style={{ color: '#C04848' }}>
                    <span>Korting:</span>
                    <span className="font-mono">-{formatDutchCurrency(receipt.discountAmount)}</span>
                  </div>
                )}

                <div className="border-t" style={{ borderColor: '#E0DAD2' }} />

                <div 
                  className="flex justify-between font-bold text-lg p-2 rounded" 
                  style={{ 
                    color: '#8A6959',
                    backgroundColor: '#F5F0EA'
                  }}
                >
                  <span className="tracking-wide">TOTAAL:</span>
                  <span className="font-mono">{formatDutchCurrency(receipt.grandTotal)}</span>
                </div>
              </div>

              <DottedDivider />

              {/* Payments */}
              <div className="text-sm space-y-1" style={{ color: '#6E625A' }}>
                {receipt.payments.map((payment: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{payment.method}:</span>
                    <span className="font-mono" style={{ color: '#4E3C32' }}>{formatDutchCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {receipt.footerText && (
                <>
                  <DottedDivider />
                  <p className="text-center text-sm" style={{ color: '#93887D' }}>{receipt.footerText}</p>
                </>
              )}

              {/* Quote */}
              {receipt.quote && (
                <>
                  <DottedDivider />
                  <div className="text-center space-y-1" data-testid="receipt-quote">
                    <p className="font-serif italic text-sm" style={{ color: '#8A6959' }}>
                      "{receipt.quote.text}"
                    </p>
                    {receipt.quote.author && (
                      <p className="text-xs italic" style={{ color: '#93887D' }}>
                        - {receipt.quote.author}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 print:hidden">
              <Button 
                variant="outline" 
                className="flex-1 border-[#CCCECD] font-medium"
                style={{ 
                  color: '#8A6959',
                  borderColor: '#CCCECD'
                }}
                onClick={onClose} 
                data-testid="button-close-receipt"
              >
                <X className="w-4 h-4 mr-2" />
                Sluiten
              </Button>
              <Button 
                variant="ghost"
                className="flex-1 font-medium border-0 !bg-[#E8BF9C] !text-white hover:!bg-[#D4AC88] active:!bg-[#C49B79]"
                onClick={handlePrint} 
                data-testid="button-print-receipt"
              >
                <Printer className="w-4 h-4 mr-2" />
                Afdrukken
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Bon niet gevonden</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
