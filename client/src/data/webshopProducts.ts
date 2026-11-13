export type WebshopCategory = "coffee" | "tea" | "equipment" | "gifts" | "zoetigheden";

export type CoffeeProcess = "Natural" | "Washed" | "Honey" | "Blend";
export type CoffeeStrength = "Mild" | "Evenwichtig" | "Krachtig";

export type TeaType =
  | "Groene Thee"
  | "Zwarte Thee"
  | "Oolong"
  | "Witte Thee"
  | "Pu-erh"
  | "Kruidenblend"
  | "Fruitinfusen"
  | "IJsthee"
  | "Rooibos";

export type JuraSeries = "E-lijn" | "S-lijn" | "Z-lijn" | "D-lijn";
export type JuraPriceRange = "Instap" | "Middenklasse" | "Premium";

export type CoffeeOriginContinent = "Afrika" | "Amerika's" | "Azie/Pacific";
export type CoffeeOriginCountry =
  | "Ethiopie"
  | "Kenya"
  | "Rwanda"
  | "Malawi"
  | "Colombia"
  | "Guatemala"
  | "Brazilie"
  | "Cuba"
  | "Costa Rica"
  | "Nicaragua"
  | "Mexico"
  | "Honduras"
  | "Peru"
  | "India"
  | "Indonesie"
  | "Papua Nieuw-Guinea";

export type TeaOriginCountry = "Japan" | "China" | "Taiwan" | "India" | "Sri Lanka" | "Zuid-Afrika" | "Nepal" | "Brazilie";

