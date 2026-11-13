import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, XCircle, Package, ArrowLeft } from "lucide-react";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";

const fontSerif = "var(--kruze-font-serif)";
const fontSans = "var(--kruze-font-sans)";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface OrderData {
  orderNumber: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  items: OrderItem[];
  subtotalExclVat: string;
  vatAmount: string;
  shippingCost: string;
  totalInclVat: string;
  creationDate: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string; message: string }> = {
  paid: {
    icon: CheckCircle,
    color: "#16a34a",
    label: "Betaling ontvangen",
    message: "Bedankt voor je bestelling! Je ontvangt een bevestigingsmail op het opgegeven emailadres.",
  },
  pending: {
    icon: Clock,
    color: "#ca8a04",
    label: "Betaling in afwachting",
    message: "Je betaling wordt verwerkt. Deze pagina wordt automatisch bijgewerkt zodra de betaling is ontvangen.",
  },
  failed: {
    icon: XCircle,
    color: "#dc2626",
    label: "Betaling mislukt",
    message: "De betaling is niet gelukt. Neem contact met ons op als je vragen hebt.",
  },
  cancelled: {
    icon: XCircle,
    color: "#dc2626",
    label: "Bestelling geannuleerd",
    message: "De betaling is geannuleerd. Je kunt opnieuw bestellen via onze webshop.",
  },
  expired: {
    icon: XCircle,
    color: "#dc2626",
    label: "Betaling verlopen",
    message: "De betaaltermijn is verstreken. Plaats een nieuwe bestelling om verder te gaan.",
  },
};

export default function OrderConfirmation() {
  useStorefrontTheme();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const orderNumber = params.get("order");

  const { data: order, isLoading, error } = useQuery<OrderData>({
    queryKey: [`/api/checkout/order/${orderNumber}`],
    enabled: !!orderNumber,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Auto-refresh if pending
      if (data && data.status === "pending") return 5000;
      return false;
    },
  });

  if (!orderNumber) {
    return (
      <StorefrontLayout>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        >
          <Package className="w-16 h-16 opacity-20" style={{ color: "var(--kruze-brown)" }} />
          <p className="text-lg" style={{ color: "var(--kruze-warmgray)" }}>
            Geen bestelnummer gevonden.
          </p>
          <Link href="/shop">
            <button
              className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white hover-elevate"
              style={{ backgroundColor: "var(--kruze-brown)" }}
            >
              Naar de webshop
            </button>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--kruze-brown)" }} />
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !order) {
    return (
      <StorefrontLayout>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        >
          <XCircle className="w-16 h-16" style={{ color: "#dc2626" }} />
          <p className="text-lg" style={{ color: "var(--kruze-warmgray)" }}>
            Bestelling niet gevonden.
          </p>
          <Link href="/shop">
            <button
              className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white hover-elevate"
              style={{ backgroundColor: "var(--kruze-brown)" }}
            >
              Naar de webshop
            </button>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const items = (order.items || []) as OrderItem[];

  return (
    <StorefrontLayout>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        data-testid="page-order-confirmation"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Status Banner */}
          <div className="flex flex-col items-center text-center mb-8">
            <StatusIcon className="w-16 h-16 mb-4" style={{ color: statusConfig.color }} />
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
              data-testid="heading-confirmation"
            >
              {statusConfig.label}
            </h1>
            <p className="text-sm max-w-md" style={{ color: "var(--kruze-warmgray)" }}>
              {statusConfig.message}
            </p>
          </div>

          {/* Order Details */}
          <div
            className="bg-white rounded-md p-6 mb-6"
            style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
              >
                Bestelling {order.orderNumber}
              </h2>
              <span
                className="text-xs px-2 py-1 rounded-sm font-semibold uppercase"
                style={{
                  backgroundColor: statusConfig.color + "15",
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </span>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--kruze-warmgray)" }}>
              {order.firstName} {order.lastName} &middot; {order.email}
            </p>

            {/* Items */}
            <div className="border-t pt-4" style={{ borderColor: "var(--kruze-taupe)" }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <span className="font-semibold" style={{ color: "var(--kruze-espresso)" }}>
                      {item.name}
                    </span>
                    <span className="ml-2" style={{ color: "var(--kruze-warmgray)" }}>
                      {item.unit} &times; {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold" style={{ color: "var(--kruze-espresso)" }}>
                    &euro;{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 mt-3 flex flex-col gap-2 text-sm" style={{ borderColor: "var(--kruze-taupe)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--kruze-warmgray)" }}>Subtotaal (excl. BTW)</span>
                <span style={{ color: "var(--kruze-espresso)" }}>
                  &euro;{parseFloat(order.subtotalExclVat).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--kruze-warmgray)" }}>BTW (6%)</span>
                <span style={{ color: "var(--kruze-espresso)" }}>
                  &euro;{parseFloat(order.vatAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--kruze-warmgray)" }}>Verzendkosten</span>
                <span style={{ color: parseFloat(order.shippingCost) === 0 ? "#16a34a" : "var(--kruze-espresso)" }}>
                  {parseFloat(order.shippingCost) === 0 ? "Gratis" : `€${parseFloat(order.shippingCost).toFixed(2)}`}
                </span>
              </div>
              <div
                className="flex justify-between font-bold text-base pt-3 mt-1 border-t"
                style={{ borderColor: "var(--kruze-taupe)" }}
              >
                <span style={{ color: "var(--kruze-espresso)" }}>Totaal</span>
                <span style={{ color: "var(--kruze-espresso)" }}>
                  &euro;{parseFloat(order.totalInclVat).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shop">
              <button
                className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-sm text-white hover-elevate"
                style={{ backgroundColor: "var(--kruze-brown)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Verder winkelen
              </button>
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
