import { Button } from "@/components/ui/button";
import { Coffee, Leaf, Star, Award, ArrowRight, ShoppingBag, User, ChevronDown, Quote, Mail, MapPin, ChevronRight, GraduationCap, Truck } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product, Announcement, ProductType } from "@shared/schema";
import pillarCoffeeIcon from "@assets/pijlers_1771248776226.png";
import pillarTeaIcon from "@assets/pijlers2_1771248776226.png";
import pillarExperienceIcon from "@assets/pijlers3_1771248776227.png";
import pillarAcademyIcon from "@assets/pijlers4_1771248776227.png";
import kruzeLogoBrown from "@assets/LOGO_KRUZE_bruin-01_1771249285335.png";
import kruzeLogoWhite from "@assets/LOGO_KRUZE_wit-01_1771249912759.png";
import { useEffect, useRef, useState } from "react";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";

const featuredProductIds = [96, 116, 298, 37, 73, 110, 228, 41, 90, 256, 50, 247];

const testimonials = [
  {
    text: "Koffie maken met de bonen van Kruze maakt van iedere koffie-amateur een echte barista! Keer op keer een geslaagd tasje met een mooi cremelaagje en een intens aroma.",
    author: "Tevreden klant",
  },
  {
    text: "Hele lekkere koffie: de verse branding is werkelijk te proeven. Uitstekende communicatie en snelle bestelling. Zeer tevreden!",
    author: "Koffieliefhebber",
  },
  {
    text: "De site was heel duidelijk, ik kon snel de specifieke bonen vinden en simpel de maalgradatie kiezen. Zeer duidelijke communicatie en snelle levering.",
    author: "Nieuwe klant",
  },
];

const COLORS = {
  mutedBrown: "#8A6959",
  softPeach: "#E8BF9C",
  offWhite: "#F1F2ED",
  softTaupe: "#DBC8B7",
  warmBeige: "#C2B197",
  warmGray: "#939081",
  coolGray: "#CCCECD",
  goldenBeige: "#CCA693",
  paleGreen: "#E6F0C7",
  deepEspresso: "#3B2314",
  bodyText: "#2E2E2E",
  tastingNote: "#6A6560",
};

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
      }}
    >
      {children}
    </div>
  );
}

const fontSerif = "'Playfair Display', Georgia, serif";
const fontSans = "'DM Sans', 'Source Sans 3', Inter, sans-serif";

// Maps product type ID → shop route slug
const PRODUCT_TYPE_ROUTES: Record<number, string> = {
  1: "/shop/coffee",
  2: "/shop/tea",
  3: "/shop/equipment",
  7: "/shop/zoetigheden",
};

function categoryShopUrl(typeId: number): string {
  return PRODUCT_TYPE_ROUTES[typeId] ?? "/shop";
}