export interface WebshopProductBase {
  id: string;
  name: string;
  category: WebshopCategory;
  description: string;
  price: number;
  imageUrl?: string;
  imageTag?: string;
  seasonal?: boolean;
  awards?: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface CoffeeProduct extends WebshopProductBase {
  category: "coffee";
  origin: CoffeeOriginCountry;
  originContinent: CoffeeOriginContinent;
  region?: string;
  tastingNote: string;
  process: CoffeeProcess;
  strength: CoffeeStrength;
  unit: string;
}

export interface TeaProduct extends WebshopProductBase {
  category: "tea";
  teaType: TeaType;
  teaCategory: "Puur" | "Kruiden & Botanisch";
  origin: TeaOriginCountry;
  brewTemp: string;
  brewTime: string;
  brewDosage?: string;
  tastingNote: string;
  unit: string;
}

export interface EquipmentProduct extends WebshopProductBase {
  category: "equipment";
  series: JuraSeries;
  priceRange: JuraPriceRange;
  specs: string[];
  premiumTag?: boolean;
}

export interface GiftProduct extends WebshopProductBase {
  category: "gifts";
  contents?: string[];
  unit?: string;
}

export interface ZoetighedenProduct extends WebshopProductBase {
  category: "zoetigheden";
  unit?: string;
}

export type WebshopProduct =
  | CoffeeProduct
  | TeaProduct
  | EquipmentProduct
  | GiftProduct
  | ZoetighedenProduct;

export const ORIGIN_CONTINENT_MAP: Record<CoffeeOriginCountry, CoffeeOriginContinent> = {
  "Ethiopie": "Afrika",
  "Kenya": "Afrika",
  "Rwanda": "Afrika",
  "Malawi": "Afrika",
  "Colombia": "Amerika's",
  "Guatemala": "Amerika's",
  "Brazilie": "Amerika's",
  "Cuba": "Amerika's",
  "Costa Rica": "Amerika's",
  "Nicaragua": "Amerika's",
  "Mexico": "Amerika's",
  "Honduras": "Amerika's",
  "Peru": "Amerika's",
  "India": "Azie/Pacific",
  "Indonesie": "Azie/Pacific",
  "Papua Nieuw-Guinea": "Azie/Pacific",
};

export const TEA_CATEGORY_MAP: Record<TeaType, "Puur" | "Kruiden & Botanisch"> = {
  "Groene Thee": "Puur",
  "Zwarte Thee": "Puur",
  "Oolong": "Puur",
  "Witte Thee": "Puur",
  "Pu-erh": "Puur",
  "Kruidenblend": "Kruiden & Botanisch",
  "Fruitinfusen": "Kruiden & Botanisch",
  "IJsthee": "Kruiden & Botanisch",
  "Rooibos": "Kruiden & Botanisch",
};

export const webshopProducts: WebshopProduct[] = [
  // ── COFFEE (~18 products) ──
  {
    id: "coffee-01",
    name: "Ethiopie Yirgacheffe",
    category: "coffee",
    description: "Single origin uit het hart van Ethiopie, gewassen verwerkt met een helder bloemig profiel.",
    price: 9.50,
    unit: "/250g",
    origin: "Ethiopie",
    originContinent: "Afrika",
    region: "Yirgacheffe",
    tastingNote: "Jasmijn, bergamot, citrus",
    process: "Washed",
    strength: "Mild",
    imageTag: "Koffie",
    inStock: true,
    featured: true,
    awards: ["Great Taste 2024"],
  },
  {
    id: "coffee-02",
    name: "Ethiopie Sidamo Natural",
    category: "coffee",
    description: "Natuurlijk verwerkte bonen met een intens fruitig karakter en volle body.",
    price: 10.50,
    unit: "/250g",
    origin: "Ethiopie",
    originContinent: "Afrika",
    region: "Sidamo",
    tastingNote: "Bosbes, cacao, tropisch fruit",
    process: "Natural",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-03",
    name: "Kenya AA Nyeri",
    category: "coffee",
    description: "Hooggelegen Keniaanse koffie met een levendig zuurprofiel en sappige body.",
    price: 11.00,
    unit: "/250g",
    origin: "Kenya",
    originContinent: "Afrika",
    region: "Nyeri",
    tastingNote: "Zwarte bes, grapefruit, bruine suiker",
    process: "Washed",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-04",
    name: "Rwanda Nyamasheke",
    category: "coffee",
    description: "Rwandese specialty koffie met een zachte zoetheid en complexe afdronk.",
    price: 9.90,
    unit: "/250g",
    origin: "Rwanda",
    originContinent: "Afrika",
    region: "Nyamasheke",
    tastingNote: "Karamel, rode appel, noten",
    process: "Honey",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-05",
    name: "Colombia Huila Supremo",
    category: "coffee",
    description: "Klassieke Colombiaanse koffie met een ronde body en zoete ondertoon.",
    price: 8.90,
    unit: "/250g",
    origin: "Colombia",
    originContinent: "Amerika's",
    region: "Huila",
    tastingNote: "Chocolade, karamel, amandel",
    process: "Washed",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
    featured: true,
  },
  {
    id: "coffee-06",
    name: "Colombia Nari\u00f1o Honey",
    category: "coffee",
    description: "Honey-processed Colombiaanse single origin met een honing-zoete afdronk.",
    price: 10.90,
    unit: "/250g",
    origin: "Colombia",
    originContinent: "Amerika's",
    region: "Narino",
    tastingNote: "Honing, perzik, melkchocolade",
    process: "Honey",
    strength: "Mild",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-07",
    name: "Guatemala Antigua",
    category: "coffee",
    description: "Vulkanische bodem geeft deze Guatemalteekse koffie een rokerig-zoet karakter.",
    price: 9.50,
    unit: "/250g",
    origin: "Guatemala",
    originContinent: "Amerika's",
    region: "Antigua",
    tastingNote: "Rookhout, donkere chocolade, vijg",
    process: "Washed",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-08",
    name: "Brazilie Santos Natural",
    category: "coffee",
    description: "Zachte Braziliaanse koffie met een nootachtig profiel, ideaal als basis voor espresso.",
    price: 7.90,
    unit: "/250g",
    origin: "Brazilie",
    originContinent: "Amerika's",
    region: "Santos",
    tastingNote: "Hazelnoot, toffee, zachte cacao",
    process: "Natural",
    strength: "Mild",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-09",
    name: "Brazilie Cerrado",
    category: "coffee",
    description: "Volle body met een lage zuurgraad, perfect voor melkdranken.",
    price: 8.50,
    unit: "/250g",
    origin: "Brazilie",
    originContinent: "Amerika's",
    region: "Cerrado",
    tastingNote: "Pinda, bruine suiker, romig",
    process: "Natural",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-10",
    name: "Cuba Serrano Superior",
    category: "coffee",
    description: "Zeldzame Cubaanse koffie met een tabaksachtige complexiteit.",
    price: 12.50,
    unit: "/250g",
    origin: "Cuba",
    originContinent: "Amerika's",
    region: "Sierra Maestra",
    tastingNote: "Tabak, ceder, donkere chocolade",
    process: "Washed",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
    seasonal: true,
  },
  {
    id: "coffee-11",
    name: "India Monsooned Malabar",
    category: "coffee",
    description: "Uniek door het monsooning-proces, met een aardse en kruidig karakter.",
    price: 9.90,
    unit: "/250g",
    origin: "India",
    originContinent: "Azie/Pacific",
    region: "Malabar",
    tastingNote: "Aarde, kruidnagel, leer",
    process: "Natural",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-12",
    name: "Indonesie Sumatra Mandheling",
    category: "coffee",
    description: "Full-bodied Sumatraanse koffie met een syruupachtige body.",
    price: 10.50,
    unit: "/250g",
    origin: "Indonesie",
    originContinent: "Azie/Pacific",
    region: "Mandheling",
    tastingNote: "Aarde, cederhout, donkere chocolade",
    process: "Natural",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-13",
    name: "Papua Nieuw-Guinea Sigri",
    category: "coffee",
    description: "Gebalanceerde koffie uit de hooglanden van Papua Nieuw-Guinea.",
    price: 10.00,
    unit: "/250g",
    origin: "Papua Nieuw-Guinea",
    originContinent: "Azie/Pacific",
    region: "Waghi Valley",
    tastingNote: "Mango, hazelnoot, subtiele zuurgraad",
    process: "Washed",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-14",
    name: "Kruze Huisblend",
    category: "coffee",
    description: "Onze signature blend: een harmonieuze mix van Colombiaanse en Braziliaanse bonen.",
    price: 7.50,
    unit: "/250g",
    origin: "Colombia",
    originContinent: "Amerika's",
    tastingNote: "Chocolade, noten, karamel",
    process: "Blend",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
    featured: true,
  },
  {
    id: "coffee-15",
    name: "Kruze Espresso Blend",
    category: "coffee",
    description: "Krachtige espressoblend met een dikke crema en volle smaak.",
    price: 8.50,
    unit: "/250g",
    origin: "Brazilie",
    originContinent: "Amerika's",
    tastingNote: "Donkere chocolade, walnoot, kruidig",
    process: "Blend",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-16",
    name: "Kruze Decaf Colombia",
    category: "coffee",
    description: "Decafe zonder compromis. Swiss Water Process voor maximale smaak.",
    price: 9.50,
    unit: "/250g",
    origin: "Colombia",
    originContinent: "Amerika's",
    region: "Huila",
    tastingNote: "Karamel, cacao, zachte noten",
    process: "Washed",
    strength: "Mild",
    imageTag: "Koffie",
    inStock: true,
  },
  {
    id: "coffee-17",
    name: "Kenya Kiambu Peaberry",
    category: "coffee",
    description: "Exclusieve peaberry selectie met een helder en complex smaakprofiel.",
    price: 13.50,
    unit: "/250g",
    origin: "Kenya",
    originContinent: "Afrika",
    region: "Kiambu",
    tastingNote: "Braam, limoen, witte wijn",
    process: "Washed",
    strength: "Krachtig",
    imageTag: "Koffie",
    inStock: true,
    awards: ["Great Taste 2023"],
  },
  {
    id: "coffee-18",
    name: "Ethiopie Guji Natural",
    category: "coffee",
    description: "Experimentele natural uit Guji met een explosie van fruitige smaken.",
    price: 12.00,
    unit: "/250g",
    origin: "Ethiopie",
    originContinent: "Afrika",
    region: "Guji",
    tastingNote: "Aardbei, mango, jasmijn",
    process: "Natural",
    strength: "Evenwichtig",
    imageTag: "Koffie",
    inStock: true,
    seasonal: true,
  },

  // ── TEA (~15 products) ──
  {
    id: "tea-01",
    name: "Sencha Superior",
    category: "tea",
    description: "Klassieke Japanse groene thee met een grassig-zoet karakter.",
    price: 8.50,
    unit: "/50g",
    teaType: "Groene Thee",
    teaCategory: "Puur",
    origin: "Japan",
    brewTemp: "75",
    brewTime: "2",
    tastingNote: "Umami, zeewier, zoete grastoppen",
    inStock: true,
    featured: true,
    imageTag: "Groene Thee",
  },
  {
    id: "tea-02",
    name: "Gyokuro Asahi",
    category: "tea",
    description: "Premium beschaduwde Japanse groene thee met een diepe umami smaak.",
    price: 18.50,
    unit: "/50g",
    teaType: "Groene Thee",
    teaCategory: "Puur",
    origin: "Japan",
    brewTemp: "60",
    brewTime: "2",
    tastingNote: "Intens umami, zeewier, boter",
    inStock: true,
    awards: ["Great Taste 2024"],
    imageTag: "Groene Thee",
  },
  {
    id: "tea-03",
    name: "Dragon Well (Longjing)",
    category: "tea",
    description: "Beroemde Chinese groene thee met een kastanjeachtige zoetheid.",
    price: 12.00,
    unit: "/50g",
    teaType: "Groene Thee",
    teaCategory: "Puur",
    origin: "China",
    brewTemp: "80",
    brewTime: "3",
    tastingNote: "Kastanje, orchidee, zachte zoetheid",
    inStock: true,
    imageTag: "Groene Thee",
  },
  {
    id: "tea-04",
    name: "Darjeeling First Flush",
    category: "tea",
    description: "De champagne onder de thees. Lichte, bloemige eerste pluk uit Darjeeling.",
    price: 14.00,
    unit: "/50g",
    teaType: "Zwarte Thee",
    teaCategory: "Puur",
    origin: "India",
    brewTemp: "95",
    brewTime: "4",
    tastingNote: "Muscatel, bloemen, lichte honing",
    inStock: true,
    featured: true,
    imageTag: "Zwarte Thee",
  },
  {
    id: "tea-05",
    name: "Assam Golden Tips",
    category: "tea",
    description: "Rijke, moutige Assam thee met gouden tips voor extra complexiteit.",
    price: 9.50,
    unit: "/50g",
    teaType: "Zwarte Thee",
    teaCategory: "Puur",
    origin: "India",
    brewTemp: "100",
    brewTime: "4",
    tastingNote: "Mout, honing, kruidig",
    inStock: true,
    imageTag: "Zwarte Thee",
  },
  {
    id: "tea-06",
    name: "Da Hong Pao",
    category: "tea",
    description: "Legendarische Chinese rotsklifoolong met een mineraal en rokerig profiel.",
    price: 16.00,
    unit: "/50g",
    teaType: "Oolong",
    teaCategory: "Puur",
    origin: "China",
    brewTemp: "95",
    brewTime: "3",
    tastingNote: "Gebrande karamel, mineraal, orchidee",
    inStock: true,
    imageTag: "Oolong",
  },
  {
    id: "tea-07",
    name: "Dong Ding Oolong",
    category: "tea",
    description: "Taiwanees paradepaardje met een romig-bloemig karakter.",
    price: 13.50,
    unit: "/50g",
    teaType: "Oolong",
    teaCategory: "Puur",
    origin: "Taiwan",
    brewTemp: "90",
    brewTime: "3",
    tastingNote: "Boter, gardenia, honing",
    inStock: true,
    imageTag: "Oolong",
  },
  {
    id: "tea-08",
    name: "Pai Mu Tan Silver Needle",
    category: "tea",
    description: "Delicate witte thee van de eerste voorjaarsknoppen.",
    price: 15.00,
    unit: "/50g",
    teaType: "Witte Thee",
    teaCategory: "Puur",
    origin: "China",
    brewTemp: "80",
    brewTime: "5",
    tastingNote: "Witte bloemen, meloen, subtiele zoetheid",
    inStock: true,
    imageTag: "Witte Thee",
  },
  {
    id: "tea-09",
    name: "Pu-erh Shu Classic",
    category: "tea",
    description: "Gerijpte pu-erh thee met een aardse diepte en zachte body.",
    price: 11.00,
    unit: "/50g",
    teaType: "Pu-erh",
    teaCategory: "Puur",
    origin: "China",
    brewTemp: "100",
    brewTime: "4",
    tastingNote: "Aarde, paddenstoel, leer",
    inStock: true,
    imageTag: "Pu-erh",
  },
  {
    id: "tea-10",
    name: "Ceylon OP1 Nuwara Eliya",
    category: "tea",
    description: "Fijne Ceylon thee uit de hoogste plantages van Sri Lanka.",
    price: 8.00,
    unit: "/50g",
    teaType: "Zwarte Thee",
    teaCategory: "Puur",
    origin: "Sri Lanka",
    brewTemp: "95",
    brewTime: "4",
    tastingNote: "Citrus, eucalyptus, licht kruidig",
    inStock: true,
    imageTag: "Zwarte Thee",
  },
  {
    id: "tea-11",
    name: "Kruze Kruidentuin",
    category: "tea",
    description: "Huisblend van kamille, citroenmelisse en pepermunt. Rustgevend en zacht.",
    price: 6.50,
    unit: "/50g",
    teaType: "Kruidenblend",
    teaCategory: "Kruiden & Botanisch",
    origin: "India",
    brewTemp: "100",
    brewTime: "6",
    tastingNote: "Kamille, munt, lichte honing",
    inStock: true,
    imageTag: "Kruiden",
  },
  {
    id: "tea-12",
    name: "Gember Kurkuma Wellness",
    category: "tea",
    description: "Verwarmende kruidenblend met gember, kurkuma en zwarte peper.",
    price: 7.00,
    unit: "/50g",
    teaType: "Kruidenblend",
    teaCategory: "Kruiden & Botanisch",
    origin: "India",
    brewTemp: "100",
    brewTime: "7",
    tastingNote: "Gember, kurkuma, pepperig warm",
    inStock: true,
    seasonal: true,
    imageTag: "Kruiden",
  },
  {
    id: "tea-13",
    name: "Rooibos Original",
    category: "tea",
    description: "Natuurlijk caffeine-vrije rooibos uit Zuid-Afrika. Zoet en nootachtig.",
    price: 5.50,
    unit: "/50g",
    teaType: "Rooibos",
    teaCategory: "Kruiden & Botanisch",
    origin: "Zuid-Afrika",
    brewTemp: "100",
    brewTime: "6",
    tastingNote: "Vanille, honing, zachte noten",
    inStock: true,
    imageTag: "Rooibos",
  },
  {
    id: "tea-14",
    name: "Rooibos Bosbes",
    category: "tea",
    description: "Fruitige rooibos met gedroogde bosbessen en een zoete afdronk.",
    price: 6.00,
    unit: "/50g",
    teaType: "Rooibos",
    teaCategory: "Kruiden & Botanisch",
    origin: "Zuid-Afrika",
    brewTemp: "100",
    brewTime: "6",
    tastingNote: "Bosbes, vanille, lichte zoetheid",
    inStock: true,
    imageTag: "Rooibos",
  },
  {
    id: "tea-15",
    name: "Matcha Ceremonieel",
    category: "tea",
    description: "Premium ceremonieel grade matcha uit Uji, Kyoto. Intens groen en romig.",
    price: 24.00,
    unit: "/30g",
    teaType: "Groene Thee",
    teaCategory: "Puur",
    origin: "Japan",
    brewTemp: "80",
    brewTime: "0",
    tastingNote: "Intens umami, romig, zoete afdronk",
    inStock: true,
    featured: true,
    imageTag: "Groene Thee",
  },

  // ── JURA MACHINES (~11 products) ──
  {
    id: "jura-01",
    name: "JURA E4",
    category: "equipment",
    description: "Compacte volautomaat voor de perfecte espresso thuis.",
    price: 599.00,
    series: "E-lijn",
    priceRange: "Instap",
    specs: ["15 bar", "8 dranken"],
    inStock: true,
    imageTag: "E-lijn",
  },
  {
    id: "jura-02",
    name: "JURA E6",
    category: "equipment",
    description: "Veelzijdige volautomaat met melkschuimsysteem voor cappuccino en latte.",
    price: 799.00,
    series: "E-lijn",
    priceRange: "Instap",
    specs: ["15 bar", "11 dranken"],
    inStock: true,
    imageTag: "E-lijn",
  },
  {
    id: "jura-03",
    name: "JURA E8",
    category: "equipment",
    description: "Topmodel uit de E-lijn met 17 specialiteiten en kleurendisplay.",
    price: 999.00,
    series: "E-lijn",
    priceRange: "Middenklasse",
    specs: ["15 bar", "17 dranken"],
    inStock: true,
    featured: true,
    imageTag: "E-lijn",
  },
  {
    id: "jura-04",
    name: "JURA S8",
    category: "equipment",
    description: "Professionele kwaliteit voor thuis met touchscreen bediening.",
    price: 1299.00,
    series: "S-lijn",
    priceRange: "Middenklasse",
    specs: ["15 bar", "15 dranken"],
    inStock: true,
    imageTag: "S-lijn",
  },
  {
    id: "jura-05",
    name: "JURA S80",
    category: "equipment",
    description: "De perfecte balans tussen design en prestaties voor de veeleisende koffieliefhebber.",
    price: 1499.00,
    series: "S-lijn",
    priceRange: "Middenklasse",
    specs: ["15 bar", "18 dranken"],
    inStock: true,
    imageTag: "S-lijn",
  },
  {
    id: "jura-06",
    name: "JURA Z10",
    category: "equipment",
    description: "Het absolute vlaggenschip. Product Recognising Grinder en cold brew functie.",
    price: 2499.00,
    series: "Z-lijn",
    priceRange: "Premium",
    specs: ["15 bar", "32 dranken", "Cold Brew"],
    premiumTag: true,
    inStock: true,
    featured: true,
    imageTag: "Z-lijn",
  },
  {
    id: "jura-07",
    name: "JURA Z8",
    category: "equipment",
    description: "Premium volautomaat met dubbele uitloop en touchscreen.",
    price: 2199.00,
    series: "Z-lijn",
    priceRange: "Premium",
    specs: ["15 bar", "21 dranken"],
    premiumTag: true,
    inStock: true,
    imageTag: "Z-lijn",
  },
  {
    id: "jura-08",
    name: "JURA D4",
    category: "equipment",
    description: "Instapmodel voor pure zwarte koffie liefhebbers. Compact en betrouwbaar.",
    price: 449.00,
    series: "D-lijn",
    priceRange: "Instap",
    specs: ["15 bar", "5 dranken"],
    inStock: true,
    imageTag: "D-lijn",
  },
  {
    id: "jura-09",
    name: "JURA D6",
    category: "equipment",
    description: "Elegante volautomaat uit de D-lijn met fijne aroma-instelling.",
    price: 549.00,
    series: "D-lijn",
    priceRange: "Instap",
    specs: ["15 bar", "7 dranken"],
    inStock: true,
    imageTag: "D-lijn",
  },
  {
    id: "jura-10",
    name: "JURA ENA 4",
    category: "equipment",
    description: "Ultra-compact design voor kleine keukens, grote smaak.",
    price: 499.00,
    series: "E-lijn",
    priceRange: "Instap",
    specs: ["15 bar", "4 dranken"],
    inStock: true,
    imageTag: "E-lijn",
  },
  {
    id: "jura-11",
    name: "JURA GIGA 10",
    category: "equipment",
    description: "Professionele machine voor kantoor en horeca met twee keramische maalwerken.",
    price: 3499.00,
    series: "Z-lijn",
    priceRange: "Premium",
    specs: ["15 bar", "35 dranken", "2 Maalwerken"],
    premiumTag: true,
    inStock: true,
    imageTag: "Z-lijn",
  },

  // ── GIFTS & SETS (~6 products) ──
  {
    id: "gift-01",
    name: "Kruze Koffie Proefpakket",
    category: "gifts",
    description: "Ontdek onze 4 populairste single origins in een stijlvolle geschenkverpakking.",
    price: 29.90,
    contents: ["Ethiopie Yirgacheffe 100g", "Colombia Huila 100g", "Kenya AA 100g", "Brazilie Santos 100g"],
    inStock: true,
    featured: true,
    imageTag: "Cadeau",
  },
  {
    id: "gift-02",
    name: "Kruze Thee Ontdekkingsreis",
    category: "gifts",
    description: "Vijf premium thees uit Japan, China en India. Perfect cadeau voor theeliefhebbers.",
    price: 34.50,
    contents: ["Sencha 30g", "Dragon Well 30g", "Darjeeling 30g", "Da Hong Pao 30g", "Pai Mu Tan 30g"],
    inStock: true,
    imageTag: "Cadeau",
  },
  {
    id: "gift-03",
    name: "Koffie & Chocolade Geschenkdoos",
    category: "gifts",
    description: "Onze huisblend gecombineerd met ambachtelijke Belgische chocolade.",
    price: 24.90,
    contents: ["Kruze Huisblend 250g", "Belgische pralines 200g"],
    inStock: true,
    imageTag: "Cadeau",
  },
  {
    id: "gift-04",
    name: "Barista Starterskit",
    category: "gifts",
    description: "Alles wat je nodig hebt om thuis barista-kwaliteit koffie te zetten.",
    price: 49.90,
    contents: ["Kruze Espresso Blend 250g", "Handmatige grinder", "Tamper", "Barista doek"],
    inStock: true,
    imageTag: "Cadeau",
  },
  {
    id: "gift-05",
    name: "Seizoensgeschenk Winter",
    category: "gifts",
    description: "Verwarmende winterthee en koffieselectie in luxe geschenkverpakking.",
    price: 39.90,
    contents: ["Gember Kurkuma 50g", "Rwanda Nyamasheke 250g", "Kaneel sticks", "Kruze koffiemok"],
    inStock: true,
    seasonal: true,
    imageTag: "Cadeau",
  },
  {
    id: "gift-06",
    name: "Kruze Cadeaubon",
    category: "gifts",
    description: "Laat je geliefde zelf kiezen. Beschikbaar in waarden van \u20ac25, \u20ac50 en \u20ac100.",
    price: 25.00,
    inStock: true,
    imageTag: "Cadeau",
  },
];

export function getProductsByCategory(category: WebshopCategory): WebshopProduct[] {
  return webshopProducts.filter((p) => p.category === category);
}

export function getCoffeeProducts(): CoffeeProduct[] {
  return webshopProducts.filter((p): p is CoffeeProduct => p.category === "coffee");
}

export function getTeaProducts(): TeaProduct[] {
  return webshopProducts.filter((p): p is TeaProduct => p.category === "tea");
}

export function getEquipmentProducts(): EquipmentProduct[] {
  return webshopProducts.filter((p): p is EquipmentProduct => p.category === "equipment");
}

export function getGiftProducts(): GiftProduct[] {
  return webshopProducts.filter((p): p is GiftProduct => p.category === "gifts");
}
