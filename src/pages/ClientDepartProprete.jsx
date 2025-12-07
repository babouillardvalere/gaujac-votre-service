import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Smile, Meh, Frown } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartProprete() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem('depart_nom');

  const [evaluationProprete, setEvaluationProprete] = useState('');
  const [commentaireProprete, setCommentaireProprete] = useState('');
  const [remarques, setRemarques] = useState('');

  useEffect(() => {
    if (!nom) {
      navigate(createPageUrl('ClientDepartIdentification'));
    }
  }, [nom, navigate]);

  const handleContinue = () => {
    if (!evaluationProprete) {
      toast.error(lang === 'fr' 
        ? 'Veuillez évaluer la propreté'
        : 'Please evaluate cleanliness');
      return;
    }

    if (evaluationProprete === 'pas_satisfaisant' && !commentaireProprete) {
      toast.error(lang === 'fr' 
        ? 'Commentaire obligatoire si propreté insatisfaisante'
        : 'Comment required if cleanliness unsatisfactory');
      return;
    }

    sessionStorage.setItem('depart_proprete_emoji', evaluationProprete);
    sessionStorage.setItem('depart_proprete_commentaire', commentaireProprete);
    sessionStorage.setItem('depart_remarques', remarques);

    navigate(createPageUrl('ClientDepartRecap'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartInventaire'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            🧽 {lang === 'fr' ? 'Propreté & Remarques' : 'Cleanliness & Comments'}
          </h1>

          {/* Propreté */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                {lang === 'fr' 
                  ? 'Comment trouvez-vous la propreté dans laquelle vous laissez le locatif ?'
                  : 'How do you find the cleanliness in which you leave the rental?'}
              </h2>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setEvaluationProprete('pas_satisfaisant')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'pas_satisfaisant'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <Frown className="w-12 h-12 mx-auto mb-2 text-red-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory'}
                  </div>
                </button>

                <button
                  onClick={() => setEvaluationProprete('correct')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'correct'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <Meh className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Correct' : 'Okay'}
                  </div>
                </button>

                <button
                  onClick={() => setEvaluationProprete('tres_propre')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'tres_propre'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <Smile className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Très propre' : 'Very clean'}
                  </div>
                </button>
              </div>

              {evaluationProprete === 'pas_satisfaisant' && (
                <div className="mt-4">
                  <Textarea
                    placeholder={lang === 'fr' 
                      ? 'Expliquez pourquoi (obligatoire)' 
                      : 'Explain why (required)'}
                    value={commentaireProprete}
                    onChange={(e) => setCommentaireProprete(e.target.value)}
                    className="border-2"
                    rows={3}
                  />
                </div>
              )}

              {evaluationProprete === 'correct' && (
                <div className="mt-4">
                  <Textarea
                    placeholder={lang === 'fr' 
                      ? 'Commentaire facultatif' 
                      : 'Optional comment'}
                    value={commentaireProprete}
                    onChange={(e) => setCommentaireProprete(e.target.value)}
                    className="border-2"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarques */}
          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                💬 {lang === 'fr' ? 'Remarques ou suggestions' : 'Comments or suggestions'}
              </h2>
              <Textarea
                placeholder={lang === 'fr' 
                  ? 'Avez-vous des remarques sur votre séjour ?' 
                  : 'Any comments about your stay?'}
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                className="border-2"
                rows={4}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleContinue}
            disabled={!evaluationProprete}
            className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading disabled:opacity-50"
          >
            {lang === 'fr' ? 'Continuer vers récapitulatif' : 'Continue to summary'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}