export default function Landing() {
  useStorefrontTheme();
  const { data: allProducts } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: activeAnnouncements } = useQuery<Announcement[]>({ queryKey: ["/api/announcements/active"] });
  const { data: homepageCategories } = useQuery<ProductType[]>({ queryKey: ["/api/homepage-categories"] });
  const featuredProducts = allProducts
    ?.filter(p => featuredProductIds.includes(p.id) && p.picture)
    ?.sort((a, b) => featuredProductIds.indexOf(a.id) - featuredProductIds.indexOf(b.id))
    ?? [];

  const [showScrollCue, setShowScrollCue] = useState(true);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  useEffect(() => {
    if (!activeAnnouncements || activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeAnnouncements]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setShowScrollCue(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: fontSans, color: COLORS.bodyText, backgroundColor: COLORS.offWhite }} data-testid="landing-page">

      {/* ===== ANNOUNCEMENT BAR (always reserve space) ===== */}
      <div
        className="relative z-[60] w-full text-center py-2 px-4 overflow-hidden"
        style={{
          backgroundColor: COLORS.mutedBrown,
          color: "#FFFFFF",
          fontFamily: fontSans,
          minHeight: "36px",
        }}
        data-testid="announcement-bar"
      >
        <div className="relative h-5 flex items-center justify-center">
          {activeAnnouncements && activeAnnouncements.length > 0 ? (
            activeAnnouncements.map((a, i) => (
              <p
                key={a.id}
                className="absolute inset-0 flex items-center justify-center text-sm tracking-wide font-medium transition-opacity duration-500"
                style={{
                  opacity: i === announcementIndex ? 1 : 0,
                  visibility: i === announcementIndex ? "visible" : "hidden",
                }}
                data-testid={`text-announcement-${a.id}`}
              >
                {a.link ? (
                  <a href={a.link} className="hover:underline flex items-center gap-1" data-testid={`link-announcement-${a.id}`}>
                    <Truck className="w-3.5 h-3.5" />
                    {a.text}
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    {a.text}
                  </span>
                )}
              </p>
            ))
          ) : (
            <span className="text-sm tracking-wide font-medium opacity-0">placeholder</span>
          )}
        </div>
      </div>

      {/* ===== NAVIGATION (old style — overlaying hero) ===== */}
      <nav className="absolute top-[36px] left-0 right-0 z-50" data-testid="nav-bar">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between gap-6 h-36">
            <Link href="/">
              <img src={kruzeLogoWhite} alt="KRUZE" className="w-80 sm:w-96 drop-shadow-lg" data-testid="nav-logo" />
            </Link>
            <div className="hidden lg:flex items-center gap-8 xl:gap-12">
              {[
                { label: "Webshop", href: "/shop" },
                { label: "Over Ons", href: "/nl/over-ons" },
                { label: "Workshops", href: "/nl/workshops" },
                { label: "Vergaderzaal", href: "/nl/vergaderzaal" },
                { label: "JURA", href: "/nl/jura" },
                { label: "Professional", href: "/nl/professional" },
                { label: "Contact", href: "/nl/contact" },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-lg lg:text-xl text-white tracking-widest uppercase font-semibold transition-colors"
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-5">
              <Link href="/shop/cart" className="text-white transition-opacity hover:opacity-80" data-testid="link-shop">
                <ShoppingBag className="w-10 h-10" strokeWidth={1.5} />
              </Link>
              <Link href="/login" className="text-white transition-opacity hover:opacity-80" data-testid="button-login">
                <User className="w-10 h-10" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO (single combined image — coffee & tea together) ===== */}
      <section className="relative min-h-[90vh]" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src="/images/hero-combined.png" alt="Kruze Coffee & Tea" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/25" />
        </div>
        <div className="relative min-h-[90vh] flex items-end">
          <div className="mx-auto px-6 sm:px-10 lg:px-16 w-full pb-20 sm:pb-24">
            <p className="text-white/80 text-sm lg:text-base tracking-[0.3em] uppercase mb-4 font-semibold" data-testid="text-roasted-label">
              Gebrand in Herent · International Tea Master
            </p>
            <h1 style={{ fontFamily: fontSerif }} className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-white leading-[0.95] mb-8" data-testid="text-hero-title">
              Love
              <br />
              to
              <br />
              Kruze
            </h1>
            <Button size="lg" variant="outline" className="bg-white/90 text-foreground border-white" asChild data-testid="button-hero-shop">
              <Link href="/shop">
                Naar de webshop
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
        {showScrollCue && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/60" />
          </div>
        )}
      </section>

      {/* ===== TRUST BADGES (full-width spread) ===== */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: COLORS.offWhite }} data-testid="trust-section">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
            <div className="flex flex-col items-center text-center gap-3" data-testid="badge-rating">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <div style={{ fontFamily: fontSerif }} className="font-bold text-2xl lg:text-4xl leading-tight" data-testid="text-rating-value">4,88 / 5</div>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 lg:w-4 lg:h-4" style={{ fill: COLORS.mutedBrown, color: COLORS.mutedBrown }} />
                  ))}
                </div>
                <div className="text-sm lg:text-base mt-1" style={{ color: COLORS.warmGray }}>587 reviews</div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3" data-testid="badge-fresh">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <div style={{ fontFamily: fontSerif }} className="font-bold text-2xl lg:text-4xl leading-tight" data-testid="text-fresh-value">Single Origin</div>
                <div className="text-sm lg:text-base mt-1" style={{ color: COLORS.warmGray }}>Ambachtelijk gebrand in Herent</div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3" data-testid="badge-award">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div style={{ fontFamily: fontSerif }} className="font-bold text-2xl lg:text-4xl leading-tight" data-testid="text-award-value">Great Taste</div>
                <div className="text-sm lg:text-base mt-1" style={{ color: COLORS.warmGray }}>Award winnaar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SHOP BY CATEGORY ===== */}
      {homepageCategories && homepageCategories.length > 0 && (
        <RevealSection style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }}>
          <section data-testid="categories-section">
            <div className="mx-auto px-6 sm:px-10 lg:px-16">
              <div className="text-center mb-10">
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                  Ons Aanbod
                </p>
                <h2
                  style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold"
                  data-testid="text-categories-title"
                >
                  Ontdek onze categorieën
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {homepageCategories.map((cat) => (
                  <Link key={cat.id} href={categoryShopUrl(cat.id)}>
                    <div
                      className="group relative overflow-hidden rounded-md aspect-[4/5] cursor-pointer"
                      data-testid={`card-category-${cat.id}`}
                    >
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-category-${cat.id}`}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.softTaupe }}
                        >
                          <Coffee className="w-12 h-12" style={{ color: COLORS.mutedBrown }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/70" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3
                          style={{ fontFamily: fontSerif }}
                          className="text-white text-xl sm:text-2xl font-bold"
                          data-testid={`text-category-name-${cat.id}`}
                        >
                          {cat.nameDutch || (cat.name.charAt(0) + cat.name.slice(1).toLowerCase())}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-white/80 text-sm font-medium group-hover:text-white transition-colors" data-testid={`link-category-${cat.id}`}>
                          Bekijk
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </RevealSection>
      )}

      {/* ===== ABOUT / STIJN (old style — A World Of Great Experiences) ===== */}
      <RevealSection style={{ backgroundColor: COLORS.offWhite, padding: "clamp(60px, 8vw, 120px) 0" }}>
        <section data-testid="about-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative">
                <div className="relative overflow-hidden rounded-md aspect-[3/4]">
                  <img
                    src="https://kruze.be/wp-content/uploads/2023/03/Stijn-in-de-winkelV1.jpg"
                    alt="Stijn Van Schoonlandt - Kruze koffiebrander en theeblender"
                    className="w-full h-full object-cover"
                    data-testid="img-stijn"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 rounded-md p-6 sm:p-8" style={{ backgroundColor: COLORS.mutedBrown }}>
                  <div style={{ fontFamily: fontSerif }} className="text-3xl sm:text-4xl font-bold text-white">2015</div>
                  <div className="text-sm text-white/90">Opgericht in Herent</div>
                </div>
              </div>
              <div>
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: COLORS.mutedBrown }} data-testid="text-about-label">
                  Ontdek Kruze
                </p>
                <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight" data-testid="text-about-title">
                  A World Of Great
                  <br />
                  Experiences
                </h2>
                <div className="space-y-5 text-lg lg:text-xl font-medium leading-relaxed" style={{ color: COLORS.warmGray }}>
                  <p data-testid="text-about-body">
                    Onze passie en meesterschap in smaak proef je in elke kop KRUZE!
                    We bieden een totaalaanbod van artisanaal gebrande single origin koffies
                    en kwaliteitsvolle zuivere en uniek geblende theeën.
                  </p>
                  <p>
                    Opgericht door Stijn Van Schoonlandt, een ITMA Certified Tea Master,
                    Tea Blender en Tea Sommelier. Met onze Probat-10 brander branden we
                    ambachtelijk kleine batches, zodat je altijd de meest verse bonen krijgt.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-8 mt-10">
                  <Button size="lg" asChild data-testid="button-about-more">
                    <Link href="/shop">
                      Ontdek ons verhaal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4" style={{ fill: COLORS.mutedBrown, color: COLORS.mutedBrown }} />
                      ))}
                    </div>
                    <span className="text-sm font-medium" style={{ color: COLORS.warmGray }}>587 reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== TASTE INTRODUCTION (new — brand guidelines) ===== */}
      <RevealSection style={{ backgroundColor: COLORS.offWhite, padding: "clamp(60px, 8vw, 120px) 0" }}>
        <section data-testid="taste-section">
          <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
            <h2
              style={{ fontFamily: fontSerif, color: COLORS.deepEspresso, lineHeight: 1.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8"
              data-testid="text-taste-headline"
            >
              Twee werelden. Eén passie voor kwaliteit.
            </h2>
            <div style={{ color: COLORS.bodyText, lineHeight: 1.7 }} className="space-y-6 text-lg lg:text-xl">
              <p>
                Bij Kruze combineren we ambachtelijk gebrande single origin koffies
                met zorgvuldig samengestelde theeblends. Onze koffie branden we
                in kleine batches op onze Probat-10 in Herent — altijd vers,
                altijd met aandacht voor het beste uit elke boon.
              </p>
              <p>
                Onze theeën worden persoonlijk geblend door Stijn, ITMA Certified
                Tea Master, Tea Blender en Tea Sommelier. Van zuivere oorsprongstheeën
                tot unieke huisblends — met dezelfde toewijding aan smaak en kwaliteit.
              </p>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== FEATURED TASTES (new — Wat Stijn nu inschenkt) ===== */}
      <RevealSection style={{ backgroundColor: COLORS.offWhite, paddingBottom: "clamp(60px, 8vw, 100px)" }}>
        <section data-testid="featured-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="text-center mb-12">
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }} data-testid="text-featured-label">
                Wat Stijn nu inschenkt
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold" data-testid="text-featured-title">
                Onze favorieten
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/shop/coffee" data-testid="card-featured-coffee">
                <div className="group relative overflow-hidden rounded-md cursor-pointer" style={{ minHeight: "500px" }}>
                  <img src="/images/featured-coffee.png" alt="Featured coffee" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,35,20,0.75) 0%, rgba(59,35,20,0.2) 50%, transparent 70%)" }} />
                  <div className="relative flex flex-col justify-end h-full p-8 md:p-10" style={{ minHeight: "500px" }}>
                    <span className="text-xs lg:text-sm uppercase mb-3" style={{ letterSpacing: "0.1em", color: COLORS.softPeach }}>Kruze Coffee</span>
                    <h3 style={{ fontFamily: fontSerif, color: "#FFFFFF" }} className="text-2xl lg:text-3xl font-bold mb-2">Ethiopia Yirgacheffe</h3>
                    <p className="text-sm lg:text-base mb-4" style={{ color: COLORS.softPeach, fontStyle: "italic" }}>Heldere bergamot, sappig rood fruit, schone afdronk.</p>
                    <span className="inline-flex items-center gap-1 text-sm transition-all group-hover:gap-2" style={{ color: COLORS.softPeach }}>
                      Proef deze <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/shop/tea" data-testid="card-featured-tea">
                <div className="group relative overflow-hidden rounded-md cursor-pointer" style={{ minHeight: "500px" }}>
                  <img src="/images/featured-tea.png" alt="Featured tea" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,35,20,0.75) 0%, rgba(59,35,20,0.2) 50%, transparent 70%)" }} />
                  <div className="relative flex flex-col justify-end h-full p-8 md:p-10" style={{ minHeight: "500px" }}>
                    <span className="text-xs lg:text-sm uppercase mb-3" style={{ letterSpacing: "0.1em", color: COLORS.softPeach }}>Kruze Tea</span>
                    <h3 style={{ fontFamily: fontSerif, color: "#FFFFFF" }} className="text-2xl lg:text-3xl font-bold mb-2">Taiwan High Mountain Oolong</h3>
                    <p className="text-sm lg:text-base mb-4" style={{ color: COLORS.softPeach, fontStyle: "italic" }}>Romig, bloemig, met een zoete afdronk die minutenlang blijft hangen.</p>
                    <span className="inline-flex items-center gap-1 text-sm transition-all group-hover:gap-2" style={{ color: COLORS.softPeach }}>
                      Proef deze <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== FOUR PILLARS (old style — 2x2 photo grid) ===== */}
      <RevealSection>
        <section className="py-20 sm:py-28" style={{ backgroundColor: COLORS.offWhite }} data-testid="pillars-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="text-center mb-16">
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }} data-testid="text-pillars-label">
                Meer dan koffie en thee
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold" data-testid="text-pillars-title">
                Vier pijlers, een passie
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Link href="/shop/coffee" data-testid="card-pillar-kruze-coffee">
                <div className="group relative overflow-hidden rounded-md aspect-square cursor-pointer">
                  <img src="/images/pillar-coffee.png" alt="Kruze Coffee" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex flex-col justify-end h-full p-6 sm:p-8">
                    <img src={pillarCoffeeIcon} alt="" className="w-14 h-14 rounded-full mb-4 border-2 border-white/30" />
                    <h3 style={{ fontFamily: fontSerif }} className="text-2xl sm:text-3xl font-bold text-white mb-2">Kruze Coffee</h3>
                    <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed mb-3 max-w-xs">
                      Single origin koffies, ambachtelijk gebrand op onze Probat-10. Altijd vers, altijd uitzonderlijk.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:gap-2 transition-all">
                      Ontdek onze koffie <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/shop/tea" data-testid="card-pillar-kruze-tea">
                <div className="group relative overflow-hidden rounded-md aspect-square cursor-pointer">
                  <img src="/images/pillar-tea-v3.png" alt="Kruze Tea" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex flex-col justify-end h-full p-6 sm:p-8">
                    <img src={pillarTeaIcon} alt="" className="w-14 h-14 rounded-full mb-4 border-2 border-white/30" />
                    <h3 style={{ fontFamily: fontSerif }} className="text-2xl sm:text-3xl font-bold text-white mb-2">Kruze Tea</h3>
                    <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed mb-3 max-w-xs">
                      Zuivere en uniek geblende theeën, samengesteld door onze International Tea Master.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:gap-2 transition-all">
                      Ontdek onze thee <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/shop" data-testid="card-pillar-kruze-experience">
                <div className="group relative overflow-hidden rounded-md aspect-square cursor-pointer">
                  <img src="/images/pillar-experience.png" alt="Kruze Experience" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex flex-col justify-end h-full p-6 sm:p-8">
                    <img src={pillarExperienceIcon} alt="" className="w-14 h-14 rounded-full mb-4 border-2 border-white/30" />
                    <h3 style={{ fontFamily: fontSerif }} className="text-2xl sm:text-3xl font-bold text-white mb-2">Kruze Experience</h3>
                    <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed mb-3 max-w-xs">
                      Proeverijen, workshops, bedrijfsbezoeken en teamevents die je nog lang bijblijven.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:gap-2 transition-all">
                      Beleef Kruze <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/shop" data-testid="card-pillar-kruze-academy">
                <div className="group relative overflow-hidden rounded-md aspect-square cursor-pointer">
                  <img src="/images/pillar-academy.png" alt="Kruze Academy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex flex-col justify-end h-full p-6 sm:p-8">
                    <img src={pillarAcademyIcon} alt="" className="w-14 h-14 rounded-full mb-4 border-2 border-white/30" />
                    <h3 style={{ fontFamily: fontSerif }} className="text-2xl sm:text-3xl font-bold text-white mb-2">Kruze Academy</h3>
                    <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed mb-3 max-w-xs">
                      Professionele opleidingen, van ITMA-programma's tot foodpairing en de nieuwste trends.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:gap-2 transition-all">
                      Start je reis <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== ORIGIN SPOTLIGHT (new — Sri Lanka) ===== */}
      <RevealSection>
        <section style={{ backgroundColor: COLORS.softTaupe, padding: "clamp(60px, 8vw, 120px) 0" }} data-testid="origin-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-7">
                <div className="overflow-hidden rounded-md">
                  <img
                    src="/images/origin-srilanka.png"
                    alt="Sri Lanka theeplantage"
                    className="w-full aspect-[3/2] object-cover"
                    data-testid="img-origin"
                  />
                </div>
              </div>
              <div className="lg:col-span-5">
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }} data-testid="text-origin-label">
                  Origin Spotlight
                </p>
                <h2
                  style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
                  data-testid="text-origin-headline"
                >
                  Sri Lanka
                </h2>
                <div style={{ color: COLORS.bodyText, lineHeight: 1.7 }} className="space-y-4 mb-8 text-base lg:text-lg">
                  <p data-testid="text-origin-body">
                    In de mistige hooglanden van Sri Lanka, waar de theeplanten al generaties lang
                    groeien op vulkanische bodem, vinden we een van de meest veelzijdige theeën ter wereld.
                    Ceylon-thee met zijn heldere, citrusachtige karakter en verfijnde bloemige ondertonen.
                    Een thee die je meeneemt naar de groene heuvels bij elke slok.
                  </p>
                </div>
                <div className="rounded-md p-5 mb-6" style={{ backgroundColor: COLORS.offWhite }}>
                  <h4 style={{ fontFamily: fontSerif, fontSize: "18px", color: COLORS.deepEspresso, fontWeight: 600 }} className="mb-1">
                    Ceylon Orange Pekoe
                  </h4>
                  <p style={{ fontSize: "14px", color: COLORS.tastingNote, fontStyle: "italic" }} className="mb-3">
                    Citrus, bloemig, licht kruidig, heldere afdronk
                  </p>
                  <Link href="/shop/tea" data-testid="link-origin-shop">
                    <span className="inline-flex items-center gap-1 font-medium transition-all" style={{ color: COLORS.mutedBrown, fontSize: "14px" }}>
                      Shop deze origin <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== PRODUCT SHOWCASE ===== */}
      {featuredProducts.length > 0 && (
        <RevealSection style={{ backgroundColor: COLORS.offWhite, padding: "clamp(60px, 8vw, 120px) 0" }}>
          <section data-testid="products-section">
            <div className="mx-auto px-6 sm:px-10 lg:px-16">
              <div className="text-center mb-14">
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }} data-testid="text-products-label">
                  Onze selectie
                </p>
                <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4" data-testid="text-products-title">
                  Populaire smaken
                </h2>
                <p className="text-base lg:text-lg" style={{ color: COLORS.warmGray, maxWidth: "560px", margin: "0 auto" }}>
                  Van single-origin koffies tot unieke theeblends — ontdek wat anderen al hebben geproefd.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 8).map((product) => (
                  <Link key={product.id} href="/shop" data-testid={`card-product-${product.id}`}>
                    <div className="group cursor-pointer">
                      <div className="relative aspect-square overflow-hidden rounded-md mb-4" style={{ backgroundColor: "#FFFFFF" }}>
                        <img
                          src={product.picture!}
                          alt={product.nameDutch || product.name}
                          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-sm lg:text-base font-semibold leading-tight mb-1" style={{ color: COLORS.deepEspresso }} data-testid={`text-product-name-${product.id}`}>
                        {product.nameDutch || product.name}
                      </h3>
                      <p className="text-sm" style={{ color: COLORS.warmGray }}>{product.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-12">
                <Link href="/shop/coffee">
                  <button className="px-6 py-3 rounded-md font-medium transition-colors duration-200" style={{ backgroundColor: COLORS.warmBeige, color: COLORS.deepEspresso }} data-testid="button-all-coffee">
                    Alle koffies
                  </button>
                </Link>
                <Link href="/shop/tea">
                  <button className="px-6 py-3 rounded-md font-medium transition-colors duration-200" style={{ backgroundColor: "transparent", color: COLORS.deepEspresso, border: `1px solid ${COLORS.warmBeige}` }} data-testid="button-all-tea">
                    Alle theeën
                  </button>
                </Link>
              </div>
            </div>
          </section>
        </RevealSection>
      )}

      {/* ===== WORKSHOPS / ACADEMY ===== */}
      <RevealSection style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }}>
        <section data-testid="workshops-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="relative overflow-hidden rounded-md aspect-[4/3]">
                <img
                  src="/images/workshops-hero.png"
                  alt="Koffie & Thee workshops bij Kruze"
                  className="w-full h-full object-cover"
                  data-testid="img-workshops"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div>
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                  Kruze Academy
                </p>
                <h2
                  style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4"
                  data-testid="text-workshops-title"
                >
                  Workshops & Proeverijen
                </h2>
                <p className="text-base sm:text-lg lg:text-xl font-medium mb-4 leading-relaxed" style={{ color: COLORS.tastingNote }}>
                  Duik in de wereld van specialty coffee en ambachtelijke thee. Onze workshops bieden een unieke ervaring voor koffieliefhebbers, thee-enthousiastelingen en bedrijven.
                </p>
                <ul className="space-y-3 mb-6" data-testid="list-workshops">
                  {[
                    "Koffie cupping & proeverij",
                    "Latte art masterclass",
                    "Thee blending workshop",
                    "Bedrijfsevenementen op maat",
                  ].map((item, idx) => (
                    <li key={item} className="flex items-center gap-3 text-base" style={{ color: COLORS.bodyText }} data-testid={`text-workshop-item-${idx}`}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.mutedBrown }}>
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/workshops">
                  <Button
                    size="lg"
                    className="rounded-md px-6"
                    style={{ backgroundColor: COLORS.mutedBrown, color: "#FFF" }}
                    data-testid="button-workshops-cta"
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Ontdek onze workshops
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== CTA BANNER (old style — Meesters in smaak) ===== */}
      <RevealSection>
        <section className="relative py-24 sm:py-32 overflow-hidden" data-testid="cta-section">
          <div className="absolute inset-0">
            <img src="/images/cta-croissant.png" alt="Kruze Experience" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
          <div className="relative mx-auto px-6 sm:px-10 lg:px-16">
            <div className="max-w-2xl">
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase text-white/70 font-semibold mb-6" data-testid="text-cta-label">
                A delightful resort for your taste
              </p>
              <h2 style={{ fontFamily: fontSerif }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-snug text-white" data-testid="text-cta-headline">
                Meesters in smaak,
                <br />
                beleving en begeleiding
              </h2>
              <p className="text-white/80 text-lg lg:text-xl font-medium mb-10 max-w-lg">
                Ontdek onze wereld van artisanale koffie en premium thee. Van de branderij tot in jouw kop.
              </p>
              <Button size="lg" variant="outline" className="bg-white/90 text-foreground border-white" asChild data-testid="button-cta-shop">
                <Link href="/shop">
                  Naar de webshop
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== REVIEWS (old style — split layout) ===== */}
      <RevealSection>
        <section className="py-20 sm:py-24" style={{ backgroundColor: COLORS.offWhite }} data-testid="testimonials-section">
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-2">
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }} data-testid="text-testimonials-label">
                  Onze klanten
                </p>
                <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-testimonials-title">
                  Wat zij
                  <br />
                  zeggen
                </h2>
                <p className="text-lg lg:text-xl font-medium leading-relaxed mb-8" style={{ color: COLORS.warmGray }}>
                  Meer dan 500 tevreden klanten gingen je voor.
                  Ontdek waarom zij kiezen voor Kruze.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5" style={{ fill: COLORS.mutedBrown, color: COLORS.mutedBrown }} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontFamily: fontSerif }} className="font-bold text-xl">4,88 / 5</div>
                    <div className="text-xs" style={{ color: COLORS.warmGray }}>587 reviews</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="relative rounded-md p-6 sm:p-8" style={{ backgroundColor: "#FFFFFF" }} data-testid={`card-testimonial-${index}`}>
                    <Quote className="w-8 h-8 mb-3" style={{ color: `${COLORS.mutedBrown}33` }} />
                    <p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed mb-4 italic" style={{ color: COLORS.bodyText }} data-testid={`text-testimonial-${index}`}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5" style={{ fill: COLORS.mutedBrown, color: COLORS.mutedBrown }} />
                        ))}
                      </div>
                      <span className="text-sm font-medium" style={{ color: COLORS.warmGray }} data-testid={`text-testimonial-author-${index}`}>
                        {testimonial.author}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ===== NEWSLETTER (new — with name, first name, birthdate) ===== */}
      <RevealSection>
        <section style={{ backgroundColor: COLORS.mutedBrown, padding: "clamp(60px, 8vw, 100px) 0" }} data-testid="newsletter-section">
          <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
            <h2
              style={{ fontFamily: fontSerif, color: "#FFFFFF", fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 1.3 }}
              className="font-bold mb-4"
              data-testid="text-newsletter-headline"
            >
              Proef elke maand iets nieuws
            </h2>
            <p className="text-base lg:text-lg mb-8" style={{ color: COLORS.softPeach }} data-testid="text-newsletter-sub">
              Nieuwe aankomsten, origin-verhalen en af en toe een obsessie — rechtstreeks van Stijn.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Voornaam"
                  className="px-4 py-3 rounded-md text-base outline-none w-full"
                  style={{ backgroundColor: "#FFFFFF", color: COLORS.bodyText, border: "none" }}
                  data-testid="input-newsletter-firstname"
                />
                <input
                  type="text"
                  placeholder="Naam"
                  className="px-4 py-3 rounded-md text-base outline-none w-full"
                  style={{ backgroundColor: "#FFFFFF", color: COLORS.bodyText, border: "none" }}
                  data-testid="input-newsletter-lastname"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="jouw@email.be"
                  className="px-4 py-3 rounded-md text-base outline-none w-full"
                  style={{ backgroundColor: "#FFFFFF", color: COLORS.bodyText, border: "none" }}
                  data-testid="input-newsletter-email"
                />
                <input
                  type="date"
                  placeholder="Geboortedatum"
                  className="px-4 py-3 rounded-md text-base outline-none w-full"
                  style={{ backgroundColor: "#FFFFFF", color: COLORS.bodyText, border: "none" }}
                  data-testid="input-newsletter-birthdate"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-md font-medium transition-colors duration-200"
                style={{ backgroundColor: COLORS.deepEspresso, color: "#FFFFFF" }}
                data-testid="button-newsletter-subscribe"
              >
                Inschrijven
              </button>
            </form>
            <p style={{ fontSize: "13px", color: `${COLORS.softPeach}99`, marginTop: "12px" }}>
              <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a>
            </p>
          </div>
        </section>
      </RevealSection>

      {/* ===== FOOTER (old style — matching previous version layout) ===== */}
      <footer style={{ backgroundColor: "#FFFFFF", borderTop: `1px solid ${COLORS.coolGray}` }} data-testid="footer">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <img src={kruzeLogoBrown} alt="KRUZE" className="w-40 mb-5" data-testid="footer-logo" />
              <p style={{ color: COLORS.warmGray, fontSize: "15px", lineHeight: 1.6 }}>
                Ambachtelijke koffie en premium thee uit het hart van Herent. Passie voor kwaliteit, duurzaamheid en de perfecte kop.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Webshop</h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Single Origin Koffie", href: "/shop/coffee" },
                  { label: "Premium Losse Thee", href: "/shop/tea" },
                  { label: "Accessoires", href: "/shop/equipment" },
                ].map(item => (
                  <Link key={item.label} href={item.href}>
                    <span style={{ color: COLORS.warmGray, fontSize: "15px" }} className="hover:opacity-80 transition-opacity">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Kruze Beleving</h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Workshops", href: "/nl/workshops" },
                  { label: "Vergaderzaal", href: "/nl/vergaderzaal" },
                  { label: "Professional", href: "/nl/professional" },
                  { label: "Over Ons", href: "/nl/over-ons" },
                ].map(item => (
                  <Link key={item.label} href={item.href}>
                    <span style={{ color: COLORS.warmGray, fontSize: "15px" }} className="hover:opacity-80 transition-opacity">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: COLORS.deepEspresso }}>Contact</h4>
              <div className="flex flex-col gap-3" style={{ fontSize: "15px", color: COLORS.warmGray }}>
                <span>Kruze Coffee & Tea</span>
                <span>Wijgmaalsesteenweg 293</span>
                <span>3020 Herent</span>
                <a href="tel:+32497974437" className="hover:opacity-80 transition-opacity">(+32) 497 97 44 37</a>
                <a href="mailto:info@kruze.be" className="hover:opacity-80 transition-opacity">info@kruze.be</a>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8" style={{ borderTop: `1px solid ${COLORS.coolGray}` }}>
            <span style={{ fontSize: "13px", color: COLORS.warmGray }}>
              &copy; {new Date().getFullYear()} Kruze BV. Alle rechten voorbehouden.
            </span>
            <span style={{ fontSize: "13px", color: COLORS.warmGray }}>
              Coffee &middot; Tea &middot; Experience &middot; Academy
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
