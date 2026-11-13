import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { StorefrontLayout, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Package,
  Star,
  LogOut,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";

// Types
interface AccountProfile {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  customer: {
    id: number;
    phone: string | null;
    birthday: string | null;
    companyName: string | null;
    vatNumber: string | null;
    billingAddressStreet: string | null;
    billingAddressBus: string | null;
    billingAddressPostalCode: string | null;
    billingAddressCity: string | null;
    shippingAddressStreet: string | null;
    shippingAddressBus: string | null;
    shippingAddressPostalCode: string | null;
    shippingAddressCity: string | null;
  } | null;
}

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  grindSize?: string;
}

interface AccountOrder {
  id: number;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  totalInclVat: string;
  shippingCost: string;
  creationDate: string;
  molliePaymentStatus: string | null;
}

interface TopProduct {
  productId: number;
  name: string;
  nameDutch: string;
  picture: string | null;
  productTypeId: number;
  totalOrdered: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: "Betaald", color: "#16a34a" },
  pending: { label: "In afwachting", color: "#ca8a04" },
  failed: { label: "Mislukt", color: "#dc2626" },
  cancelled: { label: "Geannuleerd", color: "#dc2626" },
  expired: { label: "Verlopen", color: "#dc2626" },
};

export default function Account() {
  useStorefrontTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login?returnTo=/account");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <StorefrontLayout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: COLORS.offWhite, fontFamily: fontSans }}
        >
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: COLORS.mutedBrown }}
          />
        </div>
      </StorefrontLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StorefrontLayout>
      <div
        className="min-h-screen"
        style={{ backgroundColor: COLORS.offWhite, fontFamily: fontSans }}
        data-testid="page-account"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-8"
            style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }}
            data-testid="heading-account"
          >
            Mijn Account
          </h1>

          <AccountTabs toast={toast} />
        </div>
      </div>
    </StorefrontLayout>
  );
}

// ==================== TAB NAVIGATION ====================

