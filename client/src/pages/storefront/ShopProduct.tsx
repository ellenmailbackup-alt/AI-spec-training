import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, ShoppingCart, Thermometer, Clock, Award, Scale } from "lucide-react";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

const fontSerif = "var(--kruze-font-serif)";
const fontSans = "var(--kruze-font-sans)";

interface PriceVariant {
  id: number;
  priceWithVat: string;
  priceWithoutVat: string;
  amount: number;
  unit: string;
  webshopDefault: boolean;
}

interface ApiProduct {
  id: number;
  name: string;
  nameDutch: string;
  picture: string | null;
  productTypeId: number;
  productTypeName: string | null;
  productSubtypeId: number | null;
  productSubtypeName: string | null;
  webshopEnabled: boolean;
  webshopDescription: string | null;
  originCountry: string | null;
  originContinent: string | null;
  region: string | null;
  tastingNote: string | null;
  process: string | null;
  strength: string | null;
  brewTemp: string | null;
  brewTime: string | null;
  brewDosage: string | null;
  shortDescription: string | null;
  juraSeries: string | null;
  juraPriceRange: string | null;
  specs: string | null;
  awards: string | null;
  seasonal: boolean;
  featured: boolean;
  prices: PriceVariant[];
}

const CATEGORY_CTA: Record<number, string> = {
  1: "var(--kruze-brown)",
  2: "var(--kruze-tgreen)",
  3: "var(--kruze-jura)",
};

const CATEGORY_IMAGE_BG: Record<number, string> = {
  1: "var(--kruze-coffee-image-bg)",
  2: "var(--kruze-tea-image-bg)",
  3: "var(--kruze-jura-image-bg)",
};

function getImageUrl(picture: string | null): string | undefined {
  if (!picture) return undefined;
  if (picture.startsWith("http")) return picture;
  if (picture.startsWith("/")) return picture;
  return `/images/products/${picture}`;
}

function formatUnit(amount: number, unit: string): string {
  if (unit === "gram") return `${amount}g`;
  if (unit === "stuks") return `${amount} st.`;
  return `${amount} ${unit}`;
}

