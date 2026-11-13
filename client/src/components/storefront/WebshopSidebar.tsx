import { useState } from "react";
import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import type {
  WebshopProduct,
  WebshopCategory,
  CoffeeOriginContinent,
  CoffeeOriginCountry,
  CoffeeStrength,
  TeaType,
  JuraSeries,
  JuraPriceRange,
  CoffeeProduct,
  TeaProduct,
  EquipmentProduct,
} from "@/data/webshopProducts";

export interface FilterState {
  category: WebshopCategory | "all";
  coffeeContinent?: CoffeeOriginContinent;
  coffeeCountry?: CoffeeOriginCountry;
  coffeeStrength?: CoffeeStrength;
  teaCategory?: "Puur" | "Kruiden & Botanisch";
  teaType?: TeaType;
  teaOrigin?: string;
  juraSeries?: JuraSeries;
  juraPriceRange?: JuraPriceRange;
}

interface WebshopSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  products: WebshopProduct[];
}

type AccordionKey = "coffee" | "tea" | "equipment";

const CONTINENTS: CoffeeOriginContinent[] = ["Afrika", "Amerika's", "Azie/Pacific"];

const CONTINENT_COUNTRIES: Record<CoffeeOriginContinent, CoffeeOriginCountry[]> = {
  "Afrika": ["Ethiopie", "Kenya", "Rwanda", "Malawi"],
  "Amerika's": ["Colombia", "Guatemala", "Brazilie", "Cuba", "Costa Rica", "Nicaragua", "Mexico", "Honduras", "Peru"],
  "Azie/Pacific": ["India", "Indonesie", "Papua Nieuw-Guinea"],
};

const STRENGTHS: CoffeeStrength[] = ["Mild", "Evenwichtig", "Krachtig"];

const PURE_TYPES: TeaType[] = ["Groene Thee", "Zwarte Thee", "Oolong", "Witte Thee", "Pu-erh"];
const HERBAL_TYPES: TeaType[] = ["Kruidenblend", "Fruitinfusen", "IJsthee", "Rooibos"];
const TEA_ORIGINS = ["Japan", "China", "Taiwan", "India", "Sri Lanka", "Zuid-Afrika", "Nepal", "Brazilie"] as const;

const JURA_SERIES: JuraSeries[] = ["E-lijn", "S-lijn", "Z-lijn", "D-lijn"];
const JURA_PRICE_RANGES: JuraPriceRange[] = ["Instap", "Middenklasse", "Premium"];

