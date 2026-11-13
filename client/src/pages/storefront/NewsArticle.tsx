import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link, useParams } from "wouter";
import { useStorefrontTheme } from "@/hooks/useStorefrontTheme";

const articles: Record<string, { title: string; date: string; content: string[] }> = {
  "beter-vergaderen": {
    title: "Beter vergaderen dankzij koffie",
    date: "01-11-2023",
    content: [
      "Koffie speelt een essentiële rol in productieve vergaderingen. De juiste koffie op het juiste moment kan het verschil maken tussen een saaie bijeenkomst en een inspirerende brainstormsessie.",
      "Bij KRUZE begrijpen we dat zakelijke klanten meer nodig hebben dan alleen een kopje koffie. Daarom bieden we speciaal geselecteerde blends aan die perfect zijn voor kantooromgevingen en vergaderruimtes.",
      "Onze B2B diensten omvatten reguliere leveringen, professionele koffiemachines, en training voor uw personeel om de perfecte espresso te maken."
    ]
  },
  "arabica-vs-robusta": {
    title: "Arabica bonen vs Robusta bonen",
    date: "01-11-2023",
    content: [
      "Het verschil tussen Arabica en Robusta koffiebonen is fundamenteel voor het begrijpen van koffiesmaak en kwaliteit.",
      "Arabica bonen staan bekend om hun zachte, complexe smaken met fruitige en bloementoetsen. Ze groeien op hogere hoogtes en vereisen specifieke klimaatcondities.",
      "Robusta bonen daarentegen hebben een krachtiger, bitterder profiel met meer cafeïne. Ze zijn robuuster in teelt en worden vaak gebruikt in espresso blends voor extra body en crema."
    ]
  },
  "single-origin-koffie": {
    title: "Wat maakt Single Origin koffie zo speciaal?",
    date: "01-11-2023",
    content: [
      "Single Origin koffie komt van één specifieke locatie - een enkele boerderij, regio, of land. Dit in tegenstelling tot blends die bonen van meerdere locaties combineren.",
      "De unieke terroir van elke locatie - de combinatie van bodem, klimaat, en hoogte - geeft Single Origin koffie zijn onderscheidende karakter.",
      "Bij KRUZE branden we onze Single Origin koffies met zorg om de natuurlijke eigenschappen van elke origine tot hun recht te laten komen. Van Ethiopische bloemen tot Colombiaanse chocoladetoetsen."
    ]
  }
};

export default function NewsArticle() {
  useStorefrontTheme();
  const params = useParams();
  const slug = params.slug as string;
  const article = articles[slug];

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="container mx-auto px-4 py-20">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-3xl font-bold mb-4">Artikel niet gevonden</h1>
              <p className="text-muted-foreground mb-6">
                Dit nieuwsartikel bestaat niet of is verwijderd.
              </p>
              <Link href="/shop">
                <Button data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/shop">
          <Button variant="ghost" className="mb-8" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar home
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary mb-4">
            <Calendar className="w-4 h-4" />
            <span data-testid="text-article-date">{article.date}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6" data-testid="text-article-title">
            {article.title}
          </h1>
        </div>

        <Card>
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none" data-testid="text-article-content">
              {article.content.map((paragraph, index) => (
                <p key={index} className="mb-6 text-foreground/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Wilt u meer weten over onze koffie en thee expertise?
              </p>
              <Link href="/shop">
                <Button data-testid="button-shop">
                  Ontdek onze producten
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
