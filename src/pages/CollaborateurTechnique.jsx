import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Navigation, CheckCircle, Clock, AlertTriangle, 
  Camera, Loader2, ChevronRight, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CollaborateurTechnique() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (sessionStorage.getItem('collaborateur_role') !== 'technique') {
      navigate('/Collaborateur');
    }
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-technique'],
    queryFn: () => base44.entities.Incident.filter(
      { categorie_probleme: 'technique' }, 
      '-created_date',
      100
    ),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-technique'] });
      toast.success(t('succes'));
    }
  });

  const handleTakeOver = async (incident) => {
    await updateMutation.mutateAsync({
      id: incident.id,
      data: {
        statut: 'en_route',
        date_prise_en_charge: new Date().toISOString()
      }
    });
  };

  const handleComplete = async () => {
    if (!selectedIncident) return;

    const photoUrls = [];
    for (const photo of photos) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrls.push(file_url);
    }

    const startTime = new Date(selectedIncident.date_prise_en_charge);
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 60000);

    await updateMutation.mutateAsync({
      id: selectedIncident.id,
      data: {
        statut: 'termine',
        date_fin: endTime.toISOString(),
        commentaire_collaborateur: comment,
        photos_intervention: photoUrls,
        duree_minutes: duration
      }
    });

    setSelectedIncident(null);
    setComment('');
    setPhotos([]);
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    setPhotos([...photos, ...files]);
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return inc.statut !== 'termine';
    return inc.statut === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      nouveau: 'bg-blue-100 text-blue-700',
      en_route: 'bg-amber-100 text-amber-700',
      en_cours: 'bg-purple-100 text-purple-700',
      termine: 'bg-emerald-100 text-emerald-700'
    };
    return styles[status] || styles.nouveau;
  };

  if (selectedIncident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4 py-8">
        <OfflineBanner />
        <div className="max-w-lg mx-auto">
          <Logo className="h-16 mb-6" />
          
          <Card className="shadow-lg border-0">
            <CardHeader>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="flex items-center text-slate-500 hover:text-orange-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('retour')}
              </button>
              <CardTitle className="text-xl">
                Intervention #{selectedIncident.hebergement_numero}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Incident Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client</span>
                  <span className="font-medium">{selectedIncident.client_prenom} {selectedIncident.client_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Problème</span>
                  <span className="font-medium">{t(selectedIncident.sous_categorie)}</span>
                </div>
                {selectedIncident.probleme_urgent && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{t('urgence')}</span>
                  </div>
                )}
                <p className="text-slate-700 pt-2 border-t">{selectedIncident.description_probleme}</p>
                {selectedIncident.photo_client_url && (
                  <img 
                    src={selectedIncident.photo_client_url} 
                    alt="Photo client"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">{t('commentaire')}</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Décrivez l'intervention réalisée..."
                  className="min-h-24"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">{t('photos_intervention')}</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                  id="intervention-photos"
                />
                <label
                  htmlFor="intervention-photos"
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
                >
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-slate-600">{t('ajouter_photo')}</span>
                </label>
                {photos.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden relative">
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleComplete}
                disabled={updateMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('terminer')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4 py-8">
      <OfflineBanner />
      <div className="max-w-lg mx-auto">
        <Logo className="h-16 mb-6" />

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={() => navigate('/Collaborateur')}
              className="flex items-center text-slate-500 hover:text-orange-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-light text-slate-800">
              {t('technique')} - {t('interventions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['all', 'nouveau', 'en_route'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {f === 'all' ? 'Tous' : t(f)}
                </Button>
              ))}
            </div>

            {/* Incidents List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune intervention en attente
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredIncidents.map((incident) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className={`bg-white border rounded-xl p-4 ${
                        incident.probleme_urgent ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                #{incident.hebergement_numero}
                              </span>
                              {incident.probleme_urgent && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {t(incident.sous_categorie)}
                            </p>
                          </div>
                          <Badge className={getStatusBadge(incident.statut)}>
                            {t(incident.statut)}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {incident.description_probleme}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {format(new Date(incident.created_date), 'dd MMM HH:mm', { locale: lang === 'fr' ? fr : undefined })}
                          </span>

                          {incident.statut === 'nouveau' && (
                            <Button
                              size="sm"
                              onClick={() => handleTakeOver(incident)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <Navigation className="w-4 h-4 mr-1" />
                              {t('en_route')}
                            </Button>
                          )}

                          {incident.statut === 'en_route' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedIncident(incident)}
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {t('terminer')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}