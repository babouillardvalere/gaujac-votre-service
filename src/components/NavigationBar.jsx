import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { createPageUrl } from '../utils';
import Breadcrumbs from './Breadcrumbs';

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

  // Déterminer si on est dans une zone collaborateur
  const isCollaboratorArea = currentPage.includes('Collaborateur') || 
                             currentPage.includes('Technique') || 
                             currentPage.includes('Menage') || 
                             currentPage.includes('Reception') || 
                             currentPage.includes('Materiel') || 
                             currentPage.includes('Bureau') ||
                             currentPage.includes('Notifications') ||
                             currentPage.includes('Statistiques');

  return (
    <>
      <div className={`sticky top-0 z-40 backdrop-blur-sm border-b px-4 py-2 ${
        isCollaboratorArea 
          ? 'bg-[#0077A8]/95 border-[#00AEEF]' 
          : 'bg-white/95 border-[#00AEEF]/20'
      }`}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Bouton Précédent */}
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all focus:ring-2 focus:ring-[#FFD700] focus:outline-none min-h-[44px] ${
              isCollaboratorArea
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-[#e6f7ff] hover:bg-[#00AEEF] hover:text-white text-[#0077A8]'
            }`}
            aria-label={t('back')}
            role="button"
            tabIndex={0}
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span className="font-body text-sm hidden sm:inline">{t('back')}</span>
          </button>

          {/* Badge zone collaborateur */}
          {isCollaboratorArea && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#FFD700] rounded-full">
              <span className="text-xs font-heading text-[#0077A8]">👨‍💼 STAFF</span>
            </div>
          )}

          {/* Bouton Accueil */}
          <button
            onClick={handleHome}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all focus:ring-2 focus:ring-[#FFD700] focus:outline-none min-h-[44px] ${
              isCollaboratorArea
                ? 'bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8]'
                : 'bg-[#FFF4B2] hover:bg-[#FFD700] text-[#0077A8]'
            }`}
            aria-label={t('home')}
            role="button"
            tabIndex={0}
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span className="font-body text-sm hidden sm:inline">{t('home')}</span>
          </button>
        </div>
      </div>
      <Breadcrumbs />
    </>
  );
}