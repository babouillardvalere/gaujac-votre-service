import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Accessibility, Plus, Minus, RotateCcw, Eye, Volume2, VolumeX, X } from 'lucide-react';

const STORAGE_KEY = 'camping_accessibility_settings';

const defaultSettings = {
  fontSize: 100,
  highContrast: false,
  speechEnabled: false
};

export const getAccessibilitySettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveAccessibilitySettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applyAccessibilityStyles(settings);
  window.dispatchEvent(new CustomEvent('accessibilitychange', { detail: settings }));
};

export const applyAccessibilityStyles = (settings) => {
  document.documentElement.style.fontSize = `${settings.fontSize}%`;
  
  if (settings.highContrast) {
    document.body.classList.add('high-contrast-mode');
  } else {
    document.body.classList.remove('high-contrast-mode');
  }
};

export const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = sessionStorage.getItem('user_language') === 'en' ? 'en-US' : 'fr-FR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const readPageContent = () => {
  const mainContent = document.querySelector('main') || document.body;
  const headings = mainContent.querySelectorAll('h1, h2, h3');
  const paragraphs = mainContent.querySelectorAll('p, label, span.font-body');
  
  let textToRead = '';
  headings.forEach(h => { textToRead += h.textContent + '. '; });
  paragraphs.forEach(p => { 
    if (p.textContent.trim()) textToRead += p.textContent + '. '; 
  });
  
  speakText(textToRead.slice(0, 2000));
};

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loaded = getAccessibilitySettings();
    setSettings(loaded);
    applyAccessibilityStyles(loaded);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    style.textContent = `
      .high-contrast-mode {
        background: #000 !important;
        color: #FFFF00 !important;
      }
      .high-contrast-mode * {
        background-color: #000 !important;
        color: #FFFF00 !important;
        border-color: #FFFF00 !important;
      }
      .high-contrast-mode button, .high-contrast-mode a {
        background-color: #333 !important;
        color: #FFFF00 !important;
        border: 2px solid #FFFF00 !important;
      }
      .high-contrast-mode input, .high-contrast-mode textarea, .high-contrast-mode select {
        background-color: #111 !important;
        color: #FFFF00 !important;
        border: 2px solid #FFFF00 !important;
      }
      .high-contrast-mode img {
        filter: grayscale(100%) contrast(1.2);
      }
      
      *:focus {
        outline: 3px solid #FFD700 !important;
        outline-offset: 2px !important;
      }
      
      button, a, input, textarea, select, [role="button"], [tabindex="0"] {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    
    const existing = document.getElementById('accessibility-styles');
    if (existing) existing.remove();
    document.head.appendChild(style);
    
    return () => {
      const el = document.getElementById('accessibility-styles');
      if (el) el.remove();
    };
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveAccessibilitySettings(newSettings);
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSetting('fontSize', settings.fontSize + 10);
      speakText('Texte agrandi');
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      updateSetting('fontSize', settings.fontSize - 10);
      speakText('Texte réduit');
    }
  };

  const resetFontSize = () => {
    updateSetting('fontSize', 100);
    speakText('Taille de texte réinitialisée');
  };

  const toggleHighContrast = () => {
    updateSetting('highContrast', !settings.highContrast);
    speakText(settings.highContrast ? 'Contraste normal' : 'Contraste élevé activé');
  };

  const handleReadPage = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      readPageContent();
      setIsSpeaking(true);
      
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 500);
    }
  };

  return (
    <>
      {/* Bouton flottant accessibilité */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#0077A8] hover:bg-[#005f85] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:ring-4 focus:ring-[#FFD700]"
        aria-label="Ouvrir le panneau d'accessibilité"
        role="button"
        tabIndex={0}
      >
        <Accessibility className="w-7 h-7" aria-hidden="true" />
      </button>

      {/* Panneau accessibilité */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-md"
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-describedby="accessibility-description"
        >
          <DialogHeader>
            <DialogTitle id="accessibility-title" className="font-heading text-[#0077A8] flex items-center gap-2 text-xl">
              <Accessibility className="w-6 h-6" aria-hidden="true" />
              ♿ Accessibilité
            </DialogTitle>
          </DialogHeader>
          
          <p id="accessibility-description" className="sr-only">
            Panneau de réglages d'accessibilité pour ajuster la taille du texte, le contraste et la lecture vocale
          </p>

          <div className="space-y-6 py-4">
            {/* Taille du texte */}
            <div className="space-y-3">
              <h3 className="font-heading text-[#0077A8] text-lg">📝 Taille du texte</h3>
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={decreaseFontSize}
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold border-2 border-[#00AEEF] rounded-xl hover:bg-[#e6f7ff]"
                  aria-label="Réduire la taille du texte"
                  disabled={settings.fontSize <= 80}
                >
                  <Minus className="w-5 h-5 mr-2" aria-hidden="true" />
                  A-
                </Button>
                <div 
                  className="w-20 h-14 flex items-center justify-center bg-[#e6f7ff] rounded-xl font-heading text-[#0077A8] text-lg"
                  aria-live="polite"
                  aria-label={`Taille actuelle: ${settings.fontSize} pourcent`}
                >
                  {settings.fontSize}%
                </div>
                <Button
                  onClick={increaseFontSize}
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold border-2 border-[#00AEEF] rounded-xl hover:bg-[#e6f7ff]"
                  aria-label="Agrandir la taille du texte"
                  disabled={settings.fontSize >= 150}
                >
                  <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                  A+
                </Button>
              </div>
              <Button
                onClick={resetFontSize}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:bg-gray-100 rounded-xl"
                aria-label="Réinitialiser la taille du texte"
              >
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                Réinitialiser
              </Button>
            </div>

            {/* Contraste élevé */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-[#0077A8]" aria-hidden="true" />
                <div>
                  <p className="font-heading text-[#0077A8]">👁 Contraste élevé</p>
                  <p className="text-sm text-gray-600 font-body">Fond noir, texte jaune</p>
                </div>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
                aria-label="Activer ou désactiver le contraste élevé"
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            {/* Lecture vocale */}
            <div className="space-y-3">
              <h3 className="font-heading text-[#0077A8] text-lg">🔊 Lecture vocale</h3>
              <Button
                onClick={handleReadPage}
                className={`w-full h-14 rounded-xl font-heading text-lg ${
                  isSpeaking 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-[#00AEEF] hover:bg-[#0077A8] text-white'
                }`}
                aria-label={isSpeaking ? "Arrêter la lecture vocale" : "Lire cette page"}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-5 h-5 mr-2" aria-hidden="true" />
                    Arrêter la lecture
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" aria-hidden="true" />
                    📖 Lire cette page
                  </>
                )}
              </Button>
            </div>

            {/* Info accessibilité */}
            <div className="bg-[#FFF4B2] rounded-xl p-4 border border-[#FFD700]">
              <p className="text-sm font-body text-[#0077A8]">
                <strong>💡 Astuce :</strong> Utilisez la touche TAB pour naviguer au clavier, 
                ENTRÉE pour activer les boutons, et ÉCHAP pour fermer les fenêtres.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsOpen(false)}
            className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-heading"
            aria-label="Fermer le panneau d'accessibilité"
          >
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}