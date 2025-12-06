import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReceptionFicheArrivee from '../reception/ReceptionFicheArrivee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Eye, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function BureauFichesPDF({ lang }) {
  const isFrench = lang === 'fr';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all, arrivee, depart
  const [selectedDossier, setSelectedDossier] = useState(null);

  const { data: dossiersArrivee = [] } = useQuery({
    queryKey: ['dossiers-fiches'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  const { data: controles = [] } = useQuery({
    queryKey: ['controles-fiches'],
    queryFn: () => base44.entities.ControleInventaireArrivee.list()
  });

  const { data: departChecks = [] } = useQuery({
    queryKey: ['depart-checks'],
    queryFn: () => base44.entities.DepartCheck.list()
  });

  // Filtrer les données
  const filteredDossiers = dossiersArrivee.filter(d => {
    if (searchTerm && !d.numero_logement?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.client_nom?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return selectedType === 'all' || selectedType === 'arrivee';
  });

  const filteredDeparts = departChecks.filter(d => {
    if (searchTerm && !d.numero_logement?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.client_nom?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return selectedType === 'all' || selectedType === 'depart';
  });

  const handleViewPDF = (dossier, type) => {
    if (type === 'arrivee' && dossier.pdf_url) {
      window.open(dossier.pdf_url, '_blank');
    } else {
      toast.info(isFrench ? 'PDF non disponible' : 'PDF not available');
    }
  };

  // Si un dossier est sélectionné, afficher sa fiche
  if (selectedDossier) {
    return (
      <ReceptionFicheArrivee 
        dossier={selectedDossier} 
        onClose={() => setSelectedDossier(null)}
        lang={lang}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isFrench ? 'Rechercher par locatif ou nom...' : 'Search by rental or name...'}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            className="rounded-xl"
          >
            {isFrench ? 'Tout' : 'All'}
          </Button>
          <Button
            variant={selectedType === 'arrivee' ? 'default' : 'outline'}
            onClick={() => setSelectedType('arrivee')}
            className="rounded-xl"
          >
            📘 {isFrench ? 'Arrivées' : 'Arrivals'}
          </Button>
          <Button
            variant={selectedType === 'depart' ? 'default' : 'outline'}
            onClick={() => setSelectedType('depart')}
            className="rounded-xl"
          >
            📕 {isFrench ? 'Départs' : 'Departures'}
          </Button>
        </div>
      </div>

      {/* Liste des fiches d'arrivée */}
      {(selectedType === 'all' || selectedType === 'arrivee') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00AEEF]" />
              {isFrench ? '📘 Fiches d\'arrivée' : '📘 Arrival forms'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDossiers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {isFrench ? 'Aucune fiche trouvée' : 'No form found'}
                </p>
              ) : (
                filteredDossiers.map(dossier => (
                  <div key={dossier.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-heading text-[#0077A8]">
                        🏠 {dossier.numero_logement || 'N/A'} • {dossier.client_prenom} {dossier.client_nom}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {dossier.date_arrivee} → {dossier.date_depart}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDossier(dossier)}
                        className="rounded-lg"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {isFrench ? 'Voir' : 'View'}
                      </Button>
                      {dossier.pdf_url && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => window.open(dossier.pdf_url, '_blank')}
                          className="rounded-lg bg-[#00AEEF]"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des fiches de départ */}
      {(selectedType === 'all' || selectedType === 'depart') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFA500]" />
              {isFrench ? '📕 Fiches de départ' : '📕 Departure forms'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDeparts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {isFrench ? 'Aucune fiche trouvée' : 'No form found'}
                </p>
              ) : (
                filteredDeparts.map(depart => (
                  <div key={depart.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-heading text-[#0077A8]">
                        🏠 {depart.numero_logement} • {depart.client_prenom} {depart.client_nom}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {depart.date_arrivee} → {depart.date_depart}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="rounded-lg bg-[#FFA500]"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {isFrench ? 'Voir' : 'View'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}