export default function ShopProduct() {
  useStorefrontTheme();
  const [, params] = useRoute("/shop/product/:id");
  const [, setLocation] = useLocation();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const productId = params?.id ? parseInt(params.id) : null;

  const { data: apiProducts, isLoading } = useQuery<ApiProduct[]>({
    queryKey: ["/api/webshop/products"],
  });

  const product = apiProducts?.find((p) => p.id === productId) ?? null;

  // Sort prices by amount ascending
  const sortedPrices = useMemo(() => {
    if (!product?.prices) return [];
    return [...product.prices].sort((a, b) => a.amount - b.amount);
  }, [product]);

  // Initial selected variant: the one marked webshopDefault, or fallback to smallest
  const initialVariant = useMemo(() => {
    const defaultVariant = sortedPrices.find((p) => p.webshopDefault);
    return defaultVariant ?? sortedPrices[0] ?? null;
  }, [sortedPrices]);

  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedGrindSize, setSelectedGrindSize] = useState<string | null>(null);

  const isCoffee = product?.productTypeId === 1;

  const { data: grindSizeOptions } = useQuery<{ id: number; name: string; sortOrder: number }[]>({
    queryKey: ["/api/webshop/grind-sizes"],
    enabled: isCoffee,
  });

  const effectiveGrindSize = selectedGrindSize ?? grindSizeOptions?.[0]?.name ?? null;
  const showGrindSize = isCoffee && grindSizeOptions && grindSizeOptions.length > 0;

  // Resolve selected price variant
  const selectedVariant = useMemo(() => {
    if (selectedPriceId !== null) {
      return sortedPrices.find((p) => p.id === selectedPriceId) ?? initialVariant;
    }
    return initialVariant;
  }, [selectedPriceId, sortedPrices, initialVariant]);

  const priceValue = selectedVariant ? parseFloat(selectedVariant.priceWithVat) : null;
  const unitLabel = selectedVariant ? formatUnit(selectedVariant.amount, selectedVariant.unit) : "";
  const imageUrl = product ? getImageUrl(product.picture) : undefined;
  const ctaColor = product ? (CATEGORY_CTA[product.productTypeId] ?? "var(--kruze-brown)") : "var(--kruze-brown)";
  const imageBg = product ? (CATEGORY_IMAGE_BG[product.productTypeId] ?? "var(--kruze-offwhite)") : "var(--kruze-offwhite)";

  const handleAddToCart = () => {
    if (!product || priceValue === null || !selectedVariant) return;
    const category = product.productTypeId === 1 ? "coffee" : product.productTypeId === 2 ? "tea" : "equipment";
    addItem({
      productId: product.id,
      priceId: selectedVariant.id,
      name: product.nameDutch || product.name,
      price: priceValue,
      unit: `/${unitLabel}`,
      imageUrl,
      category,
      ...(isCoffee && effectiveGrindSize ? { grindSize: effectiveGrindSize } : {}),
    }, quantity);
    toast({
      title: "Toegevoegd aan winkelwagen",
      description: `${quantity}× ${product.nameDutch || product.name} – ${unitLabel}${isCoffee && effectiveGrindSize ? ` (${effectiveGrindSize})` : ""} is toegevoegd.`,
    });
  };

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--kruze-offwhite)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--kruze-brown)" }} />
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: "var(--kruze-offwhite)" }}>
          <p style={{ fontFamily: fontSans, color: "var(--kruze-warmgray)" }}>Product niet gevonden.</p>
          <button
            onClick={() => setLocation("/shop")}
            className="text-sm font-semibold"
            style={{ color: "var(--kruze-brown)", fontFamily: fontSans }}
          >
            Terug naar winkel
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  const specs = product.specs ? JSON.parse(product.specs) as string[] : [];

  return (
    <StorefrontLayout>
      <div className="min-h-screen" style={{ backgroundColor: "white" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <button
            onClick={() => setLocation("/shop")}
            className="flex items-center gap-2 text-sm font-medium mb-8 hover:opacity-70 transition-opacity"
            style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
            data-testid="button-back-to-shop"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar winkel
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

            <div
              className="w-full rounded-md overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: "4/5" }}
              data-testid="image-product"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.nameDutch || product.name}
                  className="w-full h-full object-contain"
                  style={{
                    transform: isZoomed ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: isZoomed ? "transform 0.1s ease-out" : "transform 0.3s ease",
                    cursor: isZoomed ? "zoom-in" : "zoom-in",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="text-6xl opacity-20" style={{ fontFamily: fontSerif, color: "var(--kruze-brown)" }}>
                  K
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              {(product.originCountry || product.region) && (
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
                  data-testid="text-origin"
                >
                  {product.originCountry}{product.region ? ` · ${product.region}` : ""}
                </span>
              )}

              <h1
                className="text-3xl font-bold leading-snug"
                style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
                data-testid="text-product-name"
              >
                {product.nameDutch || product.name}
              </h1>

              {product.awards && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-sm w-fit"
                  style={{ backgroundColor: "#FFF8DC", color: "#8B6914" }}
                  data-testid="tag-award"
                >
                  <Award className="w-3 h-3" />
                  {product.awards}
                </span>
              )}

              {product.shortDescription && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--kruze-brown)", fontFamily: fontSans }}
                  data-testid="text-short-description"
                >
                  {product.shortDescription}
                </p>
              )}

              {product.tastingNote && (
                <p
                  className="text-sm italic leading-relaxed"
                  style={{ color: "var(--kruze-brown)", fontFamily: fontSans }}
                  data-testid="text-tasting"
                >
                  &ldquo;{product.tastingNote}&rdquo;
                </p>
              )}

              {(product.process || product.strength) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {product.process && (
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-sm"
                      style={{
                        backgroundColor: product.process === "Natural" ? "#F0E4D7" : product.process === "Honey" ? "#FDF2D0" : "#E0E8E4",
                        color: "var(--kruze-espresso)",
                        fontFamily: fontSans,
                      }}
                      data-testid="tag-process"
                    >
                      {product.process}
                    </span>
                  )}
                  {product.strength && (
                    <span className="text-xs" style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}>
                      {product.strength}
                    </span>
                  )}
                </div>
              )}

              {(product.brewTemp || product.brewTime || product.brewDosage) && (
                <div className="flex flex-col gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
                  >
                    Bereiding
                  </span>
                <div className="flex items-center gap-4 flex-wrap">
                  {product.brewTemp && (
                    <span className="flex items-center gap-2 text-base" style={{ color: "var(--kruze-tgreen)", fontFamily: fontSans }}>
                      <Thermometer className="w-5 h-5" />
                      {product.brewTemp}°C
                    </span>
                  )}
                  {product.brewTime && (
                    <span className="flex items-center gap-2 text-base" style={{ color: "var(--kruze-tgreen)", fontFamily: fontSans }}>
                      <Clock className="w-5 h-5" />
                      {product.brewTime} min
                    </span>
                  )}
                  {product.brewDosage && (
                    <span className="flex items-center gap-2 text-base" style={{ color: "var(--kruze-tgreen)", fontFamily: fontSans }}>
                      <Scale className="w-5 h-5" />
                      {product.brewDosage}
                    </span>
                  )}
                </div>
                </div>
              )}

              {specs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specs.map((spec) => (
                    <span
                      key={spec}
                      className="text-xs font-medium px-2 py-1 rounded-sm"
                      style={{ backgroundColor: "var(--kruze-jura-image-bg)", color: "var(--kruze-jura-dark)", fontFamily: fontSans }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Variant selector */}
              {sortedPrices.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
                  >
                    Kies hoeveelheid
                  </span>
                  <div className="flex flex-wrap gap-2" data-testid="variant-selector">
                    {sortedPrices.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedPriceId(variant.id)}
                          className="px-4 py-2 rounded-sm text-sm font-medium border transition-all hover-elevate"
                          style={{
                            backgroundColor: isSelected ? ctaColor : "white",
                            color: isSelected ? "white" : "var(--kruze-espresso)",
                            borderColor: isSelected ? ctaColor : "var(--kruze-taupe)",
                            fontFamily: fontSans,
                          }}
                          data-testid={`variant-btn-${variant.id}`}
                        >
                          {formatUnit(variant.amount, variant.unit)}
                          <span className="ml-2 opacity-80">
                            €{parseFloat(variant.priceWithVat).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grind size selector - coffee products only */}
              {showGrindSize && (
                <div className="flex flex-col gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
                  >
                    Maalgraad
                  </span>
                  <div className="flex flex-wrap gap-2" data-testid="grind-size-selector">
                    {grindSizeOptions!.map((option) => {
                      const isSelected = effectiveGrindSize === option.name;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedGrindSize(option.name)}
                          className="px-4 py-2 rounded-sm text-sm font-medium border transition-all hover-elevate"
                          style={{
                            backgroundColor: isSelected ? ctaColor : "white",
                            color: isSelected ? "white" : "var(--kruze-espresso)",
                            borderColor: isSelected ? ctaColor : "var(--kruze-taupe)",
                            fontFamily: fontSans,
                          }}
                          data-testid={`grind-btn-${option.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t mt-2" style={{ borderColor: "var(--kruze-taupe)" }}>
                {priceValue !== null && (
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
                    data-testid="text-price"
                  >
                    &euro;{priceValue.toFixed(2)}
                    {unitLabel && (
                      <span className="text-sm font-normal ml-1" style={{ color: "var(--kruze-warmgray)" }}>
                        /{unitLabel}
                      </span>
                    )}
                  </span>
                )}

                {priceValue !== null && (
                  <div className="flex items-center border rounded-sm overflow-hidden" style={{ borderColor: "var(--kruze-taupe)" }}>
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
                      aria-label="Minder"
                    >
                      −
                    </button>
                    <span
                      className="px-3 py-2.5 text-sm font-semibold min-w-[2rem] text-center"
                      style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
                      data-testid="quantity-display"
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
                      aria-label="Meer"
                    >
                      +
                    </button>
                  </div>
                )}

                {priceValue !== null && (
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-sm text-white hover-elevate"
                    style={{ backgroundColor: ctaColor, fontFamily: fontSans }}
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    In winkelwagen
                  </button>
                )}

                {priceValue === null && (
                  <span className="text-sm" style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}>
                    Prijs op aanvraag
                  </span>
                )}
              </div>
            </div>
          </div>

          {product.webshopDescription && (
            <div className="mt-10 pt-8 border-t" style={{ borderColor: "var(--kruze-taupe)" }}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--kruze-warmgray)", fontFamily: fontSans }}
              >
                Beschrijving
              </h3>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: "var(--kruze-brown)", fontFamily: fontSans }}
                data-testid="text-description"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.webshopDescription) }}
              />
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
