import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { problemTypes } from '../components/mobilhomeData';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Camera, CheckCircle, Loader2, AlertTriangle,
  Home, Clock, User, Lock, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PASSWORD = '2024TECH';

export default function Intervention() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const mobilhomeId = urlParams.get('id');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [comment, setComment] = useState('');
  const [technicien, setTechnicien] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('tech_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-intervention', mobilhomeId],
    queryFn: () => {
      if (mobilhomeId) {
        return base44.entities.Incident.filter({ mobilhome_id: mobilhomeId, statut: 'nouveau' }, '-date_signalement');
      }
      return base44.entities.Incident.filter({ statut: 'nouveau' }, '-date_signalement', 100);
    },
    enabled: isAuthenticated
  });

  const { data: mobilhome } = useQuery({
    queryKey: ['mobilhome-intervention', mobilhomeId],
    queryFn: async () => {
      if (!mobilhomeId) return null;
      const results = await base44.entities.Mobilhome.filter({ numero: mobilhomeId });
      return results[0] || null;
    },
    enabled: !!mobilhomeId && isAuthenticated
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-intervention'] });
      toast.success('Intervention enregistrée !');
      setSelectedIncident(null);
      setComment('');
      setPhoto(null);
      setPhotoPreview(null);
    }
  });

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('tech_authenticated', 'true');
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleComplete = async () => {
    if (!technicien.trim()) {
      toast.error('Veuillez indiquer votre nom');
      return;
    }

    let photoUrl = null;
    if (photo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrl = file_url;
    }

    const dateResolution = new Date();
    const dateSignalement = new Date(selectedIncident.date_signalement);
    const dureeHeures = Math.round((dateResolution - dateSignalement) / (1000 * 60 * 60) * 10) / 10;

    await updateMutation.mutateAsync({
      id: selectedIncident.id,
      data: {
        statut: 'resolu',
        technicien: technicien,
        commentaire_technicien: comment,
        photo_intervention_url: photoUrl,
        date_resolution: dateResolution.toISOString(),
        duree_resolution_heures: dureeHeures
      }
    });
  };

  const getProblemLabel = (typeId) => {
    const type = problemTypes.find(t => t.id === typeId);
    return type ? type.label : typeId;
  };

  const getProblemEmoji = (typeId) => {
    const type = problemTypes.find(t => t.id === typeId);
    return type ? type.emoji : '❓';
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <Logo className="h-16 mb-4" />
            <CardTitle className="text-xl">Espace Technicien</CardTitle>
            <p className="text-sm text-slate-500">Accès réservé au personnel</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
                className="pl-10 pr-10 h-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600"
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Intervention Detail
  if (selectedIncident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-6">
        <OfflineBanner />
        <div className="max-w-lg mx-auto">
          <Logo className="h-14 mb-4" />
          
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <button
                onClick={() => setSelectedIncident(null)}
                className="flex items-center text-slate-500 hover:text-orange-600 text-sm mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </button>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getProblemEmoji(selectedIncident.type_probleme)}</span>
                Intervention #{selectedIncident.mobilhome_id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Incident Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Problème</span>
                  <span className="font-medium">{getProblemLabel(selectedIncident.type_probleme)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client</span>
                  <span className="font-medium">{selectedIncident.client_prenom} {selectedIncident.client_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Signalé le</span>
                  <span className="font-medium">
                    {format(new Date(selectedIncident.date_signalement), 'dd/MM à HH:mm', { locale: fr })}
                  </span>
                </div>
                {selectedIncident.urgence && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">URGENT</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-slate-700">{selectedIncident.description}</p>
                </div>
                {selectedIncident.photo_client_url && (
                  <img 
                    src={selectedIncident.photo_client_url}
                    alt="Photo client"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Technicien Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Votre nom *</label>
                <Input
                  value={technicien}
                  onChange={(e) => setTechnicien(e.target.value)}
                  placeholder="Prénom Nom"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Commentaire intervention</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Décrivez ce qui a été fait..."
                  className="min-h-24"
                />
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo après intervention</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="intervention-photo"
                />
                <label
                  htmlFor="intervention-photo"
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50"
                >
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-slate-600">Ajouter une photo</span>
                </label>
                {photoPreview && (
                  <div className="relative mt-2">
                    <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleComplete}
                disabled={!technicien.trim() || updateMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Intervention effectuée
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Incidents List
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-6">
      <OfflineBanner />
      <div className="max-w-lg mx-auto">
        <Logo className="h-14 mb-4" />

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Interventions</CardTitle>
                <p className="text-orange-100 text-sm">
                  {mobilhomeId ? `Logement ${mobilhomeId}` : 'Tous les signalements'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Aucun signalement en attente</p>
                <p className="text-slate-400 text-sm">Tout est en ordre !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      incident.urgence 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-200 bg-white hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getProblemEmoji(incident.type_probleme)}</span>
                        <div>
                          <div className="font-semibold text-slate-800">
                            #{incident.mobilhome_id}
                          </div>
                          <div className="text-sm text-slate-500">
                            {getProblemLabel(incident.type_probleme)}
                          </div>
                        </div>
                      </div>
                      {incident.urgence && (
                        <Badge variant="destructive" className="text-xs">URGENT</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {incident.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {incident.client_prenom} {incident.client_nom}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(incident.date_signalement), 'dd/MM HH:mm', { locale: fr })}
                      </div>
                    </div>
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