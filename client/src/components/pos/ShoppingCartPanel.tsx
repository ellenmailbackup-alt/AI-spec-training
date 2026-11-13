import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Tag, CreditCard, Coffee } from "lucide-react";
import { CartItem, POSCustomer, Discount } from "@/pages/pos/POSPage";
import { formatCurrency } from "@/lib/currency";

interface ShoppingCartPanelProps {
  items: CartItem[];
  customer: POSCustomer | null;
  discount: Discount | null;
  onUpdateQuantity: (index: number, newAmount: number) => void;
  onRemoveItem: (index: number) => void;
  onApplyDiscount: () => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export function ShoppingCartPanel({
  items,
  customer,
  discount,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onCheckout,
  onClearCart,
}: ShoppingCartPanelProps) {
  // Calculate totals
  const subtotal = items.reduce(
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

  return (
    <div className="flex flex-col h-full bg-[#F1F2ED]">
      {/* Cart Items - Clean & Zen */}
      <div className="flex-1 p-5 overflow-y-auto">
        <h2 className="font-serif font-bold text-xl mb-5 flex items-center gap-2" style={{ color: '#8A6959' }}>
          <Coffee className="w-6 h-6" style={{ color: '#E8BF9C' }} />
          Jouw bestelling
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="relative inline-block mb-6">
              {/* Coffee Cup */}
              <Coffee className="w-24 h-24" style={{ color: '#8A6959', opacity: 0.4 }} />
              {/* Steam effect using SVG paths */}
              <svg className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-12" viewBox="0 0 64 48" fill="none">
                <path d="M20 30 Q 20 20, 25 15 T 30 10" stroke="#8A6959" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <path d="M32 35 Q 32 25, 37 20 T 42 15" stroke="#8A6959" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <path d="M44 30 Q 44 20, 49 15 T 54 10" stroke="#8A6959" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              </svg>
            </div>
            <p className="text-lg font-serif font-semibold mb-2" style={{ color: '#8A6959' }}>Nog geen geluk in je tas?</p>
            <p className="text-base text-muted-foreground italic">Tijd om te proeven</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={index} className="border-2 hover:border-primary/30 transition-all duration-200 hover:shadow-md rounded-xl bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-serif font-semibold text-sm mb-1">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.weight}{item.unit} @ {formatCurrency(item.unitPriceWithVat)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 -mt-1 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemoveItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-2 hover:bg-accent/50 transition-all duration-200 rounded-lg"
                        onClick={() => onUpdateQuantity(index, item.amount - 1)}
                        data-testid={`button-decrease-${index}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-mono text-base w-10 text-center font-semibold">{item.amount}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-2 hover:bg-accent/50 transition-all duration-200 rounded-lg"
                        onClick={() => onUpdateQuantity(index, item.amount + 1)}
                        data-testid={`button-increase-${index}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="font-mono font-bold text-lg text-[#8A6959]">
                      {formatCurrency(parseFloat(item.unitPriceWithVat) * item.amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary - Clear & Prominent */}
      <div className="p-5 space-y-5 bg-white/60 backdrop-blur-sm">
        <div className="space-y-3 bg-white/80 rounded-xl p-4 border border-primary/10">
          <div className="flex justify-between text-base">
            <span className="font-medium" style={{ color: '#939081' }}>Subtotaal</span>
            <span className="font-mono font-semibold text-[#8A6959]">{formatCurrency(subtotal)}</span>
          </div>

          {discount && (
            <div className="flex justify-between text-base text-destructive">
              <span className="font-medium">
                Korting ({discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)})
              </span>
              <span className="font-mono font-semibold">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-2xl pt-2">
            <span className="font-serif font-bold" style={{ color: '#8A6959' }}>Totaal</span>
            <span className="font-mono font-bold text-3xl" style={{ color: '#8A6959' }}>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Discount Button */}
        {!discount && items.length > 0 && (
          <Button
            variant="outline"
            className="w-full border-2 hover:bg-accent/30 transition-all duration-200 rounded-xl"
            onClick={onApplyDiscount}
            data-testid="button-apply-discount"
          >
            <Tag className="w-4 h-4 mr-2" />
            Korting toepassen
          </Button>
        )}

        {/* Action Buttons - Accent Color for Primary Action */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-16 text-xl font-semibold bg-[#E8BF9C] hover:bg-[#E8BF9C]/90 text-[#8A6959] shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] rounded-xl"
            disabled={items.length === 0 || !customer}
            onClick={onCheckout}
            data-testid="button-checkout"
          >
            <CreditCard className="w-6 h-6 mr-2" />
            {items.length === 0 ? 'Winkelwagen leeg' : `Afrekenen - ${formatCurrency(total)}`}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full transition-all duration-200 rounded-2xl"
            style={{ 
              backgroundColor: '#F5EBE3',
              borderColor: '#CCA693',
              borderWidth: '2px',
              color: '#8A6959'
            }}
            onClick={onClearCart}
            disabled={items.length === 0}
            data-testid="button-clear-cart"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Wis winkelwagen
          </Button>
        </div>
      </div>
    </div>
  );
}
