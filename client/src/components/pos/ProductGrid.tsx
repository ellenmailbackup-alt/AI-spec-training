import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Coffee, Package } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";

interface ProductGridProps {
  customerId?: number;
  searchQuery: string;
  onProductSelect: (product: any) => void;
}

export function ProductGrid({ customerId, searchQuery, onProductSelect }: ProductGridProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<number | null>(null);
  const [localSearch, setLocalSearch] = useState("");

  // Fetch POS products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/pos/products", customerId],
    queryFn: async () => {
      const params = customerId ? `?customerId=${customerId}` : "";
      const res = await apiRequest("GET", `/api/pos/products${params}`);
      return await res.json();
    },
  });

  // Get unique product types and subtypes
  const productTypes = products
    ? (() => {
        const typeMap = new Map();
        products.forEach((p: any) => {
          if (p.productTypeId && p.productTypeName) {
            typeMap.set(p.productTypeId, { id: p.productTypeId, name: p.productTypeName });
          }
        });
        return Array.from(typeMap.values());
      })()
    : [];

  const productSubtypes = products && selectedTypeId
    ? (() => {
        const subtypeMap = new Map();
        products
          .filter((p: any) => p.productTypeId === selectedTypeId)
          .forEach((p: any) => {
            if (p.productSubtypeId && p.productSubtypeName) {
              subtypeMap.set(p.productSubtypeId, { id: p.productSubtypeId, name: p.productSubtypeName });
            }
          });
        return Array.from(subtypeMap.values());
      })()
    : [];

  // Filter products
  const filteredProducts = products
    ? products.filter((p: any) => {
        // Filter by type
        if (selectedTypeId && p.productTypeId !== selectedTypeId) return false;

        // Filter by subtype
        if (selectedSubtypeId && p.productSubtypeId !== selectedSubtypeId) return false;

        // Filter by search
        if (localSearch) {
          const search = localSearch.toLowerCase();
          return (
            p.posShortNameDutch?.toLowerCase().includes(search) ||
            p.nameDutch?.toLowerCase().includes(search) ||
            p.name?.toLowerCase().includes(search)
          );
        }

        return true;
      })
    : [];

  // Get lowest price for display
  const getLowestPrice = (product: any) => {
    if (!product.variants || product.variants.length === 0) return null;
    const prices = product.variants.map((v: any) => parseFloat(v.priceWithVat));
    return Math.min(...prices);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Search - Clean & Focused */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" data-testid="icon-search" />
        <input
          type="text"
          placeholder="Zoek producten..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="flex h-14 w-full rounded-xl border-2 border-input bg-background py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary transition-all duration-200 shadow-sm"
          style={{ paddingLeft: '56px', paddingRight: '12px' }}
          data-testid="input-search-products"
        />
      </div>

      {/* Category Tabs - Artisanal Feel */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedTypeId(null);
            setSelectedSubtypeId(null);
          }}
          className="font-medium transition-all duration-200 hover:scale-105 rounded-lg"
          style={selectedTypeId === null ? { 
            backgroundColor: '#E8BF9C',
            borderColor: '#E8BF9C',
            color: '#8A6959'
          } : {}}
        >
          Alles
        </Button>
        {productTypes.map((type: any) => (
          <Button
            key={type.id}
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTypeId(type.id);
              setSelectedSubtypeId(null);
            }}
            className="font-medium transition-all duration-200 hover:scale-105 rounded-lg"
            style={selectedTypeId === type.id ? { 
              backgroundColor: '#E8BF9C',
              borderColor: '#E8BF9C',
              color: '#8A6959'
            } : {}}
          >
            {type.name}
          </Button>
        ))}
      </div>

      {/* Refined Subcategory Tabs */}
      {selectedTypeId && productSubtypes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubtypeId(null)}
            className="font-medium transition-all duration-200 hover:scale-105 rounded-lg"
            style={selectedSubtypeId === null ? { 
              backgroundColor: '#E8BF9C',
              borderColor: '#E8BF9C',
              color: '#8A6959'
            } : {}}
          >
            Alles
          </Button>
          {productSubtypes.map((subtype: any) => (
            <Button
              key={subtype.id}
              variant="outline"
              size="sm"
              onClick={() => setSelectedSubtypeId(subtype.id)}
              className="font-medium transition-all duration-200 hover:scale-105 rounded-lg"
              style={selectedSubtypeId === subtype.id ? { 
                backgroundColor: '#E8BF9C',
                borderColor: '#E8BF9C',
                color: '#8A6959'
              } : {}}
            >
              {subtype.name}
            </Button>
          ))}
        </div>
      )}

      {/* Products Grid - Premium & Artisanal */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse border-2 rounded-xl">
              <CardContent className="p-3">
                <div className="h-40 bg-muted rounded-lg mb-2" />
                <div className="h-3 bg-muted rounded mb-1" />
                <div className="h-4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product: any) => {
            const lowestPrice = getLowestPrice(product);

            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 hover:border-primary/40 bg-white rounded-xl overflow-hidden"
                onClick={() => {
                  console.log('Product clicked:', product.id, product.posShortNameDutch || product.nameDutch);
                  onProductSelect(product);
                }}
                data-testid={`card-product-${product.id}`}
              >
                <CardContent className="p-0">
                  {/* Product Image - Takes most of the space */}
                  {product.picture ? (
                    <div className="w-full h-40 overflow-hidden bg-[#F1F2ED]">
                      <img
                        src={product.picture}
                        alt={product.posShortNameDutch || product.nameDutch}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/30 to-muted/50"><svg class="w-14 h-14 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-[#F1F2ED] flex items-center justify-center">
                      <Package className="w-14 h-14 text-[#8A6959]/40" />
                    </div>
                  )}

                  {/* Product Info - Compact */}
                  <div className="p-3 text-center">
                    <p className="text-xs font-serif font-semibold line-clamp-2 mb-1 text-foreground leading-tight">
                      {product.posShortNameDutch || product.nameDutch}
                    </p>
                    {lowestPrice !== null && (
                      <p className="text-base font-bold text-[#8A6959]">
                        {formatCurrency(lowestPrice)}
                        {product.variants.length > 1 && <span className="text-xs text-muted-foreground ml-0.5">+</span>}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 rounded-2xl">
          <CardContent className="p-12 text-center">
            <Coffee className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground font-medium">Geen producten gevonden</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
