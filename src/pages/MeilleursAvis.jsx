import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Quote, Home, Calendar, Zap, Smile, Sparkles, Filter, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MeilleursAvis() {
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';
  
  const [sortBy, setSortBy] = useState('note');
  const [filterHebergement, setFilterHebergement] = useState('');

  const { data: avis = [], isLoading } = useQuery({
    queryKey: ['meilleurs-avis'],
    queryFn: () => base44.entities.Avis.list('-created_date', 500)
  });

  // Filtrer : note >= 4 et visible
  let avisFiltered = avis.filter(a => 
    a.note_globale >= 4 && 
    a.visible !== false
  );

  // Filtre par hébergement
  if (filterHebergement) {
    avisFiltered = avisFiltered.filter(a => 
      a.logement_ou_emplacement?.toLowerCase().includes(filterHebergement.toLowerCase())
    );
  }

  // Séparer les mis en avant
  const avisEnAvant = avisFiltered.filter(a => a.mis_en_avant === true);
  const avisAutres = avisFiltered.filter(a => !a.mis_en_avant);

  // Tri
  const sortFunction = (a, b) => {
    switch (sortBy) {
      case 'note': return b.note_globale - a.note_globale;
      case 'date': return new Date(b.created_date) - new Date(a.created_date);
      case 'hebergement': return (a.logement_ou_emplacement || '').localeCompare(b.logement_ou_emplacement || '');
      case 'reactivite': return b.note_reactivite - a.note_reactivite;
      case 'amabilite': return b.note_amabilite - a.note_amabilite;
      case 'qualite': return b.note_intervention - a.note_intervention;
      default: return 0;
    }
  };

  // Combiner : mis en avant en premier (triés), puis les autres (triés)
  const avisSorted = [
    ...avisEnAvant.sort(sortFunction),
    ...avisAutres.sort(sortFunction)
  ];

  const renderStars = (note, size = 'w-4 h-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star 
          key={s} 
          className={`${size} ${s <= Math.round(note) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );

  const formatName = (prenom, nom) => {
    if (!prenom && !nom) return 'Client';
    const lastNameInitial = nom ? nom.charAt(0).toUpperCase() + '.' : '';
    return `${prenom || ''} ${lastNameInitial}`.trim();
  };

  const formatDateRange = (dateArrivee, dateDepart) => {
    if (!dateArrivee || !dateDepart) return '';
    const locale = isFrench ? fr : undefined;
    return `${format(new Date(dateArrivee), 'dd MMM', { locale })} → ${format(new Date(dateDepart), 'dd MMM yyyy', { locale })}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="font-handwritten text-3xl md:text-4xl text-[#FFD700] flex items-center justify-center gap-2">
            ⭐ {t('ils_ont_adore')} ⭐
          </h1>
          <p className="font-body text-gray-600 mt-2">
            {avisSorted.length} {t('avis').toLowerCase()}
          </p>
        </motion.div>

        {/* Filtres et tri */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-[#00AEEF]" />
              <span className="font-heading text-sm text-[#0077A8]">{t('filtrer')} & {t('trier_par')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={isFrench ? "N° hébergement" : "Accommodation #"}
                value={filterHebergement}
                onChange={(e) => setFilterHebergement(e.target.value)}
                className="border-[#00AEEF]/30 rounded-xl"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">⭐ {t('par_note')}</SelectItem>
                  <SelectItem value="date">🕒 {t('par_date')}</SelectItem>
                  <SelectItem value="hebergement">🏠 {t('par_hebergement')}</SelectItem>
                  <SelectItem value="reactivite">⚡ {t('par_reactivite')}</SelectItem>
                  <SelectItem value="amabilite">😊 {t('par_amabilite')}</SelectItem>
                  <SelectItem value="qualite">✨ {t('par_qualite')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des avis */}
        <div className="space-y-4">
          {avisSorted.length === 0 ? (
            <Card className="border-2 border-gray-200 rounded-xl">
              <CardContent className="p-8 text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="font-body text-gray-500">{t('aucun_avis')}</p>
              </CardContent>
            </Card>
          ) : (
            avisSorted.map((avisItem, index) => (
              <motion.div
                key={avisItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className={`border-2 rounded-xl ${avisItem.mis_en_avant ? 'border-[#FFD700] bg-[#FFD700]/5 shadow-lg' : 'border-[#00AEEF]/30 bg-white'}`}>
                  <CardContent className="p-4">
                    {/* En-tête */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-heading text-[#0077A8]">
                          {formatName(avisItem.client_prenom, avisItem.client_nom)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {avisItem.logement_ou_emplacement}
                          </span>
                          {avisItem.date_arrivee && avisItem.date_depart && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(avisItem.date_arrivee, avisItem.date_depart)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {renderStars(avisItem.note_globale, 'w-5 h-5')}
                        <p className="text-sm text-[#0077A8] font-heading mt-1">
                          {avisItem.note_globale?.toFixed(1)}/5
                        </p>
                      </div>
                    </div>

                    {/* Notes détaillées */}
                    <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                          <Zap className="w-3 h-3 text-[#FFA500]" />
                          <span>{t('reactivite')}</span>
                        </div>
                        {renderStars(avisItem.note_reactivite, 'w-3 h-3')}
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                          <Smile className="w-3 h-3 text-green-500" />
                          <span>{t('amabilite')}</span>
                        </div>
                        {renderStars(avisItem.note_amabilite, 'w-3 h-3')}
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>{t('qualite')}</span>
                        </div>
                        {renderStars(avisItem.note_intervention, 'w-3 h-3')}
                      </div>
                    </div>

                    {/* Commentaire */}
                    {avisItem.commentaire && (
                      <div className="relative bg-white border border-gray-100 rounded-lg p-3">
                        <Quote className="w-4 h-4 text-[#FFD700] absolute left-2 top-2 opacity-50" />
                        <p className="font-body text-gray-700 text-sm italic pl-5">
                          "{avisItem.commentaire}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Bouton retour */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link to={createPageUrl('Home')}>
            <Button 
              variant="outline" 
              className="border-2 border-[#00AEEF] text-[#0077A8] hover:bg-[#00AEEF]/10 rounded-xl font-heading"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('retour_accueil')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}