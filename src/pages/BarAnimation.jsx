import React from 'react';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function BarAnimation() {
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
            <Music className="w-8 h-8 text-[#FFD700]" />
            <h1 className="font-handwritten text-4xl text-[#00AEEF]">
              Bar & Animations
            </h1>
          </div>
          <p className="text-gray-600 font-body">
            {lang === 'fr' 
              ? 'Gestion du bar, snack et animations'
              : 'Bar, snack and entertainment management'}
          </p>
        </div>

        {/* Content */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Module en construction' : 'Module under construction'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {lang === 'fr' ? 'Fonctionnalités à venir :' : 'Features coming soon:'}
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• {lang === 'fr' ? 'Gestion des stocks bar/snack' : 'Bar/snack stock management'}</li>
              <li>• {lang === 'fr' ? 'Planning des animations' : 'Entertainment schedule'}</li>
              <li>• {lang === 'fr' ? 'Réservations soirées thématiques' : 'Themed evening bookings'}</li>
              <li>• {lang === 'fr' ? 'Suivi des événements' : 'Event tracking'}</li>
              <li>• {lang === 'fr' ? 'Communication avec les clients' : 'Guest communication'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}