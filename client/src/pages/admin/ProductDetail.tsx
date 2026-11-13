import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, TrendingUp, Package, Calendar, Euro, ArrowRight, Plus, Edit, Trash2, AlertTriangle, Store, Save } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import type { SalesPrice, BuyingPrice } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown } from "lucide-react";
import { BuyingPriceDialog } from "@/components/admin/BuyingPriceDialog";
import { SalesPriceDialog } from "@/components/admin/SalesPriceDialog";
import { BlendComponentDialog } from "@/components/admin/BlendComponentDialog";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProductWithRelations = {
  id: number;
  name: string;
  nameDutch: string | null;
  picture: string | null;
  isActive: string;
  productTypeId: number;
  productTypeName: string | null;
  productSubtypeName: string | null;
  supplierName: string | null;
  supplierProductId: string | null;
  vatPercentage: number | null;
  ownBlend: boolean;
  woocommerceId: string | null;
  posShortNameDutch: string | null;
};

// Stock Movements Tab Component
function StockMovementsTab({ productId }: { productId: number }) {
  const { data: stockData, isLoading } = useQuery<{
    currentYear: number;
    startStock: number;
    totalBought: number;
    totalSold: number;
  }>({
    queryKey: [`/api/products/${productId}/stock-movements`],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Loading stock movements...</p>
        </CardContent>
      </Card>
    );
  }

  const currentYear = stockData?.currentYear || new Date().getFullYear();
  const startStock = stockData?.startStock || 0;
  const totalBought = stockData?.totalBought || 0;
  const totalSold = stockData?.totalSold || 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Stock Movements - Year {currentYear}</CardTitle>
          <Link href={`/admin/products/${productId}/stock-movements`}>
            <Button variant="outline" size="sm" data-testid="button-view-all-movements">
              View All Stock Movements
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="row">
          {/* Start Stock */}
          <div className="col-md-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(190,60%,45%)]/10 rounded-lg">
                <Package className="w-6 h-6 text-[hsl(190,60%,45%)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Stock {currentYear}</p>
                <p className="text-2xl font-bold" data-testid="text-start-stock">
                  {formatNumber(parseFloat(startStock.toString()))} g
                </p>
              </div>
            </div>
          </div>

          {/* Total Bought */}
          <div className="col-md-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(145,60%,50%)]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[hsl(145,60%,50%)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bought {currentYear}</p>
                <p className="text-2xl font-bold" data-testid="text-total-bought">
                  {formatNumber(parseFloat(totalBought.toString()))} g
                </p>
              </div>
            </div>
          </div>

          {/* Total Sold */}
          <div className="col-md-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(355,75%,60%)]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[hsl(355,75%,60%)] rotate-180" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sold {currentYear}</p>
                <p className="text-2xl font-bold" data-testid="text-total-sold">
                  {formatNumber(parseFloat(totalSold.toString()))} g
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Buying Prices Tab Component
function BuyingPricesTab({ productId }: { productId: number }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<BuyingPrice | null>(null);
  const [showExpiredPrices, setShowExpiredPrices] = useState(false);
  const [deletingPrice, setDeletingPrice] = useState<BuyingPrice | null>(null);

  const { data: buyingPrices = [], isLoading } = useQuery<BuyingPrice[]>({
    queryKey: [`/api/products/${productId}/buying-prices`],
    enabled: !!productId,
  });

  // Filter buying prices based on expired status
  const filteredBuyingPrices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter by expired status (create a copy to avoid mutating cache)
    let filteredPrices = [...buyingPrices];
    if (!showExpiredPrices) {
      filteredPrices = filteredPrices.filter(price => {
        const validUntil = new Date(price.validUntil);
        validUntil.setHours(23, 59, 59, 999);
        return validUntil >= today;
      });
    }

    // Sort by validFrom date (descending - newest first)
    return filteredPrices.sort((a, b) => {
      const dateA = new Date(a.validFrom).getTime();
      const dateB = new Date(b.validFrom).getTime();
      return dateB - dateA;
    });
  }, [buyingPrices, showExpiredPrices]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/buying-prices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/buying-prices`] });
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Buying price created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create buying price",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/buying-prices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/buying-prices`] });
      setDialogOpen(false);
      setEditingPrice(null);
      toast({
        title: "Success",
        description: "Buying price updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update buying price",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/buying-prices/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/buying-prices`] });
      setDeletingPrice(null);
      toast({
        title: "Success",
        description: "Buying price deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete buying price",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: any) => {
    if (editingPrice) {
      updateMutation.mutate({ id: editingPrice.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (price: BuyingPrice) => {
    setEditingPrice(price);
    setDialogOpen(true);
  };

  const handleDeleteClick = (price: BuyingPrice) => {
    setDeletingPrice(price);
  };

  const handleConfirmDelete = () => {
    if (deletingPrice) {
      deleteMutation.mutate(deletingPrice.id);
    }
  };

  const handleAddNew = () => {
    setEditingPrice(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buying Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Loading buying prices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Buying Prices</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-expired-buying"
                  checked={showExpiredPrices}
                  onCheckedChange={(checked) => setShowExpiredPrices(!!checked)}
                  data-testid="checkbox-show-expired-buying"
                />
                <label 
                  htmlFor="show-expired-buying" 
                  className="text-sm font-medium cursor-pointer"
                  onClick={() => setShowExpiredPrices(!showExpiredPrices)}
                >
                  Show expired prices
                </label>
              </div>
              <Button onClick={handleAddNew} size="sm" data-testid="button-add-buying-price">
                <Plus className="w-4 h-4 mr-2" />
                Add Buying Price
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBuyingPrices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {showExpiredPrices 
                  ? "No buying prices defined for this product."
                  : "No active or future buying prices available. Enable 'Show expired prices' to view historical data."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '15%', paddingLeft: '1.5rem' }}>Valid From</th>
                    <th style={{ width: '15%' }}>Valid Until</th>
                    <th className="text-right" style={{ width: '15%' }}>Price</th>
                    <th style={{ width: '10%' }}>Currency</th>
                    <th style={{ width: '15%' }}>Unit</th>
                    <th className="text-center" style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyingPrices.map((price) => (
                    <tr key={price.id} data-testid={`row-buying-price-${price.id}`}>
                      <td className="font-medium" style={{ paddingLeft: '1.5rem' }}>
                        {format(new Date(price.validFrom), 'dd/MM/yyyy')}
                      </td>
                      <td className="font-medium">
                        {format(new Date(price.validUntil), 'dd/MM/yyyy')}
                      </td>
                      <td className="text-right font-medium" data-testid={`text-price-${price.id}`}>
                        {formatNumber(parseFloat(price.price))}
                      </td>
                      <td className="font-medium">
                        {price.currency}
                      </td>
                      <td className="font-medium">
                        {price.productUnit}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEdit(price)}
                            data-testid={`button-edit-${price.id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(price)}
                            data-testid={`button-delete-${price.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BuyingPriceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPrice(null);
        }}
        onSubmit={handleSubmit}
        productId={productId}
        defaultValues={editingPrice ? {
          productId: editingPrice.productId,
          validFrom: format(new Date(editingPrice.validFrom), 'yyyy-MM-dd'),
          validUntil: format(new Date(editingPrice.validUntil), 'yyyy-MM-dd'),
          price: editingPrice.price,
          currency: editingPrice.currency,
          productUnit: editingPrice.productUnit,
          workId: editingPrice.workId,
        } : undefined}
        title={editingPrice ? "Edit Buying Price" : "Add Buying Price"}
        description={editingPrice ? "Update the buying price details" : "Add a new buying price for this product"}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingPrice} onOpenChange={(open) => !open && setDeletingPrice(null)}>
        <AlertDialogContent data-testid="dialog-delete-buying-price">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Buying Price
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the buying price from{" "}
              <strong>{deletingPrice ? format(new Date(deletingPrice.validFrom), 'dd/MM/yyyy') : ''}</strong> to{" "}
              <strong>{deletingPrice ? format(new Date(deletingPrice.validUntil), 'dd/MM/yyyy') : ''}</strong>?
              <br /><br />
              <span className="text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function WebshopTab({ productId, productTypeId }: { productId: number; productTypeId: number }) {
  const { toast } = useToast();

  const { data: webshopData, isLoading: webshopLoading } = useQuery({
    queryKey: [`/api/products/${productId}/webshop-details`],
    enabled: !!productId,
  });

  const [webshopEnabled, setWebshopEnabled] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [seasonal, setSeasonal] = useState(false);
  const [webshopDescription, setWebshopDescription] = useState("");
  const [awards, setAwards] = useState("");
  const [webshopSortOrder, setWebshopSortOrder] = useState(0);
  const [originCountry, setOriginCountry] = useState("");
  const [originContinent, setOriginContinent] = useState("");
  const [region, setRegion] = useState("");
  const [tastingNote, setTastingNote] = useState("");
  const [process, setProcess] = useState("");
  const [strength, setStrength] = useState("");
  const [brewTemp, setBrewTemp] = useState("");
  const [brewTime, setBrewTime] = useState("");
  const [brewDosage, setBrewDosage] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [juraSeries, setJuraSeries] = useState("");
  const [juraPriceRange, setJuraPriceRange] = useState("");
  const [specs, setSpecs] = useState("");

  useEffect(() => {
    if (!webshopData) return;
    setWebshopEnabled(webshopData.webshopEnabled ?? false);
    setFeatured(webshopData.featured ?? false);
    setSeasonal(webshopData.seasonal ?? false);
    setWebshopDescription(webshopData.webshopDescription || "");
    setAwards(webshopData.awards || "");
    setWebshopSortOrder(webshopData.webshopSortOrder || 0);
    setOriginCountry(webshopData.originCountry || "");
    setOriginContinent(webshopData.originContinent || "");
    setRegion(webshopData.region || "");
    setTastingNote(webshopData.tastingNote || "");
    setProcess(webshopData.process || "");
    setStrength(webshopData.strength || "");
    setBrewTemp(webshopData.brewTemp || "");
    setBrewTime(webshopData.brewTime || "");
    setBrewDosage(webshopData.brewDosage || "");
    setShortDescription(webshopData.shortDescription || "");
    setJuraSeries(webshopData.juraSeries || "");
    setJuraPriceRange(webshopData.juraPriceRange || "");
    setSpecs(webshopData.specs || "");
  }, [webshopData]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/webshop-details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/webshop/products"] });
      toast({ title: "Opgeslagen", description: "Webshop gegevens zijn bijgewerkt" });
    },
    onError: (error: Error) => {
      toast({ title: "Fout", description: error.message || "Opslaan mislukt", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      webshopEnabled,
      featured,
      seasonal,
      webshopDescription: webshopDescription || null,
      awards: awards || null,
      webshopSortOrder,
      originCountry: originCountry || null,
      originContinent: originContinent || null,
      region: region || null,
      tastingNote: tastingNote || null,
      process: process || null,
      strength: strength || null,
      brewTemp: brewTemp || null,
      brewTime: brewTime || null,
      brewDosage: brewDosage || null,
      shortDescription: shortDescription || null,
      juraSeries: juraSeries || null,
      juraPriceRange: juraPriceRange || null,
      specs: specs || null,
    });
  };

  const isCoffee = productTypeId === 1;
  const isTea = productTypeId === 2;
  const isEquipment = productTypeId === 3;

  if (webshopLoading) {
    return <div className="py-8 text-center text-muted-foreground">Laden...</div>;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Webshop Instellingen
          </CardTitle>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-webshop">
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Algemeen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="webshop-enabled">Zichtbaar in webshop</Label>
              <Switch
                id="webshop-enabled"
                checked={webshopEnabled}
                onCheckedChange={setWebshopEnabled}
                data-testid="switch-webshop-enabled"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="featured">Uitgelicht</Label>
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
                data-testid="switch-featured"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="seasonal">Seizoensproduct</Label>
              <Switch
                id="seasonal"
                checked={seasonal}
                onCheckedChange={setSeasonal}
                data-testid="switch-seasonal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-order">Sorteervolgorde</Label>
              <Input
                id="sort-order"
                type="number"
                value={webshopSortOrder}
                onChange={(e) => setWebshopSortOrder(parseInt(e.target.value) || 0)}
                data-testid="input-sort-order"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Webshop beschrijving</Label>
            <RichTextEditor
              value={webshopDescription}
              onChange={setWebshopDescription}
              data-testid="textarea-webshop-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="short-description">Korte omschrijving</Label>
            <Textarea
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Korte omschrijving voor boven de koopknop"
              data-testid="textarea-short-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="awards">Awards / Certificaten</Label>
            <Input
              id="awards"
              value={awards}
              onChange={(e) => setAwards(e.target.value)}
              placeholder="bijv. Great Taste"
              data-testid="input-awards"
            />
          </div>
        </div>

        {isCoffee && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Koffie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin-country">Herkomstland</Label>
                <Input
                  id="origin-country"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  placeholder="bijv. Ethiopie"
                  data-testid="input-origin-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin-continent">Continent</Label>
                <Select value={originContinent} onValueChange={setOriginContinent}>
                  <SelectTrigger data-testid="input-origin-continent">
                    <SelectValue placeholder="Selecteer continent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Afrika">Afrika</SelectItem>
                    <SelectItem value="Amerika's">Amerika's</SelectItem>
                    <SelectItem value="Azie/Pacific">Azie/Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Regio</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="bijv. Yirgacheffe"
                  data-testid="input-region"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="process">Verwerkingsmethode</Label>
                <Select value={process} onValueChange={setProcess}>
                  <SelectTrigger data-testid="select-process">
                    <SelectValue placeholder="Selecteer methode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Washed">Washed</SelectItem>
                    <SelectItem value="Honey">Honey</SelectItem>
                    <SelectItem value="Blend">Blend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Sterkte</Label>
                <Select value={strength} onValueChange={setStrength}>
                  <SelectTrigger data-testid="select-strength">
                    <SelectValue placeholder="Selecteer sterkte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mild">Mild</SelectItem>
                    <SelectItem value="Evenwichtig">Evenwichtig</SelectItem>
                    <SelectItem value="Krachtig">Krachtig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasting-note">Smaaknotities</Label>
              <Textarea
                id="tasting-note"
                value={tastingNote}
                onChange={(e) => setTastingNote(e.target.value)}
                placeholder="bijv. Fruitig met tonen van blauwe bes en jasmin"
                data-testid="textarea-tasting-note"
              />
            </div>
          </div>
        )}

        {isTea && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Thee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin-country-tea">Herkomstland</Label>
                <Input
                  id="origin-country-tea"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  placeholder="bijv. Japan"
                  data-testid="input-origin-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin-continent-tea">Continent</Label>
                <Input
                  id="origin-continent-tea"
                  value={originContinent}
                  onChange={(e) => setOriginContinent(e.target.value)}
                  placeholder="bijv. Azië/Pacific"
                  data-testid="input-origin-continent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brew-temp">Zettemperatuur (°C)</Label>
                <Input
                  id="brew-temp"
                  type="text"
                  value={brewTemp}
                  onChange={(e) => setBrewTemp(e.target.value)}
                  placeholder="bijv. 80 of 70-80"
                  data-testid="input-brew-temp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brew-time">Zettijd (minuten)</Label>
                <Input
                  id="brew-time"
                  type="text"
                  value={brewTime}
                  onChange={(e) => setBrewTime(e.target.value)}
                  placeholder="bijv. 3 of 2-3"
                  data-testid="input-brew-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brew-dosage">Hoeveelheid thee</Label>
                <Input
                  id="brew-dosage"
                  type="text"
                  value={brewDosage}
                  onChange={(e) => setBrewDosage(e.target.value)}
                  placeholder="bijv. 2g / 200ml"
                  data-testid="input-brew-dosage"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasting-note-tea">Smaaknotities</Label>
              <Textarea
                id="tasting-note-tea"
                value={tastingNote}
                onChange={(e) => setTastingNote(e.target.value)}
                placeholder="bijv. Fris en bloemig met zoete afdronk"
                data-testid="textarea-tasting-note"
              />
            </div>
          </div>
        )}

        {isEquipment && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Apparatuur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jura-series">Jura Serie</Label>
                <Select value={juraSeries} onValueChange={setJuraSeries}>
                  <SelectTrigger data-testid="select-jura-series">
                    <SelectValue placeholder="Selecteer serie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-lijn">E-lijn</SelectItem>
                    <SelectItem value="S-lijn">S-lijn</SelectItem>
                    <SelectItem value="Z-lijn">Z-lijn</SelectItem>
                    <SelectItem value="D-lijn">D-lijn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jura-price-range">Prijsklasse</Label>
                <Select value={juraPriceRange} onValueChange={setJuraPriceRange}>
                  <SelectTrigger data-testid="select-jura-price-range">
                    <SelectValue placeholder="Selecteer prijsklasse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instap">Instap</SelectItem>
                    <SelectItem value="Middenklasse">Middenklasse</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specs">Specificaties (JSON)</Label>
              <Textarea
                id="specs"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder='bijv. {"barPressure": "15 bar", "drinkCount": "12 dranken"}'
                className="font-mono text-sm"
                data-testid="textarea-specs"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params.id || "0");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sortField, setSortField] = useState<"year" | "sales" | "revenue">("year");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showExpiredPrices, setShowExpiredPrices] = useState(false);
  const [salesPriceDialogOpen, setSalesPriceDialogOpen] = useState(false);
  const [editingSalesPrice, setEditingSalesPrice] = useState<SalesPrice | null>(null);
  const [deletingSalesPrice, setDeletingSalesPrice] = useState<SalesPrice | null>(null);
  const [blendComponentDialogOpen, setBlendComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any | null>(null);

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery<ProductWithRelations>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch product statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<{
    ytdSales: number;
    currentStock: number;
    highestMonthlySale: number;
    totalRevenue: number;
  }>({
    queryKey: [`/api/products/${productId}/statistics`],
    enabled: !!productId,
  });

  // Fetch monthly sales data for current year (Y)
  const { data: currentYearData } = useQuery<Array<{
    month: number;
    sales: number;
    revenue: number;
  }>>({
    queryKey: [`/api/products/${productId}/monthly-sales`, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/monthly-sales?year=${selectedYear}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to fetch monthly sales');
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch monthly sales data for previous year (Y-1)
  const { data: previousYearData } = useQuery<Array<{
    month: number;
    sales: number;
    revenue: number;
  }>>({
    queryKey: [`/api/products/${productId}/monthly-sales`, selectedYear - 1],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/monthly-sales?year=${selectedYear - 1}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to fetch monthly sales');
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch yearly sales data
  const { data: yearlyData, isLoading: yearlyLoading } = useQuery<Array<{
    year: number;
    totalSales: number;
    totalRevenue: number;
    orderCount: number;
  }>>({
    queryKey: [`/api/products/${productId}/yearly-sales`],
    enabled: !!productId,
  });

  // Fetch sales prices for this product
  const { data: salesPrices = [], isLoading: pricesLoading } = useQuery<SalesPrice[]>({
    queryKey: [`/api/products/${productId}/sales-prices`],
    enabled: !!productId,
  });

  // Filter and sort sales prices for this product
  const filteredAndSortedPrices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter by expired status (create a copy to avoid mutating cache)
    let filteredPrices = [...salesPrices];
    if (!showExpiredPrices) {
      filteredPrices = filteredPrices.filter(price => {
        // Handle null validUntil as perpetual (never expires)
        if (!price.validUntil) return true;
        
        const validUntil = new Date(price.validUntil);
        validUntil.setHours(23, 59, 59, 999);
        return validUntil >= today;
      });
    }

    // Sort by unit amount first, then by validFrom (newest first)
    return filteredPrices.sort((a, b) => {
      // Primary sort: by unit amount (ascending)
      if (a.amount !== b.amount) {
        return a.amount - b.amount;
      }
      // Secondary sort: by validFrom date (descending - newest first)
      const dateA = new Date(a.validFrom).getTime();
      const dateB = new Date(b.validFrom).getTime();
      return dateB - dateA;
    });
  }, [salesPrices, showExpiredPrices]);

  // Helper function to determine price status
  const getPriceStatus = (validFrom: string, validUntil: string | null): 'active' | 'future' | 'expired' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const from = new Date(validFrom);
    from.setHours(0, 0, 0, 0);
    
    // Null validUntil means perpetual/never expires
    if (!validUntil) {
      return today < from ? 'future' : 'active';
    }
    
    const until = new Date(validUntil);
    until.setHours(23, 59, 59, 999);

    if (today < from) return 'future';
    if (today > until) return 'expired';
    return 'active';
  };

  // Prepare chart data (values already in grams)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = monthNames.map((name, index) => {
    const month = index + 1;
    const currentMonth = currentYearData?.find(d => d.month === month);
    const previousMonth = previousYearData?.find(d => d.month === month);
    
    return {
      month: name,
      [`Year ${selectedYear}`]: currentMonth?.sales || 0,
      [`Year ${selectedYear - 1}`]: previousMonth?.sales || 0,
    };
  });

  // Sort yearly data
  const sortedYearlyData = useMemo(() => {
    if (!yearlyData) return [];
    
    const sorted = [...yearlyData].sort((a, b) => {
      let aVal: number, bVal: number;
      
      if (sortField === "year") {
        aVal = a.year;
        bVal = b.year;
      } else if (sortField === "sales") {
        aVal = a.totalSales;
        bVal = b.totalSales;
      } else { // revenue
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
      }
      
      const direction = sortDirection === "asc" ? 1 : -1;
      return (aVal - bVal) * direction;
    });
    
    return sorted;
  }, [yearlyData, sortField, sortDirection]);

  const handleSort = (field: "year" | "sales" | "revenue") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sales Price mutations
  const { toast } = useToast();

  const createSalesPriceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/sales-prices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/sales-prices`] });
      setSalesPriceDialogOpen(false);
      toast({
        title: "Success",
        description: "Sales price created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales price",
        variant: "destructive",
      });
    },
  });

  const updateSalesPriceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/sales-prices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/sales-prices`] });
      setSalesPriceDialogOpen(false);
      setEditingSalesPrice(null);
      toast({
        title: "Success",
        description: "Sales price updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sales price",
        variant: "destructive",
      });
    },
  });

  const deleteSalesPriceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/sales-prices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/sales-prices`] });
      toast({
        title: "Success",
        description: "Sales price deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sales price",
        variant: "destructive",
      });
    },
  });

  const handleSalesPriceSubmit = (values: any) => {
    if (editingSalesPrice) {
      updateSalesPriceMutation.mutate({ id: editingSalesPrice.id, data: values });
    } else {
      createSalesPriceMutation.mutate(values);
    }
  };

  // Blend Component mutations
  const { data: blendComponents = [], isLoading: componentsLoading } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/components`],
    enabled: !!productId && product?.ownBlend === true,
  });

  const createComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/product-components", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/components`] });
      setBlendComponentDialogOpen(false);
      toast({
        title: "Success",
        description: "Blend component added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add blend component",
        variant: "destructive",
      });
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/product-components/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/components`] });
      setBlendComponentDialogOpen(false);
      setEditingComponent(null);
      toast({
        title: "Success",
        description: "Blend component updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update blend component",
        variant: "destructive",
      });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/product-components/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/components`] });
      toast({
        title: "Success",
        description: "Blend component deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blend component",
        variant: "destructive",
      });
    },
  });

  const handleComponentSubmit = (values: any) => {
    if (editingComponent) {
      updateComponentMutation.mutate({ id: editingComponent.id, data: values });
    } else {
      createComponentMutation.mutate(values);
    }
  };

  if (productLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
            <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
            <Link href="/admin/products">
              <Button className="mt-4" data-testid="button-back-to-products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-product-name">
            {product.name}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-product-name-dutch">
            {product.nameDutch}
          </p>
        </div>
        {product.picture && (
          <img
            src={product.picture}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg border"
            data-testid="img-product"
          />
        )}
      </div>

      {/* Statistics Cards - AdminLTE Style matching Customer page */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(190,60%,45%)] text-white border-0" data-testid="card-ytd-sales">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-ytd-sales">
                        {formatNumber(statistics?.ytdSales || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Year-to-Date Sales (grams)</div>
                    </>
                  )}
                </div>
                <TrendingUp className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(45,90%,55%)] text-white border-0" data-testid="card-current-stock">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-current-stock">
                        {formatNumber(statistics?.currentStock || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Current Inventory Stock (grams)</div>
                    </>
                  )}
                </div>
                <Package className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(355,75%,60%)] text-white border-0" data-testid="card-highest-monthly">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-highest-monthly">
                        {formatNumber(statistics?.highestMonthlySale || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Peak Monthly Sales Volume (grams)</div>
                    </>
                  )}
                </div>
                <Calendar className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(145,60%,50%)] text-white border-0" data-testid="card-total-revenue">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-total-revenue">
                        {formatCurrency(statistics?.totalRevenue || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">All-Time Revenue (excl. VAT)</div>
                    </>
                  )}
                </div>
                <Euro className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <Card data-testid="card-sales-chart">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Trends - Year-over-Year Comparison</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear - 1)}
                data-testid="button-previous-year"
              >
                ← Previous Year
              </Button>
              <span className="text-sm font-medium px-3">
                {selectedYear - 1} vs {selectedYear}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= currentYear}
                data-testid="button-next-year"
              >
                Next Year →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  label={{ value: 'Sales (grams)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => {
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}k`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => `${formatNumber(value)} g`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={`Year ${selectedYear - 1}`} 
                  stroke="hsl(355, 75%, 60%)" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name={`Year ${selectedYear - 1} (Previous)`}
                  dot={{ fill: 'hsl(355, 75%, 60%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={`Year ${selectedYear}`} 
                  stroke="hsl(190, 60%, 45%)" 
                  strokeWidth={3}
                  name={`Year ${selectedYear} (Current)`}
                  dot={{ fill: 'hsl(190, 60%, 45%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Sales Data Table */}
      <Card data-testid="card-yearly-sales">
        <CardHeader>
          <CardTitle>Yearly Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          {yearlyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("year")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                        data-testid="button-sort-year"
                      >
                        Year
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("sales")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-sales"
                      >
                        Total Sales (grams)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("revenue")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-revenue"
                      >
                        Revenue (excl. VAT)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedYearlyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedYearlyData.map((row) => (
                      <TableRow key={row.year} data-testid={`row-year-${row.year}`}>
                        <TableCell className="font-medium" data-testid={`text-year-${row.year}`}>
                          {row.year}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-sales-${row.year}`}>
                          {formatNumber(row.totalSales)} g
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-revenue-${row.year}`}>
                          {formatCurrency(row.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Tabs - Detailed Product Information */}
      <Tabs defaultValue="overview" className="space-y-4" data-testid="tabs-product-details">
        {product.ownBlend ? (
          <TabsList className="!flex w-full">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="stock" className="flex-1" data-testid="tab-stock">Stock Movements</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1" data-testid="tab-pricing">Pricing</TabsTrigger>
            <TabsTrigger value="buying-prices" className="flex-1" data-testid="tab-buying-prices">Buying Prices</TabsTrigger>
            <TabsTrigger value="blend-components" className="flex-1" data-testid="tab-blend-components">Blend Components</TabsTrigger>
            <TabsTrigger value="webshop" className="flex-1" data-testid="tab-webshop">Webshop</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="!flex w-full">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="stock" className="flex-1" data-testid="tab-stock">Stock Movements</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1" data-testid="tab-pricing">Pricing</TabsTrigger>
            <TabsTrigger value="buying-prices" className="flex-1" data-testid="tab-buying-prices">Buying Prices</TabsTrigger>
            <TabsTrigger value="webshop" className="flex-1" data-testid="tab-webshop">Webshop</TabsTrigger>
          </TabsList>
        )}

        {/* Overview Tab */}
        <TabsContent value="overview" data-testid="content-overview">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product ID</p>
                  <p className="font-semibold" data-testid="text-overview-id">{product.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">English Name</p>
                  <p className="font-semibold" data-testid="text-overview-name">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dutch Name</p>
                  <p className="font-semibold" data-testid="text-overview-name-dutch">{product.nameDutch || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="font-semibold" data-testid="text-overview-status">
                    {product.isActive === "1" ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="font-semibold" data-testid="text-overview-category">
                    {product.productTypeName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sub-Category</p>
                  <p className="font-semibold" data-testid="text-overview-subcategory">
                    {product.productSubtypeName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="font-semibold" data-testid="text-overview-supplier">
                    {product.supplierName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier Product ID</p>
                  <p className="font-semibold" data-testid="text-overview-supplier-id">
                    {product.supplierProductId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">VAT Rate</p>
                  <p className="font-semibold" data-testid="text-overview-vat">
                    {product.vatPercentage ? `${(product.vatPercentage * 100).toFixed(0)}%` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Own Blend</p>
                  <p className="font-semibold" data-testid="text-overview-blend">
                    {product.ownBlend ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WooCommerce ID</p>
                  <p className="font-semibold" data-testid="text-overview-woo-id">
                    {product.woocommerceId || "-"}
                  </p>
                </div>
              </div>
              {product.posShortNameDutch && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">POS Short Name</p>
                  <div>
                    <p className="text-xs text-muted-foreground">Dutch</p>
                    <p className="text-lg font-semibold" data-testid="text-overview-pos-name-dutch">
                      {product.posShortNameDutch}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="stock" data-testid="content-stock">
          <StockMovementsTab productId={productId} />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" data-testid="content-pricing">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Pricing Information</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="show-expired"
                      checked={showExpiredPrices}
                      onCheckedChange={(checked) => setShowExpiredPrices(!!checked)}
                      data-testid="checkbox-show-expired"
                    />
                    <label 
                      htmlFor="show-expired" 
                      className="text-sm font-medium cursor-pointer"
                      onClick={() => setShowExpiredPrices(!showExpiredPrices)}
                    >
                      Show expired prices
                    </label>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingSalesPrice(null);
                      setSalesPriceDialogOpen(true);
                    }}
                    size="sm"
                    data-testid="button-add-sales-price"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pricesLoading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Loading pricing information...</p>
                </div>
              ) : filteredAndSortedPrices.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {showExpiredPrices 
                      ? "No pricing information available for this product."
                      : "No active or future pricing information available. Enable 'Show expired prices' to view historical data."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th style={{ width: '8%', paddingLeft: '1.5rem' }}>Unit</th>
                        <th className="text-right" style={{ width: '10%' }}>B2C Price (excl VAT)</th>
                        <th className="text-right" style={{ width: '10%' }}>B2C Price (incl VAT)</th>
                        <th className="text-right" style={{ width: '10%' }}>B2B Price (excl VAT)</th>
                        <th className="text-right" style={{ width: '10%' }}>B2B Price (incl VAT)</th>
                        <th style={{ width: '11%', paddingLeft: '1rem' }}>Valid From</th>
                        <th style={{ width: '11%' }}>Valid Until</th>
                        <th className="text-center" style={{ width: '5%' }}>POS</th>
                        <th className="text-center" style={{ width: '5%' }}>Shop</th>
                        <th className="text-center" style={{ width: '5%' }}>Default</th>
                        <th className="text-center" style={{ width: '10%' }}>Status</th>
                        <th className="text-center" style={{ width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedPrices.map((price) => {
                        const status = getPriceStatus(price.validFrom, price.validUntil);
                        return (
                          <tr key={price.id} data-testid={`row-price-${price.id}`}>
                            <td className="font-medium" style={{ paddingLeft: '1.5rem' }}>
                              {price.amount} {price.unit}
                            </td>
                            <td className="text-right font-medium" data-testid={`text-b2c-excl-vat-${price.id}`}>
                              {formatCurrency(price.b2cPriceWithoutVat)}
                            </td>
                            <td className="text-right font-medium" data-testid={`text-b2c-incl-vat-${price.id}`}>
                              {formatCurrency(price.b2cPriceWithVat)}
                            </td>
                            <td className="text-right font-medium" data-testid={`text-b2b-excl-vat-${price.id}`}>
                              {formatCurrency(price.b2bPriceWithoutVat)}
                            </td>
                            <td className="text-right font-medium" data-testid={`text-b2b-incl-vat-${price.id}`}>
                              {formatCurrency(price.b2bPriceWithVat)}
                            </td>
                            <td className="font-medium" style={{ paddingLeft: '1rem' }}>
                              {format(new Date(price.validFrom), 'dd/MM/yyyy')}
                            </td>
                            <td className="font-medium">
                              {price.validUntil ? format(new Date(price.validUntil), 'dd/MM/yyyy') : 'Perpetual'}
                            </td>
                            <td className="text-center">
                              {price.posItem ? (
                                <Badge variant="default" className="bg-blue-600" data-testid={`badge-pos-${price.id}`}>POS</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs" data-testid={`badge-pos-${price.id}`}>—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {(price as any).webshopPrice ? (
                                <Badge variant="default" className="bg-emerald-600" data-testid={`badge-shop-${price.id}`}>Shop</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs" data-testid={`badge-shop-${price.id}`}>—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {(price as any).webshopDefault ? (
                                <Badge variant="default" className="bg-violet-600" data-testid={`badge-default-${price.id}`}>Default</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs" data-testid={`badge-default-${price.id}`}>—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {status === 'active' && (
                                <Badge variant="default" className="bg-green-600" data-testid={`badge-status-${price.id}`}>
                                  Active
                                </Badge>
                              )}
                              {status === 'future' && (
                                <Badge variant="default" className="bg-blue-600" data-testid={`badge-status-${price.id}`}>
                                  Future
                                </Badge>
                              )}
                              {status === 'expired' && (
                                <Badge variant="secondary" data-testid={`badge-status-${price.id}`}>
                                  Expired
                                </Badge>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSalesPrice(price);
                                    setSalesPriceDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${price.id}`}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeletingSalesPrice(price)}
                                  data-testid={`button-delete-${price.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buying Prices Tab */}
        <TabsContent value="buying-prices" data-testid="content-buying-prices">
          <BuyingPricesTab productId={productId} />
        </TabsContent>

        {/* Webshop Tab */}
        <TabsContent value="webshop" data-testid="content-webshop">
          <WebshopTab productId={productId} productTypeId={product.productTypeId} />
        </TabsContent>

        {/* Blend Components Tab */}
        {product.ownBlend && (
          <TabsContent value="blend-components" data-testid="content-blend-components">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Blend Components</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingComponent(null);
                      setBlendComponentDialogOpen(true);
                    }}
                    size="sm"
                    data-testid="button-add-component"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Component
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {componentsLoading ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">Loading blend components...</p>
                  </div>
                ) : blendComponents.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No blend components defined yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">Click "Add Component" to start building your blend.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th style={{ width: '50%', paddingLeft: '1.5rem' }}>Component Product</th>
                          <th className="text-right" style={{ width: '20%' }}>Percentage</th>
                          <th className="text-center" style={{ width: '30%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blendComponents.map((component) => (
                          <tr key={component.id}>
                            <td className="font-medium" style={{ paddingLeft: '1.5rem' }}>
                              {component.componentNameDutch} ({component.componentName})
                            </td>
                            <td className="text-right">
                              {formatNumber(parseFloat(component.componentPercentage))}%
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingComponent(component);
                                    setBlendComponentDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${component.id}`}
                                  className="hover-elevate active-elevate-2"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this component?')) {
                                      deleteComponentMutation.mutate(component.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${component.id}`}
                                  className="hover-elevate active-elevate-2"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50">
                          <td className="font-bold" style={{ paddingLeft: '1.5rem' }}>Total</td>
                          <td className="text-right font-bold">
                            {formatNumber(
                              blendComponents.reduce((sum, c) => sum + parseFloat(c.componentPercentage), 0)
                            )}%
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                    {blendComponents.reduce((sum, c) => sum + parseFloat(c.componentPercentage), 0) !== 100 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ Warning: The total percentage should equal 100%. 
                          Current total: {formatNumber(blendComponents.reduce((sum, c) => sum + parseFloat(c.componentPercentage), 0))}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Sales Price Dialog */}
      <SalesPriceDialog
        open={salesPriceDialogOpen}
        onOpenChange={setSalesPriceDialogOpen}
        onSubmit={handleSalesPriceSubmit}
        productId={productId}
        defaultValues={editingSalesPrice ? {
          amount: editingSalesPrice.amount,
          unit: editingSalesPrice.unit,
          posItem: editingSalesPrice.posItem,
          webshopPrice: (editingSalesPrice as any).webshopPrice || false,
          webshopDefault: (editingSalesPrice as any).webshopDefault || false,
          b2cPriceWithoutVat: editingSalesPrice.b2cPriceWithoutVat,
          b2cPriceWithVat: editingSalesPrice.b2cPriceWithVat,
          b2bPriceWithoutVat: editingSalesPrice.b2bPriceWithoutVat,
          b2bPriceWithVat: editingSalesPrice.b2bPriceWithVat,
          validFrom: format(new Date(editingSalesPrice.validFrom), "yyyy-MM-dd"),
          validUntil: format(new Date(editingSalesPrice.validUntil), "yyyy-MM-dd"),
        } : undefined}
        title={editingSalesPrice ? "Edit Sales Price" : "Add Sales Price"}
        description={editingSalesPrice ? "Update the sales price for this product variant" : "Add a new sales price for this product"}
        isSubmitting={createSalesPriceMutation.isPending || updateSalesPriceMutation.isPending}
      />

      <AlertDialog open={!!deletingSalesPrice} onOpenChange={(open) => !open && setDeletingSalesPrice(null)}>
        <AlertDialogContent data-testid="dialog-delete-sales-price">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Sales Price
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the sales price from{" "}
              <strong>{deletingSalesPrice ? format(new Date(deletingSalesPrice.validFrom), 'dd/MM/yyyy') : ''}</strong> to{" "}
              <strong>{deletingSalesPrice ? format(new Date(deletingSalesPrice.validUntil), 'dd/MM/yyyy') : ''}</strong>?
              <br /><br />
              <span className="text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-sales-price">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingSalesPrice) { deleteSalesPriceMutation.mutate(deletingSalesPrice.id); setDeletingSalesPrice(null); } }}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-sales-price"
            >
              {deleteSalesPriceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blend Component Dialog */}
      {product.ownBlend && (
        <BlendComponentDialog
          open={blendComponentDialogOpen}
          onOpenChange={setBlendComponentDialogOpen}
          onSubmit={handleComponentSubmit}
          productId={productId}
          defaultValues={editingComponent ? {
            componentProductId: editingComponent.componentProductId,
            componentPercentage: editingComponent.componentPercentage,
          } : undefined}
          title={editingComponent ? "Edit Blend Component" : "Add Blend Component"}
          description={editingComponent ? "Update the blend component details" : "Add a new component to this blend"}
          isSubmitting={createComponentMutation.isPending || updateComponentMutation.isPending}
        />
      )}
      </div>
    </AdminLayout>
  );
}
