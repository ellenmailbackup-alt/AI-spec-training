import { ShoppingCart, Info, Thermometer, Clock, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import type {
  WebshopProduct,
  CoffeeProduct,
  TeaProduct,
  EquipmentProduct,
  GiftProduct,
  ZoetighedenProduct,
} from "@/data/webshopProducts";

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  coffee: "#E8BF9C",
  tea: "#E6F0C7",
  equipment: "#7B8FA1",
  gifts: "#DAA520",
  zoetigheden: "#CCA693",
};

const CATEGORY_IMAGE_BG: Record<string, string> = {
  coffee: "var(--kruze-coffee-image-bg)",
  tea: "var(--kruze-tea-image-bg)",
  equipment: "var(--kruze-jura-image-bg)",
  gifts: "var(--kruze-gift-image-bg)",
  zoetigheden: "#FAF4EE",
};

const CATEGORY_CTA_BG: Record<string, string> = {
  coffee: "var(--kruze-brown)",
  tea: "var(--kruze-tgreen)",
  equipment: "var(--kruze-jura)",
  gifts: "var(--kruze-brown)",
  zoetigheden: "var(--kruze-brown)",
};

const fontSerif = "var(--kruze-font-serif)";
const fontSans = "var(--kruze-font-sans)";

function ImageArea({ product }: { product: WebshopProduct }) {
  const bgColor = CATEGORY_IMAGE_BG[product.category] || CATEGORY_IMAGE_BG.coffee;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        aspectRatio: "1 / 1",
        backgroundColor: bgColor,
        borderRadius: "6px 6px 0 0",
      }}
      data-testid={`card-image-${product.id}`}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4"
        />
      )}
      {!product.imageUrl && (
        <div className="w-full h-full flex items-center justify-center opacity-20">
          <span style={{ fontFamily: fontSerif, fontSize: 48, color: CATEGORY_BORDER_COLORS[product.category] || "#999" }}>
            {product.category === "coffee" ? "K" : product.category === "tea" ? "T" : product.category === "equipment" ? "J" : "G"}
          </span>
        </div>
      )}

      {product.awards && product.awards.length > 0 && (
        <span className="kruze-award-tag" data-testid={`tag-award-${product.id}`}>
          <Award className="inline-block w-3 h-3 mr-1 -mt-px" />
          {product.awards[0]}
        </span>
      )}
    </div>
  );
}

