// t = title, d = description, as [Deutsch, Română]
export const SCENARIOS = [
  { id: 'tutor', t: ['Mit Lehrerin sprechen', 'Vorbește cu profesoara'], d: ['Freies Gespräch, Fragen, Aussprache.', 'Discuție liberă, întrebări, pronunție.'], level: 'A1', min: 10, icon: 'chat', hue: 150,
    starters: [['Wie sagt man das auf Deutsch?', 'Cum se spune asta în germană?'], ['Kannst du das bitte langsamer sagen?', 'Poți să spui asta mai rar?'], ['Was bedeutet das?', 'Ce înseamnă asta?']] },
  { id: 'doctor', t: ['Beim Arzt', 'La medic'], d: ['Termin machen, Beschwerden beschreiben.', 'Programare și descrierea simptomelor.'], level: 'A1', min: 5, icon: 'pulse', hue: 175,
    starters: [['Ich möchte einen Termin machen.', 'Aș vrea să fac o programare.'], ['Ich habe Kopfschmerzen.', 'Mă doare capul.'], ['Seit wann haben Sie das?', 'De când aveți asta?']] },
  { id: 'authority', t: ['Auf dem Amt', 'La primărie / Amt'], d: ['Anmeldung, Unterlagen, Fragen.', 'Înregistrare, acte și întrebări.'], level: 'A2', min: 8, icon: 'building', hue: 265,
    starters: [['Ich möchte mich anmelden.', 'Vreau să mă înregistrez.'], ['Welche Unterlagen brauche ich?', 'Ce documente am nevoie?'], ['Können Sie das bitte wiederholen?', 'Puteți repeta, vă rog?']] },
  { id: 'apartment', t: ['Wohnungssuche', 'Căutare apartament'], d: ['Besichtigung, Miete, Kaution, Nebenkosten.', 'Vizionare, chirie, garanție, cheltuieli.'], level: 'A2', min: 8, icon: 'key', hue: 30,
    starters: [['Wie hoch ist die Miete?', 'Cât este chiria?'], ['Sind die Nebenkosten inklusive?', 'Sunt incluse cheltuielile?'], ['Wann kann ich einziehen?', 'Când pot să mă mut?']] },
  { id: 'work', t: ['Bei der Arbeit', 'La muncă'], d: ['Schichtplan, Aufgaben, Probleme.', 'Program, sarcini și probleme.'], level: 'A2', min: 6, icon: 'briefcase', hue: 215,
    starters: [['Wann beginnt meine Schicht?', 'Când începe tura mea?'], ['Ich habe eine Frage zur Aufgabe.', 'Am o întrebare despre sarcină.'], ['Ich bin heute krank.', 'Sunt bolnav azi.']] },
  { id: 'shopping', t: ['Beim Einkaufen', 'La cumpărături'], d: ['Preise, Umtausch, Reklamation.', 'Prețuri, schimb și reclamații.'], level: 'A1', min: 5, icon: 'bag', hue: 340,
    starters: [['Was kostet das?', 'Cât costă asta?'], ['Ich möchte das umtauschen.', 'Vreau să schimb asta.'], ['Haben Sie das in einer anderen Größe?', 'Aveți asta într-o altă mărime?']] },
  { id: 'smalltalk', t: ['Small Talk', 'Vorbă lejeră'], d: ['Mit Nachbarn und Kollegen plaudern.', 'Discuții cu vecinii și colegii.'], level: 'B1', min: 5, icon: 'chat', hue: 120,
    starters: [['Wie geht es Ihnen?', 'Ce mai faceți?'], ['Das Wetter ist heute schön.', 'Vremea e frumoasă azi.'], ['Woher kommen Sie?', 'De unde sunteți?']] },
];
export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id);