const TABS = [
  { key: "profile", label: "Mijn Gegevens", shortLabel: "Gegevens", icon: User },
  { key: "orders", label: "Mijn Bestellingen", shortLabel: "Bestellingen", icon: Package },
  { key: "top-products", label: "Meest Besteld", shortLabel: "Favorieten", icon: Star },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function AccountTabs({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div
        className="grid grid-cols-3 mb-8 rounded-md overflow-hidden"
        style={{
          border: `1px solid ${COLORS.coolGray}`,
          backgroundColor: "white",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold transition-colors"
              style={{
                fontFamily: fontSans,
                backgroundColor: isActive ? COLORS.mutedBrown : "white",
                color: isActive ? "white" : COLORS.warmGray,
                borderRight: tab.key !== "top-products" ? `1px solid ${COLORS.coolGray}` : "none",
              }}
              data-testid={`tab-${tab.key}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && <ProfileTab toast={toast} />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "top-products" && <TopProductsTab />}
    </div>
  );
}

// ==================== PROFILE TAB ====================

function ProfileTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = useQuery<AccountProfile>({
    queryKey: ["/api/account/profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    companyName: "",
    vatNumber: "",
    billingAddressStreet: "",
    billingAddressBus: "",
    billingAddressPostalCode: "",
    billingAddressCity: "",
    shippingAddressStreet: "",
    shippingAddressBus: "",
    shippingAddressPostalCode: "",
    shippingAddressCity: "",
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.user.firstName || "",
        lastName: profile.user.lastName || "",
        phone: profile.customer?.phone || "",
        birthday: profile.customer?.birthday || "",
        companyName: profile.customer?.companyName || "",
        vatNumber: profile.customer?.vatNumber || "",
        billingAddressStreet: profile.customer?.billingAddressStreet || "",
        billingAddressBus: profile.customer?.billingAddressBus || "",
        billingAddressPostalCode: profile.customer?.billingAddressPostalCode || "",
        billingAddressCity: profile.customer?.billingAddressCity || "",
        shippingAddressStreet: profile.customer?.shippingAddressStreet || "",
        shippingAddressBus: profile.customer?.shippingAddressBus || "",
        shippingAddressPostalCode: profile.customer?.shippingAddressPostalCode || "",
        shippingAddressCity: profile.customer?.shippingAddressCity || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      await apiRequest("PUT", "/api/account/profile", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account/profile"] });
      toast({
        title: "Gegevens opgeslagen",
        description: "Je profiel is succesvol bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het opslaan.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      setLocation("/");
      window.location.reload();
    } catch {
      setLocation("/");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.mutedBrown }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Personal info */}
        <Section title="Persoonlijke gegevens">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Voornaam" value={form.firstName} onChange={(v) => updateField("firstName", v)} required />
            <FormField label="Achternaam" value={form.lastName} onChange={(v) => updateField("lastName", v)} required />
            <FormField label="E-mail" value={profile?.user.email || ""} onChange={() => {}} disabled />
            <FormField label="Telefoon" value={form.phone} onChange={(v) => updateField("phone", v)} />
            <FormField label="Geboortedatum" value={form.birthday} onChange={(v) => updateField("birthday", v)} type="date" />
          </div>
        </Section>

        {/* Company info */}
        <Section title="Bedrijfsgegevens">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bedrijfsnaam" value={form.companyName} onChange={(v) => updateField("companyName", v)} />
            <FormField label="BTW-nummer" value={form.vatNumber} onChange={(v) => updateField("vatNumber", v)} />
          </div>
        </Section>

        {/* Billing address */}
        <Section title="Factuuradres">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Straat + huisnummer" value={form.billingAddressStreet} onChange={(v) => updateField("billingAddressStreet", v)} />
            <FormField label="Bus" value={form.billingAddressBus} onChange={(v) => updateField("billingAddressBus", v)} />
            <FormField label="Postcode" value={form.billingAddressPostalCode} onChange={(v) => updateField("billingAddressPostalCode", v)} />
            <FormField label="Gemeente" value={form.billingAddressCity} onChange={(v) => updateField("billingAddressCity", v)} />
          </div>
        </Section>

        {/* Shipping address */}
        <Section title="Verzendadres">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Straat + huisnummer" value={form.shippingAddressStreet} onChange={(v) => updateField("shippingAddressStreet", v)} />
            <FormField label="Bus" value={form.shippingAddressBus} onChange={(v) => updateField("shippingAddressBus", v)} />
            <FormField label="Postcode" value={form.shippingAddressPostalCode} onChange={(v) => updateField("shippingAddressPostalCode", v)} />
            <FormField label="Gemeente" value={form.shippingAddressCity} onChange={(v) => updateField("shippingAddressCity", v)} />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto px-8 py-3 text-sm font-semibold rounded-sm text-white"
            style={{ backgroundColor: COLORS.mutedBrown }}
            data-testid="button-save-profile"
          >
            {updateMutation.isPending ? "Opslaan..." : "Gegevens opslaan"}
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: COLORS.warmGray }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </div>
    </form>
  );
}

// ==================== ORDERS TAB ====================

function OrdersTab() {
  const { data: orders = [], isLoading } = useQuery<AccountOrder[]>({
    queryKey: ["/api/account/orders"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.mutedBrown }}
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Package className="w-16 h-16 opacity-20" style={{ color: COLORS.mutedBrown }} />
        <p className="text-lg" style={{ color: COLORS.warmGray }}>
          Je hebt nog geen bestellingen geplaatst.
        </p>
        <Link href="/shop">
          <button
            className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white"
            style={{ backgroundColor: COLORS.mutedBrown }}
          >
            Naar de webshop
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id;
        const items = (order.items || []) as OrderItem[];
        const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
        const orderDate = new Date(order.creationDate).toLocaleDateString("nl-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        return (
          <div
            key={order.id}
            className="bg-white rounded-md overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
            data-testid={`order-${order.orderNumber}`}
          >
            {/* Order header */}
            <button
              type="button"
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="font-bold text-sm"
                    style={{ color: COLORS.deepEspresso }}
                  >
                    {order.orderNumber}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-sm font-semibold uppercase"
                    style={{
                      backgroundColor: statusConfig.color + "15",
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs" style={{ color: COLORS.warmGray }}>
                    {orderDate}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.warmGray }}>
                    {items.length} artikel{items.length !== 1 ? "en" : ""}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.deepEspresso }}
                  >
                    {formatCurrency(order.totalInclVat)}
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.warmGray }} />
              ) : (
                <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.warmGray }} />
              )}
            </button>

            {/* Expanded order details */}
            {isExpanded && (
              <div
                className="px-5 pb-4 border-t"
                style={{ borderColor: COLORS.coolGray }}
              >
                <div className="pt-4 space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span style={{ color: COLORS.deepEspresso }}>
                          {item.name}
                        </span>
                        <span className="ml-2" style={{ color: COLORS.warmGray }}>
                          {item.unit} &times; {item.quantity}
                        </span>
                        {item.grindSize && (
                          <span className="ml-2 text-xs" style={{ color: COLORS.warmGray }}>
                            ({item.grindSize})
                          </span>
                        )}
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: COLORS.deepEspresso }}
                      >
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="flex justify-between text-sm pt-3 mt-3 border-t"
                  style={{ borderColor: COLORS.coolGray }}
                >
                  <span style={{ color: COLORS.warmGray }}>Verzendkosten</span>
                  <span style={{ color: parseFloat(order.shippingCost) === 0 ? "#16a34a" : COLORS.deepEspresso }}>
                    {parseFloat(order.shippingCost) === 0
                      ? "Gratis"
                      : formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2">
                  <span style={{ color: COLORS.deepEspresso }}>Totaal</span>
                  <span style={{ color: COLORS.deepEspresso }}>
                    {formatCurrency(order.totalInclVat)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== TOP PRODUCTS TAB ====================

function TopProductsTab() {
  const { data: products = [], isLoading } = useQuery<TopProduct[]>({
    queryKey: ["/api/account/top-products"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.mutedBrown }}
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Star className="w-16 h-16 opacity-20" style={{ color: COLORS.mutedBrown }} />
        <p className="text-lg" style={{ color: COLORS.warmGray }}>
          Je hebt nog geen producten besteld.
        </p>
        <Link href="/shop">
          <button
            className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white"
            style={{ backgroundColor: COLORS.mutedBrown }}
          >
            Ontdek ons assortiment
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link
          key={product.productId}
          href={`/shop/product/${product.productId}`}
        >
          <div
            className="bg-white rounded-md overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
            style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
            data-testid={`top-product-${product.productId}`}
          >
            <div className="aspect-square bg-gray-100 relative">
              {product.picture ? (
                <img
                  src={product.picture}
                  alt={product.nameDutch || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag
                    className="w-12 h-12 opacity-20"
                    style={{ color: COLORS.mutedBrown }}
                  />
                </div>
              )}
              <div
                className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-sm text-white"
                style={{ backgroundColor: COLORS.mutedBrown }}
              >
                {parseFloat(product.totalOrdered)}x besteld
              </div>
            </div>
            <div className="p-3">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: COLORS.deepEspresso }}
              >
                {product.nameDutch || product.name}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-md p-5 sm:p-6"
      style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
    >
      <h2
        className="text-lg font-bold mb-4"
        style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.warmGray }}>
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="h-10 rounded-sm border text-sm"
        style={{
          borderColor: COLORS.coolGray,
          color: COLORS.deepEspresso,
          backgroundColor: disabled ? "#f5f5f4" : "white",
        }}
      />
    </div>
  );
}
