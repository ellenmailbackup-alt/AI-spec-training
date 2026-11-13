import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/context/CartContext";

// Landing Page
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ResetPassword from "@/pages/ResetPassword";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import ProductDetail from "@/pages/admin/ProductDetail";
import ProductStockMovements from "@/pages/admin/ProductStockMovements";
import AdminOrders from "@/pages/admin/Orders";
import SaleDetail from "@/pages/admin/SaleDetail";
import AdminCustomers from "@/pages/admin/Customers";
import CustomerDetail from "@/pages/admin/CustomerDetail";
import AdminInvoices from "@/pages/admin/Invoices";
import AdminSettings from "@/pages/admin/Settings";
import AdminRoasts from "@/pages/admin/Roasts";
import SupplierOrders from "@/pages/admin/SupplierOrders";
import SupplierOrderDetail from "@/pages/admin/SupplierOrderDetail";
import BoerenImport from "@/pages/admin/BoerenImport";
import CountingSessions from "@/pages/admin/CountingSessions";
import CountingSessionDetail from "@/pages/admin/CountingSessionDetail";
import SalesAnalysis from "@/pages/admin/SalesAnalysis";
import Inventory from "@/pages/admin/Inventory";
import AccountingReports from "@/pages/admin/AccountingReports";
import AdminMediaLibrary from "@/pages/admin/MediaLibrary";

// Storefront Pages
import Shop from "@/pages/storefront/Shop";
import ShopProduct from "@/pages/storefront/ShopProduct";
import Cart from "@/pages/storefront/Cart";
import Checkout from "@/pages/storefront/Checkout";
import OrderConfirmation from "@/pages/storefront/OrderConfirmation";
import Account from "@/pages/storefront/Account";
import NewsArticle from "@/pages/storefront/NewsArticle";
import OverOns from "@/pages/storefront/OverOns";
import Contact from "@/pages/storefront/Contact";
import Workshops from "@/pages/storefront/Workshops";
import Vergaderzaal from "@/pages/storefront/Vergaderzaal";
import Jura from "@/pages/storefront/Jura";
import Professional from "@/pages/storefront/Professional";

// POS Page
import POSPage from "@/pages/pos/POSPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/">
        <Landing />
      </Route>
      <Route path="/home" component={Landing} />

      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Admin Routes - Protected with AdminProtected component */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/:id/stock-movements" component={ProductStockMovements} />
      <Route path="/admin/products/:id" component={ProductDetail} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/orders/:id" component={SaleDetail} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/customers/:id" component={CustomerDetail} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/roasts" component={AdminRoasts} />
      <Route path="/admin/supplier-orders/:id" component={SupplierOrderDetail} />
      <Route path="/admin/supplier-orders" component={SupplierOrders} />
      <Route path="/admin/boeren-import" component={BoerenImport} />
      <Route path="/admin/counting-sessions/:id" component={CountingSessionDetail} />
      <Route path="/admin/counting-sessions" component={CountingSessions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/analytics/sales" component={SalesAnalysis} />
      <Route path="/admin/inventory" component={Inventory} />
      <Route path="/admin/accounting" component={AccountingReports} />
      <Route path="/admin/media" component={AdminMediaLibrary} />

      {/* Storefront Routes - Public access */}
      <Route path="/shop" component={Shop} />
      <Route path="/shop/coffee" component={Shop} />
      <Route path="/shop/tea" component={Shop} />
      <Route path="/shop/equipment" component={Shop} />
      <Route path="/shop/gifts" component={Shop} />
      <Route path="/shop/zoetigheden" component={Shop} />
      <Route path="/shop/cart" component={Cart} />
      <Route path="/shop/checkout" component={Checkout} />
      <Route path="/shop/order-confirmation" component={OrderConfirmation} />
      <Route path="/account" component={Account} />
      <Route path="/shop/product/:id" component={ShopProduct} />
      <Route path="/shop/news/:slug" component={NewsArticle} />

      {/* Static Content Pages (Dutch) */}
      <Route path="/nl/over-ons" component={OverOns} />
      <Route path="/nl/contact" component={Contact} />
      <Route path="/nl/workshops" component={Workshops} />
      <Route path="/nl/vergaderzaal" component={Vergaderzaal} />
      <Route path="/nl/jura" component={Jura} />
      <Route path="/nl/professional" component={Professional} />

      {/* POS Route - Requires authentication */}
      <Route path="/pos">
        {isAuthenticated ? <POSPage /> : <Landing />}
      </Route>

      {/* 404 Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Router />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
