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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, CheckCircle, Camera, Loader2, Plus, Sparkles, 
  Bed, UtensilsCrossed, TreePine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CollaborateurMenage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIntervention, setNewIntervention] = useState({
    hebergement_numero: '',
    type_intervention: 'nettoyage_complet'
  });
  const [checklist, setChecklist] = useState({
    sols: false,
    sanitaires: false,
    cuisine: false,
    chambres: false,
    terrasse: false,
    poubelles: false
  });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (sessionStorage.getItem('collaborateur_role') !== 'menage') {
      navigate('/Collaborateur');
    }
  }, [navigate]);

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ['interventions-menage'],
    queryFn: () => base44.entities.InterventionMenage.filter({}, '-created_date', 50),
    refetchInterval: 30000
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-menage'],
    queryFn: () => base44.entities.Incident.filter(
      { categorie_probleme: 'menage', statut: 'nouveau' }, 
      '-created_date',
      50
    )
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InterventionMenage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions-menage'] });
      setShowCreateForm(false);
      setNewIntervention({ hebergement_numero: '', type_intervention: 'nettoyage_complet' });
      toast.success(t('succes'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InterventionMenage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions-menage'] });
      toast.success(t('succes'));
    }
  });

  const handleCreateIntervention = () => {
    if (!newIntervention.hebergement_numero) return;
    
    createMutation.mutate({
      ...newIntervention,
      statut: 'a_faire',
      checklist: {
        sols: false,
        sanitaires: false,
        cuisine: false,
        chambres: false,
        terrasse: false,
        poubelles: false
      }
    });
  };

  const handleStartIntervention = (intervention) => {
    updateMutation.mutate({
      id: intervention.id,
      data: {
        statut: 'en_cours',
        date_debut: new Date().toISOString()
      }
    });
    setSelectedIntervention(intervention);
    setChecklist(intervention.checklist || {
      sols: false,
      sanitaires: false,
      cuisine: false,
      chambres: false,
      terrasse: false,
      poubelles: false
    });
  };

  const handleComplete = async () => {
    if (!selectedIntervention) return;

    const photoUrls = [];
    for (const photo of photos) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrls.push(file_url);
    }

    await updateMutation.mutateAsync({
      id: selectedIntervention.id,
      data: {
        statut: 'termine',
        date_fin: new Date().toISOString(),
        checklist,
        commentaire: comment,
        photos: photoUrls
      }
    });

    setSelectedIntervention(null);
    setComment('');
    setPhotos([]);
    setChecklist({
      sols: false,
      sanitaires: false,
      cuisine: false,
      chambres: false,
      terrasse: false,
      poubelles: false
    });
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    setPhotos([...photos, ...files]);
  };

  const interventionTypes = [
    { id: 'nettoyage_complet', icon: Sparkles },
    { id: 'literie', icon: Bed },
    { id: 'vaisselle', icon: UtensilsCrossed },
    { id: 'terrasse', icon: TreePine }
  ];

  const pendingInterventions = interventions.filter(i => i.statut !== 'termine');

  if (selectedIntervention) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
        <OfflineBanner />
        <div className="max-w-lg mx-auto">
          <Logo className="h-16 mb-6" />
          
          <Card className="shadow-lg border-0">
            <CardHeader>
              <button 
                onClick={() => setSelectedIntervention(null)}
                className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('retour')}
              </button>
              <CardTitle className="text-xl">
                {t('menage')} - #{selectedIntervention.hebergement_numero}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Checklist */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Checklist</label>
                {Object.keys(checklist).map((item) => (
                  <div 
                    key={item}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      checklist[item] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="capitalize text-slate-700">{item.replace('_', ' ')}</span>
                    <Checkbox
                      checked={checklist[item]}
                      onCheckedChange={(checked) => setChecklist({ ...checklist, [item]: checked })}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">{t('commentaire')}</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Observations particulières..."
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
                  id="menage-photos"
                />
                <label
                  htmlFor="menage-photos"
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
      <OfflineBanner />
      <div className="max-w-lg mx-auto">
        <Logo className="h-16 mb-6" />

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={() => navigate('/Collaborateur')}
              className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-light text-slate-800">
                {t('menage')}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-sky-500 hover:bg-sky-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nouveau
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Create Form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-sky-50 rounded-xl border border-sky-200"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-600">Numéro hébergement</label>
                      <input
                        type="text"
                        value={newIntervention.hebergement_numero}
                        onChange={(e) => setNewIntervention({ ...newIntervention, hebergement_numero: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                        placeholder="Ex: 123"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Type</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {interventionTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setNewIntervention({ ...newIntervention, type_intervention: type.id })}
                            className={`p-3 rounded-lg border flex items-center gap-2 transition-all ${
                              newIntervention.type_intervention === type.id
                                ? 'border-sky-500 bg-sky-100'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <type.icon className="w-4 h-4" />
                            <span className="text-sm">{t(type.id)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateIntervention}
                      disabled={!newIntervention.hebergement_numero || createMutation.isPending}
                      className="w-full bg-sky-500 hover:bg-sky-600"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Créer'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Client Requests */}
            {incidents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 mb-3">Demandes clients</h3>
                <div className="space-y-2">
                  {incidents.map((incident) => (
                    <div 
                      key={incident.id}
                      className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">#{incident.hebergement_numero}</span>
                        <Badge className="bg-amber-100 text-amber-700">{t(incident.sous_categorie)}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">{incident.description_probleme}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interventions List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              </div>
            ) : pendingInterventions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune intervention en attente
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInterventions.map((intervention) => (
                  <motion.div
                    key={intervention.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-semibold text-slate-800">
                          #{intervention.hebergement_numero}
                        </span>
                        <p className="text-sm text-slate-500">
                          {t(intervention.type_intervention)}
                        </p>
                      </div>
                      <Badge className={
                        intervention.statut === 'en_cours' 
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }>
                        {intervention.statut === 'en_cours' ? t('en_cours') : 'À faire'}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleStartIntervention(intervention)}
                      className="w-full bg-sky-500 hover:bg-sky-600"
                    >
                      {intervention.statut === 'en_cours' ? t('terminer') : 'Commencer'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}