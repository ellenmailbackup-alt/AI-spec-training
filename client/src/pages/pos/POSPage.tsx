import { POSLayout } from "@/components/pos/POSLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, ShoppingCart, Receipt, BarChart3, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CustomerSelectionDialog } from "@/components/pos/CustomerSelectionDialog";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { ShoppingCartPanel } from "@/components/pos/ShoppingCartPanel";
import { VariantSelectionDialog } from "@/components/pos/VariantSelectionDialog";
import { DiscountDialog } from "@/components/pos/DiscountDialog";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { DailyReportDialog } from "@/components/pos/DailyReportDialog";
import { PrinterSettingsDialog } from "@/components/pos/PrinterSettingsDialog";

export interface CartItem {
  productId: number;
  productName: string;
  weight: number;
  unit: string;
  amount: number;
  unitPriceWithoutVat: string;
  unitPriceWithVat: string;
  vatClassId: number;
}

export interface POSCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  companyName?: string;
  b2bClient: boolean;
  b2bPrices: boolean;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

export default function POSPage() {
  // Customer state
  const [customer, setCustomer] = useState<POSCustomer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount | null>(null);

  // Load guest customer on mount
  useEffect(() => {
    const loadGuestCustomer = async () => {
      try {
        const res = await apiRequest("GET", "/api/pos/customers/guest");
        const guestCustomer = await res.json();
        setCustomer(guestCustomer);
      } catch (error) {
        console.error("Failed to load guest customer:", error);
      }
    };

    loadGuestCustomer();
  }, []);

  // Product selection state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);
  const [showVariantDialog, setShowVariantDialog] = useState(false);

  // Dialog states
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);

  // Search state
  const [productSearch, setProductSearch] = useState("");

  // Add item to cart
  const addToCart = (item: CartItem) => {
    console.log('🛒 Adding to cart:', {
      productId: item.productId,
      productName: item.productName,
      weight: item.weight,
      unit: item.unit,
      amount: item.amount,
      price: item.unitPriceWithVat
    });
    
    setCartItems(prev => {
      // Check if same product with same variant exists
      const existing = prev.find(
        ci => ci.productId === item.productId && ci.weight === item.weight
      );

      if (existing) {
        // Increment quantity
        console.log('✅ Item exists, updating quantity');
        return prev.map(ci =>
          ci.productId === item.productId && ci.weight === item.weight
            ? { ...ci, amount: ci.amount + item.amount }
            : ci
        );
      }

      // Add new item
      console.log('✅ Adding new item to cart');
      return [...prev, item];
    });
  };

  // Remove item from cart
  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item quantity
  const updateQuantity = (index: number, newAmount: number) => {
    if (newAmount <= 0) {
      removeFromCart(index);
      return;
    }

    setCartItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, amount: newAmount } : item))
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.unitPriceWithVat) * item.amount,
      0
    );

    let discountAmount = 0;
    if (discount) {
      if (discount.type === 'percentage') {
        discountAmount = subtotal * (discount.value / 100);
      } else {
        discountAmount = discount.value;
      }
    }

    const total = subtotal - discountAmount;

    return { subtotal, discountAmount, total };
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  // Handle successful sale
  const handleSaleComplete = async (saleId: number) => {
    setLastSaleId(saleId);
    setShowPaymentDialog(false);
    setShowReceiptDialog(true);

    // Reset cart and reload guest customer
    setCartItems([]);
    setDiscount(null);

    // Reload guest customer for next sale
    try {
      const res = await apiRequest("GET", "/api/pos/customers/guest");
      const guestCustomer = await res.json();
      setCustomer(guestCustomer);
    } catch (error) {
      console.error("Failed to reload guest customer:", error);
    }
  };

  // Handle receipt close
  const handleReceiptClose = () => {
    setShowReceiptDialog(false);
    setLastSaleId(null);
  };

  return (
    <ErrorBoundary>
    <POSLayout>
      <div className="h-full flex flex-col">
        {/* Top Bar - Clean & Zen */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between gap-4">
          {/* Customer Info */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCustomerDialog(true)}
              className="h-12 px-4 border-2 hover:bg-accent/20 transition-all duration-200 font-medium rounded-xl"
            >
              <User className="w-5 h-5 mr-2" />
              {customer
                ? customer.companyName || `${customer.firstName} ${customer.lastName}`
                : 'Selecteer klant'}
            </Button>
            {customer && customer.b2bClient && (
              <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold border border-primary/20">
                B2B
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrinterSettings(true)}
              className="h-10 border-2 hover:bg-muted/50 transition-all duration-200 rounded-lg"
            >
              <Printer className="w-4 h-4 mr-2" />
              Printer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportDialog(true)}
              className="h-10 border-2 hover:bg-muted/50 transition-all duration-200 rounded-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dagrapport
            </Button>
          </div>
        </div>

        {/* Main Content - Zen Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Products Section - 60% */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F1F2ED' }}>
            <ProductGrid
              customerId={customer?.id}
              searchQuery={productSearch}
              onProductSelect={(product) => {
                // If product has only one variant, add directly to cart
                if (product.variants && product.variants.length === 1) {
                  const variant = product.variants[0];
                  const cartItem: CartItem = {
                    productId: product.id,
                    productName: product.posShortNameDutch || product.nameDutch,
                    weight: variant.amount,
                    unit: variant.unit,
                    amount: 1,
                    unitPriceWithoutVat: variant.priceWithoutVat,
                    unitPriceWithVat: variant.priceWithVat,
                    vatClassId: product.vatClassId,
                  };
                  addToCart(cartItem);
                } else {
                  // Show variant selection dialog for multiple variants
                  setSelectedProductForVariant(product);
                  setShowVariantDialog(true);
                }
              }}
            />
          </div>

          {/* Cart Section - 40% */}
          <div className="w-[40%] flex flex-col shadow-lg">
            <ShoppingCartPanel
              items={cartItems}
              customer={customer}
              discount={discount}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onApplyDiscount={() => setShowDiscountDialog(true)}
              onCheckout={() => {
                if (!customer) {
                  setShowCustomerDialog(true);
                  return;
                }
                setShowPaymentDialog(true);
              }}
              onClearCart={() => {
                setCartItems([]);
                setDiscount(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CustomerSelectionDialog
        open={showCustomerDialog}
        onClose={() => {
          setShowCustomerDialog(false);
        }}
        onSelectCustomer={(selectedCustomer) => {
          setCustomer(selectedCustomer);
          setShowCustomerDialog(false);
        }}
      />

      <VariantSelectionDialog
        open={showVariantDialog}
        product={selectedProductForVariant}
        customerId={customer?.id}
        onClose={() => {
          setShowVariantDialog(false);
          setSelectedProductForVariant(null);
        }}
        onAddToCart={(item) => {
          addToCart(item);
          setShowVariantDialog(false);
          setSelectedProductForVariant(null);
        }}
      />

      <DiscountDialog
        open={showDiscountDialog}
        currentDiscount={discount}
        subtotal={subtotal}
        onClose={() => setShowDiscountDialog(false)}
        onApply={(newDiscount) => {
          setDiscount(newDiscount);
          setShowDiscountDialog(false);
        }}
      />

      <PaymentDialog
        open={showPaymentDialog}
        customer={customer!}
        items={cartItems}
        discount={discount}
        total={total}
        onClose={() => setShowPaymentDialog(false)}
        onComplete={handleSaleComplete}
      />

      <ReceiptDialog
        open={showReceiptDialog}
        saleId={lastSaleId}
        onClose={handleReceiptClose}
      />

      <DailyReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />

      <PrinterSettingsDialog
        open={showPrinterSettings}
        onOpenChange={setShowPrinterSettings}
      />
    </POSLayout>
    </ErrorBoundary>
  );
}
