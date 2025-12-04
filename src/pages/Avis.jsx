import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Avis() {
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

  const { data: incident } = useQuery({
    queryKey: ['incident-avis', incidentId],
    queryFn: () => incidentId ? base44.entities.Incident.filter({ id: incidentId }) : null,
    enabled: !!incidentId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Avis.create(data),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => navigate('/Home'), 2000);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    const incidentData = incident?.[0];

    createMutation.mutate({
      incident_id: incidentId || null,
      note: rating,
      commentaire: comment || null,
      client_nom: incidentData?.client_nom || sessionStorage.getItem('user_name') || '',
      client_prenom: incidentData?.client_prenom || sessionStorage.getItem('user_surname') || '',
      hebergement_numero: incidentData?.hebergement_numero || ''
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
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{t('succes')}</h2>
          <p className="text-slate-600">{t('merci_avis')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={() => navigate('/Home')}
              className="flex items-center text-slate-500 hover:text-amber-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-light text-slate-800">
              {t('noter_intervention')}
            </CardTitle>
            {incident?.[0] && (
              <p className="text-sm text-slate-500 mt-2">
                Logement #{incident[0].hebergement_numero} - {t(incident[0].sous_categorie)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">Comment évaluez-vous notre service ?</p>
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
                  {rating === 5 && 'Excellent !'}
                  {rating === 4 && 'Très bien !'}
                  {rating === 3 && 'Bien'}
                  {rating === 2 && 'Peut mieux faire'}
                  {rating === 1 && 'À améliorer'}
                </motion.p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm text-slate-600 mb-2 block">{t('votre_avis')}</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="min-h-28 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('chargement')}
                </>
              ) : (
                t('envoyer')
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}