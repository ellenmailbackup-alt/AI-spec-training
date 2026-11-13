import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CartItem, POSCustomer, Discount } from "@/pages/pos/POSPage";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { starPrinter } from "@/services/starPrinter";
import { receiptPrinter } from "@/services/receiptPrinter";
import type { ReceiptData } from "@/services/receiptPrinter";

interface PaymentDialogProps {
  open: boolean;
  customer: POSCustomer;
  items: CartItem[];
  discount: Discount | null;
  total: number;
  onClose: () => void;
  onComplete: (saleId: number) => void;
}

export function PaymentDialog({
  open,
  customer,
  items,
  discount,
  total,
  onClose,
  onComplete,
}: PaymentDialogProps) {
  const { toast } = useToast();

  // Payment state
  const [paymentMethod1, setPaymentMethod1] = useState<string>('');
  const [paymentAmount1, setPaymentAmount1] = useState(total.toFixed(2));
  const [paymentMethod2, setPaymentMethod2] = useState<string>('');
  const [paymentAmount2, setPaymentAmount2] = useState('0.00');
  const [showSecondPayment, setShowSecondPayment] = useState(false);

  // Cash handling - using comma separator for European format
  const [cashTendered, setCashTendered] = useState('');

  // Reset state when dialog opens or total changes
  useEffect(() => {
    if (open) {
      setPaymentMethod1('');
      setPaymentAmount1(total.toFixed(2));
      setPaymentMethod2('');
      setPaymentAmount2('0.00');
      setShowSecondPayment(false);
      setCashTendered('');
    }
  }, [open, total]);
  
  // Helper to convert European format (comma) to US format (dot) for calculations
  const parseEuropeanNumber = (value: string): number => {
    const normalized = value.replace(',', '.');
    return parseFloat(normalized) || 0;
  };
  
  // Helper to format number with comma separator
  const formatWithComma = (value: string): string => {
    return value.replace('.', ',');
  };

  // Fetch payment methods
  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  // Fetch VAT classes
  const { data: vatClasses } = useQuery<any[]>({
    queryKey: ["/api/vat-classes"],
  });

  // Calculate VAT breakdown
  const calculateVATBreakdown = () => {
    const breakdown = new Map<number, { percentage: number; vatAmount: number; totalWithoutVat: number }>();
    
    items.forEach(item => {
      const totalWithVat = parseFloat(item.unitPriceWithVat) * item.amount;
      const totalWithoutVat = parseFloat(item.unitPriceWithoutVat) * item.amount;
      const vatAmount = totalWithVat - totalWithoutVat;
      
      const vatClass = vatClasses?.find(vc => vc.id === item.vatClassId);
      if (vatClass) {
        const percentage = parseFloat(vatClass.percentage) * 100; // Convert 0.21 to 21
        
        if (!breakdown.has(percentage)) {
          breakdown.set(percentage, {
            percentage,
            vatAmount: 0,
            totalWithoutVat: 0
          });
        }
        
        const entry = breakdown.get(percentage)!;
        entry.vatAmount += vatAmount;
        entry.totalWithoutVat += totalWithoutVat;
      }
    });
    
    return Array.from(breakdown.values()).sort((a, b) => a.percentage - b.percentage);
  };

  const vatBreakdown = vatClasses ? calculateVATBreakdown() : [];
  const totalWithoutVat = items.reduce((sum, item) => 
    sum + (parseFloat(item.unitPriceWithoutVat) * item.amount), 0
  );
  const totalVat = total - totalWithoutVat;

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest("POST", "/api/pos/sales", saleData);
      return await res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Smakelijk genoten!",
        description: `Bestelling #${data.sale.id} afgerond. Proef het meesterschap!`,
      });

      // Handle printer and cash drawer
      try {
        // Open cash drawer if cash payment
        if (isCashPayment1 && starPrinter.isConnected()) {
          console.log('Opening cash drawer for cash payment...');
          await starPrinter.openCashDrawer();
        }

        // Print receipt if printer is connected
        if (starPrinter.isConnected()) {
          console.log('Printing receipt to Star printer...');

          // Fetch full receipt data
          const receiptRes = await apiRequest("GET", `/api/pos/sales/${data.sale.id}/receipt`);
          const receiptData = await receiptRes.json();

          // Convert to printer format
          const printData: ReceiptData = {
            saleId: data.sale.id,
            date: new Date(receiptData.creationDate),
            invoiceNumber: data.invoiceNumber,
            customerName: receiptData.customerName,
            items: receiptData.items.map((item: any) => ({
              name: item.productName,
              weight: item.weight?.toString(),
              unit: item.unit,
              quantity: parseFloat(item.amount),
              unitPrice: parseFloat(item.unitPrice),
              total: parseFloat(item.total),
              vatRate: parseFloat(item.vatPercentage || '0')
            })),
            subtotal: parseFloat(receiptData.subtotalWithVat),
            discount: parseFloat(receiptData.discountAmount || '0'),
            vatBreakdown: receiptData.vatBreakdown.map((vat: any) => ({
              rate: parseFloat(vat.percentage),
              amount: parseFloat(vat.amount)
            })),
            total: parseFloat(receiptData.grandTotal),
            payments: receiptData.paymentMethods.map((pm: any) => ({
              method: pm.method,
              amount: parseFloat(pm.amount)
            })),
            change: change > 0 ? change : undefined,
            companyInfo: {
              name: receiptData.companyName,
              address: receiptData.address,
              city: receiptData.city,
              postalCode: receiptData.postalCode,
              phone: receiptData.phone,
              email: receiptData.email,
              vatNumber: receiptData.vatNumber,
            }
          };

          await receiptPrinter.printReceipt(printData);
          console.log('Receipt printed successfully');
        }
      } catch (error) {
        console.error('Printer error:', error);
        // Don't block the flow if printer fails
        toast({
          title: "Printer waarschuwing",
          description: "Bon kon niet worden afgedrukt. Controleer de printer.",
          variant: "default",
        });
      }

      onComplete(data.sale.id);
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to complete sale",
        variant: "destructive",
      });
    },
  });

  // Calculate change for cash
  const isCashPayment1 = paymentMethods?.find(pm => pm.id.toString() === paymentMethod1)?.paymentMethod?.toLowerCase() === 'cash';
  const change = isCashPayment1 && cashTendered
    ? parseEuropeanNumber(cashTendered) - parseFloat(paymentAmount1)
    : 0;

  const handleCompleteSale = () => {
    // Validation
    if (!paymentMethod1) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const payments = [
      { paymentMethodId: parseInt(paymentMethod1), amount: paymentAmount1 },
    ];

    if (showSecondPayment && paymentMethod2) {
      payments.push({ paymentMethodId: parseInt(paymentMethod2), amount: paymentAmount2 });
    }

    // Validate total
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (Math.abs(totalPaid - total) > 0.01) {
      toast({
        title: "Payment Mismatch",
        description: `Payment total (${formatCurrency(totalPaid)}) doesn't match sale total (${formatCurrency(total)})`,
        variant: "destructive",
      });
      return;
    }

    // Validate cash
    if (isCashPayment1 && change < 0) {
      toast({
        title: "Insufficient Cash",
        description: "Cash tendered is less than payment amount",
        variant: "destructive",
      });
      return;
    }

    // Create sale
    const saleData = {
      customerId: customer.id,
      items: items.map(item => ({
        productId: item.productId,
        weight: item.weight,
        unit: item.unit,
        amount: item.amount,
        unitPriceWithoutVat: item.unitPriceWithoutVat,
        unitPriceWithVat: item.unitPriceWithVat,
        vatClassId: item.vatClassId,
      })),
      discount,
      payments,
    };

    createSaleMutation.mutate(saleData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl" style={{ color: '#8A6959' }}>Afrekenen</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Warm Total Card */}
          <div className="p-6 rounded-xl text-center shadow-sm border" style={{ backgroundColor: '#F1F2ED', borderColor: '#CCCECD' }}>
            <p className="text-sm font-medium tracking-wide mb-2 font-serif" style={{ color: '#8A6959' }}>Totaal te betalen</p>
            <p className="text-5xl font-bold font-mono tracking-tight" style={{ color: '#8A6959' }} data-testid="text-payment-total">
              {formatCurrency(total)}
            </p>
          </div>

          {/* VAT Breakdown */}
          {vatBreakdown.length > 0 && (
            <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: '#FAFAF8', borderColor: '#CCCECD' }}>
              <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: '#939081' }}>BTW Specificatie</p>
              
              {vatBreakdown.map((vat) => (
                <div key={vat.percentage} className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: '#8A6959' }}>
                    BTW {vat.percentage.toFixed(0)}% over {formatCurrency(vat.totalWithoutVat)}
                  </span>
                  <span className="font-mono font-semibold" style={{ color: '#8A6959' }} data-testid={`text-vat-${vat.percentage}`}>
                    {formatCurrency(vat.vatAmount)}
                  </span>
                </div>
              ))}
              
              <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: '#CCCECD' }}>
                <span className="text-sm font-semibold" style={{ color: '#8A6959' }}>Totaal BTW</span>
                <span className="font-mono font-bold" style={{ color: '#8A6959' }} data-testid="text-total-vat">
                  {formatCurrency(totalVat)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium" style={{ color: '#939081' }}>Excl. BTW</span>
                <span className="font-mono" style={{ color: '#939081' }} data-testid="text-total-without-vat">
                  {formatCurrency(totalWithoutVat)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method 1 */}
          <div>
            <Label className="font-medium" style={{ color: '#8A6959' }}>Betaalmethode</Label>
            <Select value={paymentMethod1} onValueChange={(val) => {
              setPaymentMethod1(val);
              if (!showSecondPayment) {
                setPaymentAmount1(total.toFixed(2));
              }
            }}>
              <SelectTrigger 
                className="mt-2 border-2 rounded-xl focus:ring-2 transition-all" 
                style={{ borderColor: '#CCCECD' }}
                data-testid="select-payment-method-1"
              >
                <SelectValue placeholder="Kies betaalmethode" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>
                    {pm.paymentMethod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount 1 */}
          {showSecondPayment && (
            <div>
              <Label className="font-medium" style={{ color: '#8A6959' }}>Bedrag</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount1}
                onChange={(e) => {
                  setPaymentAmount1(e.target.value);
                  const remaining = total - parseFloat(e.target.value || '0');
                  setPaymentAmount2(Math.max(0, remaining).toFixed(2));
                }}
                className="mt-2 font-mono border-2 rounded-xl"
                style={{ borderColor: '#CCCECD' }}
                data-testid="input-payment-amount-1"
              />
            </div>
          )}

          {/* Cash Tendered */}
          {isCashPayment1 && (
            <div>
              <Label className="font-medium" style={{ color: '#8A6959' }}>Ontvangen bedrag</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={cashTendered}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow numbers, comma, and dot
                  if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                    setCashTendered(value);
                  }
                }}
                placeholder={formatWithComma(paymentAmount1)}
                className="mt-2 font-mono border-2 rounded-xl"
                style={{ borderColor: '#CCCECD' }}
                data-testid="input-cash-tendered"
              />
              {cashTendered && change !== 0 && (
                <p className={`text-sm mt-2 font-medium font-mono ${change < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-500'}`} data-testid="text-change">
                  Wisselgeld: {formatCurrency(Math.abs(change))}
                </p>
              )}
            </div>
          )}

          {/* Second Payment */}
          {showSecondPayment ? (
            <div className="space-y-3 pt-3 border-t" style={{ borderColor: '#CCCECD' }}>
              <div>
                <Label className="font-medium" style={{ color: '#8A6959' }}>Tweede betaalmethode</Label>
                <Select value={paymentMethod2} onValueChange={setPaymentMethod2}>
                  <SelectTrigger className="mt-2 border-2 rounded-xl" style={{ borderColor: '#CCCECD' }}>
                    <SelectValue placeholder="Kies betaalmethode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id.toString()}>
                        {pm.paymentMethod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-medium" style={{ color: '#8A6959' }}>Bedrag</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount2}
                  onChange={(e) => setPaymentAmount2(e.target.value)}
                  className="mt-2 font-mono border-2 rounded-xl"
                  style={{ borderColor: '#CCCECD' }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-2"
                style={{ 
                  borderColor: '#CCCECD',
                  color: '#8A6959'
                }}
                onClick={() => {
                  setShowSecondPayment(false);
                  setPaymentMethod2('');
                  setPaymentAmount1(total.toFixed(2));
                  setPaymentAmount2('0.00');
                }}
              >
                Tweede betaling verwijderen
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-xl border-2"
              style={{ 
                borderColor: '#CCCECD',
                color: '#8A6959'
              }}
              onClick={() => {
                setShowSecondPayment(true);
                const half = (total / 2).toFixed(2);
                setPaymentAmount1(half);
                setPaymentAmount2(half);
              }}
            >
              Tweede betaalmethode toevoegen
            </Button>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-2"
              style={{ 
                borderColor: '#CCCECD',
                color: '#8A6959'
              }}
              onClick={onClose}
              disabled={createSaleMutation.isPending}
            >
              Annuleren
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all border-2 text-base py-3"
              style={{ 
                backgroundColor: '#8A6959',
                borderColor: '#8A6959'
              }}
              onMouseEnter={(e) => {
                if (!createSaleMutation.isPending && paymentMethod1) {
                  e.currentTarget.style.backgroundColor = '#6F5447';
                  e.currentTarget.style.borderColor = '#6F5447';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8A6959';
                e.currentTarget.style.borderColor = '#8A6959';
              }}
              onClick={handleCompleteSale}
              disabled={createSaleMutation.isPending || !paymentMethod1}
              data-testid="button-complete-sale"
            >
              {createSaleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verwerken...
                </>
              ) : (
                'Verkoop afronden'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
