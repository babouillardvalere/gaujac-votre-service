import React from 'react';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DirectionSaison() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-[#FFA500]" />
            <h1 className="font-handwritten text-4xl text-[#00AEEF]">
              Saison
            </h1>
          </div>
          <p className="text-gray-600 font-body">
            Supervision générale de la saison et planification
          </p>
        </div>

        {/* Content */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8]">
              Module en construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Fonctionnalités à venir :
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Calendrier d'ouverture et fermeture</li>
              <li>• Tableau de bord saisonnier</li>
              <li>• Planification équipe et ressources</li>
              <li>• Tâches transversales (piscine, animations, entretien)</li>
              <li>• Communications internes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}