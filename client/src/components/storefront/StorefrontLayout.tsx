import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";
import kruzeLogoBrown from "@assets/LOGO_KRUZE_bruin-01_1771249285335.png";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const COLORS = {
  mutedBrown: "#8A6959",
  softPeach: "#E8BF9C",
  offWhite: "#F1F2ED",
  softTaupe: "#DBC8B7",
  warmGray: "#939081",
  coolGray: "#CCCECD",
  deepEspresso: "#3B2314",
  bodyText: "#2E2E2E",
};

const fontSerif = "'Playfair Display', Georgia, serif";
const fontSans = "'DM Sans', 'Source Sans 3', Inter, sans-serif";

const navLinks = [
  { label: "Webshop", href: "/shop" },
  { label: "Over Ons", href: "/nl/over-ons" },
  { label: "Workshops", href: "/nl/workshops" },
  { label: "Vergaderzaal", href: "/nl/vergaderzaal" },
  { label: "JURA", href: "/nl/jura" },
  { label: "Professional", href: "/nl/professional" },
  { label: "Contact", href: "/nl/contact" },
];

const footerShopLinks = [
  { label: "Kruze Koffie", href: "/shop/coffee" },
  { label: "Kruze Thee", href: "/shop/tea" },
  { label: "JURA Machines", href: "/shop/equipment" },
  { label: "Cadeaus & Sets", href: "/shop/gifts" },
];

const footerInfoLinks = [
  { label: "Over Ons", href: "/nl/over-ons" },
  { label: "Workshops", href: "/nl/workshops" },
  { label: "Vergaderzaal", href: "/nl/vergaderzaal" },
  { label: "Professional", href: "/nl/professional" },
  { label: "Contact", href: "/nl/contact" },
];

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { data: activeAnnouncements } = useQuery<Announcement[]>({ queryKey: ["/api/announcements/active"] });
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  useEffect(() => {
    if (!activeAnnouncements || activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeAnnouncements]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div style={{ fontFamily: fontSans, color: COLORS.bodyText, backgroundColor: COLORS.offWhite }}>
      <div
        className="w-full text-center py-2 px-4 overflow-hidden"
        style={{ backgroundColor: COLORS.mutedBrown, color: "#FFFFFF", minHeight: "36px" }}
        data-testid="page-announcement-bar"
      >
        <div className="relative h-5 flex items-center justify-center">
          {activeAnnouncements && activeAnnouncements.length > 0 ? (
            activeAnnouncements.map((a, i) => (
              <p
                key={a.id}
                className="absolute inset-0 flex items-center justify-center text-sm tracking-wide font-medium transition-opacity duration-500"
                style={{ opacity: i === announcementIndex ? 1 : 0, visibility: i === announcementIndex ? "visible" : "hidden" }}
              >
                {a.text}
              </p>
            ))
          ) : (
            <span className="text-sm opacity-0">placeholder</span>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: COLORS.coolGray }} data-testid="page-header">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between h-36">
            <Link href="/">
              <img src={kruzeLogoBrown} alt="KRUZE" className="w-80 sm:w-96" data-testid="page-nav-logo" />
            </Link>
            <nav className="hidden lg:flex items-center gap-8 xl:gap-12" data-testid="page-nav-links">
              {navLinks.map(item => (
                <Link key={item.href} href={item.href}>
                  <span
                    className="text-lg lg:text-xl font-semibold tracking-widest uppercase transition-colors cursor-pointer"
                    style={{ color: location === item.href ? COLORS.mutedBrown : COLORS.bodyText }}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-5">
              <Link href="/shop/cart" className="transition-opacity hover:opacity-70" data-testid="page-link-cart">
                <div className="relative inline-flex">
                  <ShoppingBag className="w-10 h-10" style={{ color: COLORS.deepEspresso }} strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="no-default-hover-elevate absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full px-1 text-xs pointer-events-none"
                      data-testid="text-cart-count"
                    >
                      {cartCount}
                    </Badge>
                  )}
                </div>
              </Link>
              <Link href={isAuthenticated ? "/account" : "/login"} className="transition-opacity hover:opacity-70" data-testid="page-link-login">
                <User className="w-10 h-10" style={{ color: COLORS.deepEspresso }} strokeWidth={1.5} />
              </Link>
              <button
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t px-6 py-4 bg-white" style={{ borderColor: COLORS.coolGray }}>
            <div className="flex flex-col gap-3">
              {navLinks.map(item => (
                <Link key={item.href} href={item.href}>
                  <span
                    className="block py-2 text-sm font-medium"
                    style={{ color: location === item.href ? COLORS.mutedBrown : COLORS.bodyText }}
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer style={{ backgroundColor: "#FFFFFF", borderTop: `1px solid ${COLORS.coolGray}` }} data-testid="page-footer">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <img src={kruzeLogoBrown} alt="KRUZE" className="w-40 mb-5" />
              <p className="text-base" style={{ color: COLORS.warmGray, lineHeight: 1.6 }}>
                Ambachtelijke koffie en premium thee uit het hart van Herent. Passie voor kwaliteit, duurzaamheid en de perfecte kop.
              </p>
            </div>
            <div>
              <h4 className="text-sm lg:text-base font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Webshop</h4>
              <div className="flex flex-col gap-3">
                {footerShopLinks.map(item => (
                  <Link key={item.label} href={item.href}>
                    <span className="text-base" style={{ color: COLORS.warmGray }} data-testid={`footer-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm lg:text-base font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Informatie</h4>
              <div className="flex flex-col gap-3">
                {footerInfoLinks.map(item => (
                  <Link key={item.label} href={item.href}>
                    <span className="text-base" style={{ color: COLORS.warmGray }} data-testid={`footer-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm lg:text-base font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Contact</h4>
              <div className="flex flex-col gap-3 text-base" style={{ color: COLORS.warmGray }}>
                <span>Kruze Coffee & Tea</span>
                <span>Wijgmaalsesteenweg 293</span>
                <span>3020 Herent</span>
                <a href="tel:+32497974437" className="hover:opacity-80 transition-opacity" data-testid="footer-link-phone">(+32) 497 97 44 37</a>
                <a href="mailto:info@kruze.be" className="hover:opacity-80 transition-opacity" data-testid="footer-link-email">info@kruze.be</a>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8" style={{ borderTop: `1px solid ${COLORS.coolGray}` }}>
            <span className="text-sm" style={{ color: COLORS.warmGray }}>
              &copy; {new Date().getFullYear()} Kruze BV. Alle rechten voorbehouden.
            </span>
            <span className="text-sm" style={{ color: COLORS.warmGray }}>
              Coffee &middot; Tea &middot; Experience &middot; Academy
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({ title, subtitle, imageUrl, imagePosition = "center", imageScale }: { title: string; subtitle?: string; imageUrl: string; imagePosition?: string; imageScale?: number }) {
  return (
    <section className="relative h-[40vh] min-h-[280px] max-h-[400px] overflow-hidden" data-testid="page-hero">
      <div className="absolute inset-0">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" style={{ objectPosition: imagePosition, transform: imageScale ? `scale(${imageScale})` : undefined }} data-testid="img-page-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
      </div>
      <div className="relative h-full flex items-end">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 w-full pb-10 sm:pb-14">
          {subtitle && (
            <p className="text-white/80 text-base lg:text-lg tracking-[0.3em] uppercase mb-3 font-semibold" data-testid="text-hero-subtitle">
              {subtitle}
            </p>
          )}
          <h1
            style={{ fontFamily: fontSerif }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight"
            data-testid="text-page-title"
          >
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}

export { COLORS, fontSerif, fontSans };
