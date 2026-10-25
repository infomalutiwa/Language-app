// Everyday word packs. Each line is "German|Română"; nouns carry der/die/das.
// pack: [id, German title, Romanian title, icon, hue, level, lines]
const RAW = [
  ['greet', 'Begrüßung & Höflichkeit', 'Salutări & politețe', 'chat', 150, 'A1', `
Guten Morgen|Bună dimineața
Guten Tag|Bună ziua
Guten Abend|Bună seara
Gute Nacht|Noapte bună
Hallo|Salut
Tschüss|Pa
Auf Wiedersehen|La revedere
Bitte|Vă rog / Poftiți
Danke|Mulțumesc
Entschuldigung|Scuzați-mă
Es tut mir leid|Îmi pare rău
Kein Problem|Nicio problemă
Gern geschehen|Cu plăcere
Wie geht's?|Ce mai faci?
Gut, danke|Bine, mulțumesc
Freut mich|Mă bucur să vă cunosc
Viel Glück|Mult noroc
Alles Gute|Toate cele bune
Gute Besserung|Însănătoșire grabnică
Herzlichen Glückwunsch|Felicitări
Wie bitte?|Poftim?
Ich verstehe nicht|Nu înțeleg
Können Sie das wiederholen?|Puteți repeta?
Langsamer, bitte|Mai rar, vă rog`],
  ['numbers', 'Zahlen & Geld', 'Numere & bani', 'grid', 200, 'A1', `
eins|unu
zwei|doi
drei|trei
vier|patru
fünf|cinci
sechs|șase
sieben|șapte
acht|opt
neun|nouă
zehn|zece
zwanzig|douăzeci
hundert|o sută
tausend|o mie
der Euro|euro
der Cent|centul
die Zahl|numărul
die Summe|suma
der Betrag|suma de plată
das Wechselgeld|restul
die Münze|moneda
der Schein|bancnota
bar|numerar
zusammen|împreună
die Hälfte|jumătatea`],
  ['time', 'Zeit & Datum', 'Timp & dată', 'refresh', 45, 'A1', `
die Stunde|ora
die Minute|minutul
der Tag|ziua
die Woche|săptămâna
der Monat|luna
das Jahr|anul
heute|astăzi
morgen|mâine
gestern|ieri
jetzt|acum
früh|devreme
spät|târziu
der Morgen|dimineața
der Mittag|amiaza
der Abend|seara
die Nacht|noaptea
das Wochenende|weekendul
der Feiertag|sărbătoarea legală
pünktlich|punctual
oft|des
selten|rar
immer|mereu
nie|niciodată
manchmal|uneori`],
  ['calendar', 'Wochentage & Monate', 'Zilele săptămânii & lunile', 'refresh', 25, 'A1', `
Montag|luni
Dienstag|marți
Mittwoch|miercuri
Donnerstag|joi
Freitag|vineri
Samstag|sâmbătă
Sonntag|duminică
Januar|ianuarie
Februar|februarie
März|martie
April|aprilie
Mai|mai
Juni|iunie
Juli|iulie
August|august
September|septembrie
Oktober|octombrie
November|noiembrie
Dezember|decembrie
der Frühling|primăvara
der Sommer|vara
der Herbst|toamna
der Winter|iarna`],
  ['family', 'Familie & Freunde', 'Familie & prieteni', 'chat', 340, 'A1', `
die Mutter|mama
der Vater|tata
die Eltern|părinții
der Bruder|fratele
die Schwester|sora
der Sohn|fiul
die Tochter|fiica
das Kind|copilul
die Großmutter|bunica
der Großvater|bunicul
der Onkel|unchiul
die Tante|mătușa
der Cousin|vărul
die Cousine|vara
der Ehemann|soțul
die Ehefrau|soția
der Freund|prietenul
die Freundin|prietena
der Partner|partenerul
die Familie|familia
das Baby|bebelușul
der Enkel|nepotul
die Schwiegermutter|soacra`],
  ['body', 'Körper', 'Corpul', 'pulse', 10, 'A1', `
der Kopf|capul
das Gesicht|fața
das Auge|ochiul
das Ohr|urechea
die Nase|nasul
der Mund|gura
der Zahn|dintele
der Hals|gâtul
die Schulter|umărul
der Arm|brațul
die Hand|mâna
der Finger|degetul
der Rücken|spatele
der Bauch|burta
das Bein|piciorul
der Fuß|laba piciorului
das Knie|genunchiul
das Herz|inima
die Haut|pielea
das Haar|părul
der Magen|stomacul
die Lunge|plămânul
der Knochen|osul`],
  ['adjectives', 'Farben & Eigenschaften', 'Culori & însușiri', 'globe', 285, 'A1', `
rot|roșu
blau|albastru
grün|verde
gelb|galben
schwarz|negru
weiß|alb
grau|gri
braun|maro
groß|mare
klein|mic
lang|lung
kurz|scurt
neu|nou
alt|vechi
gut|bun
schlecht|rău
schön|frumos
teuer|scump
billig|ieftin
schnell|repede
langsam|încet
heiß|fierbinte
kalt|rece
warm|cald
leicht|ușor
schwer|greu`],
  ['opposites', 'Gegensätze', 'Contrare', 'swap', 170, 'A2', `
hell|luminos
dunkel|întunecat
offen|deschis
nah|aproape
hoch|înalt
niedrig|jos
tief|adânc
breit|lat
schmal|îngust
dick|gros
dünn|subțire
voll|plin
leer|gol
sauber|curat
schmutzig|murdar
nass|ud
trocken|uscat
richtig|corect
falsch|greșit
einfach|simplu
schwierig|dificil
wichtig|important
möglich|posibil
unmöglich|imposibil
bereit|gata
sicher|sigur
wahr|adevărat
jung|tânăr`],
  ['verbs1', 'Alltagsverben 1', 'Verbe de zi cu zi 1', 'play', 100, 'A1', `
gehen|a merge
kommen|a veni
machen|a face
haben|a avea
sein|a fi
wollen|a vrea
können|a putea
müssen|a trebui
sagen|a spune
fragen|a întreba
antworten|a răspunde
geben|a da
nehmen|a lua
brauchen|a avea nevoie
suchen|a căuta
finden|a găsi
warten|a aștepta
bleiben|a rămâne
wohnen|a locui
arbeiten|a lucra
lernen|a învăța
verstehen|a înțelege
sprechen|a vorbi
kaufen|a cumpăra
bezahlen|a plăti
öffnen|a deschide
schließen|a închide
anrufen|a suna`],
  ['verbs2', 'Alltagsverben 2', 'Verbe de zi cu zi 2', 'play', 120, 'A2', `
helfen|a ajuta
bringen|a aduce
schicken|a trimite
bekommen|a primi
zeigen|a arăta
erklären|a explica
wiederholen|a repeta
vergessen|a uita
sich erinnern|a-și aminti
denken|a gândi
glauben|a crede
wissen|a ști
kennen|a cunoaște
mögen|a-i plăcea
lieben|a iubi
benutzen|a folosi
anfangen|a începe
aufhören|a înceta
ändern|a schimba
wählen|a alege
entscheiden|a decide
vorbereiten|a pregăti
bestellen|a comanda
reservieren|a rezerva
abholen|a ridica
ausfüllen|a completa
unterschreiben|a semna
einladen|a invita`],
  ['connectors', 'Fragewörter & kleine Wörter', 'Întrebări & cuvinte mici', 'chat', 230, 'A1', `
wer|cine
was|ce
wo|unde
wohin|încotro
woher|de unde
wann|când
warum|de ce
wie|cum
wie viel|cât
welche|care
und|și
oder|sau
aber|dar
weil|pentru că
wenn|dacă
dass|că
auch|de asemenea
nur|doar
sehr|foarte
viel|mult
wenig|puțin
schon|deja
noch|încă
vielleicht|poate
natürlich|desigur
leider|din păcate
ohne|fără
mit|cu
für|pentru`],
  ['town', 'In der Stadt', 'În oraș', 'building', 215, 'A1', `
die Stadt|orașul
das Dorf|satul
der Platz|piața
die Ecke|colțul
links|stânga
rechts|dreapta
geradeaus|drept înainte
hier|aici
dort|acolo
in der Nähe|în apropiere
weit|departe
die Brücke|podul
der Park|parcul
die Kirche|biserica
die Bank|banca
die Post|poșta
die Apotheke|farmacia
das Krankenhaus|spitalul
die Schule|școala
die Bibliothek|biblioteca
das Rathaus|primăria
die Polizei|poliția
das Kino|cinematograful
das Schwimmbad|piscina
der Supermarkt|supermarketul
die Bäckerei|brutăria
die Toilette|toaleta
der Eingang|intrarea
der Ausgang|ieșirea`],
  ['health', 'Arzt & Praxis', 'Medic & cabinet', 'pulse', 175, 'A1', `
der Termin|programarea
die Praxis|cabinetul medical
das Rezept|rețeta
die Tablette|pastila
die Versicherung|asigurarea
das Fieber|febra
der Schmerz|durerea
der Husten|tusea
die Allergie|alergia
das Medikament|medicamentul
die Überweisung|trimiterea la specialist
krank|bolnav
der Arzt|medicul
die Ärztin|doctorița
der Zahnarzt|stomatologul
die Krankenschwester|asistenta medicală
die Notaufnahme|urgențele
der Krankenwagen|ambulanța
die Krankheit|boala
die Erkältung|răceala
die Grippe|gripa
die Übelkeit|greața
der Durchfall|diareea
die Wunde|rana
das Pflaster|plasturele
der Verband|bandajul
die Spritze|injecția
die Impfung|vaccinarea
das Blut|sângele
die Untersuchung|consultația
das Röntgenbild|radiografia
die Salbe|unguentul
schwanger|însărcinată
müde|obosit
schwindelig|amețit`],
  ['fitness', 'Gesundheit & Fitness', 'Sănătate & fitness', 'pulse', 140, 'A2', `
die Ernährung|alimentația
gesund|sănătos
ungesund|nesănătos
die Diät|dieta
abnehmen|a slăbi
zunehmen|a se îngrășa
der Schlaf|somnul
schlafen|a dormi
aufstehen|a se ridica din pat
duschen|a face duș
sich waschen|a se spăla
sich anziehen|a se îmbrăca
sich entspannen|a se relaxa
der Stress|stresul
die Gesundheit|sănătatea
das Vitamin|vitamina
die Bewegung|mișcarea
rauchen|a fuma
der Alkohol|alcoolul
die Erholung|odihna`],
  ['emergency', 'Notfall & Sicherheit', 'Urgențe & siguranță', 'pulse', 5, 'A2', `
Hilfe!|Ajutor!
die Feuerwehr|pompierii
der Notarzt|medicul de urgență
der Brand|incendiul
der Einbruch|spargerea
der Diebstahl|furtul
der Überfall|atacul
gestohlen|furat
verloren|pierdut
das Fundbüro|biroul de obiecte pierdute
die Anzeige|plângerea penală
der Zeuge|martorul
gefährlich|periculos
Achtung!|Atenție!
der Rettungsdienst|serviciul de salvare
die Erste Hilfe|primul ajutor
verletzt|rănit
bewusstlos|inconștient
Ich brauche Hilfe|Am nevoie de ajutor
Rufen Sie einen Krankenwagen|Chemați o ambulanță
Wo ist das nächste Krankenhaus?|Unde este cel mai apropiat spital?`],
  ['office', 'Amt & Papiere', 'Acte & birouri', 'building', 265, 'A2', `
das Formular|formularul
die Anmeldung|înregistrarea
der Ausweis|cartea de identitate
der Pass|pașaportul
die Bescheinigung|adeverința
der Antrag|cererea
die Unterschrift|semnătura
die Frist|termenul limită
die Gebühr|taxa
der Wohnsitz|domiciliul
die Steuer|impozitul
die Genehmigung|aprobarea
die Kopie|copia
das Original|originalul
die Geburtsurkunde|certificatul de naștere
die Heiratsurkunde|certificatul de căsătorie
die Wartenummer|numărul de ordine
der Bescheid|decizia scrisă
der Widerspruch|contestația
die Vollmacht|procura
beglaubigt|legalizat
der Dolmetscher|interpretul
der Übersetzer|traducătorul`],
  ['arrive', 'Ankommen in Deutschland', 'Sosirea în Germania', 'building', 255, 'A2', `
das Bürgeramt|oficiul de evidență a populației
die Meldebescheinigung|certificatul de înregistrare
die Steuer-ID|codul fiscal personal
das Jobcenter|Jobcenter
die Arbeitsagentur|agenția pentru ocuparea forței de muncă
das Arbeitslosengeld|ajutorul de șomaj
das Bürgergeld|venitul cetățenesc
das Wohngeld|alocația pentru locuință
die Staatsangehörigkeit|cetățenia
der Wohnort|localitatea de reședință
das Geburtsdatum|data nașterii
der Familienstand|starea civilă
ledig|necăsătorit
verheiratet|căsătorit
geschieden|divorțat
die Aufenthaltserlaubnis|permisul de ședere
die Arbeitserlaubnis|permisul de muncă
die Krankenkasse|casa de asigurări de sănătate
die Sozialversicherung|asigurarea socială
der Integrationskurs|cursul de integrare`],
  ['home', 'Wohnen', 'Locuință', 'key', 30, 'A2', `
die Miete|chiria
die Kaution|garanția
die Nebenkosten|cheltuielile suplimentare
der Vermieter|proprietarul
der Mietvertrag|contractul de închiriere
der Schlüssel|cheia
das Zimmer|camera
die Küche|bucătăria
das Badezimmer|baia
der Strom|curentul electric
die Heizung|încălzirea
der Nachbar|vecinul
der Mieter|chiriașul
der Umzug|mutarea
der Hausmeister|administratorul clădirii
die Hausordnung|regulamentul casei
die Ruhezeit|orele de liniște
die Mülltrennung|sortarea gunoiului
der Briefkasten|cutia poștală
die Klingel|soneria
der Aufzug|liftul
das Treppenhaus|casa scărilor
die Etage|etajul
das Erdgeschoss|parterul
möbliert|mobilat
die Warmmiete|chiria cu utilități
die Kaltmiete|chiria fără utilități
die Besichtigung|vizionarea
die Schlüsselübergabe|predarea cheilor
der Wasserschaden|avaria de apă
der Schimmel|mucegaiul
kaputt|stricat
reparieren|a repara`],
  ['rooms', 'Haus & Möbel', 'Casă & mobilă', 'home', 60, 'A1', `
das Haus|casa
die Wohnung|apartamentul
die Tür|ușa
das Fenster|fereastra
der Boden|podeaua
die Wand|peretele
die Decke|tavanul
das Dach|acoperișul
der Balkon|balconul
der Keller|pivnița
der Flur|holul
das Wohnzimmer|sufrageria
das Schlafzimmer|dormitorul
der Tisch|masa
der Stuhl|scaunul
das Bett|patul
der Schrank|dulapul
das Regal|raftul
das Sofa|canapeaua
die Lampe|lampa
der Teppich|covorul
der Spiegel|oglinda
die Waschmaschine|mașina de spălat
der Kühlschrank|frigiderul
der Herd|aragazul
der Ofen|cuptorul
die Dusche|dușul`],
  ['kitchen', 'Küche & Kochen', 'Bucătărie & gătit', 'home', 20, 'A1', `
der Teller|farfuria
die Tasse|cana
das Glas|paharul
die Gabel|furculița
das Messer|cuțitul
der Löffel|lingura
der Topf|oala
die Pfanne|tigaia
die Flasche|sticla
die Schüssel|castronul
kochen|a găti
braten|a prăji
backen|a coace
schneiden|a tăia
waschen|a spăla
abwaschen|a spăla vasele
das Salz|sarea
der Pfeffer|piperul
der Zucker|zahărul
das Öl|uleiul
die Butter|untul
das Mehl|făina
die Spülmaschine|mașina de spălat vase
der Müll|gunoiul
die Mülltonne|pubela`],
  ['cleaning', 'Putzen & Umwelt', 'Curățenie & mediu', 'refresh', 135, 'A2', `
die Umwelt|mediul
das Recycling|reciclarea
das Plastik|plasticul
das Papier|hârtia
der Biomüll|deșeurile biologice
der Restmüll|deșeurile reziduale
die Energie|energia
das Gas|gazul
die Sonnenenergie|energia solară
das Klima|clima
die Natur|natura
der Umweltschutz|protecția mediului
die Verschmutzung|poluarea
nachhaltig|sustenabil
die Reinigung|curățenia
putzen|a face curat
wischen|a șterge
fegen|a mătura
saugen|a aspira
aufräumen|a face ordine
der Besen|matura
der Eimer|găleata
der Lappen|cârpa
der Staubsauger|aspiratorul`],
  ['work', 'Arbeit', 'Muncă', 'briefcase', 215, 'A2', `
der Chef|șeful
der Kollege|colegul
die Schicht|tura
der Vertrag|contractul
das Gehalt|salariul
der Urlaub|concediul
die Kündigung|rezilierea contractului
die Besprechung|ședința
die Überstunden|orele suplimentare
die Bewerbung|candidatura
der Lebenslauf|CV-ul
die Krankmeldung|adeverința de boală
die Arbeitszeit|programul de lucru
die Stelle|postul
das Vorstellungsgespräch|interviul
die Probezeit|perioada de probă
der Arbeitsvertrag|contractul de muncă
die Lohnabrechnung|fluturașul de salariu
das Brutto|brutul
das Netto|netul
der Feierabend|sfârșitul programului
die Mittagspause|pauza de masă
das Büro|biroul
die Kündigungsfrist|termenul de preaviz
die Abmahnung|avertismentul
die Gewerkschaft|sindicatul
der Betriebsrat|consiliul de întreprindere`],
  ['jobs', 'Berufe', 'Meserii', 'briefcase', 195, 'A2', `
der Bauarbeiter|muncitorul în construcții
der Elektriker|electricianul
der Mechaniker|mecanicul
der Fahrer|șoferul
der Koch|bucătarul
der Verkäufer|vânzătorul
der Friseur|frizerul
der Pfleger|îngrijitorul
der Ingenieur|inginerul
der Programmierer|programatorul
der Polizist|polițistul
die Reinigungskraft|femeia de serviciu
der Handwerker|meseriașul
der Maler|zugravul
der Gärtner|grădinarul
der Landwirt|fermierul
der Lagerarbeiter|lucrătorul de depozit
der Anwalt|avocatul
der Buchhalter|contabilul
der Apotheker|farmacistul
der Beruf|profesia
die Ausbildung|formarea profesională
der Arbeitgeber|angajatorul
der Arbeitnehmer|angajatul
arbeitslos|șomer`],
  ['jobsite', 'Baustelle & Betrieb', 'Șantier & fabrică', 'briefcase', 35, 'B1', `
die Baustelle|șantierul
die Werkstatt|atelierul
die Fabrik|fabrica
das Lager|depozitul
die Sicherheit|siguranța
der Unfall|accidentul
die Schutzkleidung|echipamentul de protecție
der Helm|casca
die Maschine|mașina (utilajul)
das Gerüst|schela
der Zement|cimentul
der Beton|betonul
der Ziegel|cărămida
das Holz|lemnul
das Metall|metalul
die Lieferung|livrarea
die Palette|paletul
der Gabelstapler|stivuitorul
die Inventur|inventarul
die Qualität|calitatea`],
  ['shop', 'Einkaufen', 'Cumpărături', 'bag', 340, 'A1', `
der Preis|prețul
die Kasse|casa
der Kassenbon|bonul
die Tüte|punga
das Angebot|oferta
die Größe|mărimea
der Rabatt|reducerea
die Karte|cardul
umtauschen|a schimba
das Pfand|garanția pentru ambalaj
die Packung|pachetul
der Einkaufswagen|căruciorul
der Korb|coșul
die Theke|tejgheaua
die Pfandflasche|sticla returnabilă
frisch|proaspăt
abgelaufen|expirat
das Haltbarkeitsdatum|data de expirare
die Zutaten|ingredientele
das Gewicht|greutatea
das Kilo|kilogramul
das Gramm|gramul
der Liter|litrul
die Rückgabe|returnarea
die Garantie|garanția
die Reklamation|reclamația
der Umtausch|schimbul`],
  ['drugstore', 'Drogerie & Pflege', 'Drogherie & îngrijire', 'bag', 320, 'A1', `
die Seife|săpunul
das Shampoo|șamponul
die Zahnbürste|periuța de dinți
die Zahnpasta|pasta de dinți
das Toilettenpapier|hârtia igienică
das Waschmittel|detergentul
das Deodorant|deodorantul
die Creme|crema
das Parfüm|parfumul
die Rasierklinge|lama de ras
das Taschentuch|șervețelul
der Drogeriemarkt|drogheria
das Handtuch|prosopul
der Kamm|pieptenele
die Bürste|peria
die Sonnencreme|crema de protecție solară
das Desinfektionsmittel|dezinfectantul
die Watte|vata
die Windel|scutecul`],
  ['food', 'Essen & Mahlzeiten', 'Mâncare & mese', 'chat', 55, 'A1', `
das Frühstück|micul dejun
das Mittagessen|prânzul
das Abendessen|cina
die Speisekarte|meniul
die Rechnung|nota de plată
das Wasser|apa
das Brot|pâinea
das Fleisch|carnea
das Gemüse|legumele
das Obst|fructele
die Milch|laptele
der Kaffee|cafeaua
der Tee|ceaiul
der Saft|sucul
das Bier|berea
der Wein|vinul
die Suppe|supa
der Kuchen|prăjitura`],
  ['grocery', 'Lebensmittel', 'Alimente', 'bag', 95, 'A1', `
der Apfel|mărul
die Banane|banana
die Orange|portocala
die Kartoffel|cartoful
die Tomate|roșia
die Zwiebel|ceapa
die Gurke|castravetele
die Karotte|morcovul
der Salat|salata
der Reis|orezul
die Nudeln|pastele
das Ei|oul
der Käse|brânza
das Hähnchen|puiul
der Fisch|peștele
die Wurst|cârnatul
der Schinken|șunca
der Joghurt|iaurtul
die Schokolade|ciocolata
der Knoblauch|usturoiul
der Pilz|ciuperca
die Paprika|ardeiul
die Erdbeere|căpșuna
die Traube|strugurele
die Zitrone|lămâia`],
  ['restaurant', 'Im Restaurant', 'La restaurant', 'chat', 15, 'A2', `
das Restaurant|restaurantul
der Kellner|chelnerul
die Bestellung|comanda
das Trinkgeld|bacșișul
Getrennt oder zusammen?|Separat sau împreună?
Ich hätte gern …|Aș dori…
Was empfehlen Sie?|Ce recomandați?
vegetarisch|vegetarian
scharf|picant
lecker|gustos
satt|sătul
hungrig|flămând
durstig|însetat
Einen Tisch für zwei|O masă pentru doi
die Vorspeise|aperitivul
das Hauptgericht|felul principal
der Nachtisch|desertul
Guten Appetit!|Poftă bună!
Zum Mitnehmen|La pachet
Die Rechnung, bitte|Nota, vă rog`],
  ['clothes', 'Kleidung', 'Haine', 'bag', 300, 'A1', `
das Hemd|cămașa
die Hose|pantalonii
die Jacke|geaca
der Mantel|paltonul
das Kleid|rochia
der Rock|fusta
der Pullover|puloverul
das T-Shirt|tricoul
die Socken|șosetele
der Schuh|pantoful
der Stiefel|cizma
die Mütze|căciula
der Schal|fularul
die Handschuhe|mănușile
der Gürtel|cureaua
die Unterwäsche|lenjeria intimă
der Regenschirm|umbrela
die Brille|ochelarii
die Tasche|geanta
der Rucksack|rucsacul
anziehen|a îmbrăca
ausziehen|a dezbrăca
anprobieren|a proba
passen|a se potrivi`],
  ['bank', 'Bank & Finanzen', 'Bancă & finanțe', 'building', 75, 'A2', `
das Konto|contul
die Bankkarte|cardul bancar
der Geldautomat|bancomatul
abheben|a retrage
einzahlen|a depune
das Bargeld|numerarul
der Kredit|creditul
die Schulden|datoriile
der Zins|dobânda
die IBAN|IBAN-ul
die PIN|codul PIN
der Lohn|salariul pe oră
die Rente|pensia
das Kindergeld|alocația pentru copii
die Kosten|costurile
sparen|a economisi
ausgeben|a cheltui
die Banküberweisung|transferul bancar
der Dauerauftrag|ordinul permanent de plată
die Lastschrift|debitarea directă
das Girokonto|contul curent`],
  ['phone', 'Telefon & Internet', 'Telefon & internet', 'mic', 205, 'A2', `
der Brief|scrisoarea
die Briefmarke|timbrul
die Adresse|adresa
die Postleitzahl|codul poștal
der Empfänger|destinatarul
der Absender|expeditorul
das Telefon|telefonul
die Telefonnummer|numărul de telefon
die E-Mail|e-mailul
das Internet|internetul
das WLAN|Wi-Fi-ul
das Passwort|parola
der Benutzername|numele de utilizator
der Bildschirm|ecranul
die Tastatur|tastatura
der Computer|calculatorul
der Drucker|imprimanta
die Datei|fișierul
der Anhang|atașamentul
herunterladen|a descărca
hochladen|a încărca
der Akku|bateria
das Ladekabel|cablul de încărcare
die SIM-Karte|cartela SIM
das Guthaben|creditul
der Tarif|tariful
der Anruf|apelul
die Sprachnachricht|mesajul vocal`],
  ['calling', 'Telefonieren & Termine', 'Convorbiri & programări', 'mic', 210, 'B1', `
Hallo, hier ist …|Alo, aici este…
Ich möchte … sprechen|Aș dori să vorbesc cu…
Einen Moment, ich verbinde Sie|Un moment, vă transfer
Er ist nicht da|Nu este aici
Möchten Sie eine Nachricht hinterlassen?|Doriți să lăsați un mesaj?
Ich rufe später zurück|Revin cu un apel mai târziu
Die Verbindung ist schlecht|Conexiunea este proastă
Können Sie lauter sprechen?|Puteți vorbi mai tare?
Ich buchstabiere|Vă spun literă cu literă
die Mailbox|căsuța vocală
erreichbar|disponibil
der Rückruf|apelul înapoi
einen Termin vereinbaren|a stabili o programare
absagen|a anula
verschieben|a amâna
bestätigen|a confirma
sich verspäten|a întârzia
Ich bin unterwegs|Sunt pe drum
Ich komme gleich|Vin imediat`],
  ['travel', 'Unterwegs', 'În deplasare', 'swap', 195, 'A1', `
der Bahnhof|gara
die Haltestelle|stația
die Fahrkarte|biletul
der Zug|trenul
der Bus|autobuzul
die Verspätung|întârzierea
das Gleis|peronul
die Ampel|semaforul
die Straße|strada
der Führerschein|permisul de conducere
die Tankstelle|benzinăria
die Kreuzung|intersecția
umsteigen|a schimba mijlocul de transport
einsteigen|a urca
aussteigen|a coborî
die Fahrkartenkontrolle|controlul biletelor
das Deutschlandticket|abonamentul Deutschlandticket
die U-Bahn|metroul
die Straßenbahn|tramvaiul
das Taxi|taxiul`],
  ['car', 'Auto & Fahrrad', 'Mașină & bicicletă', 'swap', 180, 'A2', `
das Auto|mașina
das Fahrrad|bicicleta
das Motorrad|motocicleta
der Parkplatz|locul de parcare
die Parkgebühr|taxa de parcare
der Stau|ambuteiajul
die Autobahn|autostrada
die Geschwindigkeit|viteza
die Geldstrafe|amenda
der Blitzer|radarul
das Benzin|benzina
der Diesel|motorina
der Reifen|anvelopa
die Panne|defecțiunea
der Abschleppdienst|serviciul de tractare
der TÜV|inspecția tehnică
das Kennzeichen|numărul de înmatriculare
die Autoversicherung|asigurarea auto
tanken|a alimenta
parken|a parca`],
  ['trip', 'Reisen & Urlaub', 'Călătorii & vacanță', 'globe', 190, 'A2', `
der Flughafen|aeroportul
der Flug|zborul
das Gepäck|bagajul
der Koffer|valiza
die Grenze|granița
der Zoll|vama
das Hotel|hotelul
die Übernachtung|cazarea pentru o noapte
die Buchung|rezervarea
das Ticket|biletul
die Reise|călătoria
die Landkarte|harta
der Strand|plaja
die Sehenswürdigkeit|obiectivul turistic
das Museum|muzeul
der Ausflug|excursia
der Stadtplan|harta orașului
die Touristeninformation|biroul de informații turistice
die Fahrt|drumul
die Abfahrt|plecarea
die Ankunft|sosirea`],
  ['weather', 'Wetter & Natur', 'Vreme & natură', 'globe', 205, 'A1', `
die Sonne|soarele
der Regen|ploaia
der Schnee|zăpada
der Wind|vântul
die Wolke|norul
das Gewitter|furtuna
der Nebel|ceața
die Temperatur|temperatura
das Eis|gheața
der Himmel|cerul
der Baum|copacul
die Blume|floarea
der Wald|pădurea
der Berg|muntele
der See|lacul
das Meer|marea
der Fluss|râul
die Luft|aerul
die Erde|pământul
das Tier|animalul
der Hund|câinele
die Katze|pisica
der Vogel|pasărea
regnen|a ploua
schneien|a ninge
das Wetter|vremea`],
  ['feelings', 'Gefühle & Charakter', 'Sentimente & caracter', 'chat', 330, 'A2', `
glücklich|fericit
traurig|trist
wütend|furios
ängstlich|speriat
nervös|nervos
ruhig|calm
zufrieden|mulțumit
enttäuscht|dezamăgit
stolz|mândru
eifersüchtig|gelos
einsam|singur
überrascht|surprins
gelangweilt|plictisit
verliebt|îndrăgostit
freundlich|prietenos
höflich|politicos
unhöflich|nepoliticos
ehrlich|sincer
fleißig|harnic
faul|leneș
neugierig|curios
geduldig|răbdător
mutig|curajos
schüchtern|timid
lustig|amuzant`],
  ['opinion', 'Meinung & Gespräch', 'Păreri & conversație', 'chat', 160, 'B1', `
Ich finde, dass …|Eu cred că…
Meiner Meinung nach|După părerea mea
Ich bin einverstanden|Sunt de acord
Ich bin nicht einverstanden|Nu sunt de acord
Das stimmt|Așa este
Das glaube ich nicht|Nu cred asta
Genau|Exact
Wirklich?|Serios?
Ich weiß nicht|Nu știu
Das ist mir egal|Mi-e totuna
Das kommt darauf an|Depinde
Können Sie mir helfen?|Mă puteți ajuta?
Wie sagt man … auf Deutsch?|Cum se spune … în germană?
Was bedeutet das?|Ce înseamnă asta?
Ich habe eine Frage|Am o întrebare
Moment, bitte|Un moment, vă rog
Das ist wichtig|Este important
Ich habe keine Zeit|Nu am timp
Ich komme aus Rumänien|Vin din România
Ich lerne Deutsch|Învăț germana
Sprechen Sie Englisch?|Vorbiți engleza?`],
  ['hobby', 'Freizeit & Hobbys', 'Timp liber & hobby-uri', 'play', 80, 'A1', `
das Hobby|hobby-ul
der Sport|sportul
der Fußball|fotbalul
schwimmen|a înota
laufen|a alerga
wandern|a face drumeții
tanzen|a dansa
singen|a cânta
die Musik|muzica
der Film|filmul
das Konzert|concertul
die Party|petrecerea
das Spiel|jocul
spielen|a juca
lesen|a citi
schreiben|a scrie
malen|a picta
fotografieren|a fotografa
das Fitnessstudio|sala de fitness
der Verein|clubul
die Mannschaft|echipa
das Training|antrenamentul
der Spaziergang|plimbarea
das Treffen|întâlnirea
die Einladung|invitația`],
  ['kids', 'Kinder & Schule', 'Copii & școală', 'home', 345, 'A2', `
der Kindergarten|grădinița
die Grundschule|școala primară
die Klasse|clasa
der Spielplatz|locul de joacă
das Spielzeug|jucăria
der Kinderarzt|pediatrul
die Kita|creșa
die Schulpflicht|obligativitatea școlară
das Elternteil|părintele
die Elternzeit|concediul parental
die Betreuung|îngrijirea
der Elternabend|ședința cu părinții
die Schultasche|ghiozdanul
die Klassenfahrt|excursia școlară
der Kinderwagen|cărucioarul
die Geburt|nașterea
der Geburtstag|ziua de naștere
das Zeugnis|carnetul/diploma
die Hausaufgabe|tema
der Lehrer|profesorul
die Lehrerin|profesoara
der Schüler|elevul`],
  ['learn', 'Lernen & Sprache', 'Învățare & limbă', 'book', 250, 'A1', `
die Sprache|limba
der Kurs|cursul
der Student|studentul
die Prüfung|examenul
die Note|nota
das Heft|caietul
der Stift|pixul
das Buch|cartea
das Wörterbuch|dicționarul
die Grammatik|gramatica
das Wort|cuvântul
der Satz|propoziția
die Aussprache|pronunția
der Fehler|greșeala
die Übung|exercițiul
die Pause|pauza
die Anerkennung|recunoașterea diplomei
der Abschluss|diploma de absolvire
die Niveaustufe|nivelul
die Universität|universitatea`],
  ['law', 'Versicherung & Recht', 'Asigurări & drept', 'building', 280, 'B1', `
die Haftpflichtversicherung|asigurarea de răspundere civilă
die Krankenversicherung|asigurarea de sănătate
die Rentenversicherung|asigurarea de pensie
die Arbeitslosenversicherung|asigurarea de șomaj
die Hausratversicherung|asigurarea bunurilor din locuință
der Versicherungsnachweis|dovada asigurării
der Schaden|paguba
die Laufzeit|durata contractului
das Gesetz|legea
das Recht|dreptul
die Pflicht|obligația
erlaubt|permis
verboten|interzis
die Strafe|pedeapsa
das Gericht|tribunalul
der Rechtsanwalt|avocatul
die Beratung|consilierea
die Datenschutzerklärung|politica de confidențialitate
die Zustimmung|acordul
die AGB|termenii și condițiile`],
  ['amounts', 'Mengen & Maße', 'Cantități & măsuri', 'grid', 220, 'A2', `
das Viertel|sfertul
ein Paar|o pereche
die Mehrheit|majoritatea
mehr|mai mult
weniger|mai puțin
genug|suficient
alle|toți
keine|niciunul
einige|câțiva
der Meter|metrul
der Kilometer|kilometrul
der Zentimeter|centimetrul
die Höhe|înălțimea
die Breite|lățimea
die Länge|lungimea
der Prozentsatz|procentul
der Durchschnitt|media
ungefähr|aproximativ
zu viel|prea mult
zu wenig|prea puțin`],
  ['media', 'Medien & Gesellschaft', 'Media & societate', 'globe', 240, 'B1', `
die Zeitung|ziarul
die Nachrichten|știrile
das Fernsehen|televiziunea
der Fernseher|televizorul
das Radio|radioul
die Werbung|publicitatea
die Sendung|emisiunea
der Artikel|articolul
die Überschrift|titlul
die Meinung|părerea
die Information|informația
das Gerücht|zvonul
die Wahl|alegerile
die Regierung|guvernul
der Bürgermeister|primarul
das Parlament|parlamentul
der Staat|statul
das Land|țara
die Gemeinde|comuna
das Bundesland|landul federal
die EU|UE
die Gesellschaft|societatea
die Kultur|cultura
die Tradition|tradiția
das Fest|sărbătoarea
Weihnachten|Crăciunul
Ostern|Paștele
Silvester|Revelionul`],
  ['signs', 'Schilder & Hinweise', 'Indicatoare & avertizări', 'search', 90, 'A2', `
geöffnet|deschis
geschlossen|închis
ziehen|trageți
drücken|împingeți
besetzt|ocupat
frei|liber
Rauchen verboten|Fumatul interzis
Eintritt frei|Intrare liberă
der Notausgang|ieșirea de urgență
außer Betrieb|în afara funcțiunii
die Öffnungszeiten|programul de funcționare
der Ruhetag|ziua liberă (închis)
die Umleitung|ocolirea
die Einbahnstraße|strada cu sens unic
das Halteverbot|oprire interzisă
das Parkverbot|parcare interzisă
Zutritt verboten|Acces interzis
Privat|Privat
Damen|Femei
Herren|Bărbați
das Wartezimmer|sala de așteptare
die Selbstbedienung|autoservirea`],
  ['tools', 'Werkzeug & Reparatur', 'Unelte & reparații', 'key', 50, 'B1', `
der Hammer|ciocanul
der Schraubenzieher|șurubelnița
die Zange|cleștele
die Säge|ferăstrăul
der Bohrer|burghiul
die Schraube|șurubul
der Nagel|cuiul
die Leiter|scara
das Werkzeug|uneltele
die Glühbirne|becul
die Steckdose|priza
das Kabel|cablul
die Sicherung|siguranța
der Wasserhahn|robinetul
das Rohr|țeava
undicht|care curge
verstopft|înfundat
die Farbe|vopseaua
der Pinsel|pensula
der Kleber|lipiciul
das Klebeband|banda adezivă`],
];

export const PACKS = RAW.map(([id, de, ro, icon, hue, level, lines]) => ({
  id, t: [de, ro], icon, hue, level,
  words: lines.trim().split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((w) => w.length === 2 && w[0] && w[1]),
}));
export const packById = (id) => PACKS.find((p) => p.id === id);
export const TOTAL_WORDS = new Set(PACKS.flatMap((p) => p.words.map(([de]) => de.toLowerCase()))).size;
