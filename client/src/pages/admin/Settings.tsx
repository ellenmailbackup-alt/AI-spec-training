import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Plus, Trash2, Edit, Package, MapPin, Ruler, Receipt, Coffee, ChevronUp, ChevronDown, AlertTriangle, Link, Layers, Megaphone, Upload, Image, Eye, EyeOff, Truck } from "lucide-react";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import type { Supplier, VatClass, ProductType, ProductSubtype, ProductUnit, ProductLocation, ProductItemStatus, GreenRoastedCoffee, Product, ProductWithRelations, Announcement, GrindSize, FreeShippingPostalCode } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { formatPercentage } from "@/lib/currency";

const tabsListClasses = "grid grid-cols-2 lg:grid-cols-12 gap-2 h-auto p-2 rounded-xl border border-border bg-card shadow-sm";
const tabTriggerClasses = "flex items-center gap-2 justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm [&>svg]:text-current";
const tableClasses = "w-full";
const tableRowClasses = "border-b border-border hover:bg-muted/50 transition-colors";
const tableRowStripedClasses = "border-b border-border even:bg-muted/20 hover:bg-muted/50 transition-colors";
const tableHeaderCellClasses = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground bg-muted/80 border-b-2 border-border";
const tableCellClasses = "px-4 py-3";

const SortIndicator = ({ column, sortColumn, sortDirection }: { column: string; sortColumn: string; sortDirection: 'asc' | 'desc' }) => {
  if (sortColumn !== column) return null;
  return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
};

export default function Settings() {
  const { toast } = useToast();

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="font-serif text-3xl font-semibold">System Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage reference data and system configuration</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Tabs defaultValue="suppliers" className="w-full">
            <TabsList className={tabsListClasses}>
              <TabsTrigger value="suppliers" className={tabTriggerClasses} data-testid="tab-suppliers">
                <Package className="w-4 h-4" />
                Suppliers
              </TabsTrigger>
              <TabsTrigger value="vat" className={tabTriggerClasses} data-testid="tab-vat">
                <Receipt className="w-4 h-4" />
                VAT Classes
              </TabsTrigger>
              <TabsTrigger value="product-types" className={tabTriggerClasses} data-testid="tab-product-types">
                <Package className="w-4 h-4" />
                Product Types
              </TabsTrigger>
              <TabsTrigger value="product-subtypes" className={tabTriggerClasses} data-testid="tab-product-subtypes">
                <Package className="w-4 h-4" />
                Product Subtypes
              </TabsTrigger>
              <TabsTrigger value="units" className={tabTriggerClasses} data-testid="tab-units">
                <Ruler className="w-4 h-4" />
                Product Units
              </TabsTrigger>
              <TabsTrigger value="locations" className={tabTriggerClasses} data-testid="tab-locations">
                <MapPin className="w-4 h-4" />
                Product Locations
              </TabsTrigger>
              <TabsTrigger value="inventory-statuses" className={tabTriggerClasses} data-testid="tab-inventory-statuses">
                <Layers className="w-4 h-4" />
                Inventory Statuses
              </TabsTrigger>
              <TabsTrigger value="boeren-mappings" className={tabTriggerClasses} data-testid="tab-boeren-mappings">
                <Link className="w-4 h-4" />
                Boeren Mappings
              </TabsTrigger>
              <TabsTrigger value="roasts" className={tabTriggerClasses} data-testid="tab-roasts">
                <Coffee className="w-4 h-4" />
                Configure Roasts
              </TabsTrigger>
              <TabsTrigger value="announcements" className={tabTriggerClasses} data-testid="tab-announcements">
                <Megaphone className="w-4 h-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="grind-sizes" className={tabTriggerClasses} data-testid="tab-grind-sizes">
                <Coffee className="w-4 h-4" />
                Grind Sizes
              </TabsTrigger>
              <TabsTrigger value="shipping" className={tabTriggerClasses} data-testid="tab-shipping">
                <Truck className="w-4 h-4" />
                Shipping
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers">
              <SuppliersTab />
            </TabsContent>

            <TabsContent value="vat">
              <VatClassesTab />
            </TabsContent>

            <TabsContent value="product-types">
              <ProductTypesTab />
            </TabsContent>

            <TabsContent value="product-subtypes">
              <ProductSubtypesTab />
            </TabsContent>

            <TabsContent value="units">
              <ProductUnitsTab />
            </TabsContent>

            <TabsContent value="locations">
              <ProductLocationsTab />
            </TabsContent>

            <TabsContent value="inventory-statuses">
              <InventoryStatusesTab />
            </TabsContent>

            <TabsContent value="boeren-mappings">
              <BoerenMappingsTab />
            </TabsContent>

            <TabsContent value="roasts">
              <ConfigureRoastsTab />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementsTab />
            </TabsContent>

            <TabsContent value="grind-sizes">
              <GrindSizesTab />
            </TabsContent>

            <TabsContent value="shipping">
              <ShippingTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}

