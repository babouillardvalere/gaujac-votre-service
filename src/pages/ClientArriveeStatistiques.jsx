import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Users, Dog, Cat, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientArriveeStatistiques() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre_adultes: 2,
    nombre_adolescents: 0,
    nombre_enfants: 0,
    nombre_bebes: 0,
    a_animaux: false,
    nombre_chiens: 0,
    nombre_chats: 0,
    autres_animaux: ''
  });

  const dossierId = sessionStorage.getItem('arrivee_dossier_id');

  useEffect(() => {
    if (!dossierId) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
  }, [dossierId, navigate]);

  const handleIncrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.min(prev[field] + 1, 20) }));
  };

  const handleDecrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(prev[field] - 1, 0) }));
  };

  const handleSubmit = async () => {
    const totalPersonnes = formData.nombre_adultes + formData.nombre_adolescents + 
                          formData.nombre_enfants + formData.nombre_bebes;

    if (totalPersonnes === 0) {
      toast.error(lang === 'fr' 
        ? 'Au moins une personne est requise'
        : 'At least one person is required');
      return;
    }

    try {
      await base44.entities.DossierArrivee.update(dossierId, {
        nombre_adultes: formData.nombre_adultes,
        nombre_adolescents: formData.nombre_adolescents,
        nombre_enfants: formData.nombre_enfants,
        nombre_bebes: formData.nombre_bebes,
        nombre_animaux: formData.a_animaux ? 
          (formData.nombre_chiens + formData.nombre_chats) : 0,
        nombre_chiens: formData.nombre_chiens,
        nombre_chats: formData.nombre_chats,
        autres_animaux: formData.autres_animaux,
        etape_actuelle: 3
      });

      sessionStorage.setItem('arrivee_nombre_adultes', formData.nombre_adultes);
      sessionStorage.setItem('arrivee_nombre_enfants', formData.nombre_enfants + formData.nombre_adolescents + formData.nombre_bebes);
      sessionStorage.setItem('arrivee_nombre_animaux', formData.a_animaux ? 
        (formData.nombre_chiens + formData.nombre_chats) : 0);

      navigate(createPageUrl('ClientArriveeHebergement'));
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientArriveeIdentite'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' ? 'Arrivée' : 'Arrival'}
          </h1>

          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <ArriveeProgressBar etapeActuelle={2} lang={lang} />
            </CardContent>
          </Card>

          <Card className="border-2 border-[#22c55e]/30 rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* Nombre de personnes */}
              <div>
                <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {lang === 'fr' ? 'Combien de personnes séjournent avec vous ?' : 'How many people are staying with you?'}
                </h2>

                <div className="space-y-3">
                  {/* Adultes */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="font-heading text-gray-700">
                      👨‍👩 {lang === 'fr' ? 'Adultes (18+)' : 'Adults (18+)'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecrement('nombre_adultes')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-blue-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{formData.nombre_adultes}</span>
                      <button
                        onClick={() => handleIncrement('nombre_adultes')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-blue-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Adolescents */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="font-heading text-gray-700">
                      🧑‍🦱 {lang === 'fr' ? 'Adolescents (13-17 ans)' : 'Teenagers (13-17)'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecrement('nombre_adolescents')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-purple-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{formData.nombre_adolescents}</span>
                      <button
                        onClick={() => handleIncrement('nombre_adolescents')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-purple-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enfants */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="font-heading text-gray-700">
                      👧 {lang === 'fr' ? 'Enfants (3-12 ans)' : 'Children (3-12)'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecrement('nombre_enfants')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-green-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{formData.nombre_enfants}</span>
                      <button
                        onClick={() => handleIncrement('nombre_enfants')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-green-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bébés */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                    <span className="font-heading text-gray-700">
                      👶 {lang === 'fr' ? 'Bébés (0-2 ans)' : 'Babies (0-2)'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecrement('nombre_bebes')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-yellow-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{formData.nombre_bebes}</span>
                      <button
                        onClick={() => handleIncrement('nombre_bebes')}
                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-yellow-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animaux */}
              <div>
                <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                  <Dog className="w-6 h-6" />
                  {lang === 'fr' ? 'Avez-vous des animaux ?' : 'Do you have pets?'}
                </h2>

                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, a_animaux: true }))}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      formData.a_animaux ? 'bg-green-100 border-green-400' : 'border-gray-300'
                    }`}
                  >
                    <span className="font-heading">{lang === 'fr' ? 'Oui' : 'Yes'}</span>
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      a_animaux: false,
                      nombre_chiens: 0,
                      nombre_chats: 0,
                      autres_animaux: ''
                    }))}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      !formData.a_animaux ? 'bg-gray-100 border-gray-400' : 'border-gray-300'
                    }`}
                  >
                    <span className="font-heading">{lang === 'fr' ? 'Non' : 'No'}</span>
                  </button>
                </div>

                {formData.a_animaux && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                      <span className="font-heading text-gray-700 flex items-center gap-2">
                        <Dog className="w-5 h-5" />
                        {lang === 'fr' ? 'Chiens' : 'Dogs'}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrement('nombre_chiens')}
                          className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-orange-400"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{formData.nombre_chiens}</span>
                        <button
                          onClick={() => handleIncrement('nombre_chiens')}
                          className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-orange-400"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                      <span className="font-heading text-gray-700 flex items-center gap-2">
                        <Cat className="w-5 h-5" />
                        {lang === 'fr' ? 'Chats' : 'Cats'}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrement('nombre_chats')}
                          className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-pink-400"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{formData.nombre_chats}</span>
                        <button
                          onClick={() => handleIncrement('nombre_chats')}
                          className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-pink-400"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading"
              >
                {lang === 'fr' ? 'Valider et continuer' : 'Validate and continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}