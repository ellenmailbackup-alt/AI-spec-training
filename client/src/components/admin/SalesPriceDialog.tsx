import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const salesPriceFormSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  amount: z.number().min(1, "Amount is required"),
  unit: z.string().min(1, "Unit is required"),
  posItem: z.boolean(),
  webshopPrice: z.boolean(),
  webshopDefault: z.boolean(),
  b2cPriceWithoutVat: z.string().min(1, "B2C price without VAT is required"),
  b2cPriceWithVat: z.string().min(1, "B2C price with VAT is required"),
  b2bPriceWithoutVat: z.string().min(1, "B2B price without VAT is required"),
  b2bPriceWithVat: z.string().min(1, "B2B price with VAT is required"),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
}).refine((data) => {
  return new Date(data.validUntil) >= new Date(data.validFrom);
}, {
  message: "Valid until date must be on or after valid from date",
  path: ["validUntil"],
});

type SalesPriceFormValues = z.infer<typeof salesPriceFormSchema>;

interface SalesPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SalesPriceFormValues) => void;
  defaultValues?: Partial<SalesPriceFormValues>;
  productId: number;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function SalesPriceDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  productId,
  title,
  description,
  isSubmitting = false,
}: SalesPriceDialogProps) {
  // Fetch product units from the API
  const { data: productUnits = [] } = useQuery<Array<{ id: number; weight: number; unit: string }>>({
    queryKey: ["/api/product-units"],
  });

  // Fetch product to get VAT class
  const { data: product } = useQuery<any>({
    queryKey: ["/api/products", productId],
  });

  // Fetch VAT classes to get the percentage
  const { data: vatClasses = [] } = useQuery<Array<{ id: number; name: string; percentage: string }>>({
    queryKey: ["/api/settings/vat-classes"],
  });

  // Get VAT percentage for the product
  const vatPercentage = useMemo(() => {
    if (!product || !vatClasses.length) return 0;
    const vatClass = vatClasses.find(vc => vc.id === product.vatClassId);
    // Database stores percentage as decimal (0.06 for 6%), so don't divide by 100
    const percentage = vatClass ? parseFloat(vatClass.percentage) : 0;
    return percentage;
  }, [product, vatClasses]);

  // Extract unique units (e.g., "g", "kg", "ml", "l")
  const uniqueUnits = useMemo(() => {
    const units = new Set(productUnits.map(pu => pu.unit));
    return Array.from(units).sort();
  }, [productUnits]);

  const form = useForm<SalesPriceFormValues>({
    resolver: zodResolver(salesPriceFormSchema),
    defaultValues: {
      productId: productId,
      amount: defaultValues?.amount || 0,
      unit: defaultValues?.unit || "g",
      posItem: defaultValues?.posItem || false,
      webshopPrice: defaultValues?.webshopPrice || false,
      webshopDefault: (defaultValues as any)?.webshopDefault || false,
      b2cPriceWithoutVat: defaultValues?.b2cPriceWithoutVat || "",
      b2cPriceWithVat: defaultValues?.b2cPriceWithVat || "",
      b2bPriceWithoutVat: defaultValues?.b2bPriceWithoutVat || "",
      b2bPriceWithVat: defaultValues?.b2bPriceWithVat || "",
      validFrom: defaultValues?.validFrom || format(new Date(), "yyyy-MM-dd"),
      validUntil: defaultValues?.validUntil || "9999-12-31",
    },
  });

  // Refs to prevent infinite loops in VAT calculations
  const isCalculatingRef = useRef(false);
  
  // Ref to track if dialog just opened (to prevent reset on defaultValues change)
  const dialogJustOpenedRef = useRef(false);

  // Watch B2C and B2B price fields for auto-calculation
  const b2cPriceWithVat = form.watch("b2cPriceWithVat");
  const b2cPriceWithoutVat = form.watch("b2cPriceWithoutVat");
  const b2bPriceWithVat = form.watch("b2bPriceWithVat");
  const b2bPriceWithoutVat = form.watch("b2bPriceWithoutVat");

  // Auto-calculate B2C price excl VAT when incl VAT changes
  useEffect(() => {
    if (isCalculatingRef.current || !b2cPriceWithVat || vatPercentage <= 0) return;
    
    const withVat = parseFloat(b2cPriceWithVat);
    if (!isNaN(withVat) && withVat > 0) {
      const withoutVat = withVat / (1 + vatPercentage);
      const calculatedValue = withoutVat.toFixed(5);
      
      if (b2cPriceWithoutVat !== calculatedValue) {
        isCalculatingRef.current = true;
        form.setValue("b2cPriceWithoutVat", calculatedValue);
        setTimeout(() => { isCalculatingRef.current = false; }, 50);
      }
    }
  }, [b2cPriceWithVat, vatPercentage, b2cPriceWithoutVat, form]);

  // Auto-calculate B2C price incl VAT when excl VAT changes
  useEffect(() => {
    if (isCalculatingRef.current || !b2cPriceWithoutVat || vatPercentage <= 0) return;
    
    const withoutVat = parseFloat(b2cPriceWithoutVat);
    if (!isNaN(withoutVat) && withoutVat > 0) {
      const withVat = withoutVat * (1 + vatPercentage);
      const calculatedValue = withVat.toFixed(5);
      
      if (b2cPriceWithVat !== calculatedValue) {
        isCalculatingRef.current = true;
        form.setValue("b2cPriceWithVat", calculatedValue);
        setTimeout(() => { isCalculatingRef.current = false; }, 50);
      }
    }
  }, [b2cPriceWithoutVat, vatPercentage, b2cPriceWithVat, form]);

  // Auto-calculate B2B price excl VAT when incl VAT changes
  useEffect(() => {
    if (isCalculatingRef.current || !b2bPriceWithVat || vatPercentage <= 0) return;
    
    const withVat = parseFloat(b2bPriceWithVat);
    if (!isNaN(withVat) && withVat > 0) {
      const withoutVat = withVat / (1 + vatPercentage);
      const calculatedValue = withoutVat.toFixed(5);
      
      if (b2bPriceWithoutVat !== calculatedValue) {
        isCalculatingRef.current = true;
        form.setValue("b2bPriceWithoutVat", calculatedValue);
        setTimeout(() => { isCalculatingRef.current = false; }, 50);
      }
    }
  }, [b2bPriceWithVat, vatPercentage, b2bPriceWithoutVat, form]);

  // Auto-calculate B2B price incl VAT when excl VAT changes
  useEffect(() => {
    if (isCalculatingRef.current || !b2bPriceWithoutVat || vatPercentage <= 0) return;
    
    const withoutVat = parseFloat(b2bPriceWithoutVat);
    if (!isNaN(withoutVat) && withoutVat > 0) {
      const withVat = withoutVat * (1 + vatPercentage);
      const calculatedValue = withVat.toFixed(5);
      
      if (b2bPriceWithVat !== calculatedValue) {
        isCalculatingRef.current = true;
        form.setValue("b2bPriceWithVat", calculatedValue);
        setTimeout(() => { isCalculatingRef.current = false; }, 50);
      }
    }
  }, [b2bPriceWithoutVat, vatPercentage, b2bPriceWithVat, form]);

  // Get available amounts for the currently selected unit
  const selectedUnit = form.watch("unit");
  const availableAmounts = useMemo(() => {
    if (!selectedUnit) return [];
    const amounts = productUnits
      .filter(pu => pu.unit === selectedUnit)
      .map(pu => pu.weight)
      .sort((a, b) => a - b);
    return Array.from(new Set(amounts));
  }, [productUnits, selectedUnit]);

  // Reset form only when dialog opens (not when defaultValues change)
  useEffect(() => {
    if (open && !dialogJustOpenedRef.current) {
      // Mark that dialog just opened
      dialogJustOpenedRef.current = true;
      
      if (defaultValues) {
        form.reset({
          productId: productId,
          amount: defaultValues.amount || 0,
          unit: defaultValues.unit || "g",
          posItem: defaultValues.posItem || false,
          webshopPrice: defaultValues.webshopPrice || false,
          webshopDefault: (defaultValues as any)?.webshopDefault || false,
          b2cPriceWithoutVat: defaultValues.b2cPriceWithoutVat || "",
          b2cPriceWithVat: defaultValues.b2cPriceWithVat || "",
          b2bPriceWithoutVat: defaultValues.b2bPriceWithoutVat || "",
          b2bPriceWithVat: defaultValues.b2bPriceWithVat || "",
          validFrom: defaultValues.validFrom || format(new Date(), "yyyy-MM-dd"),
          validUntil: defaultValues.validUntil || "9999-12-31",
        });
      } else {
        // Reset to fresh defaults when creating new
        form.reset({
          productId: productId,
          amount: 0,
          unit: "g",
          posItem: false,
          webshopPrice: false,
          webshopDefault: false,
          b2cPriceWithoutVat: "",
          b2cPriceWithVat: "",
          b2bPriceWithoutVat: "",
          b2bPriceWithVat: "",
          validFrom: format(new Date(), "yyyy-MM-dd"),
          validUntil: "9999-12-31",
        });
      }
    }
    
    // Reset the flag when dialog closes
    if (!open) {
      dialogJustOpenedRef.current = false;
    }
  }, [open, form, productId]);

  const handleSubmit = (values: SalesPriceFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-sales-price">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset amount to undefined when unit changes to force reselection
                        form.setValue("amount", undefined as any);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder={uniqueUnits.length === 0 ? "No units available" : "Select unit"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueUnits.length === 0 ? (
                          <SelectItem value="__empty__" disabled>No units available</SelectItem>
                        ) : (
                          uniqueUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!selectedUnit || availableAmounts.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-amount">
                          <SelectValue placeholder={!selectedUnit ? "Select unit first" : availableAmounts.length === 0 ? "No amounts available" : "Select amount"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAmounts.length === 0 ? (
                          <SelectItem value="__empty__" disabled>No amounts available</SelectItem>
                        ) : (
                          availableAmounts.map((amount) => (
                            <SelectItem key={amount} value={amount.toString()}>
                              {amount}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <FormField
                control={form.control}
                name="posItem"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-pos-item"
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Tonen in kassa (POS)
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="webshopPrice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("webshopDefault", false);
                          }
                        }}
                        data-testid="checkbox-webshop-price"
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Webshop prijs (B2C)
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("webshopPrice") && (
                <FormField
                  control={form.control}
                  name="webshopDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-webshop-default"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Standaard variant (op productkaart)
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="b2cPriceWithoutVat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>B2C Price (excl. VAT)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-b2c-without-vat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="b2cPriceWithVat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>B2C Price (incl. VAT)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-b2c-with-vat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="b2bPriceWithoutVat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>B2B Price (excl. VAT)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-b2b-without-vat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="b2bPriceWithVat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>B2B Price (incl. VAT)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-b2b-with-vat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-valid-from" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-valid-until" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
