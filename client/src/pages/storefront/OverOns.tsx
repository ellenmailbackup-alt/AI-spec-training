import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, BookOpen, Coffee, Leaf } from "lucide-react";
import pillarCoffeeIcon from "@assets/pijlers_1771248776226.png";
import pillarTeaIcon from "@assets/pijlers2_1771248776226.png";
import pillarExperienceIcon from "@assets/pijlers3_1771248776227.png";
import pillarAcademyIcon from "@assets/pijlers4_1771248776227.png";

const pillars = [
  {
    icon: pillarCoffeeIcon,
    title: "Kruze Coffee",
    description: "Ontdek ons gamma single origin koffies, vers geroosterd net voor verzending. Naast de bonen, staan we je graag bij tijdens je reis door de koffiewereld met advies zodat je optimaal kan genieten van een schitterend kopje koffie.",
    href: "/shop/coffee",
  },
  {
    icon: pillarTeaIcon,
    title: "Kruze Tea",
    description: "Ons uitgebreid gamma thee vanuit de verste hoeken van de wereld, geselecteerd en geblend door onze kapitein in smaak Stijn. Van Japanse matcha tot Belgische kruidenmengelingen.",
    href: "/shop/tea",
  },
  {
    icon: pillarExperienceIcon,
    title: "Kruze Experience",
    description: "Fun en experience zijn de sleutelwoorden. Wil je graag weten wat we doen en hoe we dit doen? Spring aan boord met onze bedrijfsbezoeken, proeverijen en workshops.",
    href: "/nl/workshops",
  },
  {
    icon: pillarAcademyIcon,
    title: "Kruze Academy",
    description: "Voor professionals die samen met Stijn willen navigeren door de boeiende wereld van koffie en thee om zich verder te specialiseren. Persoonlijk en op maat.",
    href: "/nl/workshops",
  },
];

export default function OverOns() {
  return (
    <StorefrontLayout>
      <PageHero
        title="Over Ons"
        subtitle="Life aboard Kruze"
        imageUrl="/images/hero-over-ons.png"
        imagePosition="center 15%"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-intro">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
              Wil je met ons op Kruze?
            </p>
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-intro-title">
              We nemen je graag mee op ontdekkingsreis
            </h2>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.warmGray }}>
              In onze wereld van koffie en thee nemen we je mee op een boeiende reis met de volgende tussenstops.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((pillar, idx) => (
              <Link key={pillar.title} href={pillar.href}>
                <div className="text-center group cursor-pointer" data-testid={`card-pillar-${idx}`}>
                  <div className="w-24 h-24 mx-auto mb-5">
                    <img src={pillar.icon} alt={pillar.title} className="w-full h-full object-contain" />
                  </div>
                  <h3 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-xl font-bold mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm lg:text-base leading-relaxed" style={{ color: COLORS.warmGray }}>
                    {pillar.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-stijn">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative">
              <div className="relative overflow-hidden rounded-md aspect-[3/4]">
                <img
                  src="/images/stijn-roasting.jpg"
                  alt="Stijn Van Schoonlandt"
                  className="w-full h-full object-cover"
                  data-testid="img-stijn"
                />
              </div>
            </div>
            <div>
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                Koffiebrander en theeblender
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-stijn-title">
                Ontmoet Stijn
              </h2>
              <div className="space-y-4 text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
                <p>
                  Stijn woont in Veltem-Beisem met Leen en hun 3 kinderen. Leen en Stijn baten sinds 2015 samen Kruze uit, waar Stijn hoofdzakelijk instaat voor de productie en training.
                </p>
                <p>
                  Stijn is opgegroeid in de voedingswereld en wou steeds zelf iets doen met voeding. Zo richtte hij in 2015 zijn bedrijf op, dat intussen KRUZE geworden is.
                </p>
                <p>
                  Naast een passie voor koffie en thee heeft Stijn ook een voorliefde voor Japan — vandaar een uitstekende selectie Japanse theeën bij KRUZE. Hij reisde al enkele malen naar Japan om er de theeplantages te bezoeken.
                </p>
              </div>
              <blockquote className="mt-6 pl-5 italic text-xl lg:text-2xl leading-relaxed" style={{ borderLeft: `4px solid ${COLORS.mutedBrown}`, color: COLORS.warmGray, fontFamily: fontSerif }}>
                "Reeds jaren drink ik espresso van vers gemalen bonen. De zoektocht naar echte specialty koffie bleef beperkt in België. Dit bracht mij op het idee om zelf mijn zaak op te richten."
                <span className="block mt-3 not-italic text-sm lg:text-base font-semibold" style={{ color: COLORS.mutedBrown, fontFamily: fontSans }}>— Stijn Van Schoonlandt</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-leen">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-base lg:text-lg tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: COLORS.mutedBrown }}>
                Creatieve duizendpoot en theesommelier
              </p>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="text-leen-title">
                Ontmoet Leen
              </h2>
              <div className="space-y-4 text-lg lg:text-xl leading-relaxed" style={{ color: COLORS.bodyText }}>
                <p>
                  Als moeder van 3 kinderen, en met een koffie & theeliefhebbende man aan haar zij, was het duidelijk dat Leen graag haar man volgde in zijn nieuwe business.
                </p>
                <p>
                  De passie werd doorgegeven en zo rolde ze mee in het boeiende koffie & thee verhaal. Ze zet haar veelzijdige talenten en achtergrond in marketing & logistiek in om mee op het KRUZE schip te stappen.
                </p>
                <p>
                  Leen ging bovendien in de leer in Los Angeles op het tea bootcamp en volgde theesommelier cursussen.
                </p>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-md aspect-[3/4]">
                <img
                  src="/images/leen-productie.jpg"
                  alt="Leen"
                  className="w-full h-full object-cover"
                  data-testid="img-leen"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-certifications">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4" data-testid="text-certifications-title">
              Van passie tot meesterschap
            </h2>
            <p className="text-base lg:text-lg leading-relaxed" style={{ color: COLORS.warmGray }}>
              Onze passie voor koffie en thee heeft er toe geleid dat we beide ons door de jaren heen verder zijn gaan professionaliseren.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Coffee, label: "Koffiebrander", desc: "Professionele opleiding koffiebranden" },
              { icon: Award, label: "Barista", desc: "Gecertificeerd barista" },
              { icon: Leaf, label: "ITMA Theemeester", desc: "Master Theeblender en Theemeester" },
              { icon: BookOpen, label: "Theesommelier", desc: "Tea bootcamp Los Angeles" },
            ].map((cert, idx) => (
              <div key={cert.label} className="text-center p-6 rounded-md" style={{ backgroundColor: COLORS.offWhite }} data-testid={`card-cert-${idx}`}>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                  <cert.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: COLORS.deepEspresso }}>{cert.label}</h3>
                <p className="text-sm lg:text-base" style={{ color: COLORS.warmGray }}>{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: COLORS.mutedBrown, padding: "clamp(40px, 5vw, 60px) 0" }} data-testid="section-cta">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <h2 style={{ fontFamily: fontSerif }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Benieuwd naar onze producten?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto text-base lg:text-lg">
            Ontdek ons volledige gamma single origin koffies en premium losse theeën in de webshop.
          </p>
          <Link href="/shop">
            <Button variant="secondary" size="lg" data-testid="button-cta-shop">
              Naar de webshop
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
