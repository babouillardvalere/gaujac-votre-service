import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, Loader2, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SatisfactionClient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const incidentId = urlParams.get('incident');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
    }
  }, [navigate]);

  const { data: incidents } = useQuery({
    queryKey: ['satisfaction-incident', incidentId],
    queryFn: async () => {
      if (!incidentId) return null;
      const results = await base44.entities.Incident.filter({ id: incidentId });
      return results[0] || null;
    },
    enabled: !!incidentId
  });

  const incident = incidents;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Satisfaction.create(data),
    onSuccess: () => {
      setIsSuccess(true);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    createMutation.mutate({
      incident_id: incidentId || '',
      mobilhome_id: incident?.mobilhome_id || '',
      note: rating,
      commentaire: comment || null,
      technicien: incident?.technicien || '',
      type_intervention: incident?.type_probleme || '',
      client_nom: incident?.client_nom || '',
      client_prenom: incident?.client_prenom || ''
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Merci !</h2>
          <p className="text-slate-600 mb-6">Votre avis a été enregistré.</p>
          <p className="text-slate-500 text-sm">Bonnes vacances au Camping Paradis ! 🌴</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Votre avis</CardTitle>
                <p className="text-amber-100 text-sm">
                  Comment s'est passée l'intervention ?
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {incident && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                <Home className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700">Logement #{incident.mobilhome_id}</p>
                  <p className="text-sm text-slate-500">{incident.type_probleme}</p>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">Notez notre intervention</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-amber-600 font-medium mt-3"
                >
                  {rating === 5 && 'Excellent ! 🌟'}
                  {rating === 4 && 'Très bien ! 👍'}
                  {rating === 3 && 'Bien 😊'}
                  {rating === 2 && 'Peut mieux faire 🤔'}
                  {rating === 1 && 'À améliorer 😕'}
                </motion.p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm text-slate-600 mb-2 block">
                Un commentaire ? (facultatif)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="min-h-28 border-slate-200"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer mon avis'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}