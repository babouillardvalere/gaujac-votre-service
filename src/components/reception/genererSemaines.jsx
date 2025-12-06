// Génère les semaines d'un mois donné (Samedi → Vendredi)
export function genererSemaines(annee, mois) {
  const semaines = [];
  const premierJour = new Date(annee, mois - 1, 1);
  const dernierJour = new Date(annee, mois, 0);

  // Trouver le premier samedi avant ou égal au premier jour du mois
  let debut = new Date(premierJour);
  while (debut.getDay() !== 6) { // 6 = Samedi
    debut.setDate(debut.getDate() - 1);
  }

  let numeroSemaine = 1;
  while (debut <= dernierJour) {
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 6); // Vendredi

    semaines.push({
      numero: numeroSemaine,
      debut: new Date(debut),
      fin: new Date(fin),
      label: `${debut.getDate()}/${debut.getMonth() + 1} → ${fin.getDate()}/${fin.getMonth() + 1}`
    });

    debut.setDate(debut.getDate() + 7);
    numeroSemaine++;
  }

  return semaines;
}

// Vérifie si une date est dans une semaine
export function dateEstDansSemaine(date, semaine) {
  const d = new Date(date);
  return d >= semaine.debut && d <= semaine.fin;
}

// Récupère les dossiers d'une semaine donnée
export function filtrerDossiersParSemaine(dossiers, semaine) {
  return dossiers.filter(dossier => {
    // Support multiple champs de date pour compatibilité
    const dateArrivee = new Date(dossier.date_arrivee || dossier.arrival_date);
    const dateDepart = new Date(dossier.date_depart || dossier.departure_date);
    
    // Vérifier que les dates sont valides
    if (isNaN(dateArrivee.getTime()) || isNaN(dateDepart.getTime())) {
      console.warn('Invalid dates for dossier:', dossier.id, dossier);
      return false;
    }
    
    // Normaliser les dates pour comparaison (enlever les heures)
    const debut = new Date(semaine.debut);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(semaine.fin);
    fin.setHours(23, 59, 59, 999);
    
    dateArrivee.setHours(0, 0, 0, 0);
    dateDepart.setHours(23, 59, 59, 999);
    
    // Le séjour chevauche la semaine si :
    // - l'arrivée est avant ou pendant la semaine ET le départ est après ou pendant la semaine
    return dateArrivee <= fin && dateDepart >= debut;
  });
}