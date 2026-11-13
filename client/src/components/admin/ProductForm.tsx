import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertProduct } from "@shared/schema";

interface ProductFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function ProductForm({ onCancel, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "coffee",
    origin: "",
    roastLevel: "",
    flavorNotes: "",
    sku: "",
    price: "",
    costPrice: "",
    stockQuantity: "",
    lowStockThreshold: "10",
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData: InsertProduct = {
      name: formData.name,
      description: formData.description || null,
      type: formData.type as any,
      origin: formData.origin || null,
      roastLevel: formData.roastLevel || null,
      flavorNotes: formData.flavorNotes || null,
      sku: formData.sku || null,
      price: formData.price,
      costPrice: formData.costPrice || null,
      stockQuantity: parseInt(formData.stockQuantity),
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      isActive: true,
      imageUrl: null,
    };

    createProductMutation.mutate(productData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="font-serif">Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Ethiopian Yirgacheffe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-product-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Product Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger data-testid="select-product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="tea">Tea</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                placeholder="e.g., Ethiopia, Colombia, Darjeeling"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                data-testid="input-origin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roastLevel">Roast Level (for coffee)</Label>
              <Select value={formData.roastLevel} onValueChange={(value) => setFormData({ ...formData, roastLevel: value })}>
                <SelectTrigger data-testid="select-roast-level">
                  <SelectValue placeholder="Select roast level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="medium-dark">Medium-Dark</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="flavorNotes">Flavor Notes</Label>
              <Input
                id="flavorNotes"
                placeholder="e.g., Chocolate, Caramel, Nutty"
                value={formData.flavorNotes}
                onChange={(e) => setFormData({ ...formData, flavorNotes: e.target.value })}
                data-testid="input-flavor-notes"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed product description..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="PROD-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                data-testid="input-sku"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Retail Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="19,99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                data-testid="input-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                placeholder="12,00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                data-testid="input-cost-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Initial Stock *</Label>
              <Input
                id="stockQuantity"
                type="number"
                placeholder="50"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                required
                data-testid="input-stock-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                placeholder="10"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                data-testid="input-low-stock-threshold"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} type="button" data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={createProductMutation.isPending} data-testid="button-save-product">
            {createProductMutation.isPending ? "Saving..." : "Save Product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
