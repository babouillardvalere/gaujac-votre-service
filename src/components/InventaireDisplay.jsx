import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText } from 'lucide-react';

export default function InventaireDisplay({ codeCategorie, lang }) {
  const { data: inventaire, isLoading } = useQuery({
    queryKey: ['inventaire', codeCategorie],
    queryFn: async () => {
      const inventaires = await base44.entities.InventaireHebergement.list();
      return inventaires.find(inv => inv.code_categorie === codeCategorie);
    },
    enabled: !!codeCategorie
  });

  if (!codeCategorie) return null;

  if (isLoading) {
    return (
      <Card className="border-2 border-[#22c55e]/30 rounded-xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#22c55e]" />
        </CardContent>
      </Card>
    );
  }

  if (!inventaire) {
    return (
      <Card className="border-2 border-orange-300 rounded-xl">
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            {lang === 'fr' 
              ? 'Aucun inventaire disponible pour cette catégorie'
              : 'No inventory available for this category'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const titre = lang === 'fr' ? inventaire.titre_fr : inventaire.titre_en;
  const contenu = lang === 'fr' ? inventaire.contenu_fr : inventaire.contenu_en;

  return (
    <Card className="border-2 border-[#22c55e]/30 rounded-xl">
      <CardHeader className="bg-[#22c55e]/10">
        <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {titre}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {contenu ? (
          <div 
            className="prose prose-sm max-w-none font-body whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: contenu }}
          />
        ) : (
          <p className="text-gray-500 italic text-center">
            {lang === 'fr' 
              ? '📝 L\'inventaire détaillé sera bientôt disponible'
              : '📝 Detailed inventory will be available soon'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}