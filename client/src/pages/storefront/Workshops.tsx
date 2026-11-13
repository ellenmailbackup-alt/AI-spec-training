import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coffee, Leaf, Users, GraduationCap, ArrowRight, ChevronRight } from "lucide-react";

const workshops = [
  {
    icon: Coffee,
    title: "Koffie cupping & proeverij",
    description: "Ontdek de wereld van specialty koffie tijdens een professionele cupping sessie. Leer de smaken, aroma's en herkomst van onze single origin koffies kennen. Ideaal voor koffieliefhebbers die hun smaakpapillen willen trainen.",
    details: ["Duur: ca. 2 uur", "Max. 10 deelnemers", "Inclusief koffie en hapjes"],
    image: "https://kruze.be/wp-content/uploads/2021/10/tea2.jpg",
  },
  {
    icon: GraduationCap,
    title: "Latte art masterclass",
    description: "Leer de kunst van latte art van onze ervaren barista's. Van het perfect opschuimen van melk tot het gieten van patronen als een hartje, tulp en rosetta. Neem je skills mee naar huis.",
    details: ["Duur: ca. 2,5 uur", "Max. 8 deelnemers", "Alle materiaal voorzien"],
    image: "https://kruze.be/wp-content/uploads/2021/10/tea3.jpg",
  },
  {
    icon: Leaf,
    title: "Thee blending workshop",
    description: "Duik in de wereld van thee met theemeester Stijn. Leer over verschillende theevariëteiten, proef exclusieve theeën uit Japan en daarbuiten, en creëer je eigen theeblend om mee naar huis te nemen.",
    details: ["Duur: ca. 2 uur", "Max. 10 deelnemers", "Eigen blend mee naar huis"],
    image: "https://kruze.be/wp-content/uploads/2021/10/tea.jpg",
  },
  {
    icon: Users,
    title: "Bedrijfsevenementen op maat",
    description: "Op zoek naar een unieke teambuilding of bedrijfsevenement? Wij organiseren op maat gemaakte koffie- en thee-ervaringen in onze koffiebranderij. Combineer met een bezoek aan de vergaderzaal voor een complete dag.",
    details: ["Duur: in overleg", "Op maat", "Catering mogelijk"],
    image: "/images/workshops-hero.png",
  },
];

export default function Workshops() {
  return (
    <StorefrontLayout>
      <PageHero
        title="Workshops & Proeverijen"
        subtitle="Kruze Experience & Academy"
        imageUrl="/images/workshops-hero.png"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-workshops-intro">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
              Kruze Experience
            </p>
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-workshops-intro-title">
              Ontdek de wereld van koffie en thee
            </h2>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.warmGray }}>
              Spring aan boord en laat je meevoeren in de boeiende wereld van specialty koffie en ambachtelijke thee.
              Onze workshops bieden een unieke ervaring voor koffieliefhebbers, thee-enthousiastelingen en bedrijven.
            </p>
          </div>
        </div>
      </section>

      {workshops.map((workshop, idx) => (
        <section
          key={workshop.title}
          style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }}
          data-testid={`section-workshop-${idx}`}
        >
          <div className="mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className={idx % 2 !== 0 ? "order-2 lg:order-1" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                    <workshop.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold" style={{ color: COLORS.mutedBrown }}>
                    Workshop
                  </p>
                </div>
                <h3 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4" data-testid={`text-workshop-title-${idx}`}>
                  {workshop.title}
                </h3>
                <p className="text-lg lg:text-xl leading-relaxed mb-5" style={{ color: COLORS.bodyText }}>
                  {workshop.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {workshop.details.map(detail => (
                    <li key={detail} className="flex items-center gap-2 text-sm lg:text-base" style={{ color: COLORS.warmGray }}>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: COLORS.mutedBrown }} />
                      {detail}
                    </li>
                  ))}
                </ul>
                <Link href="/nl/contact">
                  <Button
                    size="lg"
                    className="rounded-md px-6"
                    style={{ backgroundColor: COLORS.mutedBrown, color: "#FFF" }}
                    data-testid={`button-workshop-cta-${idx}`}
                  >
                    Meer info aanvragen
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className={idx % 2 !== 0 ? "order-1 lg:order-2" : ""}>
                <div className="relative overflow-hidden rounded-md aspect-[4/3]">
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-cover"
                    data-testid={`img-workshop-${idx}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section style={{ backgroundColor: COLORS.mutedBrown, padding: "clamp(40px, 5vw, 60px) 0" }} data-testid="section-workshops-cta">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <h2 style={{ fontFamily: fontSerif }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Interesse in een workshop?
          </h2>
          <p className="text-white/80 lg:text-lg mb-6 max-w-xl mx-auto">
            Neem contact met ons op voor beschikbaarheid, prijzen en mogelijkheden op maat.
          </p>
          <Link href="/nl/contact">
            <Button size="lg" className="rounded-md px-8 bg-white hover:bg-white/90" style={{ color: COLORS.mutedBrown }} data-testid="button-contact-cta">
              Contacteer ons
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
