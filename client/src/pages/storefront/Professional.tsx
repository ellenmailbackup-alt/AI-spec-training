import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Coffee, HeartHandshake, Truck, Users, ShieldCheck } from "lucide-react";

const pillars = [
  {
    icon: Coffee,
    title: "Verse koffie van uitstekende kwaliteit",
    description: "Bied je personeel en klanten een lekkere koffie-ervaring. Aangezien wij branden op bestelling zijn onze single origin koffies steeds vers gebrand en garanderen wij heerlijke vers geroosterde koffie op kantoor.",
  },
  {
    icon: Users,
    title: "Advies en service bij koffieautomaten",
    description: "Overweeg je een nieuw koffieautomaat aan te schaffen op kantoor? Wij kunnen u adviseren en begeleiden bij het kiezen van het geschikte toestel. Wij zijn erkende verdeler voor professionele JURA-toestellen.",
  },
  {
    icon: HeartHandshake,
    title: "Persoonlijk contact",
    description: "In alles wat we doen vinden we het belangrijk dat onze klanten tevreden zijn. Daarom stellen we veel belang aan persoonlijk contact en goede communicatie. Loopt er iets niet naar wens? Geef ons een seintje.",
  },
  {
    icon: Truck,
    title: "Snelle levering",
    description: "We streven er steeds naar uw koffie binnen de 3 à 4 werkdagen te leveren. Bedrijven in de buurt worden door ons persoonlijk geleverd.",
  },
];

export default function Professional() {
  return (
    <StorefrontLayout>
      <PageHero
        title="Koffie op het werk"
        subtitle="Professional"
        imageUrl="/images/hero-professional.png"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-pro-intro">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
              Koffie voor bedrijven
            </p>
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-pro-intro-title">
              Heerlijke koffie op kantoor
            </h2>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
              Herken je dat moment? Heerlijk even bijpraten tijdens de koffiepauze met collega's, genietend van een kopje koffie,
              zodat je nadien weer vol energie je werk hervat. Een heerlijke kop koffie aanbieden aan je klanten is net zo belangrijk
              als een professioneel visitekaartje — het draagt bij aan het goede imago van je bedrijf.
            </p>
            <blockquote className="mt-6 text-lg italic" style={{ color: COLORS.mutedBrown }}>
              "Schenk je klanten en personeel een koffie waar ze instant blij van worden"
            </blockquote>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-pillars">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-12" data-testid="text-pillars-title">
            Waarom KRUZE koffie op kantoor?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => (
              <div key={pillar.title} className="flex gap-5 p-6 rounded-md" style={{ backgroundColor: COLORS.offWhite }} data-testid={`card-pillar-${idx}`}>
                <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                  <pillar.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: COLORS.deepEspresso }}>{pillar.title}</h3>
                  <p className="text-sm lg:text-base leading-relaxed" style={{ color: COLORS.warmGray }}>{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-jura-dealer">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-8 h-8" style={{ color: COLORS.mutedBrown }} />
                <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold" style={{ color: COLORS.mutedBrown }}>
                  Erkend verdeler
                </p>
              </div>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-jura-dealer-title">
                JURA koffiemachines voor kantoor
              </h2>
              <div className="space-y-4 text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
                <p>
                  KRUZE verdeelt JURA-koffieautomaten voor kantoor en professioneel gebruik, bijhorende accessoires en onderhoudsproducten.
                </p>
                <p>
                  Wij kunnen u adviseren en begeleiden bij het kiezen van het geschikte toestel voor uw organisatie.
                  Wij werken met verschillende leveranciers samen en maken vrijblijvend een offerte.
                </p>
              </div>
              <Link href="/nl/jura">
                <Button
                  size="lg"
                  className="rounded-md px-6 mt-6"
                  style={{ backgroundColor: COLORS.mutedBrown, color: "#FFF" }}
                  data-testid="button-jura-link"
                >
                  Ontdek JURA producten
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-md aspect-[4/3]">
              <img
                src="/images/hero-jura.png"
                alt="JURA koffiemachine op kantoor"
                className="w-full h-full object-cover"
                data-testid="img-jura-office"
              />
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.mutedBrown, padding: "clamp(40px, 5vw, 60px) 0" }} data-testid="section-pro-cta">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <h2 style={{ fontFamily: fontSerif }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Interesse in koffie voor uw bedrijf?
          </h2>
          <p className="text-white/80 lg:text-lg mb-4 max-w-xl mx-auto">
            Voor B2B prijzen, persoonlijke offertes of andere vragen — neem contact met ons op.
          </p>
          <p className="text-white/60 text-sm lg:text-base italic mb-6">
            KRUZE, jouw lokale koffiebrander waar kwaliteit en persoonlijke service centraal staan.
          </p>
          <Link href="/nl/contact">
            <Button size="lg" className="rounded-md px-8 bg-white hover:bg-white/90" style={{ color: COLORS.mutedBrown }} data-testid="button-pro-contact">
              Contacteer ons
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
