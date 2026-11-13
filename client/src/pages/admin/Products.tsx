import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Trash2, AlertTriangle, Images } from "lucide-react";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage, parseEuropeanNumber } from "@/lib/currency";
import type { ProductType, ProductSubtype, Supplier, VatClass } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProductWithDetails {
  id: number;
  name: string;
  nameDutch: string;
  posShortNameDutch: string;
  picture: string | null;
  productTypeId: number;
  productTypeName: string | null;
  productSubtypeId: number | null;
  productSubtypeName: string | null;
  vatClassId: number;
  vatClassName: string | null;
  vatPercentage: string | null;
  status: string;
  supplierId: number;
  supplierName: string | null;
  supplierProductId: string | null;
  woocommerceId: string | null;
  ownBlend: boolean;
  creationDate: Date;
  modificationDate: Date;
}

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  nameDutch: z.string().min(1, "Dutch name is required"),
  posShortNameDutch: z.string().nullable().optional(),
  productTypeId: z.number().min(1, "Category is required"),
  productSubtypeId: z.number().nullable(),
  supplierId: z.number().min(1, "Supplier is required"),
  vatClassId: z.number().min(1, "VAT class is required"),
  status: z.string().min(1, "Status is required"),
  woocommerceId: z.string().nullable(),
  supplierProductId: z.string().nullable(),
  ownBlend: z.boolean(),
  picture: z.string().nullable(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const ITEMS_PER_PAGE = 25;

type SortColumn = "id" | "name" | "nameDutch" | "productTypeName" | "productSubtypeName" | "supplierName" | "vatPercentage" | "status" | "ownBlend";
type SortDirection = "asc" | "desc";

export default function AdminProducts() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithDetails | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const { data: products = [], isLoading } = useQuery<ProductWithDetails[]>({
    queryKey: ["/api/products"],
  });

  const { data: productTypes = [] } = useQuery<ProductType[]>({
    queryKey: ["/api/settings/product-types"],
  });

  const { data: productSubtypes = [] } = useQuery<ProductSubtype[]>({
    queryKey: ["/api/settings/product-subtypes"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/settings/suppliers"],
  });

  const { data: vatClasses = [] } = useQuery<VatClass[]>({
    queryKey: ["/api/settings/vat-classes"],
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      nameDutch: "",
      posShortNameDutch: "",
      productTypeId: 0,
      productSubtypeId: null,
      supplierId: 0,
      vatClassId: 0,
      status: "1",
      woocommerceId: null,
      supplierProductId: null,
      ownBlend: false,
      picture: null,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      return await apiRequest("POST", "/api/products", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddingProduct(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number; values: ProductFormValues }) => {
      return await apiRequest("PATCH", `/api/products/${data.id}`, data.values);
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${variables.id}`] });
      setEditingProduct(null);
      setIsAddingProduct(false);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/products/upload-image', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.reason || errorData.error || 'Upload failed');
      }
      const data = await response.json();
      form.setValue('picture', data.path);
      setImagePreview(data.path);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    form.setValue('picture', null);
    setImagePreview(null);
    toast({
      title: "Image Removed",
      description: "Product image has been cleared",
    });
  };

  const handleAddProduct = () => {
    setIsAddingProduct(true);
    setEditingProduct(null);
    setImagePreview(null);
    form.reset({
      name: "",
      nameDutch: "",
      posShortNameDutch: "",
      productTypeId: 0,
      productSubtypeId: null,
      supplierId: 0,
      vatClassId: 0,
      status: "1",
      woocommerceId: null,
      supplierProductId: null,
      ownBlend: false,
      picture: null,
    });
  };

  const handleEdit = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setIsAddingProduct(false);
    setImagePreview(product.picture);
    form.reset({
      name: product.name,
      nameDutch: product.nameDutch,
      posShortNameDutch: product.posShortNameDutch || "",
      productTypeId: product.productTypeId,
      productSubtypeId: product.productSubtypeId,
      supplierId: product.supplierId,
      vatClassId: product.vatClassId,
      status: product.status,
      woocommerceId: product.woocommerceId,
      supplierProductId: product.supplierProductId,
      ownBlend: product.ownBlend,
      picture: product.picture,
    });
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    deleteProductMutation.mutate(deletingProduct.id);
    setDeletingProduct(null);
  };

  const handleSubmit = (values: ProductFormValues) => {
    // Normalize empty strings to null
    const normalizedValues = {
      ...values,
      posShortNameDutch: values.posShortNameDutch || undefined,
      productSubtypeId: values.productSubtypeId || null,
      woocommerceId: values.woocommerceId || null,
      supplierProductId: values.supplierProductId || null,
      picture: values.picture || null,
    };

    if (isAddingProduct) {
      createProductMutation.mutate(normalizedValues);
    } else if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, values: normalizedValues });
    }
  };

  const handleFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check all required fields are filled correctly.",
      variant: "destructive",
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
    );
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.nameDutch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm)
    );

    // Sort the filtered products
    return filtered.sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Handle numeric ID sorting
      if (sortColumn === "id") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle percentage sorting
      if (sortColumn === "vatPercentage") {
        aValue = aValue ? parseFloat(aValue) : 0;
        bValue = bValue ? parseFloat(bValue) : 0;
      }

      // Handle boolean ownBlend sorting - map to display strings
      if (sortColumn === "ownBlend") {
        aValue = aValue ? "Yes" : "No";
        bValue = bValue ? "Yes" : "No";
      }

      // Handle null values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset/clamp currentPage when totalPages changes (e.g., after filtering)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (filteredAndSortedProducts.length === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, filteredAndSortedProducts.length]);

  // Get filtered subtypes based on selected product type
  const filteredSubtypes = productSubtypes.filter(
    (st) => st.productTypeId === form.watch("productTypeId")
  );

  if (editingProduct || isAddingProduct) {
    return (
      <AdminLayout>
        <div className="row mb-4">
          <div className="col-12">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <div>
                <h1 className="font-serif text-3xl font-semibold">
                  {isAddingProduct ? "Add New Product" : "Edit Product"}
                </h1>
                <p className="text-muted-foreground">
                  {isAddingProduct ? "Create a new product" : "Update product information"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit, handleFormError)} className="space-y-6">
                    <div className="row">
                      <div className="col-md-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name*</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-6">
                        <FormField
                          control={form.control}
                          name="nameDutch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name Dutch*</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-name-dutch" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <FormField
                          control={form.control}
                          name="posShortNameDutch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>POS Short Name Dutch</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} data-testid="input-pos-short-name-dutch" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="productTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category*</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(parseInt(value));
                                  form.setValue("productSubtypeId", null);
                                }}
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-category">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="productSubtypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sub-Category</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(value ? parseInt(value) : null)
                                }
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-subcategory">
                                    <SelectValue placeholder="Select Sub-Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredSubtypes.map((subtype) => (
                                    <SelectItem key={subtype.id} value={subtype.id.toString()}>
                                      {subtype.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="supplierId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier*</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-supplier">
                                    <SelectValue placeholder="Select Supplier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="vatClassId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT Percentage*</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-vat">
                                    <SelectValue placeholder="Select VAT Percentage" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {vatClasses.map((vat) => (
                                    <SelectItem key={vat.id} value={vat.id.toString()}>
                                      {formatPercentage(parseFloat(vat.percentage) * 100)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status*</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-status">
                                    <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Active</SelectItem>
                                  <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="woocommerceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WooCommerce Product ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-woocommerce-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="supplierProductId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier Product ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-supplier-product-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-3">
                        <FormField
                          control={form.control}
                          name="ownBlend"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Own Blend</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "true")}
                                value={field.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-own-blend">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="space-y-2">
                          <Label htmlFor="image-upload">Product Image</Label>
                          <div className="flex gap-2">
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              data-testid="input-product-image"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMediaLibrary(true)}
                              data-testid="button-choose-from-library"
                            >
                              <Images className="w-4 h-4 mr-1" />
                              Library
                            </Button>
                          </div>
                          {uploadingImage && (
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        {imagePreview && (
                          <div className="space-y-2">
                            <Label>Image Preview</Label>
                            <div className="border rounded p-2">
                              <img
                                src={imagePreview}
                                alt="Product preview"
                                className="h-32 w-32 object-contain rounded"
                                data-testid="img-product-preview"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveImage}
                              data-testid="button-remove-image"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <MediaLibrary
                      open={showMediaLibrary}
                      onOpenChange={setShowMediaLibrary}
                      onSelect={(url) => {
                        form.setValue('picture', url);
                        setImagePreview(url);
                      }}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                        data-testid="button-save"
                      >
                        {createProductMutation.isPending || updateProductMutation.isPending
                          ? isAddingProduct ? "Creating..." : "Saving..."
                          : isAddingProduct ? "Add Product" : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null);
                          setIsAddingProduct(false);
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl font-semibold mb-2">Product Inventory</h1>
              <p className="text-muted-foreground">
                Manage your coffee, tea, and equipment products
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Product Inventory</CardTitle>
                <Button onClick={handleAddProduct} data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Controls Row */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Search:</span>
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64"
                    data-testid="input-search"
                  />
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No products found</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("id")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-id"
                            >
                              #<SortIcon column="id" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Picture
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("name")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-name"
                            >
                              Name<SortIcon column="name" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("nameDutch")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-name-dutch"
                            >
                              Name Dutch<SortIcon column="nameDutch" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("productTypeName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-category"
                            >
                              Category<SortIcon column="productTypeName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("productSubtypeName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-subcategory"
                            >
                              Sub-Category<SortIcon column="productSubtypeName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("supplierName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-supplier"
                            >
                              Supplier<SortIcon column="supplierName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("vatPercentage")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-vat"
                            >
                              VAT %<SortIcon column="vatPercentage" />
                            </Button>
                          </th>
                          <th className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("status")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-status"
                            >
                              Status<SortIcon column="status" />
                            </Button>
                          </th>
                          <th className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("ownBlend")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-own-blend"
                            >
                              Own Blend<SortIcon column="ownBlend" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Actions
                            </Button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((product) => (
                          <tr
                            key={product.id}
                            data-testid={`row-product-${product.id}`}
                            onClick={() => setLocation(`/admin/products/${product.id}`)}
                            className="cursor-pointer"
                          >
                            <td className="text-center font-mono text-sm">{product.id}</td>
                            <td>
                              {product.picture ? (
                                <img
                                  src={product.picture}
                                  alt={product.name}
                                  className="h-12 w-12 object-cover rounded"
                                  data-testid={`img-product-${product.id}`}
                                />
                              ) : (
                                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                                  No Image
                                </div>
                              )}
                            </td>
                            <td className="font-medium">{product.name}</td>
                            <td className="font-medium">{product.nameDutch}</td>
                            <td>
                              <Badge variant="outline" className="capitalize">
                                {product.productTypeName || "-"}
                              </Badge>
                            </td>
                            <td className="text-muted-foreground">
                              {product.productSubtypeName || "-"}
                            </td>
                            <td>{product.supplierName || "-"}</td>
                            <td className="font-mono text-sm">
                              {product.vatPercentage
                                ? formatPercentage(parseFloat(product.vatPercentage) * 100)
                                : "-"}
                            </td>
                            <td className="text-center">
                              <Badge variant={product.status === "1" ? "default" : "secondary"}>
                                {product.status === "1" ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge variant={product.ownBlend ? "default" : "outline"}>
                                {product.ownBlend ? "Yes" : "No"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(product);
                                  }}
                                  data-testid={`button-edit-${product.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingProduct(product);
                                  }}
                                  data-testid={`button-delete-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      
                      {/* Page Numbers with Ellipsis */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages: (number | string)[] = [];
                          const maxVisiblePages = 5;
                          
                          if (totalPages <= maxVisiblePages + 2) {
                            // Show all pages if total is small
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Always show first page
                            pages.push(1);
                            
                            if (currentPage <= 3) {
                              // Near start: show 1,2,3,4,5,...,last
                              for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                                pages.push(i);
                              }
                              if (totalPages > 5) {
                                pages.push('...');
                                pages.push(totalPages);
                              }
                            } else if (currentPage >= totalPages - 2) {
                              // Near end: show 1,...,last-4,last-3,last-2,last-1,last
                              pages.push('...');
                              for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Middle: show 1,...,current-1,current,current+1,...,last
                              pages.push('...');
                              pages.push(currentPage - 1);
                              pages.push(currentPage);
                              pages.push(currentPage + 1);
                              pages.push('...');
                              pages.push(totalPages);
                            }
                          }
                          
                          return pages.map((page, idx) => {
                            if (page === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              );
                            }
                            return (
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page as number)}
                                className="min-w-[2.5rem]"
                                data-testid={`button-page-${page}`}
                              >
                                {page}
                              </Button>
                            );
                          });
                        })()}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent data-testid="dialog-delete-product">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingProduct?.name}</strong>?
              <br /><br />
              <span className="text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
}
