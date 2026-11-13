import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ShoppingBag, Loader2, Lock, Truck, LogIn } from "lucide-react";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const fontSerif = "var(--kruze-font-serif)";
const fontSans = "var(--kruze-font-sans)";

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  companyName: string;
  vatNumber: string;
  billingStreet: string;
  billingBus: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
  differentShipping: boolean;
  shippingStreet: string;
  shippingBus: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingCountry: string;
  notes: string;
}

const initialForm: CheckoutForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  birthday: "",
  companyName: "",
  vatNumber: "",
  billingStreet: "",
  billingBus: "",
  billingPostalCode: "",
  billingCity: "",
  billingCountry: "BE",
  differentShipping: false,
  shippingStreet: "",
  shippingBus: "",
  shippingPostalCode: "",
  shippingCity: "",
  shippingCountry: "BE",
  notes: "",
};

export default function Checkout() {
  useStorefrontTheme();
  const { items, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<CheckoutForm>(() => ({
    ...initialForm,
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [shippingInfo, setShippingInfo] = useState<{
    shippingCostInclVat: number;
    isFree: boolean;
    freeReason: string | null;
    freeShippingThreshold: number;
    amountUntilFreeShipping: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill form with customer data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/checkout/customer-data", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setForm((prev) => ({
          ...prev,
          phone: data.phone || prev.phone,
          birthday: data.birthday || prev.birthday,
          companyName: data.companyName || prev.companyName,
          vatNumber: data.vatNumber || prev.vatNumber,
          billingStreet: data.billingStreet || prev.billingStreet,
          billingBus: data.billingBus || prev.billingBus,
          billingPostalCode: data.billingPostalCode || prev.billingPostalCode,
          billingCity: data.billingCity || prev.billingCity,
          shippingStreet: data.shippingStreet || prev.shippingStreet,
          shippingBus: data.shippingBus || prev.shippingBus,
          shippingPostalCode: data.shippingPostalCode || prev.shippingPostalCode,
          shippingCity: data.shippingCity || prev.shippingCity,
        }));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Determine effective postal code for shipping calculation
  const effectivePostalCode = form.differentShipping ? form.shippingPostalCode : form.billingPostalCode;
  const effectiveCountry = form.differentShipping ? form.shippingCountry : form.billingCountry;
  const productIds = items.map((item) => item.productId);

  const fetchShippingCost = useCallback(async (postal: string, country: string, total: number, pIds: number[]) => {
    try {
      const params = new URLSearchParams({
        cartTotal: total.toFixed(2),
        postalCode: postal,
        country: country,
        productIds: pIds.join(","),
      });
      const resp = await fetch(`/api/webshop/shipping-cost?${params}`);
      if (resp.ok) {
        const data = await resp.json();
        setShippingInfo(data);
      }
    } catch {
      // Silently fail - shipping info will remain null and show default
    }
  }, []);

  // Reactively fetch shipping cost when postal code, country, or cart total changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchShippingCost(effectivePostalCode, effectiveCountry, cartTotal, productIds);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [effectivePostalCode, effectiveCountry, cartTotal, fetchShippingCost]);

  // Initial fetch on mount (with empty postal code for default rate)
  useEffect(() => {
    fetchShippingCost("", "BE", cartTotal, productIds);
  }, []);

  const shippingCost = shippingInfo?.shippingCostInclVat ?? 0;
  const displayTotal = cartTotal + shippingCost;
  const vat = cartTotal * (0.06 / 1.06);
  const subtotal = cartTotal - vat;

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        >
          <ShoppingBag className="w-16 h-16 opacity-20" style={{ color: "var(--kruze-brown)" }} />
          <p className="text-lg" style={{ color: "var(--kruze-warmgray)" }}>
            Je winkelwagen is leeg.
          </p>
          <Link href="/shop">
            <button
              className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white hover-elevate"
              style={{ backgroundColor: "var(--kruze-brown)" }}
            >
              Verder winkelen
            </button>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  const updateField = (field: keyof CheckoutForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutForm, string>> = {};

    if (!form.email) newErrors.email = "Email is verplicht";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Ongeldig emailadres";
    if (!form.firstName) newErrors.firstName = "Voornaam is verplicht";
    if (!form.lastName) newErrors.lastName = "Achternaam is verplicht";
    if (!form.billingStreet) newErrors.billingStreet = "Straat + huisnummer is verplicht";
    if (!form.billingPostalCode) newErrors.billingPostalCode = "Postcode is verplicht";
    if (!form.billingCity) newErrors.billingCity = "Gemeente is verplicht";

    if (form.differentShipping) {
      if (!form.shippingStreet) newErrors.shippingStreet = "Straat + huisnummer is verplicht";
      if (!form.shippingPostalCode) newErrors.shippingPostalCode = "Postcode is verplicht";
      if (!form.shippingCity) newErrors.shippingCity = "Gemeente is verplicht";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/checkout/create", {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        birthday: form.birthday || undefined,
        companyName: form.companyName || undefined,
        vatNumber: form.vatNumber || undefined,
        billingStreet: form.billingStreet,
        billingBus: form.billingBus || undefined,
        billingPostalCode: form.billingPostalCode,
        billingCity: form.billingCity,
        billingCountry: form.billingCountry,
        shippingStreet: form.differentShipping ? form.shippingStreet : undefined,
        shippingBus: form.differentShipping ? form.shippingBus || undefined : undefined,
        shippingPostalCode: form.differentShipping ? form.shippingPostalCode : undefined,
        shippingCity: form.differentShipping ? form.shippingCity : undefined,
        shippingCountry: form.differentShipping ? form.shippingCountry : undefined,
        items,
        notes: form.notes || undefined,
        isGuest: !isAuthenticated,
      });

      const data = await response.json();

      // Clear cart and redirect to Mollie payment page
      clearCart();
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      toast({
        title: "Fout bij afrekenen",
        description: error.message || "Er is iets misgegaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "white",
    borderColor: "var(--kruze-taupe)",
    color: "var(--kruze-espresso)",
  };

  const labelStyle = {
    color: "var(--kruze-espresso)",
    fontWeight: 600,
    fontSize: "0.875rem",
  };

  return (
    <StorefrontLayout>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        data-testid="page-checkout"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/shop/cart">
            <button
              className="flex items-center gap-2 text-sm font-semibold mb-6 hover:opacity-70 transition-opacity"
              style={{ color: "var(--kruze-brown)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar winkelwagen
            </button>
          </Link>

          <h1
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
            data-testid="heading-checkout"
          >
            Afrekenen
          </h1>

          {/* Login prompt for guests */}
          {!authLoading && !isAuthenticated && (
            <div
              className="rounded-md p-4 mb-6 flex items-center justify-between"
              style={{ backgroundColor: "var(--kruze-taupe)", color: "var(--kruze-espresso)" }}
            >
              <span className="text-sm">
                Heb je al een account? Log in voor een snellere checkout met je opgeslagen gegevens.
              </span>
              <Link href="/login?returnTo=/shop/checkout">
                <button
                  type="button"
                  className="ml-4 px-4 py-2 text-sm font-semibold rounded-sm text-white hover-elevate flex items-center gap-2 flex-shrink-0"
                  style={{ backgroundColor: "var(--kruze-brown)" }}
                >
                  <LogIn className="w-4 h-4" />
                  Inloggen
                </button>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left: Billing & Shipping Form */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Contact Info */}
                <section
                  className="bg-white rounded-md p-6"
                  style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                >
                  <h2
                    className="text-lg font-bold mb-4"
                    style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                  >
                    Contactgegevens
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        placeholder="je@email.com"
                        data-testid="input-email"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Voornaam *</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-first-name"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Achternaam *</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-last-name"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Telefoon</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        placeholder="+32 ..."
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Geboortedatum</label>
                      <input
                        type="date"
                        value={form.birthday}
                        onChange={(e) => updateField("birthday", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-birthday"
                      />
                    </div>
                  </div>
                </section>

                {/* Billing Address */}
                <section
                  className="bg-white rounded-md p-6"
                  style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                >
                  <h2
                    className="text-lg font-bold mb-4"
                    style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                  >
                    Factuurgegevens
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Bedrijfsnaam</label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => updateField("companyName", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-company"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>BTW-nummer</label>
                      <input
                        type="text"
                        value={form.vatNumber}
                        onChange={(e) => updateField("vatNumber", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        placeholder="BE0123456789"
                        data-testid="input-vat"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Straat + huisnummer *</label>
                      <input
                        type="text"
                        value={form.billingStreet}
                        onChange={(e) => updateField("billingStreet", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-billing-street"
                      />
                      {errors.billingStreet && <p className="text-red-500 text-xs mt-1">{errors.billingStreet}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Bus</label>
                      <input
                        type="text"
                        value={form.billingBus}
                        onChange={(e) => updateField("billingBus", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-billing-bus"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Postcode *</label>
                      <input
                        type="text"
                        value={form.billingPostalCode}
                        onChange={(e) => updateField("billingPostalCode", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-billing-postal"
                      />
                      {errors.billingPostalCode && <p className="text-red-500 text-xs mt-1">{errors.billingPostalCode}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Gemeente *</label>
                      <input
                        type="text"
                        value={form.billingCity}
                        onChange={(e) => updateField("billingCity", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="input-billing-city"
                      />
                      {errors.billingCity && <p className="text-red-500 text-xs mt-1">{errors.billingCity}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Land</label>
                      <select
                        value={form.billingCountry}
                        onChange={(e) => updateField("billingCountry", e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                        style={inputStyle}
                        data-testid="select-billing-country"
                      >
                        <option value="BE">België</option>
                        <option value="NL">Nederland</option>
                        <option value="LU">Luxemburg</option>
                        <option value="DE">Duitsland</option>
                        <option value="FR">Frankrijk</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Different Shipping Address */}
                <section
                  className="bg-white rounded-md p-6"
                  style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.differentShipping}
                      onChange={(e) => updateField("differentShipping", e.target.checked)}
                      className="w-4 h-4 rounded"
                      data-testid="checkbox-different-shipping"
                    />
                    <span className="text-sm font-semibold" style={{ color: "var(--kruze-espresso)" }}>
                      Ander leveradres
                    </span>
                  </label>

                  {form.differentShipping && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label style={labelStyle}>Straat + huisnummer *</label>
                        <input
                          type="text"
                          value={form.shippingStreet}
                          onChange={(e) => updateField("shippingStreet", e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                          style={inputStyle}
                          data-testid="input-shipping-street"
                        />
                        {errors.shippingStreet && <p className="text-red-500 text-xs mt-1">{errors.shippingStreet}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Bus</label>
                        <input
                          type="text"
                          value={form.shippingBus}
                          onChange={(e) => updateField("shippingBus", e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                          style={inputStyle}
                          data-testid="input-shipping-bus"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Postcode *</label>
                        <input
                          type="text"
                          value={form.shippingPostalCode}
                          onChange={(e) => updateField("shippingPostalCode", e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                          style={inputStyle}
                          data-testid="input-shipping-postal"
                        />
                        {errors.shippingPostalCode && <p className="text-red-500 text-xs mt-1">{errors.shippingPostalCode}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Gemeente *</label>
                        <input
                          type="text"
                          value={form.shippingCity}
                          onChange={(e) => updateField("shippingCity", e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                          style={inputStyle}
                          data-testid="input-shipping-city"
                        />
                        {errors.shippingCity && <p className="text-red-500 text-xs mt-1">{errors.shippingCity}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Land</label>
                        <select
                          value={form.shippingCountry}
                          onChange={(e) => updateField("shippingCountry", e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)]"
                          style={inputStyle}
                          data-testid="select-shipping-country"
                        >
                          <option value="BE">België</option>
                          <option value="NL">Nederland</option>
                          <option value="LU">Luxemburg</option>
                          <option value="DE">Duitsland</option>
                          <option value="FR">Frankrijk</option>
                        </select>
                      </div>
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section
                  className="bg-white rounded-md p-6"
                  style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                >
                  <h2
                    className="text-lg font-bold mb-4"
                    style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                  >
                    Opmerking
                  </h2>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kruze-brown)] resize-none"
                    style={inputStyle}
                    rows={3}
                    placeholder="Eventuele opmerkingen bij je bestelling..."
                    data-testid="input-notes"
                  />
                </section>
              </div>

              {/* Right: Order Summary + Payment Button */}
              <div
                className="bg-white rounded-md p-6 sticky top-24"
                style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                data-testid="checkout-summary"
              >
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                >
                  Jouw bestelling
                </h2>

                {/* Items */}
                <div className="flex flex-col gap-3 mb-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.priceId}-${item.grindSize ?? ''}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: "var(--kruze-espresso)" }}>
                          {item.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--kruze-warmgray)" }}>
                          {item.unit} &times; {item.quantity}
                        </p>
                        {item.grindSize && (
                          <p className="text-xs" style={{ color: "var(--kruze-warmgray)" }}>
                            Maalgraad: {item.grindSize}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold flex-shrink-0" style={{ color: "var(--kruze-espresso)" }}>
                        &euro;{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Free shipping progress bar */}
                {shippingInfo && !shippingInfo.isFree && shippingInfo.amountUntilFreeShipping > 0 && (
                  <div
                    className="rounded-md p-3 mb-4"
                    style={{ backgroundColor: "var(--kruze-offwhite)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4" style={{ color: "var(--kruze-brown)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--kruze-espresso)" }}>
                        Nog &euro;{shippingInfo.amountUntilFreeShipping.toFixed(2)} voor gratis verzending!
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--kruze-taupe)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: "var(--kruze-brown)",
                          width: `${Math.min(100, (cartTotal / shippingInfo.freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {shippingInfo?.isFree && shippingInfo.freeReason === "threshold" && (
                  <div
                    className="rounded-md p-3 mb-4 flex items-center gap-2"
                    style={{ backgroundColor: "#f0fdf4" }}
                  >
                    <Truck className="w-4 h-4" style={{ color: "#16a34a" }} />
                    <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                      Proficiat! Je geniet van gratis verzending.
                    </span>
                  </div>
                )}

                <div className="border-t pt-3 mt-3 flex flex-col gap-2 text-sm" style={{ borderColor: "var(--kruze-taupe)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--kruze-warmgray)" }}>Subtotaal (excl. BTW)</span>
                    <span style={{ color: "var(--kruze-espresso)" }}>&euro;{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--kruze-warmgray)" }}>BTW (6%)</span>
                    <span style={{ color: "var(--kruze-espresso)" }}>&euro;{vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--kruze-warmgray)" }}>Verzendkosten</span>
                    <span style={{ color: shippingInfo?.isFree ? "#16a34a" : "var(--kruze-espresso)" }}>
                      {shippingInfo?.isFree ? "Gratis" : `€${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div
                    className="flex justify-between font-bold text-base pt-3 mt-1 border-t"
                    style={{ borderColor: "var(--kruze-taupe)" }}
                  >
                    <span style={{ color: "var(--kruze-espresso)" }}>Totaal</span>
                    <span style={{ color: "var(--kruze-espresso)" }} data-testid="text-checkout-total">
                      &euro;{displayTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 mt-6 text-sm font-semibold rounded-sm text-white hover-elevate flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--kruze-brown)" }}
                  data-testid="button-place-order"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Bestelling verwerken...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Bestellen en betalen
                    </>
                  )}
                </button>

                <p className="text-xs text-center mt-3" style={{ color: "var(--kruze-warmgray)" }}>
                  Je wordt doorgestuurd naar een beveiligde betaalpagina.
                </p>
                <p className="text-xs text-center mt-1" style={{ color: "var(--kruze-warmgray)" }}>
                  Betaling via Bancontact, Creditcard, PayPal of overschrijving.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </StorefrontLayout>
  );
}
