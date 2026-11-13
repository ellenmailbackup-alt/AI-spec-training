import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { WebshopSidebar, type FilterState } from "@/components/storefront/WebshopSidebar";
import { WebshopProductCard } from "@/components/storefront/WebshopProductCard";
import type {
  WebshopProduct,
  WebshopCategory,
  CoffeeProduct,
  TeaProduct,
  EquipmentProduct,
  TeaType,
  CoffeeOriginCountry,
  CoffeeOriginContinent,
} from "@/data/webshopProducts";
import { ORIGIN_CONTINENT_MAP, TEA_CATEGORY_MAP } from "@/data/webshopProducts";
import { ArrowRight, ChevronDown, LayoutGrid, List, Loader2 } from "lucide-react";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";

function useGridColumns() {
  const [cols, setCols] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches ? 4 : 3
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setCols(mql.matches ? 4 : 3);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return cols;
}

type SortOption = "recommended" | "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Aanbevolen",
  newest: "Nieuwste",
  "price-asc": "Prijs laag \u2192 hoog",
  "price-desc": "Prijs hoog \u2192 laag",
};

const CATEGORY_LABELS: Record<WebshopCategory, string> = {
  coffee: "KRUZE KOFFIE",
  tea: "KRUZE THEE",
  equipment: "JURA MACHINES",
  gifts: "CADEAUS & SETS",
  zoetigheden: "ZOETIGHEDEN",
};

const CATEGORY_COLORS: Record<WebshopCategory, string> = {
  coffee: "var(--kruze-brown)",
  tea: "var(--kruze-tgreen)",
  equipment: "var(--kruze-jura)",
  gifts: "var(--kruze-gift)",
  zoetigheden: "var(--kruze-golden)",
};

const CATEGORY_LINK_LABELS: Record<WebshopCategory, string> = {
  coffee: "Bekijk alle koffie",
  tea: "Bekijk alle thee",
  equipment: "Bekijk alle machines",
  gifts: "Bekijk alle cadeaus",
  zoetigheden: "Bekijk alle zoetigheden",
};

// Normalize DB country values (may be English or have special chars) to the Dutch names used in filters
const COUNTRY_NORMALIZATION_MAP: Record<string, CoffeeOriginCountry> = {
  "ethiopie": "Ethiopie",
  "ethiopi\u00eb": "Ethiopie",
  "ethiopia": "Ethiopie",
  "kenya": "Kenya",
  "kenia": "Kenya",
  "rwanda": "Rwanda",
  "malawi": "Malawi",
  "colombia": "Colombia",
  "guatemala": "Guatemala",
  "brazilie": "Brazilie",
  "brazili\u00eb": "Brazilie",
  "brazil": "Brazilie",
  "brasil": "Brazilie",
  "cuba": "Cuba",
  "costa rica": "Costa Rica",
  "nicaragua": "Nicaragua",
  "mexico": "Mexico",
  "honduras": "Honduras",
  "peru": "Peru",
  "perú": "Peru",
  "india": "India",
  "indonesie": "Indonesie",
  "indonesi\u00eb": "Indonesie",
  "indonesia": "Indonesie",
  "papua nieuw-guinea": "Papua Nieuw-Guinea",
  "papua new guinea": "Papua Nieuw-Guinea",
};

function normalizeCoffeeCountry(raw: string): CoffeeOriginCountry {
  return COUNTRY_NORMALIZATION_MAP[raw.toLowerCase().trim()] ?? (raw as CoffeeOriginCountry);
}

// Normalize DB continent values to the Dutch names used in filters
const CONTINENT_NORMALIZATION_MAP: Record<string, CoffeeOriginContinent> = {
  "afrika": "Afrika",
  "africa": "Afrika",
  "amerika": "Amerika's",
  "americas": "Amerika's",
  "midden-amerika": "Amerika's",
  "zuid-amerika": "Amerika's",
  "central america": "Amerika's",
  "south america": "Amerika's",
  "azie/pacific": "Azie/Pacific",
  "azië/pacific": "Azie/Pacific",
  "asia": "Azie/Pacific",
  "azie": "Azie/Pacific",
  "pacific": "Azie/Pacific",
};

