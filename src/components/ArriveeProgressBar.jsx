import React from 'react';
import { Check, Clock, Lock } from 'lucide-react';

export default function ArriveeProgressBar({ etapeActuelle, etapes, lang = 'fr' }) {
  const steps = [
    {
      numero: 1,
      titre_fr: 'Informations d\'arrivée',
      titre_en: 'Arrival information',
      icon: '📝'
    },
    {
      numero: 2,
      titre_fr: 'Choix du locatif',
      titre_en: 'Accommodation choice',
      icon: '🏠'
    },
    {
      numero: 3,
      titre_fr: 'Contrôle inventaire',
      titre_en: 'Inventory check',
      icon: '✔️'
    },
    {
      numero: 4,
      titre_fr: 'Validation & envoi',
      titre_en: 'Validation & send',
      icon: '📤'
    }
  ];

  const getStepStatus = (stepNumber) => {
    if (etapes && etapes[`etape_${stepNumber}_terminee`]) {
      return 'completed';
    }
    if (stepNumber === etapeActuelle) {
      return 'current';
    }
    if (stepNumber < etapeActuelle) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Ligne de progression */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div 
            className="h-full bg-[#22c55e] transition-all duration-500"
            style={{ width: `${((etapeActuelle - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const status = getStepStatus(step.numero);
          
          return (
            <div key={step.numero} className="flex flex-col items-center w-1/4">
              {/* Cercle d'étape */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 transition-all border-2 ${
                  status === 'completed' 
                    ? 'bg-[#22c55e] border-[#22c55e] text-white' 
                    : status === 'current'
                      ? 'bg-[#00AEEF] border-[#00AEEF] text-white animate-pulse'
                      : 'bg-gray-200 border-gray-300 text-gray-400'
                }`}
              >
                {status === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : status === 'current' ? (
                  <Clock className="w-6 h-6" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              {/* Emoji */}
              <div className={`text-2xl mb-1 ${status === 'pending' ? 'grayscale opacity-50' : ''}`}>
                {step.icon}
              </div>

              {/* Titre */}
              <p className={`text-xs text-center font-heading ${
                status === 'completed' ? 'text-[#22c55e] font-bold' :
                status === 'current' ? 'text-[#00AEEF] font-bold' :
                'text-gray-400'
              }`}>
                {lang === 'fr' ? step.titre_fr : step.titre_en}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}