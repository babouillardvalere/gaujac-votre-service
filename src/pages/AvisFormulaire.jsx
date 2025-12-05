import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, Loader2, Home, MapPin, ArrowLeft, Zap, Smile, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function AvisFormulaire() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';

  // Récupérer les infos de session
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [hebergement, setHebergement] = useState('');

  // Notes
  const [noteReactivite, setNoteReactivite] = useState(0);
  const [noteAmabilite, setNoteAmabilite] = useState(0);
  const [noteIntervention, setNoteIntervention] = useState(0);
  const [hoverReactivite, setHoverReactivite] = useState(0);
  const [hoverAmabilite, setHoverAmabilite] = useState(0);
  const [hoverIntervention, setHoverIntervention] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Vérifier que l'identification a été faite
    const identificationComplete = sessionStorage.getItem('avis_identification_complete');
    if (identificationComplete !== 'true') {
      navigate(createPageUrl('AvisIdentification'));
      return;
    }

    // Récupérer les données
    setClientNom(sessionStorage.getItem('avis_client_nom') || '');
    setClientPrenom(sessionStorage.getItem('avis_client_prenom') || '');
    setDateArrivee(sessionStorage.getItem('avis_date_arrivee') || '');
    setDateDepart(sessionStorage.getItem('avis_date_depart') || '');
    setHebergement(sessionStorage.getItem('avis_hebergement') || '');
  }, [navigate]);

  const createAvisMutation = useMutation({
    mutationFn: (data) => base44.entities.Avis.create(data),
    onSuccess: () => {
      // Nettoyer la session
      sessionStorage.removeItem('avis_identification_complete');
      sessionStorage.removeItem('avis_client_nom');
      sessionStorage.removeItem('avis_client_prenom');
      sessionStorage.removeItem('avis_date_arrivee');
      sessionStorage.removeItem('avis_date_depart');
      sessionStorage.removeItem('avis_hebergement');
      setIsSuccess(true);
    },
    onError: () => {
      toast.error(isFrench ? "Erreur lors de l'envoi de l'avis" : 'Error while sending review');
    }
  });

  const noteGlobale = noteReactivite > 0 && noteAmabilite > 0 && noteIntervention > 0
    ? ((noteReactivite + noteAmabilite + noteIntervention) / 3).toFixed(2)
    : 0;

  const isFormValid = () => {
    return noteReactivite > 0 && noteAmabilite > 0 && noteIntervention > 0;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      toast.error(isFrench ? 'Veuillez donner une note pour chaque critère' : 'Please rate each criterion');
      return;
    }

    const noteGlobaleNum = parseFloat(noteGlobale);

    createAvisMutation.mutate({
      client_nom: clientNom,
      client_prenom: clientPrenom,
      logement_ou_emplacement: hebergement,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      note_reactivite: noteReactivite,
      note_amabilite: noteAmabilite,
      note_intervention: noteIntervention,
      note_globale: noteGlobaleNum,
      commentaire: commentaire || null,
      visible: noteGlobaleNum >= 4,
      mis_en_avant: false
    });
  };

  const StarRating = ({ value, hoverValue, onChange, onHover, label, icon: Icon, color }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <label className="font-heading text-[#0077A8]">{label}</label>
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onChange(star)}
            className="focus:ring-2 focus:ring-[#FFD700] rounded-lg p-1"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                star <= (hoverValue || value)
                  ? 'text-[#FFD700] fill-[#FFD700]'
                  : 'text-gray-300'
              }`}
            />
          </motion.button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-center text-sm text-[#0077A8] mt-2 font-heading">{value}/5 ⭐</p>
      )}
    </div>
  );

  // Écran de succès
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
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-2">{t('merci_avis')}</h2>
          <p className="font-body text-gray-600 mb-6">{t('avis_enregistre')}</p>
          <p className="font-handwritten text-[#00AEEF] text-lg mb-6">Camping Paradis ! 🌴</p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading">
              <Home className="w-4 h-4 mr-2" />
              {t('retour_accueil')}
            </Button>
          </Link>
        </motion.div>
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

        <Card className="shadow-lg border-2 border-[#FFD700] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#FFD700] pb-4">
            <CardTitle className="text-xl font-heading text-[#0077A8] flex items-center gap-2">
              <Star className="w-5 h-5" />
              {t('noter_intervention')}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Résumé client */}
            <div className="bg-[#e6f7ff] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#00AEEF]" />
                <div>
                  <p className="font-heading text-[#0077A8]">{hebergement}</p>
                  <p className="text-sm font-body text-gray-600">{clientPrenom} {clientNom}</p>
                  <p className="text-xs font-body text-gray-500">{dateArrivee} → {dateDepart}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <StarRating
              value={noteReactivite}
              hoverValue={hoverReactivite}
              onChange={setNoteReactivite}
              onHover={setHoverReactivite}
              label={isFrench ? 'Réactivité de l\'intervention' : 'Response speed'}
              icon={Zap}
              color="bg-[#FFA500]"
            />

            <StarRating
              value={noteAmabilite}
              hoverValue={hoverAmabilite}
              onChange={setNoteAmabilite}
              onHover={setHoverAmabilite}
              label={isFrench ? 'Amabilité du collaborateur' : 'Staff friendliness'}
              icon={Smile}
              color="bg-green-500"
            />

            <StarRating
              value={noteIntervention}
              hoverValue={hoverIntervention}
              onChange={setNoteIntervention}
              onHover={setHoverIntervention}
              label={isFrench ? 'Qualité globale de l\'intervention' : 'Overall intervention quality'}
              icon={Sparkles}
              color="bg-purple-500"
            />

            {/* Prévisualisation note globale */}
            {isFormValid() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FFD700]/20 rounded-xl p-4 mb-6 text-center border-2 border-[#FFD700]"
              >
                <p className="text-sm font-body text-[#0077A8] mb-2">
                  {isFrench ? 'Votre note globale' : 'Your overall rating'}
                </p>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      className={`w-8 h-8 ${s <= Math.round(parseFloat(noteGlobale)) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="font-heading text-2xl text-[#0077A8]">{noteGlobale}/5</p>
              </motion.div>
            )}

            {/* Commentaire */}
            <div className="mb-6">
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                {t('votre_avis')}
              </label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder={t('votre_avis_placeholder')}
                className="min-h-24 border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(createPageUrl('AvisIdentification'))}
                variant="outline"
                className="flex-1 h-12 rounded-xl font-heading"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('retour')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || createAvisMutation.isPending}
                className="flex-1 h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50"
              >
                {createAvisMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('envoyer_avis')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}