import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
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
  FormDescription,
} from "@/components/ui/form";

type SortField = 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'companyName' | 'city';
type SortDirection = 'asc' | 'desc';

const customerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").nullable().or(z.literal("")),
  phone: z.string().nullable().or(z.literal("")),
  companyName: z.string().nullable().or(z.literal("")),
  vatNumber: z.string().nullable().or(z.literal("")),
  birthday: z.string().nullable().or(z.literal("")),
  b2bClient: z.boolean(),
  b2bPrices: z.boolean(),
  billingAddressStreet: z.string().nullable().or(z.literal("")),
  billingAddressBus: z.string().nullable().or(z.literal("")),
  billingAddressPostalCode: z.string().nullable().or(z.literal("")),
  billingAddressCity: z.string().nullable().or(z.literal("")),
  shippingAddressStreet: z.string().nullable().or(z.literal("")),
  shippingAddressBus: z.string().nullable().or(z.literal("")),
  shippingAddressPostalCode: z.string().nullable().or(z.literal("")),
  shippingAddressCity: z.string().nullable().or(z.literal("")),
  woocommerceId: z.string().nullable().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function AdminCustomers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [shippingAddressSameAsBilling, setShippingAddressSameAsBilling] = useState(true);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: stats } = useQuery<{
    totalCustomers: number;
    b2bCustomers: number;
    b2cCustomers: number;
    oneTimeCustomers: number;
  }>({
    queryKey: ["/api/customers/stats"],
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      vatNumber: "",
      birthday: "",
      b2bClient: false,
      b2bPrices: false,
      billingAddressStreet: "",
      billingAddressBus: "",
      billingAddressPostalCode: "",
      billingAddressCity: "",
      shippingAddressStreet: "",
      shippingAddressBus: "",
      shippingAddressPostalCode: "",
      shippingAddressCity: "",
      woocommerceId: "",
    },
  });

  // Watch b2bClient field to enforce business logic
  const b2bClient = form.watch("b2bClient");
  const [prevB2bClient, setPrevB2bClient] = useState<boolean | null>(null);

  // When b2bClient changes, manage b2bPrices accordingly
  useEffect(() => {
    // Only act if we have a previous value (i.e., user actively changed the checkbox)
    if (prevB2bClient !== null) {
      if (!b2bClient) {
        // When B2B Client is unchecked, automatically disable B2B Prices
        form.setValue("b2bPrices", false);
      } else if (prevB2bClient === false && b2bClient === true) {
        // When B2B Client is checked (changed from false to true), auto-enable B2B Prices
        form.setValue("b2bPrices", true);
      }
    }
    // Update previous value for next comparison
    setPrevB2bClient(b2bClient);
  }, [b2bClient, form]);

  const createCustomerMutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", "/api/customers", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/stats"] });
      setIsAddingCustomer(false);
      form.reset();
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; values: CustomerFormValues }) => {
      return await apiRequest("PATCH", `/api/customers/${data.id}`, data.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/stats"] });
      setEditingCustomer(null);
      form.reset();
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/stats"] });
      setDeletingCustomer(null);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleAddCustomer = () => {
    setIsAddingCustomer(true);
    setEditingCustomer(null);
    setShippingAddressSameAsBilling(true);
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      vatNumber: "",
      birthday: "",
      b2bClient: false,
      b2bPrices: false,
      billingAddressStreet: "",
      billingAddressBus: "",
      billingAddressPostalCode: "",
      billingAddressCity: "",
      shippingAddressStreet: "",
      shippingAddressBus: "",
      shippingAddressPostalCode: "",
      shippingAddressCity: "",
      woocommerceId: "",
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddingCustomer(false);
    // Determine if shipping address is the same as billing address.
    // Treat a fully-empty shipping address as "same as billing".
    const shippingHasData = !!(
      customer.shippingAddressStreet ||
      customer.shippingAddressBus ||
      customer.shippingAddressPostalCode ||
      customer.shippingAddressCity
    );
    const shippingMatchesBilling =
      (customer.shippingAddressStreet || "") === (customer.billingAddressStreet || "") &&
      (customer.shippingAddressBus || "") === (customer.billingAddressBus || "") &&
      (customer.shippingAddressPostalCode || "") === (customer.billingAddressPostalCode || "") &&
      (customer.shippingAddressCity || "") === (customer.billingAddressCity || "");
    setShippingAddressSameAsBilling(!shippingHasData || shippingMatchesBilling);
    form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || "",
      phone: customer.phone || "",
      companyName: customer.companyName || "",
      vatNumber: customer.vatNumber || "",
      birthday: customer.birthday || "",
      b2bClient: customer.b2bClient,
      b2bPrices: customer.b2bPrices,
      billingAddressStreet: customer.billingAddressStreet || "",
      billingAddressBus: customer.billingAddressBus || "",
      billingAddressPostalCode: customer.billingAddressPostalCode || "",
      billingAddressCity: customer.billingAddressCity || "",
      shippingAddressStreet: customer.shippingAddressStreet || "",
      shippingAddressBus: customer.shippingAddressBus || "",
      shippingAddressPostalCode: customer.shippingAddressPostalCode || "",
      shippingAddressCity: customer.shippingAddressCity || "",
      woocommerceId: customer.woocommerceId || "",
    });
  };

  const handleSubmit = (values: CustomerFormValues) => {
    // When shipping is same as billing, use billing values for shipping fields
    const shippingStreet = shippingAddressSameAsBilling ? values.billingAddressStreet : values.shippingAddressStreet;
    const shippingBus = shippingAddressSameAsBilling ? values.billingAddressBus : values.shippingAddressBus;
    const shippingPostalCode = shippingAddressSameAsBilling ? values.billingAddressPostalCode : values.shippingAddressPostalCode;
    const shippingCity = shippingAddressSameAsBilling ? values.billingAddressCity : values.shippingAddressCity;

    // Normalize empty strings to null for optional fields
    const normalizedValues = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      companyName: values.companyName || null,
      vatNumber: values.vatNumber || null,
      birthday: values.birthday || null,
      billingAddressStreet: values.billingAddressStreet || null,
      billingAddressBus: values.billingAddressBus || null,
      billingAddressPostalCode: values.billingAddressPostalCode || null,
      billingAddressCity: values.billingAddressCity || null,
      shippingAddressStreet: shippingStreet || null,
      shippingAddressBus: shippingBus || null,
      shippingAddressPostalCode: shippingPostalCode || null,
      shippingAddressCity: shippingCity || null,
      woocommerceId: values.woocommerceId || null,
    };

    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, values: normalizedValues });
    } else if (isAddingCustomer) {
      createCustomerMutation.mutate(normalizedValues);
    }
  };

  const handleDelete = () => {
    if (deletingCustomer) {
      deleteCustomerMutation.mutate(deletingCustomer.id);
    }
  };

  // Use stats from API (fallback to client-side calculation if stats not loaded yet)
  const totalCount = stats?.totalCustomers ?? customers.length;
  const b2bCount = stats?.b2bCustomers ?? customers.filter(c => c.b2bClient).length;
  const b2cCount = stats?.b2cCustomers ?? customers.filter(c => !c.b2bClient).length;
  const oneTimeCount = stats?.oneTimeCustomers ?? 0;

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const search = searchTerm.toLowerCase();
      return (
        customer.firstName.toLowerCase().includes(search) ||
        customer.lastName.toLowerCase().includes(search) ||
        (customer.email || '').toLowerCase().includes(search) ||
        (customer.phone || '').toLowerCase().includes(search) ||
        (customer.companyName || '').toLowerCase().includes(search) ||
        customer.id.toString().includes(search)
      );
    });
  }, [customers, searchTerm]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a, b) => {
      let aVal: string | number | null | undefined;
      let bVal: string | number | null | undefined;

      if (sortField === 'city') {
        aVal = a.billingAddressCity || a.shippingAddressCity || '';
        bVal = b.billingAddressCity || b.shippingAddressCity || '';
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      // For numeric fields, use numeric comparison
      if (sortField === 'id') {
        const aNum = typeof aVal === 'number' ? aVal : 0;
        const bNum = typeof bVal === 'number' ? bVal : 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // For other fields, use string comparison
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      const aStr = typeof aVal === 'string' ? aVal.toLowerCase() : String(aVal);
      const bStr = typeof bVal === 'string' ? bVal.toLowerCase() : String(bVal);

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredCustomers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (sortedCustomers.length === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, sortedCustomers.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  if (editingCustomer || isAddingCustomer) {
    return (
      <AdminLayout>
        <div className="row mb-4">
          <div className="col-12">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsAddingCustomer(false);
                }}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
              <div>
                <h1 className="font-serif text-3xl font-semibold">
                  {isAddingCustomer ? "Add New Customer" : "Edit Customer"}
                </h1>
                <p className="text-muted-foreground">
                  {isAddingCustomer ? "Create a new customer account" : "Update customer information"}
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
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-firstname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lastname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="birthday"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Birthday</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} value={field.value || ""} data-testid="input-birthday" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="woocommerceId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WooCommerce ID</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-woocommerce" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-company" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="vatNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>VAT Number</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-vat" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="b2bClient"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base font-semibold">
                                    B2B Client
                                  </FormLabel>
                                  <FormDescription>
                                    Mark as wholesale/business customer
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-b2b-client"
                                    className="scale-150 data-[state=checked]:bg-[hsl(190,60%,45%)] data-[state=unchecked]:bg-gray-300"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormField
                            control={form.control}
                            name="b2bPrices"
                            render={({ field }) => (
                              <FormItem className={`flex flex-row items-center justify-between rounded-md border p-4 ${!b2bClient ? 'opacity-50' : ''}`}>
                                <div className="space-y-0.5">
                                  <FormLabel className={`text-base font-semibold ${!b2bClient ? 'cursor-not-allowed' : ''}`}>
                                    B2B Pricing
                                  </FormLabel>
                                  <FormDescription>
                                    {!b2bClient ? 'Only available for B2B clients' : 'Apply business pricing'}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!b2bClient}
                                    data-testid="switch-b2b-prices"
                                    className="scale-150 data-[state=checked]:bg-[hsl(190,60%,45%)] data-[state=unchecked]:bg-gray-300"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                      <div className="row">
                        <div className="col-md-8 mb-3">
                          <FormField
                            control={form.control}
                            name="billingAddressStreet"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-billing-street" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <FormField
                            control={form.control}
                            name="billingAddressBus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bus/Apt</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-billing-bus" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <FormField
                            control={form.control}
                            name="billingAddressPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-billing-postal" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-md-8 mb-3">
                          <FormField
                            control={form.control}
                            name="billingAddressCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-billing-city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Shipping Address</h3>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="shipping-same-as-billing"
                            checked={shippingAddressSameAsBilling}
                            onCheckedChange={(checked) => {
                              const isSame = checked === true;
                              setShippingAddressSameAsBilling(isSame);
                              if (!isSame) {
                                // Pre-fill shipping with current billing values so user can edit from there
                                form.setValue("shippingAddressStreet", form.getValues("billingAddressStreet"));
                                form.setValue("shippingAddressBus", form.getValues("billingAddressBus"));
                                form.setValue("shippingAddressPostalCode", form.getValues("billingAddressPostalCode"));
                                form.setValue("shippingAddressCity", form.getValues("billingAddressCity"));
                              }
                            }}
                            data-testid="checkbox-shipping-same-as-billing"
                          />
                          <Label htmlFor="shipping-same-as-billing" className="text-sm font-normal cursor-pointer">
                            Same as billing address
                          </Label>
                        </div>
                      </div>
                      {shippingAddressSameAsBilling ? (
                        <p className="text-sm text-muted-foreground">
                          Shipping address will be the same as the billing address.
                        </p>
                      ) : (
                        <div className="row">
                          <div className="col-md-8 mb-3">
                            <FormField
                              control={form.control}
                              name="shippingAddressStreet"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Street</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} data-testid="input-shipping-street" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <FormField
                              control={form.control}
                              name="shippingAddressBus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bus/Apt</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} data-testid="input-shipping-bus" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <FormField
                              control={form.control}
                              name="shippingAddressPostalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} data-testid="input-shipping-postal" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-md-8 mb-3">
                            <FormField
                              control={form.control}
                              name="shippingAddressCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} data-testid="input-shipping-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                        data-testid="button-save"
                      >
                        {isAddingCustomer 
                          ? (createCustomerMutation.isPending ? "Creating..." : "Add Customer")
                          : (updateCustomerMutation.isPending ? "Saving..." : "Save Changes")
                        }
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingCustomer(null);
                          setIsAddingCustomer(false);
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
              <h1 className="font-serif text-3xl font-semibold mb-2">Manage Customers</h1>
              <p className="text-muted-foreground">Manage retail and wholesale customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(190,60%,45%)] text-white border-0">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-5xl font-bold mb-1" data-testid="stat-total-customers">{totalCount}</div>
                  <div className="text-sm font-medium opacity-90">CUSTOMERS</div>
                </div>
                <Users className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal" data-testid="button-more-info-total">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(45,90%,55%)] text-white border-0">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-5xl font-bold mb-1" data-testid="stat-b2b-customers">{b2bCount}</div>
                  <div className="text-sm font-medium opacity-90">B2B Customers</div>
                </div>
                <Users className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal" data-testid="button-more-info-b2b">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(355,75%,60%)] text-white border-0">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-5xl font-bold mb-1" data-testid="stat-b2c-customers">{b2cCount}</div>
                  <div className="text-sm font-medium opacity-90">B2C Customers</div>
                </div>
                <Users className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal" data-testid="button-more-info-b2c">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(145,60%,50%)] text-white border-0">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-5xl font-bold mb-1" data-testid="stat-one-time-customers">{oneTimeCount}</div>
                  <div className="text-sm font-medium opacity-90">ONE TIME CUSTOMERS</div>
                </div>
                <Users className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal" data-testid="button-more-info-onetime">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      <div className="row">
        <div className="col-12">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Customer Directory</CardTitle>
                <Button 
                  onClick={handleAddCustomer}
                  data-testid="button-add-customer-header"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
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
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Search:</span>
                  <Input
                    type="text"
                    placeholder="Search customers..."
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
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading customers...</p>
                  </div>
                </div>
              ) : paginatedCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground">Add wholesale customers or they'll be created automatically from online orders</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('id')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-id"
                            >
                              #
                              <SortIcon field="id" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('firstName')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-firstname"
                            >
                              First Name
                              <SortIcon field="firstName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('lastName')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-lastname"
                            >
                              Last Name
                              <SortIcon field="lastName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('email')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-email"
                            >
                              Email
                              <SortIcon field="email" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('phone')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-phone"
                            >
                              Phone
                              <SortIcon field="phone" />
                            </Button>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                B2B Client
                              </Button>
                            </div>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                B2B Prices
                              </Button>
                            </div>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('companyName')}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-company"
                            >
                              Company Name
                              <SortIcon field="companyName" />
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
                        {paginatedCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            data-testid={`row-customer-${customer.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setLocation(`/admin/customers/${customer.id}`)}
                          >
                            <td className="font-mono text-sm">{customer.id}</td>
                            <td className="font-medium">{customer.firstName}</td>
                            <td className="font-medium">{customer.lastName}</td>
                            <td className="text-muted-foreground text-sm">{customer.email || '-'}</td>
                            <td className="text-muted-foreground text-sm">{customer.phone || '-'}</td>
                            <td className="text-center">
                              <span data-testid={`b2b-client-${customer.id}`}>
                                {customer.b2bClient ? (
                                  <Badge variant="default" className="bg-[hsl(45,90%,55%)] text-white hover:bg-[hsl(45,90%,50%)]">B2B</Badge>
                                ) : (
                                  <Badge variant="secondary">B2C</Badge>
                                )}
                              </span>
                            </td>
                            <td className="text-center">
                              <span data-testid={`b2b-prices-${customer.id}`}>
                                {customer.b2bPrices ? (
                                  <Badge variant="outline" className="border-[hsl(190,60%,45%)] text-[hsl(190,60%,45%)]">B2B Pricing</Badge>
                                ) : (
                                  <Badge variant="secondary">B2C Pricing</Badge>
                                )}
                              </span>
                            </td>
                            <td className="text-muted-foreground text-sm">{customer.companyName || '-'}</td>
                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => handleEdit(customer)}
                                  data-testid={`button-edit-${customer.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeletingCustomer(customer)}
                                  data-testid={`button-delete-${customer.id}`}
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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedCustomers.length)} of {sortedCustomers.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent data-testid="dialog-delete-customer">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCustomer?.firstName} {deletingCustomer?.lastName}</strong>?
              <br /><br />
              <span className="text-destructive">This action cannot be undone. The customer can only be deleted if they have no sales records.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
