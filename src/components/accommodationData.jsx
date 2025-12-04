// Données des emplacements
export const emplacementCategories = {
  "6A": [
    87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177,
    226, 227, 228, 229, 230, 231,
    239,
    244, 245,
    256, 257, 258, 259,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
  ],
  "10A": [183, 184, 185, 186, 218, 219, 220, 221, 222, 223],
  "Eau + 10A": [
    117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138
  ]
};

// Données des logements avec leurs numéros
export const logementCategories = {
  "Chalet Éco": [301, 302, 303, 304, 305],
  "Chalet Classique": [310, 311, 312, 313, 314, 315],
  "Mobil-home Éco": [401, 402, 403, 404, 405, 406, 407, 408],
  "Mobil-home Classique": [410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420],
  "Mobil-home Clim": [430, 431, 432, 433, 434, 435],
  "Confort+": [450, 451, 452, 453, 454, 455, 456],
  "Premium": [501, 502, 503, 504, 505],
  "Premium 3ch": [510, 511, 512, 513],
  "Premium Twins": [520, 521, 522],
  "Cottage Premium": [530, 531, 532, 533, 534]
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