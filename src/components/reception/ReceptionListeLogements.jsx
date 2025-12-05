import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Dog, Calendar } from 'lucide-react';

export default function ReceptionListeLogements({ dossiers, onSelectDossier, lang = 'fr' }) {
  // Grouper par catégorie
  const categories = {
    'Premium': ['Premium 2ch', 'Premium 3ch', 'Premium Twins', 'Cottage Premium'],
    'Confort+': ['Confort+ 2ch', 'Confort+ 3ch'],
    'Classique': ['Mobil-home Classique', 'Mobil-home Classique Clim', 'Mobil-home Classique 3ch'],
    'Éco': ['Mobil-home Eco', 'Mobil-home Eco Clim'],
    'Chalet': ['Chalet Eco', 'Chalet Classique'],
    'Emplacement 6A': ['Emplacement 6A'],
    'Emplacement 10A': ['Emplacement 10A'],
    'Emplacement Eau+10A': ['Emplacement Eau+10A']
  };

  const dossiersParCategorie = {};
  Object.keys(categories).forEach(cat => {
    dossiersParCategorie[cat] = dossiers.filter(d => 
      categories[cat].includes(d.categorie_logement)
    );
  });

  const calculerDuree = (dateArrivee, dateDepart) => {
    const debut = new Date(dateArrivee);
    const fin = new Date(dateDepart);
    const diffTime = Math.abs(fin - debut);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formaterJourArrivee = (date) => {
    const d = new Date(date);
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const joursEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return lang === 'fr' ? jours[d.getDay()] : joursEn[d.getDay()];
  };

  return (
    <div className="space-y-4">
      {Object.entries(dossiersParCategorie).map(([categorie, dossiersCat]) => {
        if (dossiersCat.length === 0) return null;

        return (
          <div key={categorie}>
            <h3 className="font-heading text-lg text-[#0077A8] mb-2">
              {categorie}
            </h3>
            <div className="space-y-2">
              {dossiersCat.map(dossier => {
                const duree = calculerDuree(dossier.date_arrivee, dossier.date_depart);
                const jourArrivee = formaterJourArrivee(dossier.date_arrivee);
                const totalPersonnes = (dossier.nombre_adultes || 0) + (dossier.nombre_enfants || 0);

                return (
                  <button
                    key={dossier.id}
                    onClick={() => onSelectDossier(dossier)}
                    className="w-full focus:ring-4 focus:ring-[#FFD700] rounded-lg"
                  >
                    <Card className="border-2 border-gray-200 hover:border-[#00AEEF] hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-[#00AEEF]">
                              {dossier.numero_logement}
                            </div>
                            <div className="text-left">
                              <p className="font-heading text-gray-900">
                                {dossier.client_nom} {dossier.client_prenom}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {totalPersonnes} {lang === 'fr' ? 'pers' : 'ppl'}
                                  {dossier.nombre_adultes && dossier.nombre_enfants ? 
                                    ` (${dossier.nombre_adultes}A / ${dossier.nombre_enfants}E)` : ''}
                                </span>
                                {dossier.nombre_animaux > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Dog className="w-4 h-4" />
                                    {dossier.nombre_animaux}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {jourArrivee} • {duree}N
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              dossier.statut === 'finalise' ? 'bg-green-100 text-green-700' :
                              dossier.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {dossier.statut === 'finalise' ? '✔' : '⏳'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {Object.values(dossiersParCategorie).every(cat => cat.length === 0) && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              {lang === 'fr' ? 'Aucun dossier pour cette semaine' : 'No files for this week'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}