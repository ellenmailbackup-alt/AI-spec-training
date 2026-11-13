import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CartItem } from "@/pages/pos/POSPage";
import { formatCurrency } from "@/lib/currency";

interface VariantSelectionDialogProps {
  open: boolean;
  product: any;
  customerId?: number;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function VariantSelectionDialog({
  open,
  product,
  customerId,
  onClose,
  onAddToCart,
}: VariantSelectionDialogProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch variants when product changes
  const { data: variants } = useQuery({
    queryKey: ["/api/pos/products/:id/variants", product?.id, customerId],
    queryFn: async () => {
      const params = customerId ? `?customerId=${customerId}` : "";
      const res = await apiRequest("GET", `/api/pos/products/${product.id}/variants${params}`);
      return await res.json();
    },
    enabled: !!product && open,
  });

  // Auto-select if only one variant (in useEffect to avoid setState during render)
  useEffect(() => {
    if (variants && variants.length === 1 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedVariant(null);
      setQuantity(1);
    }
  }, [open]);

  const handleAdd = () => {
    if (!selectedVariant || !product) return;

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.posShortNameDutch || product.nameDutch,
      weight: selectedVariant.amount,
      unit: selectedVariant.unit,
      amount: quantity,
      unitPriceWithoutVat: selectedVariant.priceWithoutVat,
      unitPriceWithVat: selectedVariant.priceWithVat,
      vatClassId: product.vatClassId,
    };

    onAddToCart(cartItem);

    // Reset will happen via useEffect when dialog closes
  };

  if (!product) return null;

  // Convert product name to title case
  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const productDisplayName = toTitleCase(product.posShortNameDutch || product.nameDutch);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl" style={{ color: '#8A6959' }} data-testid="dialog-title-product">
            {productDisplayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Elegant Variant Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block font-serif" style={{ color: '#8A6959' }}>Welk formaat wil je?</label>
            <div className="grid grid-cols-2 gap-3">
              {variants?.map((variant: any) => {
                const isSelected = selectedVariant?.priceId === variant.priceId;
                return (
                  <Card
                    key={variant.priceId}
                    className={`cursor-pointer transition-all duration-200 rounded-xl border-2 ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#E8BF9C] shadow-md'
                        : 'shadow-sm hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#F1F2ED' : '#FAFAF8',
                      borderColor: isSelected ? '#E8BF9C' : '#CCCECD'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#F8F6F2';
                        e.currentTarget.style.borderColor = '#E8BF9C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#FAFAF8';
                        e.currentTarget.style.borderColor = '#CCCECD';
                      }
                    }}
                    onClick={() => setSelectedVariant(variant)}
                    data-testid={`card-variant-${variant.priceId}`}
                  >
                    <CardContent className="p-5 text-center relative">
                      {isSelected && (
                        <div className="absolute top-2 right-2 rounded-full p-1 shadow-sm" style={{ backgroundColor: '#E8BF9C' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="font-bold text-xl mb-2" style={{ color: '#8A6959' }}>
                        {variant.amount} {variant.unit}
                      </p>
                      <p className="text-xs font-mono" style={{ color: '#939081' }}>
                        {formatCurrency(variant.priceWithVat)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Refined Quantity Selection */}
          {selectedVariant && (
            <div>
              <label className="text-sm font-medium mb-3 block" style={{ color: '#8A6959' }}>Aantal</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 rounded-xl"
                  style={{ borderColor: '#CCCECD', color: '#8A6959' }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-mono text-3xl w-20 text-center font-bold" style={{ color: '#8A6959' }} data-testid="text-quantity">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 rounded-xl"
                  style={{ borderColor: '#CCCECD', color: '#8A6959' }}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Elegant Total */}
          {selectedVariant && (
            <div className="pt-3 border-t-2 mt-2" style={{ borderColor: '#CCCECD' }}>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium font-serif" style={{ color: '#939081' }}>Totaal</span>
                <span className="text-3xl font-bold font-mono" style={{ color: '#8A6959' }} data-testid="text-variant-total">
                  {formatCurrency(parseFloat(selectedVariant.priceWithVat) * quantity)}
                </span>
              </div>
            </div>
          )}

          {/* Premium Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 font-medium rounded-xl border-2"
              style={{ borderColor: '#CCCECD', color: '#8A6959' }}
              onClick={onClose}
              data-testid="button-cancel-variant"
            >
              Annuleren
            </Button>
            <Button
              variant="ghost"
              className="flex-1 transition-all duration-200 rounded-xl py-3"
              style={{
                backgroundColor: selectedVariant ? '#8A6959' : '#F1F2ED',
                border: selectedVariant ? '2px solid #8A6959' : '2px solid #C2B197',
                color: selectedVariant ? '#FFFFFF' : '#C2B197',
                cursor: selectedVariant ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: selectedVariant ? '700' : '600',
                lineHeight: '1.4',
                boxShadow: selectedVariant ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedVariant) {
                  e.currentTarget.style.backgroundColor = '#6F5447';
                  e.currentTarget.style.border = '2px solid #6F5447';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedVariant) {
                  e.currentTarget.style.backgroundColor = '#8A6959';
                  e.currentTarget.style.border = '2px solid #8A6959';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.fontWeight = '700';
                } else {
                  e.currentTarget.style.backgroundColor = '#F1F2ED';
                  e.currentTarget.style.border = '2px solid #C2B197';
                  e.currentTarget.style.color = '#C2B197';
                  e.currentTarget.style.fontWeight = '600';
                }
              }}
              disabled={!selectedVariant}
              onClick={handleAdd}
              data-testid="button-add-to-cart"
            >
              Toevoegen aan winkelwagen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
