import { useEffect, useState, useMemo, useRef } from "react";
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
import type { Product } from "@shared/schema";
import { Calculator } from "lucide-react";
import { formatNumber } from "@/lib/currency";

// Type for packaging units returned by API
type PackagingUnit = {
  id: number;
  amount: number;
  unit: string;
  gramsPerUnit: number;
};

// Form schema for multi-unit entry
const multiUnitEntrySchema = z.object({
  productId: z.number().min(1, "Product is required"),
  locationId: z.number().min(1, "Location is required"),
  inventoryStatus: z.enum(["in_stock", "in_use"]),
  unitCounts: z.record(z.string(), z.number().min(0)),
  looseGrams: z.number().min(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type MultiUnitEntryFormValues = z.infer<typeof multiUnitEntrySchema>;

type ExistingRecord = {
  id: number;
  productId: number;
  productName: string;
  locationId: number;
  countedQuantity: string;
  inventoryStatus: string;
  dueDate?: string | null;
  notes?: string | null;
};

// Normalize status from database format to form format
const normalizeStatus = (status: string): "in_stock" | "in_use" => {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  if (normalized === "in_use") return "in_use";
  return "in_stock";
};

interface MultiUnitEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (productId: number, locationId: number, totalGrams: number, inventoryStatus: string, dueDate?: string, notes?: string) => void;
  sessionId: number;
  isSubmitting?: boolean;
  existingRecord?: ExistingRecord | null; // For edit mode
}

export function MultiUnitEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  sessionId,
  isSubmitting = false,
  existingRecord = null,
}: MultiUnitEntryDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [localUnitCounts, setLocalUnitCounts] = useState<Record<number, number>>({});
  const [localLooseGrams, setLocalLooseGrams] = useState<number>(0);
  const isEditMode = !!existingRecord;

  // Fetch all products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch all locations
  const { data: locations = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/product-locations"],
  });

  // Filter and sort products: only active products, sorted alphabetically
  const activeProducts = useMemo(() => {
    return products
      .filter(p => p.status === "1") // Only active products
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical sort
  }, [products]);

  // Fetch packaging units for selected product
  const { data: packagingUnits = [], isLoading: unitsLoading } = useQuery<PackagingUnit[]>({
    queryKey: [`/api/products/${selectedProductId}/packaging-units`],
    enabled: !!selectedProductId,
  });

  // Determine if product is counted by pieces (stuk) or by weight (gram)
  const isPieceProduct = useMemo(() => {
    if (packagingUnits.length === 0) return false;
    // Check if any unit is "stuk" (piece)
    return packagingUnits.some(u => u.unit.toLowerCase() === "stuk");
  }, [packagingUnits]);

  // Get the display unit label
  const unitLabel = isPieceProduct ? "stuks" : "g";

  const form = useForm<MultiUnitEntryFormValues>({
    resolver: zodResolver(multiUnitEntrySchema),
    defaultValues: {
      productId: existingRecord?.productId || 0,
      locationId: existingRecord?.locationId || 0,
      inventoryStatus: existingRecord ? normalizeStatus(existingRecord.inventoryStatus) : "in_stock",
      unitCounts: {},
      looseGrams: existingRecord ? parseFloat(existingRecord.countedQuantity) : 0,
      dueDate: existingRecord?.dueDate || "",
      notes: existingRecord?.notes || "",
    },
  });

  // Set initial values when editing - reset form and local state
  useEffect(() => {
    if (existingRecord && open) {
      // Reset form with existing record values
      form.reset({
        productId: existingRecord.productId,
        locationId: existingRecord.locationId,
        inventoryStatus: normalizeStatus(existingRecord.inventoryStatus),
        unitCounts: {},
        looseGrams: parseFloat(existingRecord.countedQuantity),
        dueDate: existingRecord.dueDate || "",
        notes: existingRecord.notes || "",
      });
      setSelectedProductId(existingRecord.productId);
      // In edit mode, put the total in looseGrams since we're not breaking it down by packages
      setLocalLooseGrams(parseFloat(existingRecord.countedQuantity));
      setLocalUnitCounts({});
      setCalculatedTotal(parseFloat(existingRecord.countedQuantity));
      // Reset the prevProductIdRef to prevent unwanted resets
      prevProductIdRef.current = existingRecord.productId;
    } else if (!existingRecord && open) {
      // New entry - reset everything
      form.reset({
        productId: 0,
        locationId: 0,
        inventoryStatus: "in_stock",
        unitCounts: {},
        looseGrams: 0,
        dueDate: "",
        notes: "",
      });
      setSelectedProductId(null);
      setLocalUnitCounts({});
      setLocalLooseGrams(0);
      setCalculatedTotal(0);
      prevProductIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRecord, open]);

  // Watch form values for real-time calculation
  const watchedUnitCounts = form.watch("unitCounts");
  const watchedLooseGrams = form.watch("looseGrams");

  // Calculate total whenever unit counts or loose grams change
  useEffect(() => {
    let total = 0;

    // Sum all unit counts
    packagingUnits.forEach((unit) => {
      const count = localUnitCounts[unit.id] || 0;
      total += count * unit.gramsPerUnit;
    });

    // Add loose grams
    total += localLooseGrams || 0;

    setCalculatedTotal(total);
  }, [localUnitCounts, localLooseGrams, packagingUnits]);

  // Reset unit counts when product changes (not on initial selection)
  const prevProductIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (selectedProductId && prevProductIdRef.current !== null && prevProductIdRef.current !== selectedProductId) {
      setLocalUnitCounts({});
      setLocalLooseGrams(0);
      setCalculatedTotal(0);
    }
    prevProductIdRef.current = selectedProductId;
  }, [selectedProductId]);

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    form.setValue("productId", productId);
  };

  const handleSubmit = (values: MultiUnitEntryFormValues) => {
    // Submit with calculated total in grams (always use calculatedTotal since inputs are bound to local state)
    onSubmit(
      values.productId,
      values.locationId,
      calculatedTotal,
      values.inventoryStatus,
      values.dueDate || undefined,
      values.notes
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedProductId(null);
    form.reset();
    setCalculatedTotal(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Count Entry" : "Add Count Entry (Multi-Unit)"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the counted quantity, expiry date, status, or notes for this entry."
              : "Enter counts using the package sizes you see on the shelf."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product*</FormLabel>
                  <Select
                    onValueChange={(value) => handleProductChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                    disabled={isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-product">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && (
                    <p className="text-sm text-gray-500">Product cannot be changed when editing</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Selection */}
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location*</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show packaging units matrix when product is selected */}
            {selectedProductId && !unitsLoading && packagingUnits.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Count by Package Size
                </h3>

                {/* Unit count inputs */}
                {packagingUnits.map((unit) => (
                  <div key={unit.id} className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium">
                      {unit.amount} {unit.unit}
                      <span className="text-xs text-gray-500 ml-1">
                        ({unit.gramsPerUnit}g each)
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={localUnitCounts[unit.id] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setLocalUnitCounts(prev => ({ ...prev, [unit.id]: value }));
                      }}
                      data-testid={`input-unit-${unit.id}`}
                    />
                  </div>
                ))}

                {/* Loose/Rest input */}
                <div className="grid grid-cols-2 gap-4 items-center border-t pt-3">
                  <label className="text-sm font-medium">
                    Loose / Rest ({isPieceProduct ? "stuks" : "grams"})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step={isPieceProduct ? "1" : "0.01"}
                    placeholder="0"
                    value={localLooseGrams || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setLocalLooseGrams(value);
                    }}
                    data-testid="input-loose-grams"
                  />
                </div>

                {/* Total calculation display */}
                <div className="border-t pt-3 bg-white rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total Quantity:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {isPieceProduct ? Math.round(calculatedTotal) : formatNumber(calculatedTotal, 2)} {unitLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Show message if no packaging units found */}
            {selectedProductId && !unitsLoading && packagingUnits.length === 0 && (
              <div className="border rounded-lg p-4 bg-yellow-50 text-yellow-800 text-sm">
                No packaging units defined for this product. Please add sales prices first.
              </div>
            )}

            {/* Inventory Status */}
            <FormField
              control={form.control}
              name="inventoryStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Status*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock (Sealed)</SelectItem>
                      <SelectItem value="in_use">In Use (Opened)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date / Expiry Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      data-testid="input-due-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this count..."
                      rows={2}
                      data-testid="input-notes"
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
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProductId || (isEditMode ? false : calculatedTotal === 0)}
              >
                {isSubmitting
                  ? (isEditMode ? "Updating..." : "Adding...")
                  : (isEditMode
                      ? `Update Entry (${isPieceProduct ? Math.round(calculatedTotal) : formatNumber(calculatedTotal, 0)} ${unitLabel})`
                      : `Add Entry (${isPieceProduct ? Math.round(calculatedTotal) : formatNumber(calculatedTotal, 0)} ${unitLabel})`)}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
