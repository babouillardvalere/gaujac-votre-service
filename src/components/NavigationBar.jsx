import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { createPageUrl } from '../utils';

const translations = {
  fr: {
    back: 'Précédent',
    home: 'Accueil'
  },
  en: {
    back: 'Back',
    home: 'Home'
  }
};

// Pages où la barre de navigation ne doit pas apparaître
const excludedPages = ['Home', 'ChoixLangue'];

export default function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr'][key];

  // Déterminer la page actuelle depuis le pathname
  const currentPage = location.pathname.replace('/', '') || 'Home';
  
  // Ne pas afficher sur les pages exclues
  if (excludedPages.includes(currentPage)) {
    return null;
  }

  const handleBack = () => {
    // Vérifier s'il y a un historique de navigation
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Sinon retourner à l'accueil
      navigate(createPageUrl('Home'));
    }
  };

  const handleHome = () => {
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#00AEEF]/20 px-4 py-2">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Bouton Précédent */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#e6f7ff] hover:bg-[#00AEEF] hover:text-white text-[#0077A8] transition-all focus:ring-2 focus:ring-[#FFD700] focus:outline-none min-h-[44px]"
          aria-label={t('back')}
          role="button"
          tabIndex={0}
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span className="font-body text-sm hidden sm:inline">{t('back')}</span>
        </button>

        {/* Indicateur de page (optionnel, discret) */}
        <div className="text-xs text-gray-400 font-body hidden md:block">
          {currentPage}
        </div>

        {/* Bouton Accueil */}
        <button
          onClick={handleHome}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF4B2] hover:bg-[#FFD700] text-[#0077A8] transition-all focus:ring-2 focus:ring-[#FFD700] focus:outline-none min-h-[44px]"
          aria-label={t('home')}
          role="button"
          tabIndex={0}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span className="font-body text-sm hidden sm:inline">{t('home')}</span>
        </button>
      </div>
    </div>
  );
}