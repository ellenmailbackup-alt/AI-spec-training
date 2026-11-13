import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Product, StockMovementReason } from "@shared/schema";
import { format } from "date-fns";

const stockMovementFormSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  date: z.string().min(1, "Date is required"),
  quantity: z.number({ required_error: "Quantity is required" }),
  reason: z.number().min(1, "Reason is required"),
  remark: z.string().optional(),
  saleId: z.number().nullable().optional(),
  orderId: z.number().nullable().optional(),
  roastId: z.number().nullable().optional(),
  saleslineId: z.number().nullable().optional(),
});

type StockMovementFormValues = z.infer<typeof stockMovementFormSchema>;

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StockMovementFormValues) => void;
  defaultValues?: Partial<StockMovementFormValues>;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
  description,
  isSubmitting = false,
}: StockMovementDialogProps) {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: reasons = [] } = useQuery<StockMovementReason[]>({
    queryKey: ["/api/stock-movement-reasons"],
  });

  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      productId: defaultValues?.productId || 0,
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
      quantity: defaultValues?.quantity || 0,
      reason: defaultValues?.reason || 0,
      remark: defaultValues?.remark || "",
      saleId: defaultValues?.saleId || null,
      orderId: defaultValues?.orderId || null,
      roastId: defaultValues?.roastId || null,
      saleslineId: defaultValues?.saleslineId || null,
    },
  });

  // Reset form when defaultValues change (e.g., when editing different movement)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        productId: defaultValues.productId || 0,
        date: defaultValues.date || format(new Date(), "yyyy-MM-dd"),
        quantity: defaultValues.quantity || 0,
        reason: defaultValues.reason || 0,
        remark: defaultValues.remark || "",
        saleId: defaultValues.saleId || null,
        orderId: defaultValues.orderId || null,
        roastId: defaultValues.roastId || null,
        saleslineId: defaultValues.saleslineId || null,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (values: StockMovementFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                      disabled={!!defaultValues?.productId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date*</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-reason">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reasons.map((reason) => (
                          <SelectItem key={reason.id} value={reason.id.toString()}>
                            {reason.reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (g)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Use + to add, - to remove"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Positive values add stock, negative values remove stock
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remark</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional notes or comments"
                      className="resize-none"
                      rows={3}
                      data-testid="input-remark"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
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
