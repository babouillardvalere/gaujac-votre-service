import React from 'react';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';

export default function Animations() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="bg-[#a855f7] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl">🎵 Animations</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} className="p-2 hover:bg-white/20 rounded-lg">
              <Home className="w-6 h-6" />
            </button>
            <Music className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="border-2 border-[#a855f7]/30 rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-[#0077A8]">
                  {lang === 'fr' ? 'Gestion Animations' : 'Events Management'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {lang === 'fr' ? 'Fonctionnalités à venir :' : 'Features coming soon:'}
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>• {lang === 'fr' ? 'Planning des animations' : 'Entertainment schedule'}</li>
                  <li>• {lang === 'fr' ? 'Soirées thématiques' : 'Themed evenings'}</li>
                  <li>• {lang === 'fr' ? 'Activités sportives' : 'Sports activities'}</li>
                  <li>• {lang === 'fr' ? 'Club enfants' : 'Kids club'}</li>
                </ul>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}