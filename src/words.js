// Everyday word packs: [German with article, Romanian]. Nouns carry der/die/das.
export const PACKS = [
  { id: 'health', t: ['Gesundheit', 'Sănătate'], icon: 'pulse', hue: 175, words: [
    ['der Termin', 'programarea'], ['die Praxis', 'cabinetul medical'], ['das Rezept', 'rețeta'], ['die Tablette', 'pastila'],
    ['die Versicherung', 'asigurarea'], ['das Fieber', 'febra'], ['der Schmerz', 'durerea'], ['der Husten', 'tusea'],
    ['die Allergie', 'alergia'], ['das Medikament', 'medicamentul'], ['die Überweisung', 'trimiterea la specialist'], ['krank', 'bolnav'] ] },
  { id: 'office', t: ['Amt & Papiere', 'Acte & birouri'], icon: 'building', hue: 265, words: [
    ['das Formular', 'formularul'], ['die Anmeldung', 'înregistrarea'], ['der Ausweis', 'cartea de identitate'], ['der Pass', 'pașaportul'],
    ['die Bescheinigung', 'adeverința'], ['der Antrag', 'cererea'], ['die Unterschrift', 'semnătura'], ['die Frist', 'termenul limită'],
    ['die Gebühr', 'taxa'], ['der Wohnsitz', 'domiciliul'], ['die Steuer', 'impozitul'], ['die Genehmigung', 'aprobarea'] ] },
  { id: 'home', t: ['Wohnen', 'Locuință'], icon: 'key', hue: 30, words: [
    ['die Miete', 'chiria'], ['die Kaution', 'garanția'], ['die Nebenkosten', 'cheltuielile suplimentare'], ['der Vermieter', 'proprietarul'],
    ['der Mietvertrag', 'contractul de închiriere'], ['der Schlüssel', 'cheia'], ['das Zimmer', 'camera'], ['die Küche', 'bucătăria'],
    ['das Badezimmer', 'baia'], ['der Strom', 'curentul electric'], ['die Heizung', 'încălzirea'], ['der Nachbar', 'vecinul'] ] },
  { id: 'work', t: ['Arbeit', 'Muncă'], icon: 'briefcase', hue: 215, words: [
    ['der Chef', 'șeful'], ['der Kollege', 'colegul'], ['die Schicht', 'tura'], ['der Vertrag', 'contractul'],
    ['das Gehalt', 'salariul'], ['der Urlaub', 'concediul'], ['die Kündigung', 'rezilierea contractului'], ['die Besprechung', 'ședința'],
    ['die Überstunden', 'orele suplimentare'], ['die Bewerbung', 'candidatura'], ['der Lebenslauf', 'CV-ul'], ['die Krankmeldung', 'adeverința de boală'] ] },
  { id: 'shop', t: ['Einkaufen', 'Cumpărături'], icon: 'bag', hue: 340, words: [
    ['der Preis', 'prețul'], ['die Kasse', 'casa'], ['der Kassenbon', 'bonul'], ['die Tüte', 'punga'],
    ['das Angebot', 'oferta'], ['die Größe', 'mărimea'], ['der Rabatt', 'reducerea'], ['bar', 'numerar'],
    ['die Karte', 'cardul'], ['umtauschen', 'a schimba'], ['das Pfand', 'garanția pentru ambalaj'], ['die Packung', 'pachetul'] ] },
  { id: 'food', t: ['Essen & Trinken', 'Mâncare & băutură'], icon: 'chat', hue: 55, words: [
    ['das Frühstück', 'micul dejun'], ['das Mittagessen', 'prânzul'], ['das Abendessen', 'cina'], ['die Speisekarte', 'meniul'],
    ['die Rechnung', 'nota de plată'], ['das Wasser', 'apa'], ['das Brot', 'pâinea'], ['das Fleisch', 'carnea'],
    ['das Gemüse', 'legumele'], ['das Obst', 'fructele'], ['die Milch', 'laptele'], ['der Kaffee', 'cafeaua'] ] },
  { id: 'travel', t: ['Unterwegs', 'În deplasare'], icon: 'swap', hue: 195, words: [
    ['der Bahnhof', 'gara'], ['die Haltestelle', 'stația'], ['die Fahrkarte', 'biletul'], ['der Zug', 'trenul'],
    ['der Bus', 'autobuzul'], ['die Verspätung', 'întârzierea'], ['das Gleis', 'peronul'], ['die Ampel', 'semaforul'],
    ['die Straße', 'strada'], ['der Führerschein', 'permisul de conducere'], ['die Tankstelle', 'benzinăria'], ['die Kreuzung', 'intersecția'] ] },
  { id: 'daily', t: ['Alltag', 'Viața de zi cu zi'], icon: 'home', hue: 120, words: [
    ['die Zeit', 'timpul'], ['die Woche', 'săptămâna'], ['das Wetter', 'vremea'], ['die Familie', 'familia'],
    ['das Handy', 'telefonul mobil'], ['die Nachricht', 'mesajul'], ['die Hilfe', 'ajutorul'], ['das Problem', 'problema'],
    ['die Frage', 'întrebarea'], ['die Antwort', 'răspunsul'], ['das Geld', 'banii'], ['das Paket', 'coletul'] ] },
];
export const packById = (id) => PACKS.find((p) => p.id === id);
