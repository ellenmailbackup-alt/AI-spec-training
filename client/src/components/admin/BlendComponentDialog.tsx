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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const blendComponentFormSchema = z.object({
  finalProductId: z.number().min(1, "Final product is required"),
  componentProductId: z.number().min(1, "Component product is required"),
  componentPercentage: z.string()
    .min(1, "Percentage is required")
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0 && num <= 100;
    }, {
      message: "Percentage must be between 0 and 100",
    }),
});

type BlendComponentFormValues = z.infer<typeof blendComponentFormSchema>;

interface BlendComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BlendComponentFormValues) => void;
  defaultValues?: Partial<BlendComponentFormValues>;
  productId: number;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function BlendComponentDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  productId,
  title,
  description,
  isSubmitting = false,
}: BlendComponentDialogProps) {
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<BlendComponentFormValues>({
    resolver: zodResolver(blendComponentFormSchema),
    defaultValues: {
      finalProductId: productId,
      componentProductId: defaultValues?.componentProductId || 0,
      componentPercentage: defaultValues?.componentPercentage || "",
    },
  });

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        form.reset({
          finalProductId: productId,
          componentProductId: defaultValues.componentProductId || 0,
          componentPercentage: defaultValues.componentPercentage || "",
        });
      } else {
        form.reset({
          finalProductId: productId,
          componentProductId: 0,
          componentPercentage: "",
        });
      }
    }
  }, [defaultValues, form, productId, open]);

  const handleSubmit = (values: BlendComponentFormValues) => {
    onSubmit({
      finalProductId: values.finalProductId,
      componentProductId: values.componentProductId,
      componentPercentage: parseFloat(values.componentPercentage).toFixed(2),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="componentProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component Product*</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString() || ""}
                    disabled={productsLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-component-product">
                        <SelectValue placeholder="Select a component product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products
                        .filter((p) => p.id !== productId)
                        .map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.nameDutch} ({product.name})
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
              name="componentPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage* (0-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      {...field}
                      data-testid="input-percentage"
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
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? "Saving..." : "Save Component"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
