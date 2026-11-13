import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, TrendingUp, CreditCard, Receipt } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";

interface DailyReportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DailyReportDialog({ open, onClose }: DailyReportDialogProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Fetch daily report
  const { data: report, isLoading } = useQuery({
    queryKey: ["/api/pos/reports/daily", selectedDate],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pos/reports/daily?date=${selectedDate}`);
      return await res.json();
    },
    enabled: open,
  });

  // Helper to get payment icon
  const getPaymentIcon = (method: string) => {
    const methodUpper = method.toUpperCase();
    if (methodUpper.includes('CASH') || methodUpper.includes('CONTANT')) return '💸';
    if (methodUpper.includes('BANK') || methodUpper.includes('TRANSFER') || methodUpper.includes('OVER')) return '🏦';
    if (methodUpper.includes('CARD') || methodUpper.includes('PIN')) return '💳';
    return '💰';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl" style={{ color: '#8A6959' }}>Dagrapport</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date Selection */}
          <div>
            <Label className="font-medium" style={{ color: '#8A6959' }}>Rapportdatum</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 border-2 rounded-xl"
              style={{ borderColor: '#CCCECD' }}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Rapport laden...</p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="rounded-xl shadow-sm border" style={{ backgroundColor: '#F1F2ED', borderColor: '#CCCECD' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium font-serif" style={{ color: '#939081' }}>
                      Totale omzet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: '#8A6959' }} />
                      <p className="text-2xl font-bold font-mono" style={{ color: '#8A6959' }}>{formatCurrency(report.totalSales)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm border" style={{ backgroundColor: '#F1F2ED', borderColor: '#CCCECD' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium font-serif" style={{ color: '#939081' }}>
                      Transacties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" style={{ color: '#8A6959' }} />
                      <p className="text-2xl font-bold" style={{ color: '#8A6959' }}>{report.transactionCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm border" style={{ backgroundColor: '#F1F2ED', borderColor: '#CCCECD' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium font-serif" style={{ color: '#939081' }}>
                      Gemiddelde verkoop
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: '#8A6959' }} />
                      <p className="text-2xl font-bold font-mono" style={{ color: '#8A6959' }}>{formatCurrency(report.averageSale)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Breakdown */}
              {report.paymentBreakdown && report.paymentBreakdown.length > 0 && (
                <Card className="rounded-xl shadow-sm border" style={{ borderColor: '#CCCECD' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif" style={{ color: '#8A6959' }}>
                      <CreditCard className="w-5 h-5" style={{ color: '#8A6959' }} />
                      Betaaloverzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.paymentBreakdown.map((payment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                          <div>
                            <span className="font-medium flex items-center gap-2">
                              <span className="text-lg">{getPaymentIcon(payment.method)}</span>
                              {payment.method}
                            </span>
                            <span className="text-sm ml-7" style={{ color: '#939081' }}>
                              ({payment.count} transactie{payment.count !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <span className="font-mono font-semibold" style={{ color: '#8A6959' }}>{formatCurrency(payment.total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transactions List */}
              {report.transactions && report.transactions.length > 0 ? (
                <Card className="rounded-xl shadow-sm border" style={{ borderColor: '#CCCECD' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif" style={{ color: '#8A6959' }}>
                      <Receipt className="w-5 h-5" style={{ color: '#8A6959' }} />
                      Recente transacties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {report.transactions.map((transaction: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: '#8A6959' }}>
                              #{transaction.id}
                            </p>
                            <p className="text-xs" style={{ color: '#939081' }}>
                              {transaction.time} - {transaction.customerName}
                            </p>
                            {transaction.paymentMethods && (
                              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#8A6959' }}>
                                <span className="text-sm">{getPaymentIcon(transaction.paymentMethods)}</span>
                                <span className="font-medium">{transaction.paymentMethods}</span>
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-lg" style={{ color: '#8A6959' }}>
                            {formatCurrency(transaction.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-xl shadow-sm border" style={{ borderColor: '#CCCECD' }}>
                  <CardContent className="py-8 text-center" style={{ color: '#939081' }}>
                    Geen transacties op deze datum
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p style={{ color: '#939081' }}>Geen data beschikbaar</p>
            </div>
          )}

          {/* Close Button */}
          <Button 
            variant="ghost"
            className="w-full rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-white border-2"
            style={{ 
              backgroundColor: '#E8BF9C',
              borderColor: '#E8BF9C'
            }}
            onClick={onClose}
            data-testid="button-close-report"
          >
            Sluiten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
