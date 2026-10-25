export const SCENARIOS = [
  { id: 'doctor', title: 'La medic', desc: 'Programare și descrierea simptomelor.', level: 'A1', min: 5, icon: 'pulse', hue: 175,
    starters: [['Ich möchte einen Termin machen.', 'Aș vrea să fac o programare.'], ['Ich habe Kopfschmerzen.', 'Mă doare capul.'], ['Seit wann haben Sie das?', 'De când aveți asta?']] },
  { id: 'authority', title: 'La primărie / Amt', desc: 'Înregistrare, acte și întrebări la birou.', level: 'A2', min: 8, icon: 'building', hue: 265,
    starters: [['Ich möchte mich anmelden.', 'Vreau să mă înregistrez.'], ['Welche Unterlagen brauche ich?', 'Ce documente am nevoie?'], ['Können Sie das bitte wiederholen?', 'Puteți repeta, vă rog?']] },
  { id: 'apartment', title: 'Căutare apartament', desc: 'Vizionare, chirie, garanție și cheltuieli.', level: 'A2', min: 8, icon: 'key', hue: 30,
    starters: [['Wie hoch ist die Miete?', 'Cât este chiria?'], ['Sind die Nebenkosten inklusive?', 'Sunt incluse cheltuielile?'], ['Wann kann ich einziehen?', 'Când pot să mă mut?']] },
  { id: 'work', title: 'La muncă', desc: 'Program, sarcini și probleme la locul de muncă.', level: 'A2', min: 6, icon: 'briefcase', hue: 215,
    starters: [['Wann beginnt meine Schicht?', 'Când începe tura mea?'], ['Ich habe eine Frage zur Aufgabe.', 'Am o întrebare despre sarcină.'], ['Ich bin heute krank.', 'Sunt bolnav azi.']] },
  { id: 'shopping', title: 'La cumpărături', desc: 'Prețuri, schimb și reclamații în magazin.', level: 'A1', min: 5, icon: 'bag', hue: 340,
    starters: [['Was kostet das?', 'Cât costă asta?'], ['Ich möchte das umtauschen.', 'Vreau să schimb asta.'], ['Haben Sie das in einer anderen Größe?', 'Aveți asta într-o altă mărime?']] },
  { id: 'smalltalk', title: 'Vorbă lejeră', desc: 'Discuții cu vecinii și colegii.', level: 'B1', min: 5, icon: 'chat', hue: 120,
    starters: [['Wie geht es Ihnen?', 'Ce mai faceți?'], ['Das Wetter ist heute schön.', 'Vremea e frumoasă azi.'], ['Woher kommen Sie?', 'De unde sunteți?']] },
];
export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id);
