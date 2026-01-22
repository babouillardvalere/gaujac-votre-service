import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES_INVENTAIRE, getLabelObjet } from './InventaireCategoriesReferentiel';
import InventaireItemRow from '../InventaireItemRow';

/**
 * AFFICHAGE CATÉGORISÉ DE L'INVENTAIRE
 * Structure normalisée pour tous les types d'hébergement
 */
export default function InventaireAffichageCategories({
  items,
  quantities,
  photos,
  remarques,
  urgencies,
  problemesTechniques,
  onQuantityChange,
  onPhotosChange,
  onRemarqueChange,
  onUrgencyChange,
  onProblemeTechnique,
  lang
}) {
  // Organiser les items par catégorie
  const itemsParCategorie = {};
  
  items.forEach(item => {
    const categorie = CATEGORIES_INVENTAIRE.find(c => c.objets.includes(item.id));
    if (categorie) {
      if (!itemsParCategorie[categorie.id]) {
        itemsParCategorie[categorie.id] = [];
      }
      itemsParCategorie[categorie.id].push(item);
    }
  });

  // Compter les anomalies par catégorie
  const getAnomaliesCount = (catId) => {
    const catItems = itemsParCategorie[catId] || [];
    return catItems.filter(item => {
      const declared = quantities[item.id] !== undefined ? quantities[item.id] : item.quantity;
      return declared < item.quantity || problemesTechniques[item.id];
    }).length;
  };

  return (
    <div className="space-y-6">
      {CATEGORIES_INVENTAIRE.map(categorie => {
        const catItems = itemsParCategorie[categorie.id] || [];
        
        // Ne pas afficher les catégories vides
        if (catItems.length === 0) return null;

        const anomaliesCount = getAnomaliesCount(categorie.id);

        return (
          <Card 
            key={categorie.id}
            className={`border-2 ${
              anomaliesCount > 0 
                ? 'border-orange-400 bg-orange-50' 
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <span className="text-2xl">{categorie.icone}</span>
                  {categorie.nom}
                </CardTitle>
                {anomaliesCount > 0 && (
                  <Badge className="bg-orange-600 text-white">
                    {anomaliesCount} {lang === 'fr' ? 'anomalie(s)' : 'issue(s)'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {catItems.map(item => (
                <InventaireItemRow
                  key={item.id}
                  item={{ ...item, emoji: item.icon, qty: item.quantity }}
                  quantity={quantities[item.id]}
                  photos={photos[item.id] || []}
                  remarque={remarques[item.id] || ''}
                  onQuantityChange={onQuantityChange}
                  onPhotosChange={onPhotosChange}
                  onRemarqueChange={onRemarqueChange}
                  onUrgencyChange={onUrgencyChange}
                  onProblemeTechnique={onProblemeTechnique}
                  urgent={urgencies[item.id]}
                  problemeTechniqueSignale={problemesTechniques[item.id]}
                  lang={lang}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}