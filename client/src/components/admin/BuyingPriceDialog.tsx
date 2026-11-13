import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const buyingPriceFormSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  price: z.string().min(1, "Price is required"),
  currency: z.string().min(1, "Currency is required").default("EUR"),
  productUnit: z.string().min(1, "Product unit is required").default("kg"),
  workId: z.number().nullable().optional(),
}).refine((data) => {
  return new Date(data.validUntil) >= new Date(data.validFrom);
}, {
  message: "Valid until date must be on or after valid from date",
  path: ["validUntil"],
});

type BuyingPriceFormValues = z.infer<typeof buyingPriceFormSchema>;

interface BuyingPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BuyingPriceFormValues) => void;
  defaultValues?: Partial<BuyingPriceFormValues>;
  productId: number;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function BuyingPriceDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  productId,
  title,
  description,
  isSubmitting = false,
}: BuyingPriceDialogProps) {
  const form = useForm<BuyingPriceFormValues>({
    resolver: zodResolver(buyingPriceFormSchema),
    defaultValues: {
      productId: productId,
      validFrom: defaultValues?.validFrom || format(new Date(), "yyyy-MM-dd"),
      validUntil: defaultValues?.validUntil || format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
      price: defaultValues?.price || "",
      currency: defaultValues?.currency || "EUR",
      productUnit: defaultValues?.productUnit || "kg",
      workId: defaultValues?.workId || null,
    },
  });

  // Ref to track if dialog just opened (to prevent reset on defaultValues change)
  const dialogJustOpenedRef = useRef(false);

  // Reset form only when dialog opens (not when defaultValues change)
  useEffect(() => {
    if (open && !dialogJustOpenedRef.current) {
      // Mark that dialog just opened
      dialogJustOpenedRef.current = true;

      if (defaultValues) {
        form.reset({
          productId: productId,
          validFrom: defaultValues.validFrom || format(new Date(), "yyyy-MM-dd"),
          validUntil: defaultValues.validUntil || format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
          price: defaultValues.price || "",
          currency: defaultValues.currency || "EUR",
          productUnit: defaultValues.productUnit || "kg",
          workId: defaultValues.workId || null,
        });
      } else {
        // Reset to fresh defaults when creating new
        form.reset({
          productId: productId,
          validFrom: format(new Date(), "yyyy-MM-dd"),
          validUntil: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
          price: "",
          currency: "EUR",
          productUnit: "kg",
          workId: null,
        });
      }
    }

    // Reset the flag when dialog closes
    if (!open) {
      dialogJustOpenedRef.current = false;
    }
  }, [open, form, productId]);

  const handleSubmit = (values: BuyingPriceFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From*</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-valid-from"
                      />
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
                    <FormLabel>Valid Until*</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-valid-until"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency*</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="EUR"
                        data-testid="input-currency"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Unit*</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="kg"
                        data-testid="input-product-unit"
                      />
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
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
