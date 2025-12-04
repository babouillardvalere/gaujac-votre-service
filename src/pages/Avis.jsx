import React, { useState } from 'react';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, Loader2, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Avis() {
  const urlParams = new URLSearchParams(window.location.search);
  const incidentId = urlParams.get('id');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['avis-incident', incidentId],
    queryFn: async () => {
      if (!incidentId) return null;
      const results = await base44.entities.Incident.filter({ id: incidentId });
      return results[0] || null;
    },
    enabled: !!incidentId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.update(incidentId, data),
    onSuccess: () => {
      setIsSuccess(true);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }
    updateMutation.mutate({
      note_client: rating,
      commentaire_client: comment || null
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-[#0077A8]" />
          </div>
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-2">Merci !</h2>
          <p className="font-body text-gray-600 mb-6">Votre avis a été enregistré.</p>
          <p className="font-handwritten text-[#00AEEF] text-lg">Bonnes vacances au Camping Paradis ! 🌴</p>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Logo className="h-20 mx-auto mb-6" />
          <h2 className="font-heading text-xl text-[#0077A8]">Intervention non trouvée</h2>
          <p className="font-body text-gray-600">Ce lien n'est plus valide.</p>
        </div>
      </div>
    );
  }

  if (incident.note_client) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Logo className="h-20 mx-auto mb-6" />
          <h2 className="font-handwritten text-2xl text-[#0077A8] mb-4">Merci pour votre avis !</h2>
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-8 h-8 ${s <= incident.note_client ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
            ))}
          </div>
          <p className="font-body text-gray-600">Vous avez déjà donné votre avis pour cette intervention.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-[#FFD700]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-[#0077A8]" />
              </div>
              <div>
                <CardTitle className="text-xl font-heading text-[#0077A8]">Votre avis</CardTitle>
                <p className="text-[#0077A8]/80 text-sm font-body">
                  Comment s'est passée l'intervention ?
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="bg-[#e6f7ff] rounded-xl p-4 flex items-center gap-3 border border-[#00AEEF]/30">
              <Home className="w-5 h-5 text-[#00AEEF]" />
              <div>
                <p className="font-heading text-[#0077A8]">Logement #{incident.logement || incident.emplacement}</p>
                <p className="text-sm font-body text-gray-600">{incident.categorie}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm font-heading text-[#0077A8] mb-4">Notez notre intervention</p>
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
                          ? 'text-[#FFD700] fill-[#FFD700]'
                          : 'text-gray-300'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-handwritten text-xl text-[#00AEEF] mt-3"
                >
                  {rating === 5 && 'Excellent ! 🌟'}
                  {rating === 4 && 'Très bien ! 👍'}
                  {rating === 3 && 'Bien 😊'}
                  {rating === 2 && 'Peut mieux faire 🤔'}
                  {rating === 1 && 'À améliorer 😕'}
                </motion.p>
              )}
            </div>

            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                Un commentaire ? (facultatif)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="min-h-28 border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || updateMutation.isPending}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white font-heading rounded-xl shadow-lg disabled:opacity-50"
            >
              {updateMutation.isPending ? (
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