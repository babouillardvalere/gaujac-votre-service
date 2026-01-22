import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, CheckCircle, Home, Tent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';

// CODE COULEUR PAR CATÉGORIE
const COULEURS_CATEGORIES = {
  // Emplacements
  '6A': { fill: 'rgba(74, 222, 128, 0.4)', stroke: '#22c55e', name: 'Emplacement 6A' },
  '10A': { fill: 'rgba(96, 165, 250, 0.4)', stroke: '#3b82f6', name: 'Emplacement 10A' },
  'Eau + 10A': { fill: 'rgba(34, 211, 238, 0.4)', stroke: '#06b6d4', name: 'Eau + 10A' },
  // Hébergements
  'Eco': { fill: 'rgba(250, 204, 21, 0.4)', stroke: '#eab308', name: 'Mobil-home Eco' },
  'Eco Clim': { fill: 'rgba(251, 191, 36, 0.4)', stroke: '#f59e0b', name: 'Mobil-home Eco Clim' },
  'Confort+ 2ch': { fill: 'rgba(251, 146, 60, 0.4)', stroke: '#f97316', name: 'Confort+ 2ch' },
  'Confort+ 3ch': { fill: 'rgba(251, 146, 60, 0.4)', stroke: '#f97316', name: 'Confort+ 3ch' },
  'Premium 2ch': { fill: 'rgba(192, 132, 252, 0.4)', stroke: '#a855f7', name: 'Premium 2ch' },
  'Premium 3ch': { fill: 'rgba(192, 132, 252, 0.4)', stroke: '#a855f7', name: 'Premium 3ch' },
  'Cottage Premium': { fill: 'rgba(168, 85, 247, 0.4)', stroke: '#9333ea', name: 'Cottage Premium' }
};

// ZONES CLIQUABLES - Définies manuellement (sans statut)
const ZONES_CAMPING = [
  // Emplacements zone gauche
  { zone_id: 'EMPL_6A_089', type_locatif: 'emplacement', categorie: '6A', numero: '89', coords: [80, 340, 110, 340, 110, 360, 80, 360] },
  { zone_id: 'EMPL_6A_090', type_locatif: 'emplacement', categorie: '6A', numero: '90', coords: [80, 365, 110, 365, 110, 385, 80, 385] },
  { zone_id: 'EMPL_10A_091', type_locatif: 'emplacement', categorie: '10A', numero: '91', coords: [80, 390, 110, 390, 110, 410, 80, 410] },
  
  // Hébergements zone centre-droit
  { zone_id: 'MH_PREM_R12', type_locatif: 'hebergement', categorie: 'Premium 2ch', numero: 'R12', coords: [750, 180, 790, 180, 790, 210, 750, 210] },
  { zone_id: 'MH_PREM_R13', type_locatif: 'hebergement', categorie: 'Premium 3ch', numero: 'R13', coords: [800, 180, 840, 180, 840, 210, 800, 210] },
  { zone_id: 'MH_CONF_T06', type_locatif: 'hebergement', categorie: 'Confort+ 3ch', numero: 'T06', coords: [870, 160, 910, 160, 910, 190, 870, 190] },
  
  // Hébergements zone bas
  { zone_id: 'MH_ECO_P04', type_locatif: 'hebergement', categorie: 'Eco', numero: 'P04', coords: [340, 420, 370, 420, 370, 445, 340, 445] },
  { zone_id: 'COTTAGE_J08', type_locatif: 'hebergement', categorie: 'Cottage Premium', numero: 'J08', coords: [520, 280, 560, 280, 560, 310, 520, 310] },
  
  // Emplacements zone centre
  { zone_id: 'EMPL_10A_120', type_locatif: 'emplacement', categorie: '10A', numero: '120', coords: [430, 220, 460, 220, 460, 240, 430, 240] },
  { zone_id: 'EMPL_10A_121', type_locatif: 'emplacement', categorie: '10A', numero: '121', coords: [430, 245, 460, 245, 460, 265, 430, 265] },
];