function FilterItem({
  label,
  count,
  active,
  onClick,
  indent = 0,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  indent?: number;
  testId: string;
}) {
  return (
    <button
      className="w-full text-left py-1.5 px-3 text-sm transition-colors cursor-pointer flex items-center justify-between gap-2"
      style={{
        paddingLeft: `${12 + indent * 16}px`,
        fontFamily: "var(--kruze-font-sans)",
        fontWeight: active ? 700 : 400,
        borderLeft: active ? "3px solid var(--kruze-espresso)" : "3px solid transparent",
        backgroundColor: active ? "var(--kruze-offwhite)" : "transparent",
        color: active ? "var(--kruze-espresso)" : "#4A4A4A",
      }}
      onClick={onClick}
      data-testid={testId}
    >
      <span>{label}</span>
      <span
        className="text-xs flex-shrink-0"
        style={{ color: "var(--kruze-warmgray)", fontSize: "11px" }}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryAccordion({
  title,
  isOpen,
  onToggle,
  children,
  testId,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div className="border-b" style={{ borderColor: "var(--kruze-taupe)", borderBottomWidth: "1px" }}>
      <button
        className="w-full flex items-center justify-between py-3 px-3 cursor-pointer"
        onClick={onToggle}
        data-testid={testId}
      >
        <span
          className="font-bold"
          style={{
            fontFamily: "var(--kruze-font-serif)",
            fontSize: "15px",
            color: "var(--kruze-espresso)",
          }}
        >
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" style={{ color: "var(--kruze-warmgray)" }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: "var(--kruze-warmgray)" }} />
        )}
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}

function SubSection({ title, testId, children }: { title: string; testId: string; children: React.ReactNode }) {
  return (
    <div className="mt-1 mb-2">
      <span
        className="block px-3 py-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--kruze-warmgray)", fontSize: "10px" }}
        data-testid={testId}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

function SidebarContent({ filters, onFilterChange, products }: WebshopSidebarProps) {
  const coffeeProducts = products.filter((p): p is CoffeeProduct => p.category === "coffee");
  const teaProducts = products.filter((p): p is TeaProduct => p.category === "tea");
  const equipmentProducts = products.filter((p): p is EquipmentProduct => p.category === "equipment");
  const giftCount = products.filter((p) => p.category === "gifts").length;
  const zoetighedenCount = products.filter((p) => p.category === "zoetigheden").length;

  const [openAccordions, setOpenAccordions] = useState<Set<AccordionKey>>(
    new Set(filters.category !== "all" ? [filters.category as AccordionKey] : [])
  );
  const [openContinents, setOpenContinents] = useState<Set<CoffeeOriginContinent>>(
    new Set(filters.coffeeContinent ? [filters.coffeeContinent] : [])
  );

  const toggleAccordion = (key: AccordionKey) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleContinent = (continent: CoffeeOriginContinent) => {
    setOpenContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) next.delete(continent);
      else next.add(continent);
      return next;
    });
  };

  const setCategory = (category: WebshopCategory | "all") => {
    onFilterChange({ category });
  };

  const totalCount = products.length;

  const countCoffeeByCountry = (country: CoffeeOriginCountry) =>
    coffeeProducts.filter((p) => p.origin === country).length;
  const countCoffeeByContinent = (continent: CoffeeOriginContinent) =>
    coffeeProducts.filter((p) => p.originContinent === continent).length;
  const countCoffeeByStrength = (strength: CoffeeStrength) =>
    coffeeProducts.filter((p) => p.strength === strength).length;
  const countTeaByType = (teaType: TeaType) =>
    teaProducts.filter((p) => p.teaType === teaType).length;
  const countTeaByOrigin = (origin: string) =>
    teaProducts.filter((p) => p.origin === origin).length;
  const countJuraBySeries = (series: JuraSeries) =>
    equipmentProducts.filter((p) => p.series === series).length;
  const countJuraByPrice = (priceRange: JuraPriceRange) =>
    equipmentProducts.filter((p) => p.priceRange === priceRange).length;

  return (
    <>
      <div
        className="border-b py-3 px-3"
        style={{ borderColor: "var(--kruze-taupe)", borderBottomWidth: "1px" }}
      >
        <FilterItem
          label="Alle producten"
          count={totalCount}
          active={filters.category === "all"}
          onClick={() => setCategory("all")}
          testId="filter-all-products"
        />
      </div>

      <CategoryAccordion
        title="Kruze Koffie"
        isOpen={openAccordions.has("coffee")}
        onToggle={() => toggleAccordion("coffee")}
        testId="accordion-coffee"
      >
        <FilterItem
          label="Alle koffie"
          count={coffeeProducts.length}
          active={filters.category === "coffee" && !filters.coffeeContinent && !filters.coffeeCountry && !filters.coffeeStrength}
          onClick={() => onFilterChange({ category: "coffee" })}
          testId="filter-all-coffee"
        />

        <SubSection title="Herkomst" testId="section-coffee-origin">
          {CONTINENTS.map((continent) => (
            <div key={continent}>
              <button
                className="w-full flex items-center justify-between py-1.5 px-3 text-sm cursor-pointer"
                style={{ paddingLeft: "28px" }}
                onClick={() => {
                  toggleContinent(continent);
                  onFilterChange({ category: "coffee", coffeeContinent: continent });
                }}
                data-testid={`filter-continent-${continent.toLowerCase().replace(/[/']/g, "")}`}
              >
                <span className="flex items-center gap-1.5">
                  {openContinents.has(continent) ? (
                    <ChevronDown className="w-3 h-3" style={{ color: "var(--kruze-warmgray)" }} />
                  ) : (
                    <ChevronRight className="w-3 h-3" style={{ color: "var(--kruze-warmgray)" }} />
                  )}
                  <span
                    style={{
                      fontWeight: filters.coffeeContinent === continent && !filters.coffeeCountry ? 700 : 400,
                      color: filters.coffeeContinent === continent && !filters.coffeeCountry ? "var(--kruze-espresso)" : "#4A4A4A",
                    }}
                  >
                    {continent}
                  </span>
                </span>
                <span className="text-xs" style={{ color: "var(--kruze-warmgray)", fontSize: "11px" }}>
                  {countCoffeeByContinent(continent)}
                </span>
              </button>
              {openContinents.has(continent) && (
                <div className="ml-2">
                  {CONTINENT_COUNTRIES[continent].map((country) => {
                    const cc = countCoffeeByCountry(country);
                    if (cc === 0) return null;
                    return (
                      <FilterItem
                        key={country}
                        label={country}
                        count={cc}
                        active={filters.coffeeCountry === country}
                        onClick={() =>
                          onFilterChange({
                            category: "coffee",
                            coffeeContinent: continent,
                            coffeeCountry: country,
                          })
                        }
                        indent={2}
                        testId={`filter-country-${country.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </SubSection>

        <SubSection title="Smaak" testId="section-coffee-strength">
          {STRENGTHS.map((strength) => (
            <FilterItem
              key={strength}
              label={strength}
              count={countCoffeeByStrength(strength)}
              active={filters.coffeeStrength === strength}
              onClick={() => onFilterChange({ category: "coffee", coffeeStrength: strength })}
              indent={1}
              testId={`filter-strength-${strength.toLowerCase()}`}
            />
          ))}
        </SubSection>
      </CategoryAccordion>

      <CategoryAccordion
        title="Kruze Thee"
        isOpen={openAccordions.has("tea")}
        onToggle={() => toggleAccordion("tea")}
        testId="accordion-tea"
      >
        <FilterItem
          label="Alle thee"
          count={teaProducts.length}
          active={filters.category === "tea" && !filters.teaType && !filters.teaCategory && !filters.teaOrigin}
          onClick={() => onFilterChange({ category: "tea" })}
          testId="filter-all-tea"
        />

        <SubSection title="Puur" testId="section-tea-pure">
          {PURE_TYPES.map((type) => (
            <FilterItem
              key={type}
              label={type}
              count={countTeaByType(type)}
              active={filters.teaType === type}
              onClick={() =>
                onFilterChange({ category: "tea", teaCategory: "Puur", teaType: type })
              }
              indent={1}
              testId={`filter-tea-${type.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
        </SubSection>

        <SubSection title="Kruiden & Botanisch" testId="section-tea-herbal">
          {HERBAL_TYPES.map((type) => (
            <FilterItem
              key={type}
              label={type}
              count={countTeaByType(type)}
              active={filters.teaType === type}
              onClick={() =>
                onFilterChange({ category: "tea", teaCategory: "Kruiden & Botanisch", teaType: type })
              }
              indent={1}
              testId={`filter-tea-${type.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
        </SubSection>

        <SubSection title="Herkomst" testId="section-tea-origin">
          {TEA_ORIGINS.map((origin) => {
            const ct = countTeaByOrigin(origin);
            if (ct === 0) return null;
            return (
              <FilterItem
                key={origin}
                label={origin}
                count={ct}
                active={filters.teaOrigin === origin}
                onClick={() => onFilterChange({ category: "tea", teaOrigin: origin })}
                indent={1}
                testId={`filter-tea-origin-${origin.toLowerCase().replace(/\s+/g, "-")}`}
              />
            );
          })}
        </SubSection>
      </CategoryAccordion>

      <CategoryAccordion
        title="Jura Machines"
        isOpen={openAccordions.has("equipment")}
        onToggle={() => toggleAccordion("equipment")}
        testId="accordion-equipment"
      >
        <FilterItem
          label="Alle machines"
          count={equipmentProducts.length}
          active={filters.category === "equipment" && !filters.juraSeries && !filters.juraPriceRange}
          onClick={() => onFilterChange({ category: "equipment" })}
          testId="filter-all-equipment"
        />

        <SubSection title="Serie" testId="section-jura-series">
          {JURA_SERIES.map((series) => (
            <FilterItem
              key={series}
              label={series}
              count={countJuraBySeries(series)}
              active={filters.juraSeries === series}
              onClick={() => onFilterChange({ category: "equipment", juraSeries: series })}
              indent={1}
              testId={`filter-series-${series.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
        </SubSection>

        <SubSection title="Prijs" testId="section-jura-price">
          {JURA_PRICE_RANGES.map((range) => (
            <FilterItem
              key={range}
              label={range}
              count={countJuraByPrice(range)}
              active={filters.juraPriceRange === range}
              onClick={() => onFilterChange({ category: "equipment", juraPriceRange: range })}
              indent={1}
              testId={`filter-price-${range.toLowerCase()}`}
            />
          ))}
        </SubSection>
      </CategoryAccordion>

      <div
        className="border-b"
        style={{ borderColor: "var(--kruze-taupe)", borderBottomWidth: "1px" }}
      >
        <button
          className="w-full flex items-center justify-between py-3 px-3 cursor-pointer"
          onClick={() => setCategory("gifts")}
          data-testid="filter-gifts"
          style={{
            backgroundColor: filters.category === "gifts" ? "var(--kruze-offwhite)" : "transparent",
            borderLeft: filters.category === "gifts" ? "3px solid var(--kruze-espresso)" : "3px solid transparent",
          }}
        >
          <span
            className="font-bold"
            style={{
              fontFamily: "var(--kruze-font-serif)",
              fontSize: "15px",
              color: "var(--kruze-espresso)",
            }}
          >
            Cadeaus & Sets
          </span>
          <span className="text-xs" style={{ color: "var(--kruze-warmgray)", fontSize: "11px" }}>
            {giftCount}
          </span>
        </button>
      </div>

      <div
        className="border-b"
        style={{ borderColor: "var(--kruze-taupe)", borderBottomWidth: "1px" }}
      >
        <button
          className="w-full flex items-center justify-between py-3 px-3 cursor-pointer"
          onClick={() => setCategory("zoetigheden")}
          data-testid="filter-zoetigheden"
          style={{
            backgroundColor: filters.category === "zoetigheden" ? "var(--kruze-offwhite)" : "transparent",
            borderLeft: filters.category === "zoetigheden" ? "3px solid var(--kruze-espresso)" : "3px solid transparent",
          }}
        >
          <span
            className="font-bold"
            style={{
              fontFamily: "var(--kruze-font-serif)",
              fontSize: "15px",
              color: "var(--kruze-espresso)",
            }}
          >
            Zoetigheden
          </span>
          <span className="text-xs" style={{ color: "var(--kruze-warmgray)", fontSize: "11px" }}>
            {zoetighedenCount}
          </span>
        </button>
      </div>
    </>
  );
}

export function WebshopSidebar({ filters, onFilterChange, products }: WebshopSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden lg:block flex-shrink-0 sticky self-start overflow-y-auto z-40"
        style={{
          width: "260px",
          top: "60px",
          maxHeight: "calc(100vh - 60px)",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid var(--kruze-taupe)",
        }}
        data-testid="sidebar-filters"
      >
        <div
          className="py-4 px-3 border-b"
          style={{
            borderColor: "var(--kruze-taupe)",
            fontFamily: "var(--kruze-font-serif)",
          }}
        >
          <span
            className="font-bold text-lg"
            style={{ color: "var(--kruze-espresso)" }}
            data-testid="text-sidebar-title"
          >
            Filters
          </span>
        </div>
        <SidebarContent filters={filters} onFilterChange={onFilterChange} products={products} />
      </aside>

      <button
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "var(--kruze-espresso)",
          color: "#FFFFFF",
        }}
        onClick={() => setMobileOpen(true)}
        data-testid="button-mobile-filters"
      >
        <Filter className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            data-testid="overlay-mobile-filters"
          />
          <div
            className="relative w-[280px] max-w-[85vw] h-full overflow-y-auto bg-white shadow-xl"
            style={{ animation: "slideInLeft 0.25s ease-out" }}
            data-testid="sidebar-mobile-filters"
          >
            <div className="flex items-center justify-between py-4 px-4 border-b" style={{ borderColor: "var(--kruze-taupe)" }}>
              <span
                className="font-bold text-lg"
                style={{
                  fontFamily: "var(--kruze-font-serif)",
                  color: "var(--kruze-espresso)",
                }}
              >
                Filters
              </span>
              <button onClick={() => setMobileOpen(false)} data-testid="button-close-mobile-filters">
                <X className="w-5 h-5" style={{ color: "var(--kruze-warmgray)" }} />
              </button>
            </div>
            <SidebarContent
              filters={filters}
              onFilterChange={(f) => {
                onFilterChange(f);
                setMobileOpen(false);
              }}
              products={products}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