function normalizeCoffeeContinent(raw: string): CoffeeOriginContinent | undefined {
  return CONTINENT_NORMALIZATION_MAP[raw.toLowerCase().trim()];
}

const TEA_SUBTYPE_MAP: Record<string, TeaType> = {
  "BLACK TEA": "Zwarte Thee",
  "GREEN TEA": "Groene Thee",
  "OOLONG TEA": "Oolong",
  "OOLONG": "Oolong",
  "WHITE TEA": "Witte Thee",
  "PUER TEA": "Pu-erh",
  "PU-ERH": "Pu-erh",
  "PURPLE TEA": "Witte Thee",
  "HERBAL INFUSION": "Kruidenblend",
  "FRUIT INFUSION": "Fruitinfusen",
  "ROOIBOS INFUSION": "Rooibos",
  "ROOIBOS": "Rooibos",
  "YELLOW TEA": "Groene Thee",
};

interface ApiWebshopProduct {
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
  webshopSortOrder: number;
  prices: Array<{
    id: number;
    priceWithVat: string;
    priceWithoutVat: string;
    amount: number;
    unit: string;
    webshopDefault: boolean;
  }>;
}

function mapApiProductToWebshop(item: ApiWebshopProduct): WebshopProduct | null {
  // Use the variant flagged as default; fall back to smallest amount
  const defaultPrice = item.prices && item.prices.length > 0
    ? (item.prices.find((p) => p.webshopDefault) ??
        item.prices.reduce((smallest, p) => p.amount < smallest.amount ? p : smallest, item.prices[0]))
    : null;
  const price = defaultPrice ? parseFloat(defaultPrice.priceWithVat) : 0;
  const unit = defaultPrice
    ? `/${defaultPrice.amount}${defaultPrice.unit === "gram" ? "g" : defaultPrice.unit}`
    : "";

  const imageUrl = item.picture
    ? (item.picture.startsWith("http") ? item.picture : item.picture.startsWith("/") ? item.picture : `/images/products/${item.picture}`)
    : undefined;

  const base = {
    id: String(item.id),
    name: item.nameDutch || item.name,
    description: item.webshopDescription || "",
    price,
    imageUrl,
    seasonal: item.seasonal || false,
    featured: item.featured || false,
    awards: item.awards ? [item.awards] : undefined,
    inStock: true,
  };

  // Normalize diacritics so e.g. "Brazilië" matches "Brazilie" in type definitions and filters
  const normalizeOrigin = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (item.productTypeId === 1) {
    const origin = (normalizeOrigin(item.originCountry || "")) as CoffeeOriginCountry;
    const continent = (
      (item.originContinent ? normalizeCoffeeContinent(item.originContinent) : undefined)
      ?? ORIGIN_CONTINENT_MAP[origin]
      ?? "Afrika"
    ) as CoffeeOriginContinent;
    return {
      ...base,
      category: "coffee" as const,
      origin,
      originContinent: continent,
      region: item.region || undefined,
      tastingNote: item.tastingNote || "",
      process: (item.process || "Washed") as CoffeeProduct["process"],
      strength: (item.strength || "Evenwichtig") as CoffeeProduct["strength"],
      unit,
      imageTag: undefined,
    };
  }

  if (item.productTypeId === 2) {
    const subtypeName = (item.productSubtypeName || "").toUpperCase();
    const productNameUpper = (item.name || "").toUpperCase();
    // Name takes priority: an ice tea product may have subtype "FRUIT INFUSION" in the DB
    const isIceTea = productNameUpper.includes("ICE TEA") || productNameUpper.includes("IJSTHEE");
    const teaType: TeaType = isIceTea ? "IJsthee" : (TEA_SUBTYPE_MAP[subtypeName] || "Groene Thee");
    const teaCategory = TEA_CATEGORY_MAP[teaType] || "Puur";
    const teaOrigin = (normalizeOrigin(item.originCountry || "")) as TeaProduct["origin"];
    return {
      ...base,
      category: "tea" as const,
      teaType,
      teaCategory,
      origin: teaOrigin,
      brewTemp: item.brewTemp || "",
      brewTime: item.brewTime || "",
      brewDosage: item.brewDosage || "",
      tastingNote: item.tastingNote || "",
      unit,
      imageTag: teaType,
    };
  }

  if (item.productTypeId === 3) {
    let specs: string[] = [];
    if (item.specs) {
      try {
        const parsed = JSON.parse(item.specs);
        specs = Array.isArray(parsed) ? parsed : [];
      } catch {
        specs = item.specs.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return {
      ...base,
      category: "equipment" as const,
      series: (item.juraSeries || "E-lijn") as EquipmentProduct["series"],
      priceRange: (item.juraPriceRange || "Instap") as EquipmentProduct["priceRange"],
      specs,
      premiumTag: item.juraPriceRange === "Premium",
      imageTag: item.juraSeries || "Jura",
    };
  }

  if (item.productTypeId === 7) {
    return {
      ...base,
      category: "zoetigheden" as const,
      unit,
    };
  }

  return null;
}

function routeToCategory(path: string): WebshopCategory | "all" {
  if (path.startsWith("/shop/coffee")) return "coffee";
  if (path.startsWith("/shop/tea")) return "tea";
  if (path.startsWith("/shop/equipment")) return "equipment";
  if (path.startsWith("/shop/gifts")) return "gifts";
  if (path.startsWith("/shop/zoetigheden")) return "zoetigheden";
  return "all";
}

function filterProducts(products: WebshopProduct[], filters: FilterState): WebshopProduct[] {
  return products.filter((p) => {
    if (filters.category !== "all" && p.category !== filters.category) return false;

    if (filters.category === "coffee" && p.category === "coffee") {
      const cp = p as CoffeeProduct;
      if (filters.coffeeCountry && cp.origin !== filters.coffeeCountry) return false;
      if (filters.coffeeContinent && !filters.coffeeCountry && cp.originContinent !== filters.coffeeContinent) return false;
      if (filters.coffeeStrength && cp.strength !== filters.coffeeStrength) return false;
    }

    if (filters.category === "tea" && p.category === "tea") {
      const tp = p as TeaProduct;
      if (filters.teaType && tp.teaType !== filters.teaType) return false;
      if (filters.teaOrigin && tp.origin !== filters.teaOrigin) return false;
      if (filters.teaCategory && !filters.teaType && !filters.teaOrigin && tp.teaCategory !== filters.teaCategory) return false;
    }

    if (filters.category === "equipment" && p.category === "equipment") {
      const ep = p as EquipmentProduct;
      if (filters.juraSeries && ep.series !== filters.juraSeries) return false;
      if (filters.juraPriceRange && ep.priceRange !== filters.juraPriceRange) return false;
    }

    return true;
  });
}

function sortProducts(products: WebshopProduct[], sort: SortOption): WebshopProduct[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted.reverse();
    case "recommended":
    default:
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }
}

function SplitEntryBanner({ coffeCount, teaCount }: { coffeCount: number; teaCount: number }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6" data-testid="split-entry-banner">
      <Link href="/shop/coffee" className="flex-1">
        <div
          className="relative overflow-hidden rounded-md cursor-pointer transition-transform hover:-translate-y-0.5"
          style={{
            height: 130,
            background: "linear-gradient(135deg, #3B2314, #8A6959)",
          }}
          data-testid="banner-coffee"
        >
          <div className="relative h-full flex flex-col justify-center px-6">
            <span
              className="text-white/70 text-[10px] tracking-[0.12em] uppercase font-medium mb-1"
              style={{ fontFamily: "var(--kruze-font-sans)" }}
            >
              Single origin
            </span>
            <h3
              className="text-white text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--kruze-font-serif)" }}
            >
              Kruze Koffie
            </h3>
            <span className="text-white/60 text-xs mb-2" style={{ fontFamily: "var(--kruze-font-sans)" }}>
              {coffeCount} koffies
            </span>
            <span className="flex items-center gap-1 text-white/80 text-sm font-medium">
              Bekijk alle koffie <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      <Link href="/shop/tea" className="flex-1">
        <div
          className="relative overflow-hidden rounded-md cursor-pointer transition-transform hover:-translate-y-0.5"
          style={{
            height: 130,
            background: "linear-gradient(135deg, #2C4A35, #4A7C59)",
          }}
          data-testid="banner-tea"
        >
          <div className="relative h-full flex flex-col justify-center px-6">
            <span
              className="text-white/70 text-[10px] tracking-[0.12em] uppercase font-medium mb-1"
              style={{ fontFamily: "var(--kruze-font-sans)" }}
            >
              Premium losse thee
            </span>
            <h3
              className="text-white text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--kruze-font-serif)" }}
            >
              Kruze Thee
            </h3>
            <span className="text-white/60 text-xs mb-2" style={{ fontFamily: "var(--kruze-font-sans)" }}>
              {teaCount} thee{teaCount !== 1 ? "en" : ""}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-sm font-medium">
              Bekijk alle thee <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Toolbar({
  productCount,
  categoryLabel,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  productCount: number;
  categoryLabel: string;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (v: "grid" | "list") => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-between gap-4 py-3 px-1 mb-4 border-b flex-wrap"
      style={{ borderColor: "var(--kruze-taupe)", fontFamily: "var(--kruze-font-sans)" }}
      data-testid="toolbar"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "var(--kruze-warmgray)" }} data-testid="text-product-count">
          {productCount} {productCount === 1 ? "product" : "producten"}
        </span>
        {categoryLabel !== "Alle producten" && (
          <>
            <span style={{ color: "var(--kruze-taupe)" }}>&middot;</span>
            <span className="text-sm font-semibold" style={{ color: "var(--kruze-espresso)" }} data-testid="text-active-category">
              {categoryLabel}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-sm border cursor-pointer"
            style={{
              borderColor: "var(--kruze-taupe)",
              color: "var(--kruze-espresso)",
            }}
            onClick={() => setSortOpen(!sortOpen)}
            data-testid="button-sort"
          >
            {SORT_LABELS[sort]}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-white rounded-sm shadow-lg border z-20 min-w-[180px]"
              style={{ borderColor: "var(--kruze-taupe)" }}
              data-testid="dropdown-sort"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left text-sm px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    fontWeight: sort === opt ? 700 : 400,
                    color: sort === opt ? "var(--kruze-espresso)" : "#4A4A4A",
                    backgroundColor: sort === opt ? "var(--kruze-offwhite)" : "transparent",
                  }}
                  onClick={() => {
                    onSortChange(opt);
                    setSortOpen(false);
                  }}
                  data-testid={`sort-option-${opt}`}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center border rounded-sm" style={{ borderColor: "var(--kruze-taupe)" }}>
          <button
            className="p-1.5 cursor-pointer"
            style={{
              backgroundColor: viewMode === "grid" ? "var(--kruze-offwhite)" : "transparent",
              color: viewMode === "grid" ? "var(--kruze-espresso)" : "var(--kruze-warmgray)",
            }}
            onClick={() => onViewModeChange("grid")}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 cursor-pointer"
            style={{
              backgroundColor: viewMode === "list" ? "var(--kruze-offwhite)" : "transparent",
              color: viewMode === "list" ? "var(--kruze-espresso)" : "var(--kruze-warmgray)",
            }}
            onClick={() => onViewModeChange("list")}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  category,
  count,
  onViewAll,
}: {
  category: WebshopCategory;
  count: number;
  onViewAll: () => void;
}) {
  const color = CATEGORY_COLORS[category];
  return (
    <div className="flex items-center gap-4 mb-5 mt-8 first:mt-0" data-testid={`section-label-${category}`}>
      <span
        className="text-xs font-bold tracking-[0.15em] uppercase whitespace-nowrap"
        style={{ color, fontFamily: "var(--kruze-font-sans)" }}
      >
        {CATEGORY_LABELS[category]}
      </span>
      <div className="kruze-section-line" />
      <button
        className="whitespace-nowrap text-xs font-semibold flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
        style={{ color }}
        onClick={onViewAll}
        data-testid={`link-view-all-${category}`}
      >
        {CATEGORY_LINK_LABELS[category]} ({count}) <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Shop() {
  useStorefrontTheme();
  const [location, setLocation] = useLocation();

  const initialCategory = routeToCategory(location);
  const [filters, setFilters] = useState<FilterState>({ category: initialCategory });
  const [sort, setSort] = useState<SortOption>("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const gridCols = useGridColumns();

  const { data: apiProducts, isLoading } = useQuery<ApiWebshopProduct[]>({
    queryKey: ["/api/webshop/products"],
  });

  const webshopProducts: WebshopProduct[] = useMemo(() => {
    if (!apiProducts) return [];
    return apiProducts
      .map(mapApiProductToWebshop)
      .filter((p): p is WebshopProduct => p !== null);
  }, [apiProducts]);

  useEffect(() => {
    const cat = routeToCategory(location);
    if (cat !== filters.category && !filters.coffeeCountry && !filters.coffeeContinent && !filters.coffeeStrength && !filters.teaType && !filters.teaOrigin && !filters.teaCategory && !filters.juraSeries && !filters.juraPriceRange) {
      setFilters({ category: cat });
    }
  }, [location]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const catRoutes: Record<string, string> = {
      all: "/shop",
      coffee: "/shop/coffee",
      tea: "/shop/tea",
      equipment: "/shop/equipment",
      gifts: "/shop/gifts",
      zoetigheden: "/shop/zoetigheden",
    };
    const target = catRoutes[newFilters.category] || "/shop";
    if (location !== target) {
      setLocation(target);
    }
  };

  const filteredProducts = useMemo(() => filterProducts(webshopProducts, filters), [webshopProducts, filters]);
  const sortedProducts = useMemo(() => sortProducts(filteredProducts, sort), [filteredProducts, sort]);

  const showAllCategories = filters.category === "all";

  const productsByCategory = useMemo(() => {
    if (!showAllCategories) return null;
    const cats: WebshopCategory[] = ["coffee", "tea", "equipment", "gifts", "zoetigheden"];
    const grouped: Record<WebshopCategory, WebshopProduct[]> = {
      coffee: [],
      tea: [],
      equipment: [],
      gifts: [],
      zoetigheden: [],
    };
    for (const p of sortedProducts) {
      grouped[p.category].push(p);
    }
    return { cats, grouped };
  }, [sortedProducts, showAllCategories]);

  const activeCategoryLabel = filters.category === "all"
    ? "Alle producten"
    : CATEGORY_LABELS[filters.category];

  const coffeeCount = webshopProducts.filter(p => p.category === "coffee").length;
  const teaCount = webshopProducts.filter(p => p.category === "tea").length;

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ backgroundColor: "var(--kruze-offwhite)" }}
          data-testid="loading-shop"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--kruze-brown)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--kruze-warmgray)", fontFamily: "var(--kruze-font-sans)" }}
            >
              Producten laden...
            </span>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div
        className="flex min-h-screen"
        style={{ backgroundColor: "var(--kruze-offwhite)" }}
        data-testid="page-shop"
      >
        <WebshopSidebar filters={filters} onFilterChange={handleFilterChange} products={webshopProducts} />

        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {showAllCategories && <SplitEntryBanner coffeCount={coffeeCount} teaCount={teaCount} />}

            <Toolbar
              productCount={sortedProducts.length}
              categoryLabel={activeCategoryLabel}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {showAllCategories && productsByCategory ? (
              productsByCategory.cats.map((cat) => {
                const items = productsByCategory.grouped[cat];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <SectionLabel
                      category={cat}
                      count={webshopProducts.filter((p) => p.category === cat).length}
                      onViewAll={() => handleFilterChange({ category: cat })}
                    />
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                          : "flex flex-col gap-4"
                      }
                      data-testid={`grid-${cat}`}
                    >
                      {items.slice(0, gridCols * 2).map((product) => (
                        <WebshopProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    : "flex flex-col gap-4"
                }
                data-testid="grid-filtered"
              >
                {sortedProducts.map((product) => (
                  <WebshopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {sortedProducts.length === 0 && !isLoading && (
              <div
                className="text-center py-16"
                style={{ fontFamily: "var(--kruze-font-sans)" }}
                data-testid="text-no-products"
              >
                <p className="text-lg" style={{ color: "var(--kruze-warmgray)" }}>
                  Geen producten gevonden voor deze selectie.
                </p>
                <button
                  className="mt-4 text-sm font-semibold cursor-pointer"
                  style={{ color: "var(--kruze-brown)" }}
                  onClick={() => handleFilterChange({ category: "all" })}
                  data-testid="button-reset-filters"
                >
                  Bekijk alle producten
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
