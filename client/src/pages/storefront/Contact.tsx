import { StorefrontLayout, PageHero, COLORS, fontSerif, fontSans } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const openingHours = [
  { day: "Maandag", hours: "Gesloten" },
  { day: "Dinsdag", hours: "Gesloten" },
  { day: "Woensdag", hours: "13u30 — 17u00" },
  { day: "Donderdag", hours: "Gesloten" },
  { day: "Vrijdag", hours: "13u30 — 17u00" },
  { day: "Zaterdag", hours: "10u00 — 18u00" },
  { day: "Zondag", hours: "Gesloten" },
];

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Bericht verzonden", description: "Bedankt voor je bericht! We nemen zo snel mogelijk contact op." });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <StorefrontLayout>
      <PageHero
        title="Contact"
        subtitle="Neem contact op"
        imageUrl="/images/hero-contact.png"
      />

      <section style={{ backgroundColor: COLORS.offWhite, padding: "clamp(50px, 6vw, 80px) 0" }} data-testid="section-contact-info">
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8" data-testid="text-contact-title">
                Bezoek onze winkel
              </h2>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4" data-testid="contact-address">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base lg:text-lg" style={{ color: COLORS.deepEspresso }}>Adres</h3>
                    <p className="text-base lg:text-lg" style={{ color: COLORS.warmGray }}>Wijgmaalsesteenweg 293</p>
                    <p className="text-base lg:text-lg" style={{ color: COLORS.warmGray }}>3020 Herent</p>
                  </div>
                </div>

                <div className="flex items-start gap-4" data-testid="contact-phone">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base lg:text-lg" style={{ color: COLORS.deepEspresso }}>Telefoon</h3>
                    <a href="tel:+32497974437" className="text-base lg:text-lg hover:opacity-80 transition-opacity" style={{ color: COLORS.warmGray }}>(+32) 497 97 44 37</a>
                  </div>
                </div>

                <div className="flex items-start gap-4" data-testid="contact-email">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base lg:text-lg" style={{ color: COLORS.deepEspresso }}>E-mail</h3>
                    <a href="mailto:info@kruze.be" className="text-base lg:text-lg hover:opacity-80 transition-opacity" style={{ color: COLORS.warmGray }}>info@kruze.be</a>
                  </div>
                </div>

                <div className="flex items-start gap-4" data-testid="contact-hours">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mutedBrown }}>
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-base lg:text-lg" style={{ color: COLORS.deepEspresso }}>Openingsuren</h3>
                    <div className="space-y-1.5">
                      {openingHours.map(item => (
                        <div key={item.day} className="flex justify-between gap-8 text-sm lg:text-base" style={{ color: COLORS.warmGray }}>
                          <span className="font-medium min-w-[100px]">{item.day}</span>
                          <span className={item.hours === "Gesloten" ? "opacity-50" : ""}>{item.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md overflow-hidden aspect-video bg-muted" data-testid="contact-map">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=4.6685%2C50.8965%2C4.6745%2C50.8995&layer=mapnik&marker=50.8980%2C4.6715"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Kruze locatie"
                />
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily: fontSerif, color: COLORS.deepEspresso }} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8" data-testid="text-form-title">
                Stuur ons een bericht
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-contact">
                <div>
                  <label className="block text-sm lg:text-base font-medium mb-1.5" style={{ color: COLORS.deepEspresso }}>Naam</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border text-base outline-none focus:ring-2"
                    style={{ borderColor: COLORS.coolGray, backgroundColor: "#FFFFFF" }}
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="block text-sm lg:text-base font-medium mb-1.5" style={{ color: COLORS.deepEspresso }}>E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border text-base outline-none focus:ring-2"
                    style={{ borderColor: COLORS.coolGray, backgroundColor: "#FFFFFF" }}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-sm lg:text-base font-medium mb-1.5" style={{ color: COLORS.deepEspresso }}>Onderwerp</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border text-base outline-none focus:ring-2"
                    style={{ borderColor: COLORS.coolGray, backgroundColor: "#FFFFFF" }}
                    data-testid="input-subject"
                  />
                </div>
                <div>
                  <label className="block text-sm lg:text-base font-medium mb-1.5" style={{ color: COLORS.deepEspresso }}>Bericht</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border text-base outline-none focus:ring-2 resize-none"
                    style={{ borderColor: COLORS.coolGray, backgroundColor: "#FFFFFF" }}
                    data-testid="input-message"
                  />
                </div>
                <Button
                  size="lg"
                  type="submit"
                  className="rounded-md px-8"
                  style={{ backgroundColor: COLORS.mutedBrown, color: "#FFFFFF" }}
                  data-testid="button-send"
                >
                  Verstuur bericht
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
