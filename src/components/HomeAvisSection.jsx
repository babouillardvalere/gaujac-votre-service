import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from './translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Quote, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function HomeAvisSection() {
  const { t } = useTranslation();

  const { data: avis = [], isLoading } = useQuery({
    queryKey: ['home-avis-publics'],
    queryFn: () => base44.entities.Avis.list('-created_date', 100)
  });

  // Filtrer : note >= 4 et visible
  const avisFiltered = avis.filter(a => 
    a.note_globale >= 4 && 
    a.visible !== false
  );

  // Séparer les mis en avant (max 3) et les autres
  const avisEnAvant = avisFiltered.filter(a => a.mis_en_avant === true).slice(0, 3);
  const avisAutres = avisFiltered
    .filter(a => !a.mis_en_avant)
    .sort((a, b) => b.note_globale - a.note_globale || new Date(b.created_date) - new Date(a.created_date));

  // Combiner : mis en avant en premier, puis les meilleurs
  const avisAffiches = [...avisEnAvant, ...avisAutres].slice(0, 5);

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
    const lastNameInitial = nom ? nom.charAt(0).toUpperCase() + '.' : '';
    return `${prenom || ''} ${lastNameInitial}`.trim();
  };

  if (isLoading || avisAffiches.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mt-10"
    >
      <div className="text-center mb-6">
        <h2 className="font-handwritten text-2xl md:text-3xl text-[#FFD700] flex items-center justify-center gap-2">
          ⭐ {t('ils_ont_adore')} ⭐
        </h2>
      </div>

      <div className="space-y-3">
        {avisAffiches.map((avisItem, index) => (
          <motion.div
            key={avisItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
          >
            <Card className={`border-2 rounded-xl bg-white/90 backdrop-blur-sm ${avisItem.mis_en_avant ? 'border-[#FFD700] shadow-lg' : 'border-[#00AEEF]/30'}`}>
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
                    <p className="font-body text-gray-600 text-sm italic pl-4 line-clamp-2">
                      "{avisItem.commentaire}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {avisFiltered.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-4 text-center"
        >
          <Link to={createPageUrl('MeilleursAvis')}>
            <Button 
              variant="outline" 
              className="border-2 border-[#FFD700] text-[#0077A8] hover:bg-[#FFD700]/10 rounded-xl font-heading"
            >
              {t('voir_plus_avis')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}