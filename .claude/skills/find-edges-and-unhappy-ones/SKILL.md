---
name: find-edges-and-unhappy-ones
description: Zoek naar edge cases en unhappy paths binnen een gegeven user journey
user-invocable: true
argument-hint: "[user journey, UC-NNN, story-ID of beschrijving van een situatie]"
allowed-tools: Read, Grep, Glob
agent: analyst
---

# Find edges and unhappy ones

Onderzoek de aangeboden situatie of user journey (`$ARGUMENTS`) systematisch op **edge cases** en **unhappy paths**. Het doel is alles boven water te krijgen wat mis kan gaan of afwijkt van het "gelukkige" scenario, zodat dit kan worden opgenomen in use cases, acceptatiecriteria, specs en tests.

Dit is een **onderzoeksskill**: rapporteer je bevindingen in de chat. Maak of wijzig GEEN bestanden, tenzij de gebruiker daar expliciet om vraagt.

## Begrippen

- **Happy path** — het verwachte scenario waarin alles goed gaat.
- **Unhappy path** — een scenario waarin de gebruiker of het systeem het doel niet (volledig) bereikt: fouten, weigeringen, annuleringen, time-outs, ongeldige invoer.
- **Edge case** — een scenario aan de grenzen van wat geldig is: minimum/maximum, leeg, exact op een grens, zeldzame combinaties, ongewone timing. Het kan goed aflopen, maar wordt vaak vergeten.

## Stap 0: Verzamel de context

1. Als `$ARGUMENTS` verwijst naar een UC-NNN, story-ID of SPEC-NNN: lees het document in `docs/use-cases/`, `docs/product/backlog/` of `docs/specs/`.
2. Als het een vrije beschrijving is: vat de journey samen in genummerde stappen (actor → actie → systeemreactie).
3. Zoek indien relevant de bestaande code op (routes, services, schema, componenten) om te zien welke regels en validaties al bestaan.
4. Lees `.claude/skills/_shared/references/use-case-30-principles.md` voor de manier waarop alternatieve flows worden beschreven.
5. Is de journey te vaag om te analyseren? Stel dan eerst maximaal 3 gerichte vragen in plaats van te gokken.

## Stap 1: Breng de happy path in kaart

Schrijf de basisflow uit als genummerde stappen. Benoem per stap:
- de **actor** (klant, barista, admin, systeem, externe dienst)
- de **invoer** en de **output**
- de **aannames** die stilzwijgend gelden ("de gebruiker is ingelogd", "het product is op voorraad")

Elke aanname is een kandidaat voor een unhappy path: wat als ze níet klopt?

## Stap 2: Loop elke stap langs met de checklijst

Ga per stap de onderstaande categorieën af. Sla een categorie alleen over als ze aantoonbaar niet van toepassing is.

### 1. Invoer en data
- Leeg, null, ontbrekend, alleen spaties
- Te lang, te kort, minimum, maximum, exact op de grens (0, 1, max, max+1)
- Negatieve getallen, decimalen, afronding, valuta
- Speciale tekens, emoji, andere talen, hoofdletter-gevoeligheid
- Verkeerd formaat (datum, e-mail, telefoon, BTW-nummer, postcode)
- Dubbele waarden (duplicaten)

### 2. Gebruikersgedrag
- Gebruiker annuleert halverwege, gaat terug, ververst de pagina
- Dubbel klikken / formulier twee keer verzenden
- Meerdere tabbladen of apparaten tegelijk
- Gebruiker verlaat de flow en komt later terug (sessie verlopen?)
- Gebruiker doet stappen in een onverwachte volgorde (deep link)

### 3. Rechten en identiteit
- Niet ingelogd, sessie verlopen, token ongeldig
- Verkeerde rol (klant vs. barista vs. admin)
- Toegang tot data van een andere gebruiker of vestiging
- Account geblokkeerd, verwijderd of nog niet geactiveerd

### 4. Status en levenscyclus
- Object bestaat niet (meer), is gearchiveerd of verwijderd
- Object is in een andere status dan verwacht (bestelling al betaald, geannuleerd, verzonden)
- Ongeldige statusovergangen
- Herhaalde actie (idempotentie): wat gebeurt bij een tweede keer?