export default function PlanCampingTest() {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState(null);
  const [confirmedSelection, setConfirmedSelection] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleZoneClick = (zone) => {
    if (zone.statut === 'libre') {
      setSelectedZone(zone);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSelection = () => {
    setConfirmedSelection(selectedZone);
    setShowConfirmModal(false);
  };

  const handleModifySelection = () => {
    setConfirmedSelection(null);
    setSelectedZone(null);
  };

  const getZoneColor = (zone) => {
    if (confirmedSelection && zone.zone_id === confirmedSelection.zone_id) {
      return 'rgba(34, 197, 94, 0.5)'; // Vert pour sélection confirmée
    }
    if (hoveredZone === zone.zone_id) {
      return 'rgba(59, 130, 246, 0.4)'; // Bleu pour hover
    }
    if (zone.statut === 'libre') {
      return 'rgba(0, 174, 239, 0.2)'; // Bleu clair pour libre
    }
    if (zone.statut === 'occupe') {
      return 'rgba(239, 68, 68, 0.3)'; // Rouge pour occupé
    }
    return 'rgba(156, 163, 175, 0.3)'; // Gris pour indisponible
  };

  const getZoneStroke = (zone) => {
    if (confirmedSelection && zone.zone_id === confirmedSelection.zone_id) {
      return '#22c55e';
    }
    if (hoveredZone === zone.zone_id) {
      return '#3b82f6';
    }
    if (zone.statut === 'libre') {
      return '#00AEEF';
    }
    if (zone.statut === 'occupe') {
      return '#ef4444';
    }
    return '#9ca3af';
  };

  const getStatutBadge = (statut) => {
    if (statut === 'libre') return <Badge className="bg-green-500">✓ Disponible</Badge>;
    if (statut === 'occupe') return <Badge className="bg-red-500">✗ Occupé</Badge>;
    return <Badge className="bg-gray-500">✗ Indisponible</Badge>;
  };

  if (confirmedSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Logo className="h-16 mx-auto" />
          
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Sélection confirmée
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-green-50 p-6 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  {confirmedSelection.type_locatif === 'emplacement' ? (
                    <Tent className="w-8 h-8 text-green-600" />
                  ) : (
                    <Home className="w-8 h-8 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Type de locatif</p>
                    <p className="text-xl font-bold text-green-800 capitalize">{confirmedSelection.type_locatif}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                  <div>
                    <p className="text-sm text-gray-600">Catégorie</p>
                    <p className="text-lg font-semibold text-green-700">{confirmedSelection.categorie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro</p>
                    <p className="text-lg font-semibold text-green-700">{confirmedSelection.numero}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-600">Identifiant complet</p>
                  <p className="text-lg font-mono bg-white px-3 py-2 rounded border border-green-300">
                    {confirmedSelection.zone_id}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleModifySelection} 
                  variant="outline" 
                  className="flex-1"
                >
                  Modifier la sélection
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl('Home'))} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Valider définitivement
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 italic">
                Module TEST - Aucun impact sur le système
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            onClick={() => navigate(createPageUrl('Home'))} 
            variant="outline" 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#0077A8]">Plan du Camping</h1>
            <p className="text-sm text-gray-600">🧪 Module TEST - Sélection interactive</p>
          </div>
          <div className="w-24" />
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-200 border-2 border-blue-500 rounded"></div>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-200 border-2 border-red-500 rounded"></div>
              <span className="text-sm">Occupé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 border-2 border-gray-500 rounded"></div>
              <span className="text-sm">Indisponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-400 border-2 border-green-600 rounded"></div>
              <span className="text-sm font-semibold">Sélectionné</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan du camping avec zones cliquables */}
      <div className="p-6">
        <Card className="max-w-7xl mx-auto overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="relative w-full" style={{ paddingBottom: '65%' }}>
              {/* Image de fond */}
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6931d7aca4264ba7f3fc01de/196cdf6c5_planducampingavectouteslesinformations.png"
                alt="Plan du camping"
                className="absolute inset-0 w-full h-full object-contain"
              />
              
              {/* SVG overlay pour les zones cliquables */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1024 660"
                preserveAspectRatio="xMidYMid meet"
              >
                {ZONES_CAMPING.map((zone) => (
                  <polygon
                    key={zone.zone_id}
                    points={zone.coords.join(',')}
                    fill={getZoneColor(zone)}
                    stroke={getZoneStroke(zone)}
                    strokeWidth="2"
                    className={zone.statut === 'libre' ? 'cursor-pointer transition-all' : 'cursor-not-allowed'}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={() => zone.statut === 'libre' && setHoveredZone(zone.zone_id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />
                ))}
                
                {/* Labels sur les zones */}
                {ZONES_CAMPING.map((zone) => {
                  const centerX = zone.coords.reduce((sum, val, i) => i % 2 === 0 ? sum + val : sum, 0) / (zone.coords.length / 2);
                  const centerY = zone.coords.reduce((sum, val, i) => i % 2 === 1 ? sum + val : sum, 0) / (zone.coords.length / 2);
                  return (
                    <text
                      key={`label-${zone.zone_id}`}
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-bold pointer-events-none"
                      fill={zone.statut === 'libre' ? '#0077A8' : '#666'}
                    >
                      {zone.numero}
                    </text>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Info hover */}
        {hoveredZone && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-lg p-4 border-2 border-blue-500 z-20">
            {(() => {
              const zone = ZONES_CAMPING.find(z => z.zone_id === hoveredZone);
              return (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{zone.numero} - {zone.categorie}</p>
                    <p className="text-xs text-gray-600 capitalize">{zone.type_locatif}</p>
                  </div>
                  <Badge className="bg-blue-500">Cliquez pour sélectionner</Badge>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0077A8]">
              <MapPin className="w-6 h-6" />
              Confirmer la sélection
            </DialogTitle>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  {selectedZone.type_locatif === 'emplacement' ? (
                    <Tent className="w-8 h-8 text-[#0077A8]" />
                  ) : (
                    <Home className="w-8 h-8 text-[#0077A8]" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Type de locatif</p>
                    <p className="text-xl font-bold text-[#0077A8] capitalize">{selectedZone.type_locatif}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Catégorie</p>
                    <p className="font-semibold">{selectedZone.categorie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro</p>
                    <p className="font-semibold">{selectedZone.numero}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatutBadge(selectedZone.statut)}
                </div>
              </div>

              {selectedZone.statut !== 'libre' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-semibold">
                    ⚠️ Ce locatif n'est pas disponible
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowConfirmModal(false)} variant="outline">
              ❌ Annuler
            </Button>
            {selectedZone?.statut === 'libre' && (
              <Button onClick={handleConfirmSelection} className="bg-[#00AEEF] hover:bg-[#0077A8]">
                ✅ Sélectionner ce locatif
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}