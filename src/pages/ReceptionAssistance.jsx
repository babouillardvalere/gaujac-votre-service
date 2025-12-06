import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Home, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ReceptionAssistance({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const options = [
    {
      id: 'arrivee',
      title: lang === 'fr' ? '🏡 Aider un client - ARRIVÉE' : '🏡 Help a guest - ARRIVAL',
      description: lang === 'fr' ? 'Faire la procédure d\'arrivée à la place du client' : 'Complete arrival procedure for guest',
      color: 'bg-[#22c55e] hover:bg-[#16a34a]',
      route: 'ReceptionAideArrivee'
    },
    {
      id: 'sejour',
      title: lang === 'fr' ? '🛠 Aider un client - SÉJOUR' : '🛠 Help a guest - STAY',
      description: lang === 'fr' ? 'Créer une intervention à la place du client' : 'Create intervention for guest',
      color: 'bg-[#00AEEF] hover:bg-[#0077A8]',
      route: 'ReceptionAideSejour'
    },
    {
      id: 'depart',
      title: lang === 'fr' ? '🚗 Aider un client - DÉPART' : '🚗 Help a guest - DEPARTURE',
      description: lang === 'fr' ? 'Faire la procédure de départ à la place du client' : 'Complete departure procedure for guest',
      color: 'bg-[#FFA500] hover:bg-[#FF8C00]',
      route: 'ReceptionAideDepart'
    }
  ];

  const content = (
    <>
      {!embedded && (
        <>
          <button
            onClick={() => navigate(createPageUrl('Reception'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour à Réception' : 'Back to Reception'}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-red-600 text-center mb-2">
            🆘 {lang === 'fr' ? 'Assistance Client' : 'Guest Assistance'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' 
              ? 'Effectuer les procédures à la place d\'un client'
              : 'Complete procedures on behalf of a guest'}
          </p>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map(option => (
          <motion.button
            key={option.id}
            onClick={() => navigate(createPageUrl(option.route))}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="focus:ring-4 focus:ring-[#FFD700] rounded-xl"
          >
            <Card className={`${option.color} border-0 rounded-xl h-full transition-all`}>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl mb-3 text-white">
                  {option.title}
                </h2>
                <p className="text-sm text-white">
                  {option.description}
                </p>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>

      <Card className="border-2 border-blue-300 bg-blue-50 rounded-xl mt-8">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 font-body">
            💡 {lang === 'fr'
              ? 'Ces procédures sont identiques à celles des clients, mais optimisées pour la réception. Vous pouvez tout modifier manuellement et ajouter des remarques internes.'
              : 'These procedures are identical to guest procedures, but optimized for reception. You can manually edit everything and add internal notes.'}
          </p>
        </CardContent>
      </Card>
    </>
  );

  if (embedded) {
    return <div className="max-w-4xl mx-auto">{content}</div>;
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {content}
        </motion.div>
      </div>
    </div>
  );
}