import React, { useEffect } from 'react';
import AccessibilityPanel, { getAccessibilitySettings, applyAccessibilityStyles } from './components/AccessibilityPanel';
import NavigationBar from './components/NavigationBar';

export default function Layout({ children }) {
  useEffect(() => {
    // Appliquer les paramètres d'accessibilité au chargement
    const settings = getAccessibilitySettings();
    applyAccessibilityStyles(settings);

    // Gestion de la touche Échap pour fermer les modales
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        dialogs.forEach(dialog => {
          const closeBtn = dialog.querySelector('[aria-label*="ermer"], [aria-label*="nnuler"]');
          if (closeBtn) closeBtn.click();
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen relative" role="application" aria-label="Application Camping Paradis">
      {/* Import des polices + styles accessibilité */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Times+New+Roman&family=Montserrat:wght@600;700&display=swap');
        
        :root {
          --camping-blue: #00AEEF;
          --camping-blue-dark: #0077A8;
          --camping-yellow: #FFD700;
          --camping-yellow-light: #FFF4B2;
          --camping-orange: #FFA500;
          --camping-white: #FFFFFF;
          --camping-gray-light: #F5F5F5;
          --camping-text: #333333;
        }
        
        .font-handwritten {
          font-family: 'Caveat', cursive;
        }
        
        .font-heading {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
        }
        
        .font-body {
          font-family: 'Times New Roman', Times, serif;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #333333;
        }
        
        h1, h2, h3 {
          font-family: 'Caveat', cursive;
          color: #0077A8;
        }
        
        /* Boutons principaux */
        .btn-camping-primary {
          background-color: #00AEEF !important;
          color: white !important;
          border-radius: 12px !important;
        }
        
        .btn-camping-primary:hover {
          background-color: #0077A8 !important;
        }
        
        .btn-camping-secondary {
          background-color: #FFD700 !important;
          color: #0077A8 !important;
          border-radius: 12px !important;
        }
        
        /* Cartes */
        .card-camping {
          background: white;
          border: 2px solid #00AEEF;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 174, 239, 0.15);
        }

        /* === ACCESSIBILITÉ === */
        
        /* Focus visible pour navigation clavier */
        *:focus {
          outline: 3px solid #FFD700 !important;
          outline-offset: 2px !important;
        }
        
        *:focus:not(:focus-visible) {
          outline: none !important;
        }
        
        *:focus-visible {
          outline: 3px solid #FFD700 !important;
          outline-offset: 2px !important;
        }

        /* Zones cliquables minimum 44px */
        button, a, [role="button"], [tabindex="0"], 
        input[type="checkbox"], input[type="radio"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Skip link pour navigation clavier */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #0077A8;
          color: white;
          padding: 8px 16px;
          z-index: 100;
          text-decoration: none;
        }
        .skip-link:focus {
          top: 0;
        }

        /* Texte caché pour lecteurs d'écran */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Mode contraste élevé */
        .high-contrast-mode {
          background: #000 !important;
          color: #FFFF00 !important;
        }
        .high-contrast-mode * {
          background-color: #000 !important;
          color: #FFFF00 !important;
          border-color: #FFFF00 !important;
        }
        .high-contrast-mode button, 
        .high-contrast-mode a,
        .high-contrast-mode [role="button"] {
          background-color: #222 !important;
          color: #FFFF00 !important;
          border: 2px solid #FFFF00 !important;
        }
        .high-contrast-mode input, 
        .high-contrast-mode textarea, 
        .high-contrast-mode select {
          background-color: #111 !important;
          color: #FFFF00 !important;
          border: 2px solid #FFFF00 !important;
        }
        .high-contrast-mode img {
          filter: grayscale(100%) contrast(1.2);
        }
        .high-contrast-mode .fixed.bottom-20 {
          background-color: #FFFF00 !important;
          color: #000 !important;
        }

        /* Espacement suffisant entre éléments */
        button + button, 
        a + a,
        .gap-2 > * {
          margin-top: 0;
        }
      `}</style>

      {/* Skip link pour accessibilité clavier */}
      <a href="#main-content" className="skip-link" tabIndex={0}>
        Aller au contenu principal
      </a>

      {/* Fond thématique camping */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e6f7ff] via-white to-[#fff9e6]" />
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] opacity-20 blur-2xl" />
        <svg className="absolute bottom-0 left-0 right-0 opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{height: '200px', width: '100%'}}>
          <path fill="#00AEEF" d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute bottom-20 left-10 opacity-10" width="100" height="150" viewBox="0 0 100 150">
          <ellipse cx="50" cy="40" rx="40" ry="50" fill="#22c55e"/>
          <rect x="45" y="80" width="10" height="60" fill="#8B4513"/>
        </svg>
        <svg className="absolute bottom-24 right-20 opacity-10" width="80" height="120" viewBox="0 0 100 150">
          <ellipse cx="50" cy="40" rx="40" ry="50" fill="#22c55e"/>
          <rect x="45" y="80" width="10" height="60" fill="#8B4513"/>
        </svg>
        <svg className="absolute bottom-10 left-1/4 opacity-5" width="120" height="80" viewBox="0 0 120 80">
          <rect x="10" y="30" width="100" height="40" rx="5" fill="#0077A8"/>
          <rect x="20" y="40" width="20" height="15" fill="#fff"/>
          <rect x="50" y="40" width="20" height="15" fill="#fff"/>
          <rect x="80" y="35" width="20" height="30" fill="#FFD700"/>
          <polygon points="10,30 60,5 110,30" fill="#FFA500"/>
        </svg>
      </div>

      {/* Slogan discret */}
      <div className="fixed bottom-4 right-4 z-10 opacity-40 pointer-events-none hidden md:block" aria-hidden="true">
        <p className="font-handwritten text-white text-sm drop-shadow-lg" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>
          Camping Paradis – Le Domaine de Gaujac à votre service !
        </p>
      </div>

      {/* Contenu principal */}
      <main id="main-content" className="relative z-0" role="main" tabIndex={-1}>
        {children}
      </main>

      {/* Panneau d'accessibilité global */}
      <AccessibilityPanel />
    </div>
  );
}