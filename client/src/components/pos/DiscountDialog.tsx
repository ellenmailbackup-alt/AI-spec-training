import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { Discount } from "@/pages/pos/POSPage";
import { formatCurrency } from "@/lib/currency";

interface DiscountDialogProps {
  open: boolean;
  currentDiscount: Discount | null;
  subtotal: number;
  onClose: () => void;
  onApply: (discount: Discount | null) => void;
}

export function DiscountDialog({
  open,
  currentDiscount,
  subtotal,
  onClose,
  onApply,
}: DiscountDialogProps) {
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (currentDiscount) {
      setType(currentDiscount.type);
      setValue(currentDiscount.value.toString());
    } else {
      setValue('');
    }
  }, [currentDiscount, open]);

  const calculateDiscount = () => {
    const numValue = parseFloat(value) || 0;
    if (type === 'percentage') {
      return subtotal * (numValue / 100);
    }
    return numValue;
  };

  const discountAmount = calculateDiscount();
  const newTotal = subtotal - discountAmount;

  const handleApply = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      onApply(null);
    } else {
      onApply({ type, value: numValue });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl" style={{ color: '#8A6959' }}>
            Korting toepassen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Discount Type */}
          <div>
            <Label className="font-medium text-base">Type korting</Label>
            <RadioGroup
              value={type}
              onValueChange={(val) => setType(val as 'percentage' | 'fixed')}
              className="flex gap-4 mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="percentage" 
                  id="percentage"
                  style={{
                    borderColor: '#8A6959',
                    color: '#8A6959'
                  }}
                />
                <Label htmlFor="percentage" className="font-medium">
                  Percentage (in %)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="fixed" 
                  id="fixed"
                  style={{
                    borderColor: '#8A6959',
                    color: '#8A6959'
                  }}
                />
                <Label htmlFor="fixed" className="font-medium">
                  Vast bedrag (€)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Discount Value */}
          <div>
            <Label className="font-medium text-base">
              {type === 'percentage' ? 'Percentage' : 'Bedrag'}
            </Label>
            <Input
              type="number"
              step={type === 'percentage' ? '1' : '0.01'}
              min="0"
              max={type === 'percentage' ? '100' : subtotal.toFixed(2)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percentage' ? '10' : '5,00'}
              className="mt-2 h-14 text-lg font-mono border-2 rounded-xl shadow-sm transition-all duration-200 focus:shadow-md"
              style={{ borderColor: '#CCCECD' }}
              data-testid="input-discount-value"
            />
          </div>

          {/* Preview */}
          {value && parseFloat(value) > 0 && (
            <div className="rounded-xl p-5 space-y-3 transition-all duration-300 animate-in fade-in" style={{ backgroundColor: '#F1F2ED' }}>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground font-medium">Subtotaal</span>
                <span className="font-mono font-semibold" style={{ color: '#8A6959' }}>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-base items-center transition-colors duration-200" style={{ color: '#CCA693' }}>
                <span className="italic flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Korting
                </span>
                <span className="font-mono font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
              
              <div className="h-px" style={{ backgroundColor: '#CCA693', opacity: 0.3 }}></div>
              
              <div className="flex justify-between font-bold text-xl pt-2 transition-all duration-200" style={{ color: '#8A6959' }}>
                <span className="font-serif">Nieuw totaal</span>
                <span className="font-mono text-2xl">{formatCurrency(newTotal)}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            {currentDiscount && (
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                style={{ 
                  backgroundColor: '#F5EBE3',
                  borderColor: '#CCA693',
                  borderWidth: '2px',
                  color: '#8A6959'
                }}
                onClick={() => onApply(null)}
                data-testid="button-remove-discount"
              >
                Verwijder korting
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              style={{ 
                backgroundColor: '#CCCECD',
                borderColor: '#CCCECD',
                borderWidth: '2px',
                color: '#8A6959'
              }}
              onClick={onClose}
              data-testid="button-cancel-discount"
            >
              Annuleren
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:opacity-90"
              style={{ 
                backgroundColor: '#E8BF9C',
                color: '#8A6959',
                border: 'none'
              }}
              onClick={handleApply}
              disabled={!value || parseFloat(value) <= 0}
              data-testid="button-apply-discount"
            >
              Toepassen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
