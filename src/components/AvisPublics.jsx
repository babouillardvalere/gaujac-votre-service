import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AvisPublics({ limit = 5, showOnlyFeatured = false }) {
  const { data: avis = [], isLoading } = useQuery({
    queryKey: ['avis-publics'],
    queryFn: () => base44.entities.Avis.list('-created_date', 100)
  });

  // Filtrer : note >= 4 et visible
  let avisAffiches = avis.filter(a => a.note_globale >= 4 && a.visible !== false);
  
  // Si on veut uniquement les mis en avant
  if (showOnlyFeatured) {
    avisAffiches = avisAffiches.filter(a => a.mis_en_avant === true);
  }

  // Limiter le nombre
  avisAffiches = avisAffiches.slice(0, limit);

  const renderStars = (note) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star 
          key={s} 
          className={`w-4 h-4 ${s <= Math.round(note) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );

  const formatName = (prenom, nom) => {
    if (!prenom && !nom) return 'Client';
    const firstNameInitial = prenom ? prenom.charAt(0).toUpperCase() + '.' : '';
    return `${nom || ''} ${firstNameInitial}`.trim();
  };

  if (isLoading || avisAffiches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {avisAffiches.map((avisItem, index) => (
        <motion.div
          key={avisItem.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border border-[#FFD700]/50 rounded-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-heading text-[#0077A8] text-sm">
                    {formatName(avisItem.client_prenom, avisItem.client_nom)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{avisItem.logement_ou_emplacement}</span>
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(avisItem.note_globale)}
                  <p className="text-xs text-[#0077A8] font-heading mt-1">
                    {avisItem.note_globale?.toFixed(1)}/5
                  </p>
                </div>
              </div>
              
              {avisItem.commentaire && (
                <div className="mt-3 relative">
                  <Quote className="w-4 h-4 text-[#FFD700] absolute -left-1 -top-1 opacity-50" />
                  <p className="font-body text-gray-600 text-sm italic pl-4">
                    "{avisItem.commentaire}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}