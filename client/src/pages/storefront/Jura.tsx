import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Monitor, Wrench, Coffee, Truck, Settings, ShieldCheck } from "lucide-react";

const productCategories = [
  {
    icon: Monitor,
    title: "Koffiemachines",
    description: "De professionele koffiemachines van JURA bieden voor elke onderneming of omgeving een oplossing: van kleine kantoren tot cafetaria ruimtes.",
    href: "/shop",
  },
  {
    icon: Wrench,
    title: "Onderhoudsproducten",
    description: "JURA onderhoudsproducten zijn precies afgestemd op de onderdelen van de JURA koffietoestellen en bieden je machine een lange levensduur.",
    href: "/shop",
  },
  {
    icon: Settings,
    title: "Accessoires",
    description: "Met de accessoires van JURA wordt je koffiebeleving nog groter: coolers, kopjeswarmers, en meer voor de ultieme koffie-ervaring.",
    href: "/shop",
  },
];

const servicePoints = [
  "We leveren het toestel tot bij u ter plaatse",
  "We stellen het toestel samen met u af en demonstreren het gebruik",
  "Je ontvangt gratis KRUZE koffie bij aankoop van een JURA toestel",
  "Bij defect depanneren wij u tijdelijk met een eigen toestel",
  "Grotere modellen worden bij u ter plaatse gerepareerd",
];

export default function Jura() {
  return (
    <StorefrontLayout>
      <PageHero
        title="JURA Koffiemachines"
        subtitle="Erkend verdeler"
        imageUrl="/images/hero-jura.png"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-jura-intro">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
              KRUZE x JURA
            </p>
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-jura-intro-title">
              Samen voor heerlijke koffie
            </h2>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
              KRUZE staat garant voor heerlijke kwaliteitskoffie. Daarom werken we samen met partners die kwaliteit
              hoog in het vaandel dragen. JURA is wereldwijd dé specialist van koffie-volautomaten. Met de keuze voor
              een koffiemachine van JURA kies je voor reeds 90 jaar innovatie, precisie, kwaliteit, betrouwbaarheid,
              duurzaamheid en service.
            </p>
            <blockquote className="mt-6 text-lg italic" style={{ color: COLORS.mutedBrown }}>
              "Samen zorgen we ervoor dat je van de beste koffie kan genieten op kantoor"
            </blockquote>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-products">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-12" data-testid="text-products-title">
            Ontdek de JURA producten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {productCategories.map((cat, idx) => (
              <div key={cat.title} className="text-center p-8 rounded-md" style={{ backgroundColor: COLORS.offWhite }} data-testid={`card-jura-product-${idx}`}>
                <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                  <cat.icon className="w-7 h-7 text-white" />
                </div>
                <h3 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-xl font-bold mb-3">
                  {cat.title}
                </h3>
                <p className="text-sm lg:text-base leading-relaxed mb-5" style={{ color: COLORS.warmGray }}>
                  {cat.description}
                </p>
                <Link href={cat.href}>
                  <Button variant="outline" className="rounded-md" style={{ borderColor: COLORS.mutedBrown, color: COLORS.mutedBrown }} data-testid={`button-jura-cat-${idx}`}>
                    Bekijk producten
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-service">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                Meer dan een machine
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-service-title">
                Onze service bij aankoop
              </h2>
              <ul className="space-y-3">
                {servicePoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base lg:text-lg" style={{ color: COLORS.bodyText }} data-testid={`text-service-point-${idx}`}>
                    <div className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.mutedBrown }}>
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-md aspect-[4/3] bg-white flex items-center justify-center p-8" style={{ border: `1px solid ${COLORS.coolGray}` }}>
              <div className="text-center">
                <ShieldCheck className="w-20 h-20 mx-auto mb-4" style={{ color: COLORS.mutedBrown }} />
                <p className="text-sm lg:text-base font-semibold uppercase tracking-wider" style={{ color: COLORS.mutedBrown }}>Erkend verdeler</p>
                <p style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-3xl font-bold mt-2">JURA</p>
                <p className="text-sm lg:text-base mt-2" style={{ color: COLORS.warmGray }}>Professionele koffiemachines</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-technology">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4" data-testid="text-tech-title">
              Modernste technologieën
            </h2>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.warmGray }}>
              JURA koffiemachines weten heel wat koffieliefhebbers te bekoren door hun buitengewoon goede koffiekwaliteit,
              het grote gebruiksgemak, een hoogwaardig design en het gebruik van de nieuwste technologieën.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="p-6 rounded-md text-center" style={{ backgroundColor: COLORS.offWhite }} data-testid="card-tech-pep">
              <Coffee className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.mutedBrown }} />
              <h3 className="font-semibold mb-2" style={{ color: COLORS.deepEspresso }}>P.E.P.</h3>
              <p className="text-sm lg:text-base" style={{ color: COLORS.warmGray }}>Het pulserend extractieproces voor de perfecte espresso</p>
            </div>
            <div className="p-6 rounded-md text-center" style={{ backgroundColor: COLORS.offWhite }} data-testid="card-tech-iws">
              <Settings className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.mutedBrown }} />
              <h3 className="font-semibold mb-2" style={{ color: COLORS.deepEspresso }}>I.W.S.®</h3>
              <p className="text-sm lg:text-base" style={{ color: COLORS.warmGray }}>Het intelligente watersysteem voor optimale waterkwaliteit</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.mutedBrown, padding: "clamp(40px, 5vw, 60px) 0" }} data-testid="section-jura-cta">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <h2 style={{ fontFamily: fontSerif }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Interesse in een JURA toestel?
          </h2>
          <p className="text-white/80 lg:text-lg mb-6 max-w-xl mx-auto">
            Contacteer ons voor advies, een persoonlijke offerte of een demonstratie bij u op kantoor.
          </p>
          <Link href="/nl/contact">
            <Button size="lg" className="rounded-md px-8 bg-white hover:bg-white/90" style={{ color: COLORS.mutedBrown }} data-testid="button-jura-contact">
              Contacteer ons
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
