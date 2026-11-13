import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Download, Send } from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { SaleWithLines, PaymentMethod, SalesStatus } from "@shared/schema";
import { formatNumber } from "@/lib/currency";
import { useState } from "react";
import { StockMovementConfirmDialog } from "@/components/admin/StockMovementConfirmDialog";
import { SendInvoiceDialog } from "@/components/admin/SendInvoiceDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(num);
};

export default function SaleDetail() {
  const params = useParams();
  const saleId = params.id ? parseInt(params.id) : null;
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showStockConfirm, setShowStockConfirm] = useState(false);
  const [showSendInvoiceDialog, setShowSendInvoiceDialog] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: sale, isLoading, error } = useQuery<SaleWithLines>({
    queryKey: saleId ? ["/api/sales", saleId] : [],
    enabled: !!saleId,
  });

  const handleDownloadInvoice = async () => {
    if (!saleId || !sale?.invoiceNumber) return;

    try {
      setIsDownloadingPDF(true);
      const response = await fetch(`/api/sales/${saleId}/invoice-pdf`);

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Factuur_${new Date(sale.salesDate).getFullYear()}_${sale.invoiceNumber}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const { data: paymentMethods = [], isLoading: loadingPaymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/settings/payment-methods"],
  });

  const { data: salesStatuses = [], isLoading: loadingSalesStatuses } = useQuery<SalesStatus[]>({
    queryKey: ["/api/settings/sales-statuses"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ statusId, createStockMovements }: { statusId: number; createStockMovements: boolean }) => {
      return await apiRequest('PATCH', `/api/sales/${saleId}/status`, {
        statusId,
        createStockMovements,
      });
    },
    onSuccess: (data: any) => {
      if (data.needsConfirmation) {
        setShowStockConfirm(true);
      } else {
        toast({
          title: "Status Updated",
          description: "Sale status has been updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
        queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
        setPendingStatusId(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
      setPendingStatusId(null);
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ subject, body }: { subject: string; body: string }) => {
      return await apiRequest('POST', `/api/sales/${saleId}/send-invoice`, {
        subject,
        body,
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Sent",
        description: "Invoice has been sent successfully",
      });
      setShowSendInvoiceDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatusId: string) => {
    const statusId = parseInt(newStatusId);
    setPendingStatusId(statusId);
    updateStatusMutation.mutate({ statusId, createStockMovements: false });
  };

  const handleStockConfirm = () => {
    if (pendingStatusId !== null) {
      setShowStockConfirm(false);
      updateStatusMutation.mutate({ statusId: pendingStatusId, createStockMovements: true });
    }
  };

  const handleStockCancel = () => {
    setShowStockConfirm(false);
    setPendingStatusId(null);
  };

  const handleSendInvoice = (subject: string, body: string) => {
    sendInvoiceMutation.mutate({ subject, body });
  };

  const paymentMethodName = loadingPaymentMethods 
    ? "Loading..."
    : paymentMethods.find(pm => pm.id === sale?.paymentMethod)?.paymentMethod || "Unknown";
  
  const salesStatusName = loadingSalesStatuses
    ? "Loading..."
    : salesStatuses.find(ss => ss.id === sale?.salesStatus)?.salesStatus || "Unknown";
  
  const customerName = sale?.customer 
    ? [sale.customer.firstName, sale.customer.lastName, sale.customer.companyName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Customer"
    : "-";

  // Calculate product subtotals
  const productsSubtotalWithoutVat = sale?.salesLines?.reduce((sum, item) => sum + parseFloat(item.totalWithoutVat), 0) || 0;
  const productsSubtotalWithVat = sale?.salesLines?.reduce((sum, item) => sum + parseFloat(item.totalWithVat), 0) || 0;
  
  // Add shipping and subtract discount to get final totals
  const shippingWithoutVat = sale?.shippingCostWithoutVat ? parseFloat(sale.shippingCostWithoutVat) : 0;
  const shippingWithVat = sale?.shippingCostWithVat ? parseFloat(sale.shippingCostWithVat) : 0;
  const discountWithoutVat = sale?.discountWithoutVat ? parseFloat(sale.discountWithoutVat) : 0;
  const discountWithVat = sale?.discountWithVat ? parseFloat(sale.discountWithVat) : 0;
  
  const subtotalWithoutVat = productsSubtotalWithoutVat + shippingWithoutVat - discountWithoutVat;
  const subtotalWithVat = productsSubtotalWithVat + shippingWithVat - discountWithVat;
  const totalVat = subtotalWithVat - subtotalWithoutVat;

  // Helper to normalize VAT percentage to consistent format
  // Converts decimal (0.06, 0.21) to percentage string (6.00, 21.00)
  const normalizeVatPercentage = (percentage: string | number): string => {
    const parsed = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    const asPercentage = parsed * 100; // Convert decimal to percentage (0.06 -> 6, 0.21 -> 21)
    return asPercentage.toFixed(2); // Always use 2 decimal places (e.g., "21.00", "6.00")
  };

  // Calculate VAT amounts grouped by percentage (products only initially)
  const vatByPercentage = sale?.salesLines?.reduce((acc, item) => {
    const vatPercentage = normalizeVatPercentage(item.vatPercentage || '0');
    const vatAmount = parseFloat(item.totalWithVat) - parseFloat(item.totalWithoutVat);
    
    if (!acc[vatPercentage]) {
      acc[vatPercentage] = 0;
    }
    acc[vatPercentage] += vatAmount;
    
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate product VAT total (before discount) for proportional distribution
  const productVatTotal = sale?.salesLines?.reduce((sum, item) => {
    return sum + (parseFloat(item.totalWithVat) - parseFloat(item.totalWithoutVat));
  }, 0) || 0;

  // Distribute discount VAT proportionally across product VAT rates only (not shipping)
  const discountVat = discountWithVat - discountWithoutVat;
  if (discountVat > 0.01 && productVatTotal > 0) {
    // Get product VAT rates (normalized)
    const productVatRates = sale?.salesLines?.reduce((acc, item) => {
      const rate = normalizeVatPercentage(item.vatPercentage || '0');
      if (!acc.includes(rate)) acc.push(rate);
      return acc;
    }, [] as string[]) || [];

    // Distribute discount only among product VAT rates
    productVatRates.forEach(normalizedPercentage => {
      const productVatAtRate = sale?.salesLines
        ?.filter(item => normalizeVatPercentage(item.vatPercentage || '0') === normalizedPercentage)
        .reduce((sum, item) => sum + (parseFloat(item.totalWithVat) - parseFloat(item.totalWithoutVat)), 0) || 0;
      
      const proportion = productVatAtRate / productVatTotal;
      vatByPercentage[normalizedPercentage] = (vatByPercentage[normalizedPercentage] || 0) - (discountVat * proportion);
    });
  }

  // Add shipping VAT AFTER discount allocation (so discounts don't affect it)
  const shippingVat = shippingWithVat - shippingWithoutVat;
  if (shippingVat > 0.01 && shippingWithoutVat > 0) {
    // Calculate the shipping VAT percentage
    const calculatedRate = (shippingVat / shippingWithoutVat) * 100;
    
    // Round to nearest standard Belgian VAT rate (0%, 6%, 12%, 21%)
    const standardRates = [0, 6, 12, 21];
    const nearestRate = standardRates.reduce((prev, curr) => 
      Math.abs(curr - calculatedRate) < Math.abs(prev - calculatedRate) ? curr : prev
    );
    
    const shippingVatRate = nearestRate.toFixed(2);
    vatByPercentage[shippingVatRate] = (vatByPercentage[shippingVatRate] || 0) + shippingVat;
  }

  // Sort VAT percentages in descending order (21% first, then 6%, etc.)
  const sortedVatPercentages = Object.keys(vatByPercentage)
    .sort((a, b) => parseFloat(b) - parseFloat(a));

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sales
                </Button>
              </Link>
              <h1 className="font-serif text-3xl font-semibold">
                {sale?.invoiceNumber ? `Sale #${sale.invoiceNumber}` : `Sale Details`}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {sale && !loadingSalesStatuses && (
                <div className="w-48">
                  <Select
                    value={sale.salesStatus?.toString()}
                    onValueChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.salesStatus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {sale?.invoiceNumber && sale.customer?.email && salesStatusName !== "PAID" && (
                <Button
                  onClick={() => setShowSendInvoiceDialog(true)}
                  disabled={sendInvoiceMutation.isPending}
                  variant="outline"
                  data-testid="button-send-invoice"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invoice
                </Button>
              )}
              {sale?.invoiceNumber && (
                <Button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingPDF}
                  data-testid="button-download-invoice"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloadingPDF ? 'Generating PDF...' : 'Download Invoice'}
                </Button>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">View complete sale information and line items</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="animate-pulse text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">Loading sale details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full border-destructive">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Error loading sale</p>
                <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                <Link href="/admin/orders">
                  <Button variant="outline" className="mt-4">
                    Back to Sales
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : sale ? (
        <div className="row">
          <div className="col-12">
            <div className="space-y-4">
              {/* Sale Information */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Sale Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                      <p className="font-mono font-medium mt-1" data-testid="text-invoice-number">
                        {sale.invoiceNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sale Date</label>
                      <p className="mt-1" data-testid="text-sale-date">
                        {format(new Date(sale.salesDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Customer</label>
                      <p className="font-medium mt-1" data-testid="text-customer-name">
                        {customerName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                      <div className="mt-1">
                        <Badge variant="outline" data-testid="badge-payment-method">
                          {paymentMethodName}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant="outline" data-testid="badge-status">
                          {salesStatusName}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Webshop Sale</label>
                      <p className="mt-1" data-testid="text-webshop-sale">
                        {sale.webshopSale ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Stock Updated</label>
                      <p className="mt-1" data-testid="text-stock-updated">
                        {sale.stockUpdated ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Uploaded to Accounting</label>
                      <p className="mt-1" data-testid="text-uploaded-accounting">
                        {sale.uploadedAccounting ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-right">Quantity</th>
                          <th className="text-right">Unit</th>
                          <th className="text-right">Unit Price (excl VAT)</th>
                          <th className="text-right">Unit Price (incl VAT)</th>
                          <th className="text-right">Total (excl VAT)</th>
                          <th className="text-right">Total (incl VAT)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.salesLines && sale.salesLines.length > 0 ? (
                          sale.salesLines.map((line) => (
                            <tr key={line.id} data-testid={`row-line-${line.id}`}>
                              <td className="font-medium">{line.product.name}</td>
                              <td className="text-right">{formatNumber(line.amount, 2)}</td>
                              <td className="text-right">{formatNumber(line.weight, 2)} {line.unit}</td>
                              <td className="text-right">{formatCurrency(line.unitPriceWithoutVat)}</td>
                              <td className="text-right">{formatCurrency(line.unitPriceWithVat)}</td>
                              <td className="text-right">{formatCurrency(line.totalWithoutVat)}</td>
                              <td className="text-right font-medium">{formatCurrency(line.totalWithVat)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center text-muted-foreground py-4">
                              No line items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-w-md ml-auto">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Products Subtotal (excl VAT):</span>
                      <span className="font-medium" data-testid="text-products-subtotal">
                        {formatCurrency(productsSubtotalWithoutVat.toFixed(2))}
                      </span>
                    </div>
                    {shippingWithoutVat > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping Cost (excl VAT):</span>
                        <span className="font-medium" data-testid="text-shipping-cost">
                          {formatCurrency(shippingWithoutVat.toFixed(2))}
                        </span>
                      </div>
                    )}
                    {discountWithoutVat > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount (excl VAT):</span>
                        <span className="font-medium text-green-600 dark:text-green-400" data-testid="text-discount">
                          -{formatCurrency(discountWithoutVat.toFixed(2))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-muted-foreground">Subtotal (excl VAT):</span>
                      <span className="font-medium" data-testid="text-subtotal-without-vat">
                        {formatCurrency(subtotalWithoutVat.toFixed(2))}
                      </span>
                    </div>
                    {sortedVatPercentages.map((percentage) => (
                      <div key={percentage} className="flex justify-between">
                        <span className="text-muted-foreground">
                          VAT {formatNumber(parseFloat(percentage), 0)}%:
                        </span>
                        <span className="font-medium" data-testid={`text-vat-${percentage}`}>
                          {formatCurrency(vatByPercentage[percentage].toFixed(2))}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Total (incl VAT):</span>
                      <span data-testid="text-total-with-vat">
                        {formatCurrency(subtotalWithVat.toFixed(2))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      <StockMovementConfirmDialog
        open={showStockConfirm}
        onConfirm={handleStockConfirm}
        onCancel={handleStockCancel}
      />

      <SendInvoiceDialog
        open={showSendInvoiceDialog}
        onOpenChange={setShowSendInvoiceDialog}
        invoiceNumber={sale?.invoiceNumber || ""}
        customerEmail={sale?.customer?.email || ""}
        onSend={handleSendInvoice}
        isSending={sendInvoiceMutation.isPending}
      />
    </AdminLayout>
  );
}
