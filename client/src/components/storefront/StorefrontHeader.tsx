import { Link, useLocation } from "wouter";
import { ShoppingCart, Coffee, Phone, UserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";

interface StorefrontHeaderProps {
  cartItemCount?: number;
}

export function StorefrontHeader({ cartItemCount: _ignored }: StorefrontHeaderProps) {
  const { cartCount } = useCart();
  const cartItemCount = cartCount;
  const [location, setLocation] = useLocation();
  const { isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Uitloggen mislukt",
        description: "Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      <div className="hidden md:block border-b border-border/80 bg-secondary/30 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-[0.3em] text-foreground/80">
              Experience Mastery in Every Sip.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/shop/b2b">
              <span
                className="cursor-pointer font-semibold uppercase tracking-[0.2em] text-foreground/70 transition hover:text-primary"
                data-testid="link-topbar-b2b"
              >
                Crafted with Passion. Sourced with Purpose.
              </span>
            </Link>
            <Link href="/shop/contact">
              <span
                className="cursor-pointer text-foreground/60 transition hover:text-primary"
                data-testid="link-topbar-contact"
              >
                Love to Kruze
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="flex h-20 items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/shop">
              <div
                className="flex items-center gap-3 rounded-full px-4 py-2 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                data-testid="link-home"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Coffee className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <span className="block font-serif text-2xl font-bold tracking-[0.25em] text-foreground">KRUZE</span>
                  <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">Coffee &amp; Tea</span>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {[
                { href: "/shop", label: "Shop" },
                { href: "/shop/coffee", label: "Koffie" },
                { href: "/shop/tea", label: "Thee" },
                { href: "/shop/experience", label: "Experience" },
                { href: "/shop/academy", label: "Academy" },
                { href: "/shop/story", label: "Over Kruze" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`text-sm font-medium uppercase tracking-[0.2em] transition-colors hover:text-primary cursor-pointer ${
                      location === item.href ? "text-primary" : "text-muted-foreground"
                    }`}
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Cart & Admin Link */}
            <div className="ml-auto flex items-center gap-3">
              <Link href="/shop/account">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2" data-testid="link-account">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Mijn Kruze
                </Button>
              </Link>
              <Link href="/shop/cart">
                <div className="relative inline-flex">
                  <Button variant="secondary" size="icon" data-testid="button-cart">
                    <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                  </Button>
                  {cartItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="no-default-hover-elevate absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full px-1 text-xs pointer-events-none"
                      data-testid="text-cart-count"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="link-admin">
                    Admin
                  </Button>
                </Link>
              )}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
