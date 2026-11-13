import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { parseVatToDecimal, parseVatToPercentage } from "@/lib/vat";
import { format } from "date-fns";

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  companyName: string | null;
  b2bClient: boolean;
  b2bPrices: boolean;
};

type Product = {
  id: number;
  name: string;
  nameDutch: string;
  picture: string | null;
  productTypeName: string | null;
  vatPercentage: string | null;
  status: string;
};

type SalesPrice = {
  id: number;
  productId: number;
  amount: number;
  unit: string;
  posItem: boolean;
  b2cPriceWithoutVat: string;
  b2cPriceWithVat: string;
  b2bPriceWithoutVat: string;
  b2bPriceWithVat: string;
  validFrom: string;
  validUntil: string;
};

type PaymentMethod = {
  id: number;
  paymentMethod: string;
};

type SalesStatus = {
  id: number;
  salesStatus: string;
};

type SaleLineItem = {
  productId: number;
  productName: string;
  weight: number;
  unit: string;
  amount: number;
  unitPriceWithoutVat: number;
  unitPriceWithVat: number;
  vatRate: number;
  totalWithoutVat: number;
  totalWithVat: number;
};

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCustomerId?: number;
}

export function NewSaleDialog({ open, onOpenChange, preSelectedCustomerId }: NewSaleDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [salesDate, setSalesDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [statusId, setStatusId] = useState<string>("1"); // Default to "NEW" status
  const [paymentMethodId, setPaymentMethodId] = useState<string>(""); // Empty - allows clearing
  const [webshopSale, setWebshopSale] = useState<boolean>(false);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Shipping state
  const [selectedShippingProductId, setSelectedShippingProductId] = useState<string>("");
  const [shippingCostWithVat, setShippingCostWithVat] = useState<string>("");
  const [shippingCostWithoutVat, setShippingCostWithoutVat] = useState<string>("");

  // Discount state
  const [discountPercentage, setDiscountPercentage] = useState<string>("0");
  const [discountWithVat, setDiscountWithVat] = useState<number>(0);
  const [discountWithoutVat, setDiscountWithoutVat] = useState<number>(0);

  // Set pre-selected customer when dialog opens
  useEffect(() => {
    if (open && preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId.toString());
    }
  }, [open, preSelectedCustomerId]);

  // Fetch customers
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/settings/payment-methods"],
  });

  // Fetch sales statuses
  const { data: salesStatuses } = useQuery<SalesStatus[]>({
    queryKey: ["/api/settings/sales-statuses"],
  });

  // Fetch products for picker
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch sales prices
  const { data: salesPrices } = useQuery<SalesPrice[]>({
    queryKey: ["/api/sales-prices"],
  });

  // Fetch next invoice number
  const { data: nextInvoiceData } = useQuery<{ year: number; nextNumber: number; formattedNumber: string }>({
    queryKey: ["/api/invoice-number/next"],
    enabled: open,
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sales", data);
      return response.json();
    },
    onSuccess: (createdSale: { id: number }) => {
      // Invalidate sales queries
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-number/next"] });

      // Invalidate customer queries to update statistics
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      if (selectedCustomerId) {
        const customerId = parseInt(selectedCustomerId);
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/statistics`] });
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/yearly-sales`] });
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/products-purchased`] });
      }

      onOpenChange(false);
      resetForm();
      toast({
        title: "Sale created successfully",
        description: `Sale #${createdSale.id} has been created.`,
        action: (
          <ToastAction
            altText="View Sale"
            onClick={() => setLocation(`/admin/orders/${createdSale.id}`)}
          >
            View Sale
          </ToastAction>
        ),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sale",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedCustomerId("");
    setSalesDate(format(new Date(), "yyyy-MM-dd"));
    setInvoiceNumber(nextInvoiceData?.formattedNumber || "");
    setStatusId("1"); // Reset to "NEW"
    setPaymentMethodId(""); // Reset to empty
    setWebshopSale(false);
    setLineItems([]);
    setSelectedShippingProductId("");
    setShippingCostWithVat("");
    setShippingCostWithoutVat("");
    setDiscountPercentage("0");
    setDiscountWithVat(0);
    setDiscountWithoutVat(0);
  };

  // Auto-populate invoice number when dialog opens or invoice data changes
  useEffect(() => {
    if (open && nextInvoiceData && !invoiceNumber) {
      setInvoiceNumber(nextInvoiceData.formattedNumber);
    }
  }, [open, nextInvoiceData]);

  // Recalculate discount and shipping VAT when line items change
  useEffect(() => {
    // Recalculate discount amounts when line items change
    const pct = parseFloat(discountPercentage) || 0;
    if (pct > 0 && lineItems.length > 0) {
      const subtotalWithVat = lineItems.reduce((sum, item) => sum + item.totalWithVat, 0);
      const subtotalWithoutVat = lineItems.reduce((sum, item) => sum + item.totalWithoutVat, 0);
      setDiscountWithVat(subtotalWithVat * (pct / 100));
      setDiscountWithoutVat(subtotalWithoutVat * (pct / 100));
    }

    // Recalculate shipping VAT if shipping cost is set and line items changed
    if (shippingCostWithVat && lineItems.length > 0) {
      handleShippingCostChange(shippingCostWithVat);
    }
  }, [lineItems]);

  const handleAddProduct = (
    product: Product,
    salesPrice: SalesPrice,
    quantity: number,
    overriddenPrice?: number
  ) => {
    // VAT percentage is stored as decimal (e.g., "0.21" for 21%)
    const vatDecimal = parseVatToDecimal(product.vatPercentage);
    const vatPercentage = parseVatToPercentage(product.vatPercentage);
    
    // Determine if customer uses B2B prices
    const isB2B = selectedCustomer?.b2bPrices || false;
    
    // Get default price (WITH VAT) from sales price
    const defaultPrice = isB2B
      ? parseFloat(salesPrice.b2bPriceWithVat)
      : parseFloat(salesPrice.b2cPriceWithVat);
    
    // Use overridden price if provided, otherwise use default
    const unitPriceWithVat = overriddenPrice ?? defaultPrice;
    const unitPriceWithoutVat = unitPriceWithVat / (1 + vatDecimal);
    
    const totalWithoutVat = unitPriceWithoutVat * quantity;
    const totalWithVat = unitPriceWithVat * quantity;

    const newItem: SaleLineItem = {
      productId: product.id,
      productName: product.name,
      weight: salesPrice.amount, // Per-unit weight (e.g., 250g)
      unit: salesPrice.unit,
      amount: quantity, // Number of units
      unitPriceWithoutVat,
      unitPriceWithVat,
      vatRate: vatPercentage, // Store as percentage (21, 6, etc.)
      totalWithoutVat,
      totalWithVat,
    };

    setLineItems([...lineItems, newItem]);
    setShowProductPicker(false);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...lineItems];
    const item = updatedItems[index];
    // weight stores per-unit weight (e.g., 250g) - it stays constant
    // only amount (quantity) and totals change
    item.amount = newQuantity;
    item.totalWithoutVat = item.unitPriceWithoutVat * newQuantity;
    item.totalWithVat = item.unitPriceWithVat * newQuantity;
    setLineItems(updatedItems);
  };

  // Handle shipping product selection
  const handleShippingProductChange = (productId: string) => {
    setSelectedShippingProductId(productId === "none" ? "" : productId);

    if (!productId || productId === "none") {
      setShippingCostWithVat("");
      setShippingCostWithoutVat("");
      return;
    }

    // Find the selected shipping product
    const product = products?.find((p) => p.id.toString() === productId);
    if (!product) return;

    // Find the sales price for this product
    const salesPrice = salesPrices?.find((sp) => sp.productId.toString() === productId);
    if (!salesPrice) return;

    // Determine if customer uses B2B prices
    const isB2B = selectedCustomer?.b2bPrices || false;

    // Get the price based on customer type
    const priceWithVat = isB2B
      ? parseFloat(salesPrice.b2bPriceWithVat)
      : parseFloat(salesPrice.b2cPriceWithVat);

    // Calculate price without VAT using the product's VAT rate
    const vatDecimal = parseVatToDecimal(product.vatPercentage);
    const priceWithoutVat = priceWithVat / (1 + vatDecimal);

    setShippingCostWithVat(priceWithVat.toFixed(2));
    setShippingCostWithoutVat(priceWithoutVat.toFixed(5));
  };

  // Handle manual shipping cost change (with VAT)
  const handleShippingCostChange = (value: string) => {
    setShippingCostWithVat(value);

    if (!value || value === "") {
      setShippingCostWithoutVat("");
      return;
    }

    const costWithVat = parseFloat(value);
    if (isNaN(costWithVat)) {
      setShippingCostWithoutVat("");
      return;
    }

    // Calculate VAT rate based on line items
    // If any item has 21% VAT, use 21%, otherwise use 6%
    let shippingVatRate = 0.06; // Default to 6%
    const has21PercentVat = lineItems.some((item) => item.vatRate === 21);
    if (has21PercentVat) {
      shippingVatRate = 0.21;
    } else if (lineItems.length === 0) {
      // If no line items, check if there's a selected shipping product for VAT rate
      if (selectedShippingProductId) {
        const product = products?.find((p) => p.id.toString() === selectedShippingProductId);
        if (product) {
          const vatDecimal = parseVatToDecimal(product.vatPercentage);
          shippingVatRate = vatDecimal;
        }
      }
    }

    const costWithoutVat = costWithVat / (1 + shippingVatRate);
    setShippingCostWithoutVat(costWithoutVat.toFixed(5));
  };

  // Handle discount percentage change
  const handleDiscountPercentageChange = (percentage: string) => {
    setDiscountPercentage(percentage);

    const pct = parseFloat(percentage) || 0;
    if (pct === 0 || lineItems.length === 0) {
      setDiscountWithVat(0);
      setDiscountWithoutVat(0);
      return;
    }

    // Calculate discount from subtotal (line items only, not shipping)
    const subtotalWithVat = lineItems.reduce((sum, item) => sum + item.totalWithVat, 0);
    const subtotalWithoutVat = lineItems.reduce((sum, item) => sum + item.totalWithoutVat, 0);

    const discountAmountWithVat = subtotalWithVat * (pct / 100);
    const discountAmountWithoutVat = subtotalWithoutVat * (pct / 100);

    setDiscountWithVat(discountAmountWithVat);
    setDiscountWithoutVat(discountAmountWithoutVat);
  };

  // Calculate totals by VAT rate
  const totalsByVat = useMemo(() => {
    const grouped: Record<number, { withoutVat: number; withVat: number }> = {};
    lineItems.forEach((item) => {
      if (!grouped[item.vatRate]) {
        grouped[item.vatRate] = { withoutVat: 0, withVat: 0 };
      }
      grouped[item.vatRate].withoutVat += item.totalWithoutVat;
      grouped[item.vatRate].withVat += item.totalWithVat;
    });
    return grouped;
  }, [lineItems]);

  const grandTotal = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalWithVat, 0);
    const shipping = parseFloat(shippingCostWithVat) || 0;
    const discount = discountWithVat || 0;
    return subtotal + shipping - discount;
  }, [lineItems, shippingCostWithVat, discountWithVat]);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers?.find(c => c.id.toString() === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  const handleSubmit = () => {
    // Validate form data
    if (!selectedCustomerId || !statusId || lineItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and add at least one product",
        variant: "destructive",
      });
      return;
    }

    // Determine if this customer requires an invoice number (B2B)
    const requiresInvoiceNumber = selectedCustomer?.b2bClient || false;

    const saleData = {
      customerId: parseInt(selectedCustomerId),
      requiresInvoiceNumber, // Send flag to server to generate invoice number
      salesDate,
      salesStatus: parseInt(statusId),
      paymentMethod: parseInt(paymentMethodId || "1"), // Default to Bank Transfer (ID 1) if empty
      webshopSale,
      shippingCostWithoutVat: shippingCostWithoutVat || "0",
      shippingCostWithVat: shippingCostWithVat || "0",
      discountPercentage: discountPercentage || "0",
      discountWithoutVat: discountWithoutVat.toFixed(5),
      discountWithVat: discountWithVat.toFixed(5),
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        weight: item.weight.toString(),
        unit: item.unit,
        amount: item.amount.toString(),
        unitPriceWithoutVat: item.unitPriceWithoutVat.toFixed(5),
        unitPriceWithVat: item.unitPriceWithVat.toFixed(5),
        totalWithoutVat: item.totalWithoutVat.toFixed(5),
        totalWithVat: item.totalWithVat.toFixed(5),
      })),
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Sale Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sale Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger id="customer" data-testid="select-customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName} {customer.lastName}
                            {customer.companyName && ` - ${customer.companyName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sales-date">Sales Date *</Label>
                    <Input
                      id="sales-date"
                      type="date"
                      value={salesDate}
                      onChange={(e) => setSalesDate(e.target.value)}
                      data-testid="input-sales-date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice-number">
                      Invoice Number {selectedCustomer?.b2bClient && <span className="text-xs text-muted-foreground ml-1">(auto-generated for B2B)</span>}
                    </Label>
                    <Input
                      id="invoice-number"
                      value={selectedCustomer?.b2bClient ? (nextInvoiceData?.formattedNumber || "Loading...") : "Not applicable (B2C)"}
                      readOnly
                      disabled
                      className="bg-muted"
                      data-testid="input-invoice-number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={statusId} onValueChange={setStatusId}>
                      <SelectTrigger id="status" data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesStatuses
                          ?.sort((a, b) => a.id - b.id)
                          .map((status) => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                              {status.salesStatus}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethodId || "none"} onValueChange={(val) => setPaymentMethodId(val === "none" ? "" : val)}>
                      <SelectTrigger id="payment-method" data-testid="select-payment-method">
                        <SelectValue placeholder="Bank Transfer (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground italic">None (use default)</span>
                        </SelectItem>
                        {paymentMethods
                          ?.sort((a, b) => a.id - b.id)
                          .map((method) => (
                            <SelectItem key={method.id} value={method.id.toString()}>
                              {method.paymentMethod}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="webshop-sale"
                    checked={webshopSale}
                    onCheckedChange={(checked) => setWebshopSale(checked === true)}
                    data-testid="checkbox-webshop-sale"
                  />
                  <Label htmlFor="webshop-sale" className="cursor-pointer">
                    Webshop Sale
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Line Items Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Products</CardTitle>
                  <Button onClick={() => setShowProductPicker(true)} size="sm" data-testid="button-add-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products added yet. Click "Add Product" to get started.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Product</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-left p-2">Unit</th>
                          <th className="text-right p-2">Unit Price</th>
                          <th className="text-right p-2">VAT</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-center p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => {
                          return (
                            <tr key={index} className="border-b" data-testid={`row-line-item-${index}`}>
                              <td className="p-2 font-medium">{item.productName}</td>
                              <td className="p-2 text-right">
                                <Input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  min="0"
                                  step="0.01"
                                  data-testid={`input-quantity-${index}`}
                                />
                              </td>
                              <td className="p-2" data-testid={`text-unit-${index}`}>
                                {item.weight} {item.unit}
                              </td>
                              <td className="p-2 text-right">{formatCurrency(item.unitPriceWithVat)}</td>
                              <td className="p-2 text-right">
                                <Badge variant="outline">{item.vatRate}%</Badge>
                              </td>
                              <td className="p-2 text-right font-medium">{formatCurrency(item.totalWithVat)}</td>
                              <td className="p-2 text-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  data-testid={`button-remove-${index}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Cost Section */}
            {lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shipping Cost</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping-product">Shipping Product (Optional)</Label>
                      <Select
                        value={selectedShippingProductId || "none"}
                        onValueChange={handleShippingProductChange}
                      >
                        <SelectTrigger id="shipping-product">
                          <SelectValue placeholder="Select shipping product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">None</span>
                          </SelectItem>
                          {products
                            ?.filter((p) => p.productTypeName?.toLowerCase().includes("shipping") ||
                                           p.productTypeName?.toLowerCase().includes("verzend") ||
                                           p.name.toLowerCase().includes("shipping") ||
                                           p.name.toLowerCase().includes("verzend"))
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.vatPercentage}% VAT)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="shipping-cost">Shipping Cost (with VAT)</Label>
                      <Input
                        id="shipping-cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCostWithVat}
                        onChange={(e) => handleShippingCostChange(e.target.value)}
                        placeholder="0.00"
                      />
                      {shippingCostWithoutVat && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Without VAT: €{parseFloat(shippingCostWithoutVat).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discount Section */}
            {lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Discount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quick Select</Label>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {[0, 5, 10, 15, 20, 25].map((pct) => (
                        <Button
                          key={pct}
                          type="button"
                          variant={discountPercentage === pct.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDiscountPercentageChange(pct.toString())}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount-percentage">Custom Discount %</Label>
                      <Input
                        id="discount-percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Discount Amount (with VAT)</Label>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm">
                        {formatCurrency(discountWithVat)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Without VAT: {formatCurrency(discountWithoutVat)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Totals Section */}
            {lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(totalsByVat).map(([vatRate, totals]) => (
                      <div key={vatRate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subtotal ({vatRate}% VAT):
                        </span>
                        <span>{formatCurrency(totals.withVat)}</span>
                      </div>
                    ))}
                    {shippingCostWithVat && parseFloat(shippingCostWithVat) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>{formatCurrency(parseFloat(shippingCostWithVat))}</span>
                      </div>
                    )}
                    {discountWithVat > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discountPercentage}%):</span>
                        <span>-{formatCurrency(discountWithVat)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold text-lg">
                      <span>Grand Total:</span>
                      <span data-testid="text-grand-total">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createSaleMutation.isPending}
              data-testid="button-submit-sale"
            >
              {createSaleMutation.isPending ? "Creating..." : "Create Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Picker Dialog */}
      {showProductPicker && (
        <ProductPickerDialog
          open={showProductPicker}
          onOpenChange={setShowProductPicker}
          products={products || []}
          salesPrices={salesPrices || []}
          isB2B={selectedCustomer?.b2bPrices || false}
          onAddProduct={handleAddProduct}
        />
      )}
    </>
  );
}

// Product Picker Dialog Component
interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  salesPrices: SalesPrice[];
  isB2B: boolean;
  onAddProduct: (product: Product, salesPrice: SalesPrice, quantity: number, overriddenPrice?: number) => void;
}

function ProductPickerDialog({ open, onOpenChange, products, salesPrices, isB2B, onAddProduct }: ProductPickerDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSalesPrice, setSelectedSalesPrice] = useState<SalesPrice | null>(null);
  const [quantity, setQuantity] = useState<number>(1); // Number of units (e.g., 2x 250g)
  const [overridePrice, setOverridePrice] = useState<string>(""); // Empty means use default

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.filter((p) => p.status === "1");
    const lower = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.status === "1" &&
        (p.name.toLowerCase().includes(lower) ||
          p.nameDutch.toLowerCase().includes(lower) ||
          p.id.toString().includes(lower))
    );
  }, [products, searchTerm]);

  // Get available sales prices for selected product
  const availablePrices = useMemo(() => {
    if (!selectedProduct) return [];
    return salesPrices.filter((sp) => sp.productId === selectedProduct.id);
  }, [selectedProduct, salesPrices]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSalesPrice(null);
    setQuantity(1);
    setOverridePrice("");
  };

  const handleSalesPriceSelect = (salesPrice: SalesPrice) => {
    setSelectedSalesPrice(salesPrice);
    setQuantity(1);
    setOverridePrice(""); // Reset override when changing unit
  };

  const getDefaultPrice = (sp: SalesPrice) => {
    return isB2B ? parseFloat(sp.b2bPriceWithVat) : parseFloat(sp.b2cPriceWithVat);
  };

  const handleAdd = () => {
    if (selectedProduct && selectedSalesPrice && quantity > 0) {
      const finalPrice = overridePrice ? parseFloat(overridePrice) : undefined;
      onAddProduct(selectedProduct, selectedSalesPrice, quantity, finalPrice);
      setSelectedProduct(null);
      setSelectedSalesPrice(null);
      setQuantity(1);
      setOverridePrice("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-product-search"
            />
          </div>

          {/* Product List */}
          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">VAT</th>
                  <th className="text-center p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b hover-elevate"
                    data-testid={`row-product-${product.id}`}
                  >
                    <td className="p-2 font-mono text-sm">{product.id}</td>
                    <td className="p-2 font-medium">{product.name}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {product.productTypeName || "-"}
                    </td>
                    <td className="p-2 text-right text-sm">
                      {product.vatPercentage ? `${parseVatToPercentage(product.vatPercentage).toFixed(0)}%` : "-"}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleProductSelect(product)}
                        data-testid={`button-select-${product.id}`}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Product - Show Available Units */}
          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedProduct.name} - Select Unit/Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Units/Amounts */}
                <div>
                  <Label>Available Units ({isB2B ? "B2B" : "B2C"} Pricing)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availablePrices.length === 0 && (
                      <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                        No sales prices defined for this product
                      </div>
                    )}
                    {availablePrices.map((sp) => {
                      const defaultPrice = getDefaultPrice(sp);
                      const isSelected = selectedSalesPrice?.id === sp.id;
                      return (
                        <Button
                          key={sp.id}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleSalesPriceSelect(sp)}
                          className="flex justify-between items-center h-auto py-3"
                        >
                          <span className="font-medium">
                            {sp.amount} {sp.unit}
                          </span>
                          <span className="text-sm">{formatCurrency(defaultPrice)}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity and Price Override */}
                {selectedSalesPrice && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="quantity">Quantity (units) *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        step="1"
                        data-testid="input-add-quantity"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        = {quantity * selectedSalesPrice.amount} {selectedSalesPrice.unit} total
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="override-price">
                        Override Price (per {selectedSalesPrice.amount} {selectedSalesPrice.unit})
                      </Label>
                      <Input
                        id="override-price"
                        type="number"
                        value={overridePrice}
                        onChange={(e) => setOverridePrice(e.target.value)}
                        placeholder={`Default: ${formatCurrency(getDefaultPrice(selectedSalesPrice))}`}
                        min="0"
                        step="0.01"
                        data-testid="input-add-unit-price"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to use default</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-picker-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedProduct || !selectedSalesPrice || quantity <= 0}
            data-testid="button-picker-add"
          >
            Add to Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
