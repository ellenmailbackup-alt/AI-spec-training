import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import type { Product } from "@shared/schema";
import { format } from "date-fns";

interface RoastWithDetails {
  id: number;
  greenCoffeeId: number;
  greenCoffeeName: string | null;
  greenCoffeeAmount: number;
  roastedCoffeeAmount: number;
  roastDate: string;
  remark: string;
}

const roastFormSchema = z.object({
  greenCoffeeId: z.number().min(1, "Green coffee is required"),
  greenCoffeeAmount: z.number().min(1, "Green coffee amount must be greater than 0"),
  roastedCoffeeAmount: z.number().min(1, "Roasted coffee amount must be greater than 0"),
  roastDate: z.string().min(1, "Roast date is required"),
  remark: z.string(),
});

type RoastFormValues = z.infer<typeof roastFormSchema>;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

type SortColumn = "id" | "greenCoffeeName" | "roastDate" | "greenCoffeeAmount" | "roastedCoffeeAmount";
type SortDirection = "asc" | "desc";

export default function AdminRoasts() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingRoast, setEditingRoast] = useState<RoastWithDetails | null>(null);
  const [isAddingRoast, setIsAddingRoast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("roastDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deletingRoast, setDeletingRoast] = useState<RoastWithDetails | null>(null);
  const [selectedGreenCoffee, setSelectedGreenCoffee] = useState<string>("all");

  const { data: roasts = [], isLoading } = useQuery<RoastWithDetails[]>({
    queryKey: ["/api/roasts"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<RoastFormValues>({
    resolver: zodResolver(roastFormSchema),
    defaultValues: {
      greenCoffeeId: 0,
      greenCoffeeAmount: 0,
      roastedCoffeeAmount: 0,
      roastDate: "",
      remark: "",
    },
  });

  const createRoastMutation = useMutation({
    mutationFn: async (values: RoastFormValues) => {
      return await apiRequest("POST", "/api/roasts", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roasts"] });
      setIsAddingRoast(false);
      setEditingRoast(null);
      form.reset();
      toast({
        title: "Success",
        description: "Roast created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create roast",
        variant: "destructive",
      });
    },
  });

  const updateRoastMutation = useMutation({
    mutationFn: async (data: { id: number; values: RoastFormValues }) => {
      return await apiRequest("PATCH", `/api/roasts/${data.id}`, data.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roasts"] });
      setEditingRoast(null);
      setIsAddingRoast(false);
      toast({
        title: "Success",
        description: "Roast updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update roast",
        variant: "destructive",
      });
    },
  });

  const deleteRoastMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/roasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roasts"] });
      toast({
        title: "Success",
        description: "Roast deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete roast",
        variant: "destructive",
      });
    },
  });

  const handleAddRoast = () => {
    setIsAddingRoast(true);
    setEditingRoast(null);
    form.reset({
      greenCoffeeId: 0,
      greenCoffeeAmount: 0,
      roastedCoffeeAmount: 0,
      roastDate: format(new Date(), "yyyy-MM-dd"),
      remark: "",
    });
  };

  const handleEdit = (roast: RoastWithDetails) => {
    setEditingRoast(roast);
    setIsAddingRoast(false);
    form.reset({
      greenCoffeeId: roast.greenCoffeeId,
      greenCoffeeAmount: roast.greenCoffeeAmount,
      roastedCoffeeAmount: roast.roastedCoffeeAmount,
      roastDate: roast.roastDate,
      remark: roast.remark,
    });
  };

  const handleDelete = () => {
    if (!deletingRoast) return;
    deleteRoastMutation.mutate(deletingRoast.id);
    setDeletingRoast(null);
  };

  const handleSubmit = (values: RoastFormValues) => {
    if (isAddingRoast) {
      createRoastMutation.mutate(values);
    } else if (editingRoast) {
      updateRoastMutation.mutate({ id: editingRoast.id, values });
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

  // Get unique green coffee names for filtering
  const uniqueGreenCoffees = useMemo(() => {
    const names = new Set<string>();
    roasts.forEach((roast) => {
      if (roast.greenCoffeeName) {
        names.add(roast.greenCoffeeName);
      }
    });
    return Array.from(names).sort();
  }, [roasts]);

  // Filter and sort roasts
  const filteredAndSortedRoasts = useMemo(() => {
    let filtered = roasts.filter((roast) => {
      // Apply green coffee filter
      if (selectedGreenCoffee !== "all" && roast.greenCoffeeName !== selectedGreenCoffee) {
        return false;
      }

      // Apply search filter
      return (
        roast.id.toString().includes(searchTerm) ||
        roast.greenCoffeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roast.remark.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort the filtered roasts
    return filtered.sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Handle numeric ID sorting
      if (sortColumn === "id" || sortColumn === "greenCoffeeAmount" || sortColumn === "roastedCoffeeAmount") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle date sorting
      if (sortColumn === "roastDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
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
  }, [roasts, searchTerm, sortColumn, sortDirection, selectedGreenCoffee]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRoasts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoasts = filteredAndSortedRoasts.slice(startIndex, endIndex);

  // Reset/clamp currentPage when totalPages changes (e.g., after filtering)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (filteredAndSortedRoasts.length === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, filteredAndSortedRoasts.length]);

  if (editingRoast || isAddingRoast) {
    return (
      <AdminLayout>
        <div className="row mb-4">
          <div className="col-12">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRoast(null);
                  setIsAddingRoast(false);
                }}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Roasts
              </Button>
              <div>
                <h1 className="font-serif text-3xl font-semibold">
                  {isAddingRoast ? "Add New Roast" : "Edit Roast"}
                </h1>
                <p className="text-muted-foreground">
                  {isAddingRoast ? "Record a new coffee roast" : "Update roast information"}
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
                          name="greenCoffeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Green Coffee*</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-green-coffee">
                                    <SelectValue placeholder="Select Green Coffee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products
                                    .filter((product: any) =>
                                      (product.productTypeName?.toLowerCase().includes('groene koffie') ||
                                       product.productTypeName?.toLowerCase().includes('green coffee')) &&
                                      product.status === "1"
                                    )
                                    .map((product) => (
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
                      </div>
                      <div className="col-md-6">
                        <FormField
                          control={form.control}
                          name="roastDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roast Date*</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-roast-date" />
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
                          name="greenCoffeeAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Green Coffee Amount (g)*</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-green-coffee-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-md-6">
                        <FormField
                          control={form.control}
                          name="roastedCoffeeAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roasted Coffee Amount (g)*</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-roasted-coffee-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-12">
                        <FormField
                          control={form.control}
                          name="remark"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Remarks</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-remark" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createRoastMutation.isPending || updateRoastMutation.isPending}
                        data-testid="button-save"
                      >
                        {createRoastMutation.isPending || updateRoastMutation.isPending
                          ? isAddingRoast ? "Creating..." : "Saving..."
                          : isAddingRoast ? "Add Roast" : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingRoast(null);
                          setIsAddingRoast(false);
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
              <h1 className="font-serif text-3xl font-semibold mb-2">Manage Roasts</h1>
              <p className="text-muted-foreground">
                Track and manage coffee roasting operations
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
                <CardTitle>Roast Records</CardTitle>
                <Button onClick={handleAddRoast} data-testid="button-add-roast">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Roast
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

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Green Coffee:</span>
                    <Select
                      value={selectedGreenCoffee}
                      onValueChange={(value) => {
                        setSelectedGreenCoffee(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-48" data-testid="select-green-coffee-filter">
                        <SelectValue placeholder="All Green Coffees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Green Coffees</SelectItem>
                        {uniqueGreenCoffees.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      type="text"
                      placeholder="Search roasts..."
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
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <p className="text-muted-foreground">Loading roasts...</p>
                  </div>
                </div>
              ) : filteredAndSortedRoasts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No roasts found</p>
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
                              ID<SortIcon column="id" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("greenCoffeeName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-green-coffee"
                            >
                              Green Coffee<SortIcon column="greenCoffeeName" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("roastDate")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-roast-date"
                            >
                              Roast Date<SortIcon column="roastDate" />
                            </Button>
                          </th>
                          <th className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("greenCoffeeAmount")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-green-amount"
                            >
                              Green Amount (g)<SortIcon column="greenCoffeeAmount" />
                            </Button>
                          </th>
                          <th className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("roastedCoffeeAmount")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="header-roasted-amount"
                            >
                              Roasted Amount (g)<SortIcon column="roastedCoffeeAmount" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Remarks
                            </Button>
                          </th>
                          <th className="text-center">
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
                        {paginatedRoasts.map((roast) => (
                          <tr key={roast.id} data-testid={`row-roast-${roast.id}`}>
                            <td className="text-center font-mono text-sm">{roast.id}</td>
                            <td className="font-medium text-sm">{roast.greenCoffeeName || "-"}</td>
                            <td className="text-muted-foreground text-sm">
                              {format(new Date(roast.roastDate), "dd/MM/yyyy")}
                            </td>
                            <td className="text-right font-mono text-sm">{roast.greenCoffeeAmount.toLocaleString()}</td>
                            <td className="text-right font-mono text-sm">{roast.roastedCoffeeAmount.toLocaleString()}</td>
                            <td className="text-muted-foreground text-sm">{roast.remark || "-"}</td>
                            <td className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => handleEdit(roast)}
                                  data-testid={`button-edit-${roast.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeletingRoast(roast)}
                                  data-testid={`button-delete-${roast.id}`}
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
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedRoasts.length)} of {filteredAndSortedRoasts.length} entries
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
      <AlertDialog open={!!deletingRoast} onOpenChange={(open) => !open && setDeletingRoast(null)}>
        <AlertDialogContent data-testid="dialog-delete-roast">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Roast
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete roast <strong>#{deletingRoast?.id}</strong> ({deletingRoast?.greenCoffeeName})?
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
              {deleteRoastMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
