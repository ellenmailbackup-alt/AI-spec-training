import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, Truck } from "lucide-react";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";
import { useCart } from "@/context/CartContext";
import { useQuery } from "@tanstack/react-query";

const fontSerif = "var(--kruze-font-serif)";
const fontSans = "var(--kruze-font-sans)";

const CATEGORY_CTA: Record<string, string> = {
  coffee: "var(--kruze-brown)",
  tea: "var(--kruze-tgreen)",
  equipment: "var(--kruze-jura)",
  gifts: "var(--kruze-brown)",
};

export default function Cart() {
  useStorefrontTheme();
  const { items, removeItem, updateQuantity, cartTotal } = useCart();

  const { data: shippingConfig } = useQuery<{ shippingCostInclVat: number; freeShippingThreshold: number }>({
    queryKey: ["/api/webshop/shipping-config"],
  });

  const threshold = shippingConfig?.freeShippingThreshold ?? 100;
  const isFreeShipping = cartTotal >= threshold;
  const amountUntilFree = Math.max(0, threshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / threshold) * 100);

  const vat = cartTotal * 0.06;
  const subtotal = cartTotal - vat;

  return (
    <StorefrontLayout>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--kruze-offwhite)", fontFamily: fontSans }}
        data-testid="page-cart"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
            data-testid="heading-cart"
          >
            Winkelwagen
          </h1>

          {items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 gap-6"
              data-testid="empty-cart"
            >
              <ShoppingCart
                className="w-16 h-16 opacity-20"
                style={{ color: "var(--kruze-brown)" }}
              />
              <p
                className="text-lg"
                style={{ color: "var(--kruze-warmgray)" }}
                data-testid="text-empty-cart"
              >
                Je winkelwagen is leeg.
              </p>
              <Link href="/shop">
                <button
                  className="text-sm font-semibold px-6 py-2.5 rounded-sm text-white hover-elevate"
                  style={{ backgroundColor: "var(--kruze-brown)" }}
                  data-testid="button-continue-shopping"
                >
                  Verder winkelen
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 flex flex-col gap-3" data-testid="cart-items">
                {items.map((item) => {
                  const ctaColor = CATEGORY_CTA[item.category] ?? "var(--kruze-brown)";
                  return (
                    <div
                      key={`${item.productId}-${item.priceId}-${item.grindSize ?? ''}`}
                      className="flex items-center gap-4 bg-white rounded-md p-4"
                      style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                      data-testid={`cart-item-${item.productId}`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-contain rounded-sm flex-shrink-0"
                          style={{ backgroundColor: "var(--kruze-offwhite)" }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-sm flex-shrink-0 flex items-center justify-center opacity-20"
                          style={{ backgroundColor: "var(--kruze-taupe)" }}
                        >
                          <ShoppingCart className="w-6 h-6" style={{ color: "var(--kruze-espresso)" }} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm leading-snug truncate"
                          style={{ color: "var(--kruze-espresso)", fontFamily: fontSerif }}
                          data-testid={`cart-item-name-${item.productId}`}
                        >
                          {item.name}
                        </p>
                        {item.unit && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--kruze-warmgray)" }}>
                            {item.unit}
                          </p>
                        )}
                        {item.grindSize && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--kruze-warmgray)" }}>
                            Maalgraad: {item.grindSize}
                          </p>
                        )}
                        <p
                          className="text-sm font-bold mt-1"
                          style={{ color: "var(--kruze-espresso)" }}
                          data-testid={`cart-item-price-${item.productId}`}
                        >
                          &euro;{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.productId, item.priceId, item.quantity - 1, item.grindSize)}
                          className="w-7 h-7 rounded-sm flex items-center justify-center hover-elevate"
                          style={{ backgroundColor: "var(--kruze-offwhite)", color: "var(--kruze-espresso)" }}
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className="w-6 text-center text-sm font-semibold"
                          style={{ color: "var(--kruze-espresso)" }}
                          data-testid={`text-quantity-${item.productId}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.priceId, item.quantity + 1, item.grindSize)}
                          className="w-7 h-7 rounded-sm flex items-center justify-center hover-elevate"
                          style={{ backgroundColor: ctaColor, color: "white" }}
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.priceId, item.grindSize)}
                        className="flex-shrink-0 p-1.5 rounded-sm hover-elevate"
                        style={{ color: "var(--kruze-warmgray)" }}
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                <Link href="/shop">
                  <button
                    className="text-sm font-semibold mt-2 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--kruze-brown)" }}
                    data-testid="button-continue-shopping"
                  >
                    &larr; Verder winkelen
                  </button>
                </Link>
              </div>

              <div
                className="bg-white rounded-md p-6 sticky top-24"
                style={{ boxShadow: "0 1px 4px rgba(59,35,20,0.06)" }}
                data-testid="cart-summary"
              >
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                >
                  Overzicht
                </h2>
                <div className="flex flex-col gap-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--kruze-warmgray)" }}>Subtotaal (excl. BTW)</span>
                    <span style={{ color: "var(--kruze-espresso)" }}>&euro;{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--kruze-warmgray)" }}>BTW (6%)</span>
                    <span style={{ color: "var(--kruze-espresso)" }}>&euro;{vat.toFixed(2)}</span>
                  </div>
                  <div
                    className="flex justify-between font-bold text-base pt-3 mt-1 border-t"
                    style={{ borderColor: "var(--kruze-taupe)" }}
                  >
                    <span style={{ color: "var(--kruze-espresso)" }}>Totaal</span>
                    <span style={{ color: "var(--kruze-espresso)" }} data-testid="text-cart-total">
                      &euro;{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Link href="/shop/checkout">
                <button
                  className="w-full py-3 text-sm font-semibold rounded-sm text-white hover-elevate"
                  style={{ backgroundColor: "var(--kruze-brown)" }}
                  data-testid="button-checkout"
                >
                  Afrekenen
                </button>
              </Link>
                {/* Free shipping progress */}
                {items.length > 0 && !isFreeShipping && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4" style={{ color: "var(--kruze-brown)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--kruze-espresso)" }}>
                        Nog &euro;{amountUntilFree.toFixed(2)} voor gratis verzending!
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
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {items.length > 0 && isFreeShipping && (
                  <div className="mt-4 flex items-center gap-2 justify-center">
                    <Truck className="w-4 h-4" style={{ color: "#16a34a" }} />
                    <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                      Proficiat! Gratis verzending!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
