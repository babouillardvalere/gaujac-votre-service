import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { CATEGORIES_INVENTAIRE, getLabelObjet } from './InventaireCategoriesReferentiel';

/**
 * COMPOSANT DE PRÉSENTATION CLIENT
 * Affiche l'inventaire catégorisé avec conformité automatique
 */
export default function InventaireCategoriePresentationClient({ inventaireData, clientInfo }) {
  // Organiser les données par catégorie
  const dataParCategorie = {};
  
  Object.entries(inventaireData || {}).forEach(([objetId, data]) => {
    const categorie = CATEGORIES_INVENTAIRE.find(c => c.objets.includes(objetId));
    if (categorie) {
      if (!dataParCategorie[categorie.id]) {
        dataParCategorie[categorie.id] = [];
      }
      dataParCategorie[categorie.id].push({
        objetId,
        label: getLabelObjet(objetId),
        present: data.quantity || 0,
        attendu: data.expected || 0,
        conforme: (data.quantity || 0) === (data.expected || 0)
      });
    }
  });

  // Compter les anomalies totales
  const totalAnomalies = Object.values(dataParCategorie)
    .flat()
    .filter(obj => !obj.conforme)
    .length;

  return (
    <div className="space-y-6">
      {/* EN-TÊTE DU CONTRÔLE */}
      <Card className="border-2 border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-blue-900">
            📋 Contrôle inventaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nom du client</p>
              <p className="font-bold text-lg">
                {clientInfo?.nom} {clientInfo?.prenom}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Période de séjour</p>
              <p className="font-bold text-lg">
                {clientInfo?.dateArrivee} → {clientInfo?.dateDepart}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type d'hébergement</p>
              <p className="font-bold text-lg">{clientInfo?.typeHebergement}</p>
            </div>
            {totalAnomalies > 0 && (
              <div>
                <Badge className="bg-orange-500 text-white flex items-center gap-2 text-base px-3 py-1">
                  <AlertTriangle className="w-4 h-4" />
                  {totalAnomalies} anomalie(s) détectée(s)
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CATÉGORIES ET OBJETS */}
      {CATEGORIES_INVENTAIRE.map(categorie => {
        const objets = dataParCategorie[categorie.id] || [];
        
        // Ne pas afficher les catégories vides
        if (objets.length === 0) return null;

        const categorieConforme = objets.every(obj => obj.conforme);

        return (
          <Card 
            key={categorie.id}
            className={`border-2 ${
              categorieConforme 
                ? 'border-green-300 bg-green-50' 
                : 'border-orange-300 bg-orange-50'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <span className="text-2xl">{categorie.icone}</span>
                  {categorie.nom}
                </CardTitle>
                {categorieConforme ? (
                  <Badge className="bg-green-600 text-white flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Conforme
                  </Badge>
                ) : (
                  <Badge className="bg-orange-600 text-white flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Anomalie
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {objets.map(objet => (
                  <div
                    key={objet.objetId}
                    className={`p-3 rounded-lg border-2 ${
                      objet.conforme
                        ? 'bg-white border-green-200'
                        : 'bg-orange-100 border-orange-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{objet.label}</p>
                      {objet.conforme ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <p className={`text-lg font-bold mt-1 ${
                      objet.conforme ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {objet.present} / {objet.attendu}
                    </p>
                    {!objet.conforme && (
                      <p className="text-xs text-orange-600 mt-1">
                        {objet.present < objet.attendu ? 'Manquant' : 'Excédent'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}