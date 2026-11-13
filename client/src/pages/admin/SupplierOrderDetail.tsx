import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle2, Package } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";

type SupplierOrderWithLines = {
  id: number;
  supplierId: number;
  orderDate: string;
  confirmed: boolean;
  confirmationDate: string | null;
  remark: string | null;
  supplier: {
    id: number;
    name: string;
    contactFirstname: string;
    contactLastname: string;
    contactPhone: string;
    contactEmail: string;
  } | null;
  orderLines: Array<{
    id: number;
    supplierOrderId: number;
    productId: number;
    quantity: string;
    product: {
      id: number;
      name: string;
    };
    buyingPrice: {
      id: number;
      price: string;
      currency: string;
      productUnit: string;
      validFrom: string;
      validUntil: string;
    } | null;
  }>;
};

type Product = {
  id: number;
  name: string;
  supplierId: number;
};

type OrderLineFormData = {
  productId: number;
  quantity: string;
};

export default function SupplierOrderDetail() {
  const [, params] = useRoute("/admin/supplier-orders/:id");
  const orderId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddLineDialog, setShowAddLineDialog] = useState(false);
  const [editLineId, setEditLineId] = useState<number | null>(null);
  const [deleteLineId, setDeleteLineId] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: order, isLoading } = useQuery<SupplierOrderWithLines>({
    queryKey: [`/api/supplier-orders/${orderId}`],
    enabled: !!orderId,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products by the order's supplier
  const supplierProducts = products?.filter(
    (p) => p.supplierId === order?.supplierId
  ) || [];

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/supplier-orders/${orderId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Order confirmed and stock movements created",
      });
      setShowConfirmDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { remark: string }) => {
      return await apiRequest("PATCH", `/api/supplier-orders/${orderId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: number) => {
      await apiRequest("DELETE", `/api/supplier-order-lines/${lineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Order line deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order line",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLine = async () => {
    if (deleteLineId) {
      await deleteLineMutation.mutateAsync(deleteLineId);
      setDeleteLineId(null);
    }
  };

  const handleConfirmOrder = async () => {
    await confirmMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">Loading order...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-8">Order not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/supplier-orders")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Supplier Order #{order.id}
            </h1>
            <p className="text-muted-foreground">
              {order.supplier?.name || "Unknown Supplier"}
            </p>
          </div>
          <div>
            {order.confirmed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Confirmed on {format(parseISO(order.confirmationDate!), "dd/MM/yyyy")}
              </Badge>
            ) : (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={order.orderLines.length === 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Order Date</Label>
              <p className="text-sm">{format(parseISO(order.orderDate), "dd MMMM yyyy")}</p>
            </div>
            <div>
              <Label>Status</Label>
              <p className="text-sm">
                {order.confirmed ? (
                  <span className="text-green-600 font-medium">Confirmed</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Pending</span>
                )}
              </p>
            </div>
            <div>
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={order.remark || ""}
                onChange={(e) => {
                  if (!order.confirmed) {
                    updateOrderMutation.mutate({ remark: e.target.value });
                  }
                }}
                disabled={order.confirmed}
                placeholder="Add notes about this order..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm font-medium">{order.supplier?.name || "N/A"}</p>
            </div>
            <div>
              <Label>Contact Person</Label>
              <p className="text-sm">
                {order.supplier?.contactFirstname} {order.supplier?.contactLastname}
              </p>
            </div>
            <div>
              <Label>Phone</Label>
              <p className="text-sm">{order.supplier?.contactPhone}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm">{order.supplier?.contactEmail}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Lines ({order.orderLines.length})
            </CardTitle>
            {!order.confirmed && (
              <Button onClick={() => setShowAddLineDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {order.orderLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products added yet. Add products to this order.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-2 text-sm font-medium">Product</th>
                      <th className="p-2 text-sm font-medium text-right">Quantity</th>
                      <th className="p-2 text-sm font-medium">Unit</th>
                      <th className="p-2 text-sm font-medium text-right">Unit Price</th>
                      <th className="p-2 text-sm font-medium text-right">Line Total</th>
                      {!order.confirmed && (
                        <th className="p-2 text-right text-sm font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderLines.map((line) => {
                      const quantity = parseFloat(line.quantity);
                      const unitPrice = line.buyingPrice ? parseFloat(line.buyingPrice.price) : 0;
                      const lineTotal = quantity * unitPrice;
                      
                      return (
                        <tr key={line.id} className="border-b hover:bg-accent/50">
                          <td className="p-2">
                            <span className="font-medium">
                              {line.product?.name || `Product ID ${line.productId} (not found)`}
                            </span>
                            {!line.product && (
                              <span className="ml-2 text-xs text-yellow-600">⚠ Missing product data</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <span className="text-sm">
                              {new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quantity)}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">
                              {line.buyingPrice?.productUnit || 'units'}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            {line.buyingPrice ? (
                              <span className="text-sm">
                                € {new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(unitPrice)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No active price</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {line.buyingPrice ? (
                              <span className="text-sm font-medium">
                                € {new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(lineTotal)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          {!order.confirmed && (
                            <td className="p-2">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => setEditLineId(line.id)}
                                  disabled={!line.product}
                                  data-testid={`button-edit-${line.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteLineId(line.id)}
                                  data-testid={`button-delete-${line.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Order Total */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Order Total:</span>
                      <span className="text-lg font-bold" data-testid="text-order-total">
                        {(() => {
                          const total = order.orderLines.reduce((sum, line) => {
                            if (line.buyingPrice) {
                              const quantity = parseFloat(line.quantity);
                              const unitPrice = parseFloat(line.buyingPrice.price);
                              return sum + (quantity * unitPrice);
                            }
                            return sum;
                          }, 0);
                          
                          return `€ ${new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showAddLineDialog && (
        <OrderLineDialog
          open={showAddLineDialog}
          onOpenChange={setShowAddLineDialog}
          orderId={order.id}
          products={supplierProducts}
        />
      )}

      {editLineId && (
        <OrderLineDialog
          open={!!editLineId}
          onOpenChange={(open) => !open && setEditLineId(null)}
          orderId={order.id}
          products={supplierProducts}
          line={order.orderLines.find((l) => l.id === editLineId)}
        />
      )}

      <AlertDialog open={!!deleteLineId} onOpenChange={() => setDeleteLineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order line? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLine}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Supplier Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this order? This will create stock movements for
              all products in this order and the order can no longer be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder}>
              Confirm Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function OrderLineDialog({
  open,
  onOpenChange,
  orderId,
  products,
  line,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  products: Product[];
  line?: {
    id: number;
    productId: number;
    quantity: string;
  };
}) {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrderLineFormData>({
    defaultValues: {
      productId: line?.productId,
      quantity: line?.quantity || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: OrderLineFormData) => {
      return await apiRequest("POST", `/api/supplier-orders/${orderId}/lines`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Order line added successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add order line",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrderLineFormData) => {
      return await apiRequest("PATCH", `/api/supplier-order-lines/${line?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Order line updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order line",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderLineFormData) => {
    if (!data.productId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }
    if (!data.quantity || parseFloat(data.quantity) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    if (line) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedProductId = watch("productId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{line ? "Edit" : "Add"} Order Line</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product *</Label>
            <Select
              value={selectedProductId?.toString()}
              onValueChange={(value) => setValue("productId", parseInt(value))}
              disabled={!!line}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {products.length === 0 && (
              <p className="text-sm text-yellow-600">
                No products available from this supplier
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              {...register("quantity", { required: true, min: 0.01 })}
              placeholder="Enter quantity"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : line
                ? "Update"
                : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