function CoffeeCardBody({ product, onAddToCart }: { product: CoffeeProduct; onAddToCart: () => void }) {
  return (
    <div className="flex flex-col flex-1 p-4 gap-2" style={{ fontFamily: fontSans }}>
      {(product.origin || product.region) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--kruze-warmgray)" }}
            data-testid={`text-origin-${product.id}`}
          >
            {product.origin}{product.region ? ` \u00B7 ${product.region}` : ""}
          </span>
        </div>
      )}

      <h3
        className="text-base font-bold leading-snug"
        style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
        data-testid={`text-name-${product.id}`}
      >
        {product.name}
      </h3>

      {(product.process || product.strength) && (
        <div className="flex items-center gap-2 flex-wrap">
          {product.process && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: product.process === "Natural" ? "#F0E4D7" :
                  product.process === "Honey" ? "#FDF2D0" :
                  product.process === "Blend" ? "#E8E0D8" : "#E0E8E4",
                color: "var(--kruze-espresso)",
              }}
              data-testid={`tag-process-${product.id}`}
            >
              {product.process}
            </span>
          )}
          {product.strength && (
            <span
              className="text-[11px]"
              style={{ color: "var(--kruze-warmgray)" }}
            >
              {product.strength}
            </span>
          )}
        </div>
      )}

      {product.tastingNote && (
        <p
          className="text-sm italic leading-relaxed flex-1"
          style={{ color: "var(--kruze-brown)" }}
          data-testid={`text-tasting-${product.id}`}
        >
          &ldquo;{product.tastingNote}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <span
          className="text-lg font-bold"
          style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
          data-testid={`text-price-${product.id}`}
        >
          {product.price > 0 ? (
            <>
              &euro;{product.price.toFixed(2)}
              {product.unit && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--kruze-warmgray)" }}>
                  {product.unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-normal" style={{ color: "var(--kruze-warmgray)" }}>Prijs op aanvraag</span>
          )}
        </span>
        {product.price > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="flex items-center justify-center font-semibold px-3 py-2 rounded-sm text-white hover-elevate"
            style={{ backgroundColor: "var(--kruze-brown)" }}
            data-testid={`button-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function TeaCardBody({ product, onAddToCart }: { product: TeaProduct; onAddToCart: () => void }) {
  return (
    <div className="flex flex-col flex-1 p-4 gap-2" style={{ fontFamily: fontSans }}>
      {product.origin && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--kruze-warmgray)" }}
            data-testid={`text-origin-${product.id}`}
          >
            {product.origin}
          </span>
        </div>
      )}

      <h3
        className="text-base font-bold leading-snug"
        style={{ fontFamily: fontSerif, color: "var(--kruze-green)" }}
        data-testid={`text-name-${product.id}`}
      >
        {product.name}
      </h3>

      {(product.brewTemp || product.brewTime) && (
        <div className="flex items-center gap-3 flex-wrap">
          {product.brewTemp && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--kruze-tgreen)" }}>
              <Thermometer className="w-3 h-3" />
              {product.brewTemp}°
            </span>
          )}
          {product.brewTime && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--kruze-tgreen)" }}>
              <Clock className="w-3 h-3" />
              {product.brewTime} min
            </span>
          )}
        </div>
      )}

      {product.tastingNote && (
        <p
          className="text-sm italic leading-relaxed flex-1"
          style={{ color: "var(--kruze-tgreen)" }}
          data-testid={`text-tasting-${product.id}`}
        >
          &ldquo;{product.tastingNote}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <span
          className="text-lg font-bold"
          style={{ color: "var(--kruze-green)", fontFamily: fontSans }}
          data-testid={`text-price-${product.id}`}
        >
          {product.price > 0 ? (
            <>
              &euro;{product.price.toFixed(2)}
              {product.unit && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--kruze-warmgray)" }}>
                  {product.unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-normal" style={{ color: "var(--kruze-warmgray)" }}>Prijs op aanvraag</span>
          )}
        </span>
        {product.price > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="flex items-center justify-center font-semibold px-3 py-2 rounded-sm text-white hover-elevate"
            style={{ backgroundColor: "var(--kruze-tgreen)" }}
            data-testid={`button-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function EquipmentCardBody({ product, onMoreInfo }: { product: EquipmentProduct; onMoreInfo: () => void }) {
  return (
    <div className="flex flex-col flex-1 p-4 gap-2" style={{ fontFamily: fontSans }}>
      <span
        className="text-[11px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--kruze-warmgray)" }}
        data-testid={`text-origin-${product.id}`}
      >
        Jura &middot; Volautomaat
      </span>

      <h3
        className="text-base font-bold leading-snug"
        style={{ fontFamily: fontSerif, color: "var(--kruze-jura-dark)" }}
        data-testid={`text-name-${product.id}`}
      >
        {product.name}
      </h3>

      {product.specs && product.specs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.specs.map((spec) => (
            <span
              key={spec}
              className="text-[10px] font-medium px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: "var(--kruze-jura-image-bg)",
                color: "var(--kruze-jura-dark)",
              }}
              data-testid={`tag-spec-${product.id}-${spec.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {spec}
            </span>
          ))}
        </div>
      )}

      {product.description && (
        <p
          className="text-sm italic leading-relaxed flex-1"
          style={{ color: "var(--kruze-jura)" }}
          data-testid={`text-description-${product.id}`}
        >
          &ldquo;{product.description}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <span
          className="text-lg font-bold"
          style={{ color: "var(--kruze-jura-dark)", fontFamily: fontSans }}
          data-testid={`text-price-${product.id}`}
        >
          {product.price > 0 ? `€${product.price.toFixed(2)}` : (
            <span className="text-sm font-normal" style={{ color: "var(--kruze-warmgray)" }}>Prijs op aanvraag</span>
          )}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onMoreInfo(); }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm text-white hover-elevate"
          style={{ backgroundColor: "var(--kruze-jura)" }}
          data-testid={`button-info-${product.id}`}
        >
          <Info className="w-3.5 h-3.5" />
          Meer informatie
        </button>
      </div>
    </div>
  );
}

function GiftCardBody({ product, onAddToCart }: { product: GiftProduct; onAddToCart: () => void }) {
  return (
    <div className="flex flex-col flex-1 p-4 gap-2" style={{ fontFamily: fontSans }}>
      <h3
        className="text-base font-bold leading-snug"
        style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
        data-testid={`text-name-${product.id}`}
      >
        {product.name}
      </h3>

      {product.description && (
        <p
          className="text-sm leading-relaxed flex-1"
          style={{ color: "var(--kruze-brown)" }}
          data-testid={`text-description-${product.id}`}
        >
          {product.description}
        </p>
      )}

      {product.contents && product.contents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {product.contents.map((item) => (
            <span
              key={item}
              className="text-[10px] font-medium px-2 py-0.5 rounded-sm"
              style={{ backgroundColor: "var(--kruze-gift-image-bg)", color: "var(--kruze-espresso)" }}
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <span
          className="text-lg font-bold"
          style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
          data-testid={`text-price-${product.id}`}
        >
          {product.price > 0 ? (
            <>
              &euro;{product.price.toFixed(2)}
              {product.unit && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--kruze-warmgray)" }}>
                  {product.unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-normal" style={{ color: "var(--kruze-warmgray)" }}>Prijs op aanvraag</span>
          )}
        </span>
        {product.price > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="flex items-center justify-center font-semibold px-3 py-2 rounded-sm text-white hover-elevate"
            style={{ backgroundColor: "var(--kruze-brown)" }}
            data-testid={`button-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ZoetighedenCardBody({ product, onAddToCart }: { product: ZoetighedenProduct; onAddToCart: () => void }) {
  return (
    <div className="flex flex-col flex-1 p-4 gap-2" style={{ fontFamily: fontSans }}>
      <h3
        className="text-base font-bold leading-snug"
        style={{ fontFamily: fontSerif, color: "var(--kruze-espresso)" }}
        data-testid={`text-name-${product.id}`}
      >
        {product.name}
      </h3>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <span
          className="text-lg font-bold"
          style={{ color: "var(--kruze-espresso)", fontFamily: fontSans }}
          data-testid={`text-price-${product.id}`}
        >
          {product.price > 0 ? (
            <>
              &euro;{product.price.toFixed(2)}
              {product.unit && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--kruze-warmgray)" }}>
                  {product.unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-normal" style={{ color: "var(--kruze-warmgray)" }}>Prijs op aanvraag</span>
          )}
        </span>
        {product.price > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="flex items-center justify-center font-semibold px-3 py-2 rounded-sm text-white hover-elevate"
            style={{ backgroundColor: "var(--kruze-brown)" }}
            data-testid={`button-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function WebshopProductCard({ product }: { product: WebshopProduct }) {
  const borderColor = CATEGORY_BORDER_COLORS[product.category] || CATEGORY_BORDER_COLORS.coffee;
  const [, setLocation] = useLocation();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleCardClick = () => {
    setLocation(`/shop/product/${product.id}`);
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit || "",
      imageUrl: product.imageUrl,
      category: product.category,
    });
    toast({
      title: "Toegevoegd aan winkelwagen",
      description: `${product.name} is toegevoegd.`,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="kruze-card-hover flex flex-col bg-white overflow-hidden cursor-pointer"
      style={{
        borderRadius: 6,
        borderBottom: `3px solid ${borderColor}`,
        boxShadow: "0 1px 4px rgba(59, 35, 20, 0.06)",
      }}
      data-testid={`card-product-${product.id}`}
    >
      <ImageArea product={product} />

      {product.category === "coffee" && (
        <CoffeeCardBody product={product as CoffeeProduct} onAddToCart={handleAddToCart} />
      )}
      {product.category === "tea" && (
        <TeaCardBody product={product as TeaProduct} onAddToCart={handleAddToCart} />
      )}
      {product.category === "equipment" && (
        <EquipmentCardBody product={product as EquipmentProduct} onMoreInfo={handleCardClick} />
      )}
      {product.category === "gifts" && (
        <GiftCardBody product={product as GiftProduct} onAddToCart={handleAddToCart} />
      )}
      {product.category === "zoetigheden" && (
        <ZoetighedenCardBody product={product as ZoetighedenProduct} onAddToCart={handleAddToCart} />
      )}
    </div>
  );
}