// Suppliers Tab Component
function SuppliersTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/settings/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/suppliers"] });
      toast({ title: "Success", description: "Supplier created successfully" });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/suppliers"] });
      toast({ title: "Success", description: "Supplier updated successfully" });
      setShowForm(false);
      setEditingSupplier(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/suppliers"] });
      setDeletingSupplier(null);
      toast({ title: "Success", description: "Supplier deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name") as string,
      contactFirstname: formData.get("contactFirstname") as string,
      contactLastname: formData.get("contactLastname") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactEmail: formData.get("contactEmail") as string,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Supplier];
      let bVal: any = b[sortColumn as keyof Supplier];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [suppliers, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Suppliers</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-supplier">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingSupplier && (
                <div>
                  <Label htmlFor="id">ID</Label>
                  <Input id="id" name="id" type="number" defaultValue={editingSupplier.id} disabled data-testid="input-supplier-id" />
                </div>
              )}
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Input id="name" name="name" required defaultValue={editingSupplier?.name || ""} data-testid="input-supplier-name" />
              </div>
              <div>
                <Label htmlFor="contactFirstname">Contact First Name (Optional)</Label>
                <Input id="contactFirstname" name="contactFirstname" defaultValue={editingSupplier?.contactFirstname || ""} data-testid="input-contact-firstname" />
              </div>
              <div>
                <Label htmlFor="contactLastname">Contact Last Name (Optional)</Label>
                <Input id="contactLastname" name="contactLastname" defaultValue={editingSupplier?.contactLastname || ""} data-testid="input-contact-lastname" />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                <Input id="contactPhone" name="contactPhone" defaultValue={editingSupplier?.contactPhone || ""} data-testid="input-contact-phone" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                <Input id="contactEmail" name="contactEmail" type="email" defaultValue={editingSupplier?.contactEmail || ""} data-testid="input-contact-email" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-supplier">
                {editingSupplier ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('contactFirstname')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-contact">
                  Contact<SortIndicator column="contactFirstname" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('contactPhone')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-phone">
                  Phone<SortIndicator column="contactPhone" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('contactEmail')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-email">
                  Email<SortIndicator column="contactEmail" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSuppliers?.map((supplier) => (
                <tr key={supplier.id} className={tableRowStripedClasses} data-testid={`row-supplier-${supplier.id}`}>
                  <td className={tableCellClasses}>{supplier.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{supplier.name}</td>
                  <td className={tableCellClasses}>{supplier.contactFirstname} {supplier.contactLastname}</td>
                  <td className={tableCellClasses}>{supplier.contactPhone}</td>
                  <td className={tableCellClasses}>{supplier.contactEmail}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(supplier)}
                        data-testid={`button-edit-supplier-${supplier.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingSupplier(supplier)}
                        data-testid={`button-delete-supplier-${supplier.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
      <AlertDialogContent data-testid="dialog-delete-supplier">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Supplier
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingSupplier?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingSupplier && deleteMutation.mutate(deletingSupplier.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}

// VAT Classes Tab Component
function VatClassesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingVatClass, setEditingVatClass] = useState<VatClass | null>(null);
  const [deletingVatClass, setDeletingVatClass] = useState<VatClass | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: vatClasses, isLoading } = useQuery<VatClass[]>({
    queryKey: ["/api/settings/vat-classes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/vat-classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/vat-classes"] });
      toast({ title: "Success", description: "VAT class created successfully" });
      setShowForm(false);
      setEditingVatClass(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/vat-classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/vat-classes"] });
      toast({ title: "Success", description: "VAT class updated successfully" });
      setEditingVatClass(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/vat-classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/vat-classes"] });
      setDeletingVatClass(null);
      toast({ title: "Success", description: "VAT class deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const percentageInput = formData.get("percentage") as string;
    const data: any = {
      name: formData.get("name") as string,
      percentage: (parseFloat(percentageInput) / 100).toString(),
    };

    if (editingVatClass) {
      updateMutation.mutate({ id: editingVatClass.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (vatClass: VatClass) => {
    setEditingVatClass(vatClass);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingVatClass(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedVatClasses = useMemo(() => {
    if (!vatClasses) return [];
    return vatClasses.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof VatClass];
      let bVal: any = b[sortColumn as keyof VatClass];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vatClasses, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>VAT Classes</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-vat-class">
            <Plus className="w-4 h-4 mr-2" />
            Add VAT Class
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {editingVatClass && (
                <div>
                  <Label htmlFor="vat-id">ID</Label>
                  <Input id="vat-id" name="id" type="number" defaultValue={editingVatClass.id} disabled data-testid="input-vat-id" />
                </div>
              )}
              <div>
                <Label htmlFor="vat-name">Name</Label>
                <Input id="vat-name" name="name" required defaultValue={editingVatClass?.name || ""} data-testid="input-vat-name" />
              </div>
              <div>
                <Label htmlFor="vat-percentage">Percentage</Label>
                <Input id="vat-percentage" name="percentage" type="number" step="0.01" required defaultValue={editingVatClass ? (parseFloat(editingVatClass.percentage) * 100).toString() : ""} data-testid="input-vat-percentage" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-vat">
                {editingVatClass ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('percentage')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-percentage">
                  Percentage<SortIndicator column="percentage" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVatClasses?.map((vatClass) => (
                <tr key={vatClass.id} className={tableRowStripedClasses} data-testid={`row-vat-${vatClass.id}`}>
                  <td className={tableCellClasses}>{vatClass.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{vatClass.name}</td>
                  <td className={tableCellClasses}>{formatPercentage(parseFloat(vatClass.percentage) * 100, 2)}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(vatClass)}
                        data-testid={`button-edit-vat-${vatClass.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingVatClass(vatClass)}
                        data-testid={`button-delete-vat-${vatClass.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingVatClass} onOpenChange={(open) => !open && setDeletingVatClass(null)}>
      <AlertDialogContent data-testid="dialog-delete-vat-class">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete VAT Class
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingVatClass?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingVatClass && deleteMutation.mutate(deletingVatClass.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Product Types Tab Component
function ProductTypesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [deletingType, setDeletingType] = useState<ProductType | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: productTypes } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/product-types", data),
    onSuccess: (createdType: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({ title: "Success", description: "Product type created successfully" });
      setShowForm(false);
      setEditingType(null);
      if (imageFile && createdType?.id) {
        imageUploadMutation.mutate({ id: createdType.id, file: imageFile });
        setImageFile(null);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/product-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({ title: "Success", description: "Product type updated successfully" });
      setEditingType(null);
      setShowForm(false);
      setImageFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/product-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setDeletingType(null);
      toast({ title: "Success", description: "Product type deleted successfully" });
    },
  });

  const imageUploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`/api/settings/product-types/${id}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({ title: "Success", description: "Category image uploaded" });
    },
  });

  const toggleHomepageMutation = useMutation({
    mutationFn: async ({ id, showOnHomepage, homepageSortOrder }: { id: number; showOnHomepage: boolean; homepageSortOrder?: number }) =>
      apiRequest("PATCH", `/api/settings/product-types/${id}`, { showOnHomepage, ...(homepageSortOrder !== undefined ? { homepageSortOrder } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nameDutchValue = formData.get("nameDutch") as string;
    const data: any = {
      name: formData.get("name") as string,
      nameDutch: nameDutchValue || null,
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data });
      if (imageFile) {
        imageUploadMutation.mutate({ id: editingType.id, file: imageFile });
      }
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = (typeId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageUploadMutation.mutate({ id: typeId, file });
    }
  };

  const handleEdit = (type: ProductType) => {
    setEditingType(type);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setShowForm(false);
    setImageFile(null);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProductTypes = useMemo(() => {
    if (!productTypes) return [];
    return productTypes.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof ProductType];
      let bVal: any = b[sortColumn as keyof ProductType];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productTypes, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Categories (Types)</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-product-type">
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type-name">Name (English)*</Label>
                <Input id="type-name" name="name" required defaultValue={editingType?.name || ""} data-testid="input-type-name" />
              </div>
              <div>
                <Label htmlFor="type-name-dutch">Name (Dutch)</Label>
                <Input id="type-name-dutch" name="nameDutch" defaultValue={editingType?.nameDutch || ""} placeholder="Nederlandse naam" data-testid="input-type-name-dutch" />
              </div>
            </div>
            <div className="mt-3">
              <Label>Image</Label>
              <div className="flex items-center gap-2 mt-1">
                {editingType?.imageUrl && !imageFile && (
                  <img src={editingType.imageUrl} alt={editingType.name} className="w-10 h-10 rounded object-cover" />
                )}
                {imageFile && (
                  <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-10 h-10 rounded object-cover" />
                )}
                <label className="cursor-pointer flex items-center gap-2 border rounded px-3 py-1.5 text-sm hover:bg-muted" data-testid="label-type-image">
                  <Upload className="w-4 h-4" />
                  {imageFile ? imageFile.name : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    data-testid="input-type-image-form"
                  />
                </label>
                {imageFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImageFile(null)} data-testid="button-clear-image">
                    ✕
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-type">
                {editingType ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('nameDutch')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name-dutch">
                  Name (Dutch)<SortIndicator column="nameDutch" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Image</th>
                <th scope="col" className={tableHeaderCellClasses}>Homepage</th>
                <th scope="col" className={tableHeaderCellClasses}>Sort</th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProductTypes?.map((type) => (
                <tr key={type.id} className={tableRowStripedClasses} data-testid={`row-type-${type.id}`}>
                  <td className={tableCellClasses}>{type.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{type.name}</td>
                  <td className={tableCellClasses}>{type.nameDutch || <span className="text-muted-foreground text-xs">—</span>}</td>
                  <td className={tableCellClasses}>
                    <div className="flex items-center gap-2">
                      {type.imageUrl ? (
                        <img src={type.imageUrl} alt={type.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(type.id, e)}
                          data-testid={`input-image-type-${type.id}`}
                        />
                        <Button size="sm" variant="outline" asChild>
                          <span><Upload className="w-3 h-3" /></span>
                        </Button>
                      </label>
                    </div>
                  </td>
                  <td className={tableCellClasses}>
                    <Switch
                      checked={type.showOnHomepage}
                      onCheckedChange={(checked) => toggleHomepageMutation.mutate({ id: type.id, showOnHomepage: checked })}
                      data-testid={`switch-homepage-${type.id}`}
                    />
                  </td>
                  <td className={tableCellClasses}>
                    {type.showOnHomepage && (
                      <Input
                        type="number"
                        className="w-16"
                        defaultValue={type.homepageSortOrder}
                        onBlur={(e) => toggleHomepageMutation.mutate({ id: type.id, showOnHomepage: type.showOnHomepage, homepageSortOrder: parseInt(e.target.value) || 0 })}
                        data-testid={`input-sort-type-${type.id}`}
                      />
                    )}
                  </td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(type)}
                        data-testid={`button-edit-type-${type.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingType(type)}
                        data-testid={`button-delete-type-${type.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
      <AlertDialogContent data-testid="dialog-delete-product-type">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Product Type
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingType?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingType && deleteMutation.mutate(deletingType.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Product Subtypes Tab Component
function ProductSubtypesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSubtype, setEditingSubtype] = useState<ProductSubtype | null>(null);
  const [deletingSubtype, setDeletingSubtype] = useState<ProductSubtype | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: productSubtypes } = useQuery<ProductSubtype[]>({
    queryKey: ["/api/product-subtypes"],
  });

  const { data: productTypes } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/product-subtypes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-subtypes"] });
      toast({ title: "Success", description: "Product subtype created successfully" });
      setShowForm(false);
      setEditingSubtype(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/product-subtypes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-subtypes"] });
      toast({ title: "Success", description: "Product subtype updated successfully" });
      setEditingSubtype(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/product-subtypes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-subtypes"] });
      setDeletingSubtype(null);
      toast({ title: "Success", description: "Product subtype deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      productTypeId: parseInt(formData.get("productTypeId") as string),
    };

    if (editingSubtype) {
      updateMutation.mutate({ id: editingSubtype.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (subtype: ProductSubtype) => {
    setEditingSubtype(subtype);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingSubtype(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProductSubtypes = useMemo(() => {
    if (!productSubtypes) return [];
    return productSubtypes.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof ProductSubtype];
      let bVal: any = b[sortColumn as keyof ProductSubtype];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productSubtypes, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Sub-Categories (Subtypes)</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-product-subtype">
            <Plus className="w-4 h-4 mr-2" />
            Add Subtype
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtype-name">Name</Label>
                <Input id="subtype-name" name="name" required defaultValue={editingSubtype?.name || ""} data-testid="input-subtype-name" />
              </div>
              <div>
                <Label htmlFor="subtype-type">Product Type</Label>
                <select id="subtype-type" name="productTypeId" className="form-select" required defaultValue={editingSubtype?.productTypeId || ""} data-testid="select-product-type">
                  <option value="">Select Type...</option>
                  {productTypes?.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-subtype">
                {editingSubtype ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('productTypeId')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-product-type">
                  Product Type<SortIndicator column="productTypeId" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProductSubtypes?.map((subtype) => (
                <tr key={subtype.id} className={tableRowStripedClasses} data-testid={`row-subtype-${subtype.id}`}>
                  <td className={tableCellClasses}>{subtype.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{subtype.name}</td>
                  <td className={tableCellClasses}>{productTypes?.find(t => t.id === subtype.productTypeId)?.name}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(subtype)}
                        data-testid={`button-edit-subtype-${subtype.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingSubtype(subtype)}
                        data-testid={`button-delete-subtype-${subtype.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingSubtype} onOpenChange={(open) => !open && setDeletingSubtype(null)}>
      <AlertDialogContent data-testid="dialog-delete-product-subtype">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Product Subtype
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingSubtype?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingSubtype && deleteMutation.mutate(deletingSubtype.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Product Units Tab Component
function ProductUnitsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<ProductUnit | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: productUnits } = useQuery<ProductUnit[]>({
    queryKey: ["/api/settings/product-units"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/product-units", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-units"] });
      toast({ title: "Success", description: "Product unit created successfully" });
      setShowForm(false);
      setEditingUnit(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/product-units/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-units"] });
      toast({ title: "Success", description: "Product unit updated successfully" });
      setEditingUnit(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/product-units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-units"] });
      setDeletingUnit(null);
      toast({ title: "Success", description: "Product unit deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      weight: parseInt(formData.get("weight") as string),
      unit: formData.get("unit") as string,
    };

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (unit: ProductUnit) => {
    setEditingUnit(unit);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProductUnits = useMemo(() => {
    if (!productUnits) return [];
    return productUnits.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof ProductUnit];
      let bVal: any = b[sortColumn as keyof ProductUnit];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productUnits, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Units</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-product-unit">
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit-weight">Weight</Label>
                <Input id="unit-weight" name="weight" type="number" required defaultValue={editingUnit?.weight || ""} data-testid="input-unit-weight" />
              </div>
              <div>
                <Label htmlFor="unit-unit">Unit</Label>
                <Input id="unit-unit" name="unit" required placeholder="e.g., gram, kg, stuk" defaultValue={editingUnit?.unit || ""} data-testid="input-unit-unit" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-unit">
                {editingUnit ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('weight')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-weight">
                  Weight<SortIndicator column="weight" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('unit')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-unit">
                  Unit<SortIndicator column="unit" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProductUnits?.map((unit) => (
                <tr key={unit.id} className={tableRowStripedClasses} data-testid={`row-unit-${unit.id}`}>
                  <td className={tableCellClasses}>{unit.id}</td>
                  <td className={tableCellClasses}>{unit.weight}</td>
                  <td className={`${tableCellClasses} font-medium`}>{unit.unit}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(unit)}
                        data-testid={`button-edit-unit-${unit.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingUnit(unit)}
                        data-testid={`button-delete-unit-${unit.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingUnit} onOpenChange={(open) => !open && setDeletingUnit(null)}>
      <AlertDialogContent data-testid="dialog-delete-product-unit">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Product Unit
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingUnit?.weight} {deletingUnit?.unit}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingUnit && deleteMutation.mutate(deletingUnit.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Product Locations Tab Component
function ProductLocationsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ProductLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<ProductLocation | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: productLocations } = useQuery<ProductLocation[]>({
    queryKey: ["/api/settings/product-locations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/product-locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-locations"] });
      toast({ title: "Success", description: "Product location created successfully" });
      setShowForm(false);
      setEditingLocation(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/product-locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-locations"] });
      toast({ title: "Success", description: "Product location updated successfully" });
      setEditingLocation(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/product-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-locations"] });
      setDeletingLocation(null);
      toast({ title: "Success", description: "Product location deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get("name") as string };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (location: ProductLocation) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProductLocations = useMemo(() => {
    if (!productLocations) return [];
    return productLocations.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof ProductLocation];
      let bVal: any = b[sortColumn as keyof ProductLocation];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productLocations, sortColumn, sortDirection]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Locations</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-product-location">
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="location-name">Location Name</Label>
              <Input id="location-name" name="name" required defaultValue={editingLocation?.name || ""} data-testid="input-location-name" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-location">
                {editingLocation ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProductLocations?.map((location) => (
                <tr key={location.id} className={tableRowStripedClasses} data-testid={`row-location-${location.id}`}>
                  <td className={tableCellClasses}>{location.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{location.name}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(location)}
                        data-testid={`button-edit-location-${location.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingLocation(location)}
                        data-testid={`button-delete-location-${location.id}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingLocation} onOpenChange={(open) => !open && setDeletingLocation(null)}>
      <AlertDialogContent data-testid="dialog-delete-product-location">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Product Location
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingLocation?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingLocation && deleteMutation.mutate(deletingLocation.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Inventory Statuses Tab Component
function InventoryStatusesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProductItemStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<ProductItemStatus | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: productItemStatuses } = useQuery<ProductItemStatus[]>({
    queryKey: ["/api/settings/product-statuses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/product-statuses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-statuses"] });
      toast({ title: "Success", description: "Inventory status created successfully" });
      setShowForm(false);
      setEditingStatus(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/product-statuses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-statuses"] });
      toast({ title: "Success", description: "Inventory status updated successfully" });
      setEditingStatus(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/product-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/product-statuses"] });
      setDeletingStatus(null);
      toast({ title: "Success", description: "Inventory status deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory status",
        variant: "destructive",
      });
      setDeletingStatus(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };

    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (status: ProductItemStatus) => {
    setEditingStatus(status);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedStatuses = useMemo(() => {
    if (!productItemStatuses) return [];
    return productItemStatuses.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof ProductItemStatus];
      let bVal: any = b[sortColumn as keyof ProductItemStatus];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productItemStatuses, sortColumn, sortDirection]);

  // Helper to determine if a status is system critical (ID 1 or 2)
  const isSystemCritical = (id: number) => id === 1 || id === 2;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inventory Statuses</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage product inventory statuses. IDs 1 (In Use) and 2 (In Stock) are system critical and cannot be deleted.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-inventory-status">
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="status-name">Status Name</Label>
                <Input
                  id="status-name"
                  name="name"
                  required
                  defaultValue={editingStatus?.name || ""}
                  data-testid="input-status-name"
                  placeholder="e.g., Quarantine, Reserved, Showroom"
                />
              </div>
              <div>
                <Label htmlFor="status-description">Description</Label>
                <Input
                  id="status-description"
                  name="description"
                  defaultValue={editingStatus?.description || ""}
                  data-testid="input-status-description"
                  placeholder="Brief description of this status"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-status">
                {editingStatus ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-id">
                  ID<SortIndicator column="id" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('name')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-name">
                  Name<SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" onClick={() => handleSort('description')} className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`} data-testid="header-description">
                  Description<SortIndicator column="description" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Status</th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStatuses?.map((status) => (
                <tr key={status.id} className={tableRowStripedClasses} data-testid={`row-status-${status.id}`}>
                  <td className={tableCellClasses}>{status.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{status.name}</td>
                  <td className={tableCellClasses}>{status.description || '-'}</td>
                  <td className={tableCellClasses}>
                    {isSystemCritical(status.id) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        <AlertTriangle className="w-3 h-3" />
                        System Critical
                      </span>
                    )}
                    {status.id === 2 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ml-2">
                        Default Sellable
                      </span>
                    )}
                  </td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(status)}
                        data-testid={`button-edit-status-${status.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingStatus(status)}
                        disabled={isSystemCritical(status.id)}
                        data-testid={`button-delete-status-${status.id}`}
                        title={isSystemCritical(status.id) ? "System critical status cannot be deleted" : "Delete status"}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingStatus} onOpenChange={(open) => !open && setDeletingStatus(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Inventory Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deletingStatus?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingStatus && deleteMutation.mutate(deletingStatus.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Boeren Mappings Tab Component
interface BoerenMapping {
  mapBoerenId: string;
  mapSudId: string;
  productName?: string;
  salesPriceInfo?: string;
}

interface SalesPriceWithProduct {
  id: number;
  productId: number;
  amount: number;
  unit: string;
  b2cPriceWithVat: string;
  b2bPriceExclVat: string;
  posItem: boolean;
  validFrom: string;
  validUntil: string;
}

function BoerenMappingsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<BoerenMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<BoerenMapping | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('mapBoerenId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: mappings } = useQuery<BoerenMapping[]>({
    queryKey: ["/api/boeren-import/mappings"],
  });

  const { data: salesPrices } = useQuery<SalesPriceWithProduct[]>({
    queryKey: ["/api/sales-prices"],
  });

  const { data: products } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { productReference: string; salesPriceId: number }) =>
      apiRequest("POST", "/api/boeren-import/save-mapping", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boeren-import/mappings"] });
      toast({ title: "Success", description: "Mapping created successfully" });
      setShowForm(false);
      setEditingMapping(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { productReference: string; salesPriceId: number }) =>
      apiRequest("POST", "/api/boeren-import/save-mapping", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boeren-import/mappings"] });
      toast({ title: "Success", description: "Mapping updated successfully" });
      setEditingMapping(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reference: string) =>
      apiRequest("DELETE", `/api/boeren-import/mappings/${encodeURIComponent(reference)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boeren-import/mappings"] });
      setDeletingMapping(null);
      toast({ title: "Success", description: "Mapping deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      productReference: formData.get("productReference") as string,
      salesPriceId: parseInt(formData.get("salesPriceId") as string),
    };

    if (editingMapping) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (mapping: BoerenMapping) => {
    setEditingMapping(mapping);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMapping(null);
    setShowForm(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedMappings = useMemo(() => {
    if (!mappings) return [];
    return mappings.slice().sort((a, b) => {
      let aVal: any = a[sortColumn as keyof BoerenMapping];
      let bVal: any = b[sortColumn as keyof BoerenMapping];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [mappings, sortColumn, sortDirection]);

  // Create a map of sales prices with product info for the dropdown
  const salesPriceOptions = useMemo(() => {
    if (!salesPrices || !products) return [];

    return salesPrices
      .map(sp => {
        const product = products.find(p => p.id === sp.productId);
        return {
          id: sp.id,
          label: product
            ? `${product.nameDutch || product.name} - ${sp.amount}${sp.unit} - €${sp.b2cPriceWithVat}`
            : `Product #${sp.productId} - ${sp.amount}${sp.unit} - €${sp.b2cPriceWithVat}`,
          productName: product?.nameDutch || product?.name || `Product #${sp.productId}`,
        };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [salesPrices, products]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Boeren en Buren Product Mappings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Map external product references from Boeren en Buren imports to internal sales prices
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-boeren-mapping">
            <Plus className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productReference">External Product Reference</Label>
                <Input
                  id="productReference"
                  name="productReference"
                  required
                  placeholder="e.g., EARL-GREY-100"
                  defaultValue={editingMapping?.mapBoerenId || ""}
                  disabled={!!editingMapping}
                  data-testid="input-product-reference"
                />
                {editingMapping && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reference cannot be changed when editing
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="salesPriceId">Sales Price (Product - Amount - Price)</Label>
                <select
                  id="salesPriceId"
                  name="salesPriceId"
                  className="form-select"
                  required
                  defaultValue={editingMapping?.mapSudId || ""}
                  data-testid="select-sales-price"
                >
                  <option value="">Select Sales Price...</option>
                  {salesPriceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-mapping">
                {editingMapping ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th
                  scope="col"
                  onClick={() => handleSort('mapBoerenId')}
                  className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`}
                  data-testid="header-external-reference"
                >
                  External Reference
                  <SortIndicator column="mapBoerenId" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort('productName')}
                  className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`}
                  data-testid="header-product"
                >
                  Product
                  <SortIndicator column="productName" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort('salesPriceInfo')}
                  className={`${tableHeaderCellClasses} cursor-pointer hover:bg-muted`}
                  data-testid="header-sales-price"
                >
                  Sales Price Info
                  <SortIndicator column="salesPriceInfo" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMappings?.map((mapping) => (
                <tr key={mapping.mapBoerenId} className={tableRowStripedClasses} data-testid={`row-mapping-${mapping.mapBoerenId}`}>
                  <td className={`${tableCellClasses} font-mono text-sm`}>{mapping.mapBoerenId}</td>
                  <td className={`${tableCellClasses} font-medium`}>{mapping.productName || 'Unknown Product'}</td>
                  <td className={tableCellClasses}>{mapping.salesPriceInfo || `Sales Price ID: ${mapping.mapSudId}`}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(mapping)}
                        data-testid={`button-edit-mapping-${mapping.mapBoerenId}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingMapping(mapping)}
                        data-testid={`button-delete-mapping-${mapping.mapBoerenId}`}
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
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingMapping} onOpenChange={(open) => !open && setDeletingMapping(null)}>
      <AlertDialogContent data-testid="dialog-delete-mapping">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Mapping
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the mapping for <strong>{deletingMapping?.mapBoerenId}</strong>?
            {deletingMapping?.productName && (
              <>
                <br />
                This maps to: <strong>{deletingMapping.productName}</strong>
              </>
            )}
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingMapping && deleteMutation.mutate(deletingMapping.mapBoerenId)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Configure Roasts Tab Component
function ConfigureRoastsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GreenRoastedCoffee | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<GreenRoastedCoffee | null>(null);

  const { data: roastConfigs } = useQuery<GreenRoastedCoffee[]>({
    queryKey: ["/api/settings/roast-configurations"],
  });

  const { data: products } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/roast-configurations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/roast-configurations"] });
      toast({ title: "Success", description: "Roast configuration created successfully" });
      setShowForm(false);
      setEditingConfig(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/roast-configurations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/roast-configurations"] });
      toast({ title: "Success", description: "Roast configuration updated successfully" });
      setEditingConfig(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/roast-configurations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/roast-configurations"] });
      setDeletingConfig(null);
      toast({ title: "Success", description: "Roast configuration deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      greenCoffeeId: parseInt(formData.get("greenCoffeeId") as string),
      roastedCoffeeId: parseInt(formData.get("roastedCoffeeId") as string),
    };

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: GreenRoastedCoffee) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setShowForm(false);
  };

  const greenCoffeeForDialog = products?.find((p) => p.id === deletingConfig?.greenCoffeeId);
  const roastedCoffeeForDialog = products?.find((p) => p.id === deletingConfig?.roastedCoffeeId);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Configure Roasts (Green → Roasted Coffee Mapping)</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-roast-config">
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roast-green">Green Coffee</Label>
                <select
                  id="roast-green"
                  name="greenCoffeeId"
                  className="form-select"
                  required
                  defaultValue={editingConfig?.greenCoffeeId || ""}
                  data-testid="select-green-coffee"
                >
                  <option value="">Select Green Coffee...</option>
                  {products
                    ?.filter((p) => p.productTypeName?.toLowerCase().includes("green") && p.status === "1")
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="roast-roasted">Roasted Coffee</Label>
                <select
                  id="roast-roasted"
                  name="roastedCoffeeId"
                  className="form-select"
                  required
                  defaultValue={editingConfig?.roastedCoffeeId || ""}
                  data-testid="select-roasted-coffee"
                >
                  <option value="">Select Roasted Coffee...</option>
                  {products
                    ?.filter((p) => p.productTypeName?.toLowerCase() === "coffee" && p.status === "1")
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-roast-config">
                {editingConfig ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" className={tableHeaderCellClasses}>ID</th>
                <th scope="col" className={tableHeaderCellClasses}>Green Coffee</th>
                <th scope="col" className={tableHeaderCellClasses}>Roasted Coffee</th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roastConfigs?.map((config) => {
                const greenCoffee = products?.find((p) => p.id === config.greenCoffeeId);
                const roastedCoffee = products?.find((p) => p.id === config.roastedCoffeeId);
                return (
                  <tr key={config.id} className={tableRowStripedClasses} data-testid={`row-roast-config-${config.id}`}>
                    <td className={tableCellClasses}>{config.id}</td>
                    <td className={`${tableCellClasses} font-medium`}>{greenCoffee?.name || `Product #${config.greenCoffeeId}`}</td>
                    <td className={`${tableCellClasses} font-medium`}>{roastedCoffee?.name || `Product #${config.roastedCoffeeId}`}</td>
                    <td className={tableCellClasses}>
                      <div className="flex gap-2 justify-start">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          onClick={() => handleEdit(config)}
                          data-testid={`button-edit-roast-config-${config.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingConfig(config)}
                          data-testid={`button-delete-roast-config-${config.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingConfig} onOpenChange={(open) => !open && setDeletingConfig(null)}>
      <AlertDialogContent data-testid="dialog-delete-roast-config">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Roast Configuration
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the mapping from <strong>{greenCoffeeForDialog?.name || `Product #${deletingConfig?.greenCoffeeId}`}</strong> to <strong>{roastedCoffeeForDialog?.name || `Product #${deletingConfig?.roastedCoffeeId}`}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingConfig && deleteMutation.mutate(deletingConfig.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function AnnouncementsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const { data: items } = useQuery<Announcement[]>({
    queryKey: ["/api/settings/announcements"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/announcements"] });
      toast({ title: "Success", description: "Announcement created" });
      setShowForm(false);
      setEditingAnnouncement(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/announcements"] });
      toast({ title: "Success", description: "Announcement updated" });
      setEditingAnnouncement(null);
      setShowForm(false);
    },
  });

  const deleteMutation2 = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/announcements"] });
      setDeletingAnnouncement(null);
      toast({ title: "Success", description: "Announcement deleted" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/settings/announcements/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/announcements"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      text: formData.get("text") as string,
      link: (formData.get("link") as string) || null,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      active: true,
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingAnnouncement(item);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setShowForm(false);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Homepage Announcements</CardTitle>
          <Button onClick={() => { setShowForm(!showForm); setEditingAnnouncement(null); }} data-testid="button-add-announcement">
            <Plus className="w-4 h-4 mr-2" />
            Add Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          These announcements appear in the banner at the top of the homepage. Only active announcements are shown. Use the sort order to control the display sequence.
        </p>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="announcement-text">Announcement Text</Label>
                <Input
                  id="announcement-text"
                  name="text"
                  required
                  placeholder="e.g. Gratis verzending vanaf € 100"
                  defaultValue={editingAnnouncement?.text || ""}
                  data-testid="input-announcement-text"
                />
              </div>
              <div>
                <Label htmlFor="announcement-link">Link (optional)</Label>
                <Input
                  id="announcement-link"
                  name="link"
                  placeholder="e.g. /shipping-info"
                  defaultValue={editingAnnouncement?.link || ""}
                  data-testid="input-announcement-link"
                />
              </div>
              <div>
                <Label htmlFor="announcement-sort">Sort Order</Label>
                <Input
                  id="announcement-sort"
                  name="sortOrder"
                  type="number"
                  defaultValue={editingAnnouncement?.sortOrder ?? 0}
                  data-testid="input-announcement-sort"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-announcement">
                {editingAnnouncement ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" className={tableHeaderCellClasses}>ID</th>
                <th scope="col" className={tableHeaderCellClasses}>Text</th>
                <th scope="col" className={tableHeaderCellClasses}>Link</th>
                <th scope="col" className={tableHeaderCellClasses}>Sort</th>
                <th scope="col" className={tableHeaderCellClasses}>Active</th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id} className={tableRowStripedClasses} data-testid={`row-announcement-${item.id}`}>
                  <td className={tableCellClasses}>{item.id}</td>
                  <td className={`${tableCellClasses} font-medium max-w-xs truncate`}>{item.text}</td>
                  <td className={`${tableCellClasses} text-muted-foreground`}>{item.link || "—"}</td>
                  <td className={tableCellClasses}>{item.sortOrder}</td>
                  <td className={tableCellClasses}>
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: item.id, active: checked })}
                      data-testid={`switch-active-${item.id}`}
                    />
                  </td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-announcement-${item.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingAnnouncement(item)}
                        data-testid={`button-delete-announcement-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No announcements yet. Click "Add Announcement" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingAnnouncement} onOpenChange={(open) => !open && setDeletingAnnouncement(null)}>
      <AlertDialogContent data-testid="dialog-delete-announcement">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Announcement
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "<strong>{deletingAnnouncement?.text}</strong>"?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingAnnouncement && deleteMutation2.mutate(deletingAnnouncement.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation2.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Grind Sizes Tab Component
function GrindSizesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingGrindSize, setEditingGrindSize] = useState<GrindSize | null>(null);
  const [deletingGrindSize, setDeletingGrindSize] = useState<GrindSize | null>(null);

  const { data: grindSizes } = useQuery<GrindSize[]>({
    queryKey: ["/api/settings/grind-sizes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/settings/grind-sizes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/grind-sizes"] });
      toast({ title: "Success", description: "Grind size created successfully" });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/grind-sizes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/grind-sizes"] });
      toast({ title: "Success", description: "Grind size updated successfully" });
      setEditingGrindSize(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/grind-sizes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/grind-sizes"] });
      setDeletingGrindSize(null);
      toast({ title: "Success", description: "Grind size deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    };
    if (editingGrindSize) {
      updateMutation.mutate({ id: editingGrindSize.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (grindSize: GrindSize) => {
    setEditingGrindSize(grindSize);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingGrindSize(null);
    setShowForm(false);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Grind Sizes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage available grind size options shown when ordering coffee in the webshop.
            </p>
          </div>
          <Button onClick={() => { setEditingGrindSize(null); setShowForm(!showForm); }} data-testid="button-add-grind-size">
            <Plus className="w-4 h-4 mr-2" />
            Add Grind Size
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grind-name">Name</Label>
                <Input
                  id="grind-name"
                  name="name"
                  required
                  placeholder="e.g., Hele bonen, Espresso"
                  defaultValue={editingGrindSize?.name || ""}
                  data-testid="input-grind-name"
                />
              </div>
              <div>
                <Label htmlFor="grind-sort-order">Sort Order</Label>
                <Input
                  id="grind-sort-order"
                  name="sortOrder"
                  type="number"
                  placeholder="0"
                  defaultValue={editingGrindSize?.sortOrder ?? 0}
                  data-testid="input-grind-sort-order"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" data-testid="button-submit-grind-size">
                {editingGrindSize ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" className={tableHeaderCellClasses}>ID</th>
                <th scope="col" className={tableHeaderCellClasses}>Name</th>
                <th scope="col" className={tableHeaderCellClasses}>Sort Order</th>
                <th scope="col" className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grindSizes?.map((gs) => (
                <tr key={gs.id} className={tableRowStripedClasses} data-testid={`row-grind-size-${gs.id}`}>
                  <td className={tableCellClasses}>{gs.id}</td>
                  <td className={`${tableCellClasses} font-medium`}>{gs.name}</td>
                  <td className={tableCellClasses}>{gs.sortOrder}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2 justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleEdit(gs)}
                        data-testid={`button-edit-grind-size-${gs.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingGrindSize(gs)}
                        data-testid={`button-delete-grind-size-${gs.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {grindSizes?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No grind sizes configured yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!deletingGrindSize} onOpenChange={(open) => !open && setDeletingGrindSize(null)}>
      <AlertDialogContent data-testid="dialog-delete-grind-size">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Grind Size
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deletingGrindSize?.name}</strong>?
            <br /><br />
            <span className="text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingGrindSize && deleteMutation.mutate(deletingGrindSize.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function ShippingTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deletingCode, setDeletingCode] = useState<FreeShippingPostalCode | null>(null);
  const [threshold, setThreshold] = useState("");
  const [paramsLoaded, setParamsLoaded] = useState(false);

  const { data: shippingParams } = useQuery<{ freeShippingThreshold: string }>({
    queryKey: ["/api/settings/shipping-params"],
  });

  if (shippingParams && !paramsLoaded) {
    setThreshold(shippingParams.freeShippingThreshold);
    setParamsLoaded(true);
  }

  const { data: postalCodes } = useQuery<FreeShippingPostalCode[]>({
    queryKey: ["/api/settings/free-shipping-postal-codes"],
  });

  const saveParamsMutation = useMutation({
    mutationFn: async (data: { freeShippingThreshold: string }) =>
      apiRequest("POST", "/api/settings/shipping-params", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping-params"] });
      toast({ title: "Success", description: "Shipping parameters saved successfully" });
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: { postalCode: string; city?: string }) =>
      apiRequest("POST", "/api/settings/free-shipping-postal-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/free-shipping-postal-codes"] });
      toast({ title: "Success", description: "Free shipping postal code added" });
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add postal code. It may already exist.", variant: "destructive" });
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/settings/free-shipping-postal-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/free-shipping-postal-codes"] });
      setDeletingCode(null);
      toast({ title: "Success", description: "Free shipping postal code removed" });
    },
  });

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    saveParamsMutation.mutate({ freeShippingThreshold: threshold });
  };

  const handleAddCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCodeMutation.mutate({
      postalCode: formData.get("postalCode") as string,
      city: (formData.get("city") as string) || undefined,
    });
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Parameters</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Shipping cost is determined by the shipping products (VERZENDKOSTEN) on the Products page.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveParams} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="free-threshold">Free Shipping Threshold (incl. VAT) in EUR</Label>
              <Input
                id="free-threshold"
                type="number"
                step="0.01"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="100"
                className="max-w-xs"
                data-testid="input-free-threshold"
              />
            </div>
            <div>
              <Button type="submit" disabled={saveParamsMutation.isPending} data-testid="button-save-shipping-params">
                {saveParamsMutation.isPending ? "Saving..." : "Save Parameters"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Free Shipping Postal Codes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Postal codes that always qualify for free shipping (e.g. local pickup area).
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-postal-code">
              <Plus className="w-4 h-4 mr-2" />
              Add Postal Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleAddCode} className="mb-6 p-4 border-2 rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    name="postalCode"
                    required
                    placeholder="e.g., 3000"
                    maxLength={10}
                    data-testid="input-postal-code"
                  />
                </div>
                <div>
                  <Label htmlFor="postal-city">City (optional)</Label>
                  <Input
                    id="postal-city"
                    name="city"
                    placeholder="e.g., Leuven"
                    data-testid="input-postal-city"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit" disabled={createCodeMutation.isPending} data-testid="button-submit-postal-code">
                  {createCodeMutation.isPending ? "Adding..." : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto border rounded-lg">
            <table className={tableClasses}>
              <thead>
                <tr>
                  <th scope="col" className={tableHeaderCellClasses}>Postal Code</th>
                  <th scope="col" className={tableHeaderCellClasses}>City</th>
                  <th scope="col" className={tableHeaderCellClasses}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {postalCodes?.map((pc) => (
                  <tr key={pc.id} className={tableRowStripedClasses} data-testid={`row-postal-code-${pc.id}`}>
                    <td className={`${tableCellClasses} font-medium`}>{pc.postalCode}</td>
                    <td className={tableCellClasses}>{pc.city || "—"}</td>
                    <td className={tableCellClasses}>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingCode(pc)}
                        data-testid={`button-delete-postal-code-${pc.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {postalCodes?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No free shipping postal codes configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <AlertDialog open={!!deletingCode} onOpenChange={(open) => !open && setDeletingCode(null)}>
      <AlertDialogContent data-testid="dialog-delete-postal-code">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Free Shipping Postal Code
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove postal code <strong>{deletingCode?.postalCode}</strong>{deletingCode?.city ? ` (${deletingCode.city})` : ""}?
            Orders shipping to this postal code will no longer receive free shipping automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingCode && deleteCodeMutation.mutate(deletingCode.id)}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete-postal"
          >
            {deleteCodeMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
