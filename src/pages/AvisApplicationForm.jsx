import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Home, Smartphone, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function AvisApplicationForm() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';

  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [noteIntuitivite, setNoteIntuitivite] = useState('');
  const [ameliorations, setAmeliorations] = useState('');
  const [aidePendantSejour, setAidePendantSejour] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const createAvisMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisApplication.create(data),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: () => {
      toast.error(isFrench ? "Erreur lors de l'envoi de l'avis" : 'Error while sending feedback');
    }
  });

  const isFormValid = () => {
    return clientNom && clientPrenom && noteIntuitivite && aidePendantSejour;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      toast.error(isFrench ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill all required fields');
      return;
    }

    createAvisMutation.mutate({
      client_nom: clientNom,
      client_prenom: clientPrenom,
      note_intuitivite: noteIntuitivite,
      ameliorations: ameliorations || null,
      aide_pendant_sejour: aidePendantSejour
    });
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error(isFrench ? 'Dictée vocale non disponible sur ce navigateur' : 'Voice input not available on this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isFrench ? 'fr-FR' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success(isFrench ? '🎤 Parlez maintenant...' : '🎤 Speak now...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAmeliorations((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error(isFrench ? 'Erreur de reconnaissance vocale' : 'Voice recognition error');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

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
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-2">
            {isFrench ? 'Merci pour votre retour !' : 'Thank you for your feedback!'}
          </h2>
          <p className="font-body text-gray-600 mb-6">
            {isFrench 
              ? 'Votre avis nous aide à améliorer l\'application !' 
              : 'Your feedback helps us improve the app!'}
          </p>
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

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] pb-4">
            <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {isFrench ? '📱 Avis sur l\'application' : '📱 App Feedback'}
            </CardTitle>
            <p className="text-sm text-white/90 font-body mt-2">
              {isFrench 
                ? 'Aidez-nous à améliorer votre expérience !' 
                : 'Help us improve your experience!'}
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Identité */}
            <div className="mb-6">
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                {isFrench ? 'Nom' : 'Last name'} *
              </label>
              <Input
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                placeholder={isFrench ? 'Votre nom' : 'Your last name'}
                className="border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                {isFrench ? 'Prénom' : 'First name'} *
              </label>
              <Input
                value={clientPrenom}
                onChange={(e) => setClientPrenom(e.target.value)}
                placeholder={isFrench ? 'Votre prénom' : 'Your first name'}
                className="border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            {/* Question 1 : Intuitivité */}
            <div className="mb-6">
              <label className="text-sm font-heading text-[#0077A8] mb-3 block">
                ⭐ {isFrench ? 'Comment trouvez-vous l\'application ?' : 'How do you find the app?'} *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'mauvaise', emoji: '😠', label: isFrench ? 'Mauvaise' : 'Bad' },
                  { value: 'moyenne', emoji: '😐', label: isFrench ? 'Moyenne' : 'Average' },
                  { value: 'tres_intuitive', emoji: '😄', label: isFrench ? 'Très intuitive' : 'Very intuitive' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNoteIntuitivite(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      noteIntuitivite === option.value
                        ? 'border-[#00AEEF] bg-[#e6f7ff]'
                        : 'border-gray-200 hover:border-[#00AEEF]/50'
                    }`}
                  >
                    <span className="text-2xl mr-3">{option.emoji}</span>
                    <span className="font-heading text-[#0077A8]">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 : Améliorations */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-heading text-[#0077A8]">
                  📝 {isFrench ? 'Que devrions-nous améliorer ?' : 'What should we improve?'}
                </label>
                <Button
                  type="button"
                  onClick={startVoiceRecording}
                  variant="ghost"
                  size="sm"
                  disabled={isRecording}
                  className={`rounded-lg ${isRecording ? 'text-red-500 animate-pulse' : 'text-[#0077A8]'}`}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  {isRecording ? '🔴' : '🎤'}
                </Button>
              </div>
              <Textarea
                value={ameliorations}
                onChange={(e) => setAmeliorations(e.target.value)}
                placeholder={isFrench ? 'Vos suggestions...' : 'Your suggestions...'}
                className="min-h-24 border-[#00AEEF]/30 rounded-xl font-body"
              />
              <p className="text-xs text-gray-500 mt-1 font-body">
                {isFrench ? '💡 Cliquez sur le micro pour dicter' : '💡 Click the mic to dictate'}
              </p>
            </div>

            {/* Question 3 : Aide pendant le séjour */}
            <div className="mb-6">
              <label className="text-sm font-heading text-[#0077A8] mb-3 block">
                📊 {isFrench 
                  ? 'L\'application vous a-t-elle aidé pendant votre séjour ?' 
                  : 'Did the app help you during your stay?'} *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'oui', emoji: '✔', label: isFrench ? 'Oui' : 'Yes', color: 'bg-green-500' },
                  { value: 'non', emoji: '❌', label: 'Non', color: 'bg-red-500' },
                  { value: 'un_peu', emoji: '🟧', label: isFrench ? 'Un peu' : 'A bit', color: 'bg-orange-500' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAidePendantSejour(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      aidePendantSejour === option.value
                        ? `border-[#00AEEF] ${option.color} text-white`
                        : 'border-gray-200 hover:border-[#00AEEF]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="font-heading text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton d'envoi */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || createAvisMutation.isPending}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50"
            >
              {createAvisMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isFrench ? '✅ Envoyer mon avis' : '✅ Submit feedback'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}