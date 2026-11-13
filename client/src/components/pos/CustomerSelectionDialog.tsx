import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, UserPlus, Search, Building2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { POSCustomer } from "@/pages/pos/POSPage";

interface CustomerSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: POSCustomer) => void;
}

export function CustomerSelectionDialog({
  open,
  onClose,
  onSelectCustomer,
}: CustomerSelectionDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Registration form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");

  // Fetch guest customer
  const { data: guestCustomer } = useQuery<POSCustomer>({
    queryKey: ["/api/pos/customers/guest"],
  });

  // Search customers
  const { data: searchResults, isLoading: isSearching } = useQuery<POSCustomer[]>({
    queryKey: ["/api/pos/customers/search", searchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pos/customers/search?q=${encodeURIComponent(searchQuery)}`);
      return await res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Register customer mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pos/customers/register", data);
      return await res.json();
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Customer Registered",
        description: `${newCustomer.firstName} ${newCustomer.lastName} has been registered.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onSelectCustomer(newCustomer);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register customer",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setBirthday("");
    setShowRegisterForm(false);
  };

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !birthday) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      firstName,
      lastName,
      email,
      birthday,
    });
  };

  // Don't render at all when closed
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>

        {!showRegisterForm ? (
          <div className="space-y-4">
            {/* Guest Checkout */}
            <Card
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => guestCustomer && onSelectCustomer(guestCustomer)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Guest Checkout</p>
                    <p className="text-sm text-muted-foreground">Anonymous - No registration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Customers */}
            <div>
              <Label>Search Existing Customer</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((customer) => (
                      <Card
                        key={customer.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onSelectCustomer(customer)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              {customer.b2bClient ? (
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {customer.companyName || `${customer.firstName} ${customer.lastName}`}
                              </p>
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            </div>
                            {customer.b2bClient && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                                B2B
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No customers found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Register New Customer */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRegisterForm(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register New Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <Label>Birthday *</Label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRegister}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : "Register"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
