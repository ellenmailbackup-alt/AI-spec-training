import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Coffee, Car, ChevronRight, Users, Euro } from "lucide-react";
import vergaderzaalHero from "@assets/image_1771684948087.png";

const features = [
  { icon: Users, label: "10 personen", desc: "Ruime tafel met luxueuze stoelen" },
  { icon: Coffee, label: "Gratis koffie & thee", desc: "Eigen koffiecorner in de zaal" },
  { icon: Monitor, label: "Presentatie-uitrusting", desc: "Flatscreen TV, flipchart, videoconference" },
  { icon: Car, label: "Ruime parking", desc: "Gelegen aan de vaart met parkeermogelijkheden" },
];

const pricing = [
  { label: "Per uur", price: "€ 50", note: "excl. BTW" },
  { label: "Halve dag", price: "€ 150", note: "excl. BTW" },
  { label: "Volledige dag", price: "€ 250", note: "excl. BTW" },
];

export default function Vergaderzaal() {
  return (
    <StorefrontLayout>
      <PageHero
        title="Vergaderzaal"
        subtitle="Unieke locatie in een koffiebranderij"
        imageUrl={vergaderzaalHero}
        imagePosition="center 30%"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-vergaderzaal-intro">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                Unieke locatie in een gerestaureerd herenhuis
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-vergaderzaal-title">
                Vergaderzaal in de koffiebranderij
              </h2>
              <div className="space-y-4 text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
                <p>
                  Kruze beschikt over een unieke vergaderzaal achterin de koffiebranderij, met zicht op de koffiebrander.
                  Deze zaal kan gehuurd worden voor meetings, brainstorm sessies, off-sites en teambuildings.
                </p>
                <p>
                  De vergaderzaal (4,3 m bij 6,3 m) is ruim en stijlvol ingericht en beschikt over een eigen koffiecorner.
                  Door de grote glaskoepels krijg je veel lichtinval. Een dubbele glazen deur sluit de zaal af van de koffiebranderij.
                </p>
                <p>
                  Onze koffiebranderij is gelegen aan de vaart, met ruime parkeermogelijkheden. Ideaal om even te ontspannen
                  tijdens het vergaderen en te genieten van een wandeling langs het water.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-md aspect-[4/3]">
              <img
                src="https://kruze.be/wp-content/uploads/2023/02/20221229_143516-002-1-scaled.jpg"
                alt="Vergaderzaal Kruze"
                className="w-full h-full object-cover"
                data-testid="img-vergaderzaal"
              />
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-features">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-12" data-testid="text-features-title">
            Faciliteiten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <div key={f.label} className="text-center p-6 rounded-md" style={{ backgroundColor: COLORS.offWhite }} data-testid={`card-feature-${idx}`}>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: COLORS.deepEspresso }}>{f.label}</h3>
                <p className="text-sm lg:text-base" style={{ color: COLORS.warmGray }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-pricing">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3" data-testid="text-pricing-title">
              Tarieven en beschikbaarheid
            </h2>
            <p className="text-sm lg:text-base" style={{ color: COLORS.warmGray }}>Gratis koffie, thee en water inbegrepen</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {pricing.map((p, idx) => (
              <div
                key={p.label}
                className="text-center p-8 rounded-md bg-white"
                style={{ border: `1px solid ${COLORS.coolGray}` }}
                data-testid={`card-price-${idx}`}
              >
                <p className="text-sm lg:text-base font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.mutedBrown }}>{p.label}</p>
                <div style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl font-bold mb-1">{p.price}</div>
                <p className="text-xs" style={{ color: COLORS.warmGray }}>{p.note}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm lg:text-base mt-8" style={{ color: COLORS.warmGray }}>
            Wijgmaalsesteenweg 293, 3020 Herent — gelegen aan de brug van Wijgmaal
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-catering">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative overflow-hidden rounded-md aspect-[4/3]">
              <img
                src="https://kruze.be/wp-content/uploads/2023/02/tasjekoffie-KRUZE.jpg"
                alt="Catering Kruze"
                className="w-full h-full object-cover"
                data-testid="img-catering"
              />
            </div>
            <div>
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                Extra service
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-catering-title">
                Catering
              </h2>
              <div className="space-y-4 text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
                <p>
                  Wij kunnen eveneens de catering van je event verzorgen. Dit kan besproken worden bij het boeken van de zaal.
                </p>
                <p>
                  Zowel ontbijt als diverse lunchopties zijn mogelijk. Een afternoon tea behoort ook tot de mogelijkheden.
                </p>
                <p>
                  Wens je graag na de vergadering te genieten van één van onze workshops zoals sushi en thee, thee en chocolade,
                  of een koffie proeverij? Laat het ons weten en wij zorgen dat jullie een unieke afsluiter beleven.
                </p>
              </div>
              <Link href="/nl/contact">
                <Button
                  size="lg"
                  className="rounded-md px-6 mt-6"
                  style={{ backgroundColor: COLORS.mutedBrown, color: "#FFF" }}
                  data-testid="button-vergaderzaal-contact"
                >
                  Beschikbaarheid opvragen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
