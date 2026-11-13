import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { parseVatToPercentage } from "@/lib/vat";
import { Package } from "lucide-react";

type SaleLineItem = {
  id: number;
  productId: number;
  productName: string;
  weight: string;
  amount: string;
  unit: string;
  unitPriceWithoutVat: string;
  unitPriceWithVat: string;
  totalWithoutVat: string;
  totalWithVat: string;
  vatPercentage: string;
};

type SaleWithLines = {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  salesDate: Date;
  paymentMethod: number;
  paymentMethodName: string;
  salesStatus: number;
  salesStatusName: string;
  webshopSale: boolean;
  stockUpdated: boolean;
  uploadedAccounting: boolean;
  shippingCostWithoutVat: string;
  shippingCostWithVat: string;
  discountPercentage: string;
  discountWithoutVat: string;
  discountWithVat: string;
  salesLines: (SaleLineItem & { product: { name: string } })[];
};

type ViewSaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number | null;
};

export function ViewSaleDialog({ open, onOpenChange, saleId }: ViewSaleDialogProps) {
  const { data: sale, isLoading } = useQuery<SaleWithLines>({
    queryKey: ["/api/sales", saleId],
    queryFn: async () => {
      if (!saleId) throw new Error("No sale ID");
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) throw new Error("Failed to fetch sale");
      return response.json();
    },
    enabled: open && !!saleId,
  });

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
  const normalizeVatPercentage = (percentage: string | number): string => parseVatToPercentage(percentage).toFixed(2);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            View Sale {sale?.invoiceNumber ? `#${sale.invoiceNumber}` : `ID: ${saleId}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-center">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">Loading sale details...</p>
            </div>
          </div>
        ) : sale ? (
          <div className="space-y-6">
            {/* Sale Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="font-mono font-medium">{sale.invoiceNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sale Date</label>
                  <p>{format(new Date(sale.salesDate), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{sale.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <Badge variant="outline">{sale.paymentMethodName}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="outline">{sale.salesStatusName}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Webshop Sale</label>
                  <p>{sale.webshopSale ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Updated</label>
                  <p>{sale.stockUpdated ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uploaded to Accounting</label>
                  <p>{sale.uploadedAccounting ? "Yes" : "No"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products</CardTitle>
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
                          <tr key={line.id}>
                            <td className="font-medium">{line.product.name}</td>
                            <td className="text-right">{formatNumber(line.amount, 2)}</td>
                            <td className="text-right text-muted-foreground text-sm">{formatNumber(line.weight, 2)}g</td>
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
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products Subtotal (excl VAT):</span>
                  <span className="font-medium">{formatCurrency(productsSubtotalWithoutVat.toFixed(2))}</span>
                </div>
                {shippingWithoutVat > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping Cost (excl VAT):</span>
                    <span className="font-medium">{formatCurrency(shippingWithoutVat.toFixed(2))}</span>
                  </div>
                )}
                {discountWithoutVat > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount (excl VAT):</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{formatCurrency(discountWithoutVat.toFixed(2))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Subtotal (excl VAT):</span>
                  <span className="font-medium">{formatCurrency(subtotalWithoutVat.toFixed(2))}</span>
                </div>
                {sortedVatPercentages.map((percentage) => (
                  <div key={percentage} className="flex justify-between">
                    <span className="text-muted-foreground">
                      VAT {formatNumber(parseFloat(percentage), 0)}%:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(vatByPercentage[percentage].toFixed(2))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total (incl VAT):</span>
                  <span>{formatCurrency(subtotalWithVat.toFixed(2))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Sale not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
