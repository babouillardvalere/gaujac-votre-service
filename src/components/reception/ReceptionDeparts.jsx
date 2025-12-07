import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import ReceptionFicheDepart from './ReceptionFicheDepart';

export default function ReceptionDeparts({ lang }) {
  const [ficheSelectionnee, setFicheSelectionnee] = useState(null);
  const [recherche, setRecherche] = useState('');

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches-depart'],
    queryFn: () => base44.entities.FicheDepart.list('-date_validation'),
    refetchInterval: 10000
  });

  const fichesFiltrees = fiches.filter(f => {
    if (!recherche) return true;
    const searchLower = recherche.toLowerCase();
    return (
      f.client_nom?.toLowerCase().includes(searchLower) ||
      f.client_prenom?.toLowerCase().includes(searchLower) ||
      f.numero_logement?.toLowerCase().includes(searchLower)
    );
  });

  if (ficheSelectionnee) {
    return (
      <ReceptionFicheDepart
        fiche={ficheSelectionnee}
        onClose={() => setFicheSelectionnee(null)}
        lang={lang}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-[#FFA500]">
            {lang === 'fr' ? '🔴 Départs – Dossiers & états' : '🔴 Departures – Files & conditions'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {lang === 'fr' ? `${fiches.length} dossier(s) enregistré(s)` : `${fiches.length} file(s) recorded`}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher par nom ou n° logement...' : 'Search by name or accommodation number...'}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Liste des fiches */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </CardContent>
        </Card>
      ) : fichesFiltrees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {recherche 
                ? (lang === 'fr' ? 'Aucun dossier trouvé' : 'No file found')
                : (lang === 'fr' ? 'Aucun dossier de départ enregistré' : 'No departure file recorded')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fichesFiltrees.map(fiche => {
            const aDegats = fiche.degats_signales || fiche.evaluation_proprete === 'pas_satisfaisant';

            return (
              <Card key={fiche.id} className={`border-2 ${aDegats ? 'border-red-400 bg-red-50' : 'border-gray-300'} hover:shadow-lg transition-all cursor-pointer`}
                onClick={() => setFicheSelectionnee(fiche)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl font-bold text-[#FFA500]">
                        {fiche.numero_logement}
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-xl text-gray-900">
                          {fiche.client_prenom} {fiche.client_nom}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {fiche.date_arrivee} → {fiche.date_depart}
                          </span>
                          <span>{fiche.categorie_logement}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {aDegats ? (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {lang === 'fr' ? 'Dégâts' : 'Damages'}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {lang === 'fr' ? 'OK' : 'OK'}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        {lang === 'fr' ? 'Voir le dossier' : 'View file'} →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}