### 5. Gelijktijdigheid en timing
- Twee gebruikers wijzigen hetzelfde tegelijk (race condition)
- Laatste item op voorraad wordt door twee klanten gekocht
- Prijs, promotie of openingsuren wijzigen tijdens de flow
- Tijdzones, middernacht, zomer-/wintertijd, feestdagen, schrikkeljaar
- Vervaldata en deadlines exact op de grens

### 6. Externe systemen en infrastructuur
- Externe dienst (betaling, auth, e-mail, verzending) is traag, onbereikbaar of geeft een fout
- Gedeeltelijk succes: betaling gelukt maar bestelling niet opgeslagen (of omgekeerd)
- Netwerk valt weg (vooral relevant voor POS en mobiel)
- Database niet beschikbaar, time-out, retry

### 7. Bedrijfsregels
- Combinaties van kortingen, minimumbedragen, maximale aantallen
- Uitzonderingen per kanaal (Storefront vs. POS vs. Admin)
- Regels die elkaar tegenspreken
- Wat als een regel niet van toepassing is (geen voorraadbeheer, gratis product)?

### 8. Volume en schaal
- Nul resultaten, één resultaat, heel veel resultaten (paginering)
- Zeer grote bestellingen of bestanden
- Piekbelasting

### 9. Toegankelijkheid en context
- Kleine schermen, trage verbinding, browser zonder JavaScript-ondersteuning
- Schermlezer, alleen toetsenbord
- Taal- en landinstellingen

## Stap 3: Beoordeel en prioriteer

Geef elke gevonden case een inschatting:
- **Kans**: Hoog / Middel / Laag
- **Impact**: Hoog (geld, data, veiligheid, juridisch) / Middel (frustratie, extra werk) / Laag (cosmetisch)
- **Prioriteit**: combineer kans en impact → **Must** / **Should** / **Could**

Wees eerlijk: markeer theoretische cases als Laag in plaats van ze op te blazen.

## Stap 4: Rapporteer

Gebruik het volgende formaat:

```markdown
## Edge cases & unhappy paths: [naam van de journey]

### Samenvatting
[2–3 zinnen: hoeveel cases gevonden, welke de grootste risico's zijn]

### Happy path (referentie)
1. ...
2. ...

### Bevindingen

| # | Stap | Categorie | Type | Scenario | Verwacht gedrag (voorstel) | Kans | Impact | Prio |
|---|------|-----------|------|----------|----------------------------|------|--------|------|
| 1 | 3 | Gelijktijdigheid | Unhappy | Twee klanten kopen tegelijk het laatste item | Tweede klant krijgt melding "niet meer op voorraad", betaling wordt niet uitgevoerd | Middel | Hoog | Must |
| 2 | 1 | Invoer | Edge | Aantal = 0 | Knop "Toevoegen" is uitgeschakeld | Hoog | Laag | Should |

### Open vragen
[Situaties waarvoor het gewenste gedrag niet uit de documentatie of code af te leiden is — deze moeten door de product owner beantwoord worden]

### Reeds afgedekt
[Cases die al expliciet in de UC, story, spec of code geregeld zijn, met verwijzing]

### Aanbevolen vervolgstappen
- Alternatieve flows toevoegen aan UC-NNN → `/extend-feature` of `/create-use-case`
- Acceptatiecriteria aanvullen → `/slice-stories` of `/review-stories`
- Testcases schrijven → `/generate-tests`
- Beveiligingsgerelateerde cases nakijken → `/security-audit`
```

## Regels

- **Maak geen bestanden aan** — rapporteer enkel, tenzij de gebruiker expliciet vraagt om resultaten op te slaan (dan in `docs/investigations/`).
- **Verzin geen gewenst gedrag als feit** — formuleer het als voorstel, of zet het onder "Open vragen".
- **Wees concreet** — "ongeldige invoer" is geen bevinding; "e-mailadres zonder @ in het registratieformulier" wel.
- **Koppel elke case aan een stap** in de happy path, zodat ze later als alternatieve flow (bv. `3a`) in een use case kan landen.
- **Geen dubbels** — groepeer varianten van hetzelfde probleem.
- **Focus op wat ertoe doet** — liever 15 relevante cases dan 60 triviale. Toon bij lange lijsten eerst de Must-cases.
