
// Données exactes des hébergements du Camping Paradis - Domaine de Gaujac

export const emplacements = {
  "Emplacement 6A": [
    ...Array.from({ length: 24 }, (_, i) => String(i + 1)),
    ...Array.from({ length: 13 }, (_, i) => String(87 + i)), // 87-99
    ...Array.from({ length: 17 }, (_, i) => String(161 + i)), // 161-177
    ...Array.from({ length: 6 }, (_, i) => String(226 + i)), // 226-231
    "239",
    "244", "245",
    "256", "257", "258", "259"
  ],
  "Emplacement 10A": [
    "183", "184", "185", "186",
    "218", "219", "220", "221", "222", "223"
  ],
  "Emplacement Eau+10A": [
    ...Array.from({ length: 22 }, (_, i) => String(117 + i)) // 117-138
  ]
};

export const logements = {
  "Chalet Eco": ["C1", "C2", "C3", "C4", "C5", "C6"],
  "Chalet Classique": ["A1", "A2", "A3", "A4"],
  "Mobil-home Eco": [
    "H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08",
    "H09", "H10", "H11", "H12", "H13", "H14", "H15", "H16"
  ],
  "Mobil-home Eco Clim": ["OO1", "OO2", "OO3", "OO4", "OO5", "OO6"],
  "Mobil-home Classique": [
    "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10",
    "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20", "D21"
  ],
  "Mobil-home Classique Clim": [
    "V01", "V02", "V03", "V04", "V05", "V06", "V07", "V08", "V09", "V10",
    "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20", "V21", "V22"
  ],
  "Mobil-home Classique 3ch": ["L1", "L2", "L3", "L4", "L5", "L6"],
  "Confort+ 2ch": [
    "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12"
  ],
  "Confort+ 3ch": ["T01", "T02", "T03", "T04", "T05", "T06"],
  "Premium 2ch": [
    "R1", "R2", "R3", "R6", "R7", "R8", "R9", "R10", "R13", "R14", "R15", "R16", "R17", "R18"
  ],
  "Premium 3ch": [
    "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12", "M13", "M14"
  ],
  "Premium Twins": ["R11/R04", "R12/R05"],
  "Cottage Premium": ["J1", "J2", "J3", "J4", "J5"]
};

// Sous-catégories de problèmes
export const problemCategories = {
  technique: [
    { id: "gaz", icon: "Flame", urgentDefault: true, canUncheck: true },
    { id: "electricite", icon: "Zap", urgentDefault: true, canUncheck: true },
    { id: "eau_plomberie", icon: "Droplets", urgentDefault: true, canUncheck: true },
    { id: "immobilier", icon: "Home", urgentDefault: false, canUncheck: true },
    { id: "clim", icon: "Wind", urgentDefault: false, canUncheck: true },
    { id: "tv", icon: "Tv", urgentDefault: false, canUncheck: true },
    { id: "frigo", icon: "Refrigerator", urgentDefault: false, canUncheck: true },
    { id: "autres", icon: "Wrench", urgentDefault: false, canUncheck: true }
  ],
  nuisibles: [
    { id: "souris", icon: "Mouse", emoji: "🐭", urgentDefault: false, canUncheck: true },
    { id: "guepes", icon: "Bug", emoji: "🐝", urgentDefault: true, canUncheck: false },
    { id: "frelons", icon: "Bug", emoji: "🦟", urgentDefault: true, canUncheck: false }
  ],
  menage: [
    { id: "literie", icon: "Bed", urgentDefault: false, canUncheck: true },
    { id: "vaisselle", icon: "UtensilsCrossed", urgentDefault: false, canUncheck: true },
    { id: "menage", icon: "Sparkles", urgentDefault: false, canUncheck: true },
    { id: "terrasse", icon: "TreePine", urgentDefault: false, canUncheck: true }
  ]
};

// Catégories urgentes qui cochent automatiquement l'urgence
export const urgentCategories = ['gaz', 'eau_plomberie', 'electricite', 'guepes', 'frelons'];
