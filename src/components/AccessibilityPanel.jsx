import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Accessibility, Plus, Minus, RotateCcw, Eye, Volume2, VolumeX, X } from 'lucide-react';

const STORAGE_KEY = 'camping_accessibility_settings';

const translations = {
  fr: {
    accessibility: 'Accessibilité',
    open_panel: 'Ouvrir le panneau d\'accessibilité',
    text_size: 'Taille du texte',
    reduce_text: 'Réduire la taille du texte',
    increase_text: 'Agrandir la taille du texte',
    reset: 'Réinitialiser',
    high_contrast: 'Contraste élevé',
    high_contrast_desc: 'Fond noir, texte jaune',
    speech: 'Lecture vocale',
    speech_desc: 'Lit à voix haute les éléments survolés ou touchés',
    speech_on: 'Lecture vocale activée',
    speech_off: 'Lecture vocale désactivée',
    read_page: 'Lire cette page',
    stop_reading: 'Arrêter la lecture',
    tip: 'Astuce',
    tip_text: 'Utilisez la touche TAB pour naviguer au clavier, ENTRÉE pour activer les boutons, et ÉCHAP pour fermer les fenêtres.',
    close: 'Fermer',
    text_increased: 'Texte agrandi',
    text_decreased: 'Texte réduit',
    text_reset: 'Taille de texte réinitialisée',
    contrast_on: 'Contraste élevé activé',
    contrast_off: 'Contraste normal',
    current_size: 'Taille actuelle'
  },
  en: {
    accessibility: 'Accessibility',
    open_panel: 'Open accessibility panel',
    text_size: 'Text size',
    reduce_text: 'Reduce text size',
    increase_text: 'Increase text size',
    reset: 'Reset',
    high_contrast: 'High contrast',
    high_contrast_desc: 'Black background, yellow text',
    speech: 'Voice reading',
    speech_desc: 'Reads hovered or touched elements aloud',
    speech_on: 'Voice reading enabled',
    speech_off: 'Voice reading disabled',
    read_page: 'Read this page',
    stop_reading: 'Stop reading',
    tip: 'Tip',
    tip_text: 'Use TAB key to navigate, ENTER to activate buttons, and ESC to close dialogs.',
    close: 'Close',
    text_increased: 'Text increased',
    text_decreased: 'Text decreased',
    text_reset: 'Text size reset',
    contrast_on: 'High contrast enabled',
    contrast_off: 'Normal contrast',
    current_size: 'Current size'
  }
};

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
  
  // Mettre à jour l'attribut pour le speech
  if (settings.speechEnabled) {
    document.body.setAttribute('data-speech-enabled', 'true');
  } else {
    document.body.removeAttribute('data-speech-enabled');
  }
};

export const speakText = (text, force = false) => {
  const settings = getAccessibilitySettings();
  if (!force && !settings.speechEnabled) return;
  
  if ('speechSynthesis' in window && text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = sessionStorage.getItem('user_language') || 'fr';
    utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Essayer de trouver une voix native
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(lang === 'en' ? 'en' : 'fr') && v.localService
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
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
  
  speakText(textToRead.slice(0, 2000), true);
};

// Hook pour la lecture vocale interactive
export const useSpeechOnInteraction = () => {
  useEffect(() => {
    const handleInteraction = (e) => {
      const settings = getAccessibilitySettings();
      if (!settings.speechEnabled) return;
      
      const target = e.target;
      if (!target || !target.getAttribute) return;
      
      let textToSpeak = '';
      
      // Priorité: aria-label > aria-labelledby > title > alt > textContent
      if (target.getAttribute('aria-label')) {
        textToSpeak = target.getAttribute('aria-label');
      } else if (target.getAttribute('aria-labelledby')) {
        const labelId = target.getAttribute('aria-labelledby');
        const labelEl = document.getElementById(labelId);
        if (labelEl) textToSpeak = labelEl.textContent;
      } else if (target.getAttribute('title')) {
        textToSpeak = target.getAttribute('title');
      } else if (target.tagName === 'IMG' && target.getAttribute('alt')) {
        textToSpeak = target.getAttribute('alt');
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const label = document.querySelector(`label[for="${target.id}"]`);
        if (label) {
          textToSpeak = label.textContent;
        } else if (target.placeholder) {
          textToSpeak = target.placeholder;
        }
        if (target.type === 'checkbox') {
          textToSpeak += target.checked ? ' coché' : ' non coché';
        }
      } else if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
        textToSpeak = target.textContent?.trim() || target.getAttribute('aria-label') || '';
      } else if (target.tagName === 'A') {
        textToSpeak = target.textContent?.trim() || target.getAttribute('aria-label') || 'Lien';
      } else if (target.closest('button') || target.closest('[role="button"]')) {
        const btn = target.closest('button') || target.closest('[role="button"]');
        textToSpeak = btn.getAttribute('aria-label') || btn.textContent?.trim() || '';
      } else {
        // Pour les autres éléments, essayer le texte visible
        const text = target.textContent?.trim();
        if (text && text.length < 200) {
          textToSpeak = text;
        }
      }
      
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    };
    
    // Écouter les événements de survol et de focus
    document.addEventListener('mouseenter', handleInteraction, true);
    document.addEventListener('focus', handleInteraction, true);
    document.addEventListener('touchstart', handleInteraction, true);
    
    return () => {
      document.removeEventListener('mouseenter', handleInteraction, true);
      document.removeEventListener('focus', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
    };
  }, []);
};

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuickButtons, setShowQuickButtons] = useState(false);
  
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;

  // Activer la lecture vocale interactive
  useSpeechOnInteraction();

  useEffect(() => {
    const loaded = getAccessibilitySettings();
    setSettings(loaded);
    applyAccessibilityStyles(loaded);
    
    // Charger les voix
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
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
      
      /* Animation pour indiquer que la lecture vocale est active */
      body[data-speech-enabled="true"] *:hover,
      body[data-speech-enabled="true"] *:focus {
        outline: 2px dashed #00AEEF !important;
        outline-offset: 2px;
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

  const updateSetting = useCallback((key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveAccessibilitySettings(newSettings);
  }, [settings]);

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSetting('fontSize', settings.fontSize + 10);
      speakText(t('text_increased'), true);
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      updateSetting('fontSize', settings.fontSize - 10);
      speakText(t('text_decreased'), true);
    }
  };

  const resetFontSize = () => {
    updateSetting('fontSize', 100);
    speakText(t('text_reset'), true);
  };

  const toggleHighContrast = () => {
    const newValue = !settings.highContrast;
    updateSetting('highContrast', newValue);
    speakText(newValue ? t('contrast_on') : t('contrast_off'), true);
  };

  const toggleSpeech = () => {
    const newValue = !settings.speechEnabled;
    updateSetting('speechEnabled', newValue);
    speakText(newValue ? t('speech_on') : t('speech_off'), true);
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
      {/* Boutons rapides A+/A- persistants */}
      {showQuickButtons && (
        <div className="fixed bottom-36 right-4 z-50 flex flex-col gap-2">
          <button
            onClick={increaseFontSize}
            disabled={settings.fontSize >= 150}
            className="w-12 h-12 bg-[#00AEEF] hover:bg-[#0077A8] disabled:bg-gray-300 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-lg transition-all focus:ring-4 focus:ring-[#FFD700]"
            aria-label={t('increase_text')}
          >
            A+
          </button>
          <button
            onClick={decreaseFontSize}
            disabled={settings.fontSize <= 80}
            className="w-12 h-12 bg-[#00AEEF] hover:bg-[#0077A8] disabled:bg-gray-300 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-lg transition-all focus:ring-4 focus:ring-[#FFD700]"
            aria-label={t('reduce_text')}
          >
            A-
          </button>
          {settings.speechEnabled && (
            <button
              onClick={() => { stopSpeaking(); toggleSpeech(); }}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all focus:ring-4 focus:ring-[#FFD700] animate-pulse"
              aria-label={t('speech_off')}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Bouton flottant accessibilité */}
      <button
        onClick={() => {
          setIsOpen(true);
          setShowQuickButtons(true);
        }}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#0077A8] hover:bg-[#005f85] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:ring-4 focus:ring-[#FFD700]"
        aria-label={t('open_panel')}
        role="button"
        tabIndex={0}
      >
        <Accessibility className="w-7 h-7" aria-hidden="true" />
      </button>

      {/* Indicateur lecture vocale active */}
      {settings.speechEnabled && (
        <div className="fixed bottom-20 right-20 z-40 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
          <Volume2 className="w-3 h-3" />
          ON
        </div>
      )}

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
              ♿ {t('accessibility')}
            </DialogTitle>
          </DialogHeader>
          
          <p id="accessibility-description" className="sr-only">
            {t('tip_text')}
          </p>

          <div className="space-y-6 py-4">
            {/* Taille du texte */}
            <div className="space-y-3">
              <h3 className="font-heading text-[#0077A8] text-lg">📝 {t('text_size')}</h3>
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={decreaseFontSize}
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold border-2 border-[#00AEEF] rounded-xl hover:bg-[#e6f7ff]"
                  aria-label={t('reduce_text')}
                  disabled={settings.fontSize <= 80}
                >
                  <Minus className="w-5 h-5 mr-2" aria-hidden="true" />
                  A-
                </Button>
                <div 
                  className="w-20 h-14 flex items-center justify-center bg-[#e6f7ff] rounded-xl font-heading text-[#0077A8] text-lg"
                  aria-live="polite"
                  aria-label={`${t('current_size')}: ${settings.fontSize}%`}
                >
                  {settings.fontSize}%
                </div>
                <Button
                  onClick={increaseFontSize}
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold border-2 border-[#00AEEF] rounded-xl hover:bg-[#e6f7ff]"
                  aria-label={t('increase_text')}
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
                aria-label={t('reset')}
              >
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('reset')}
              </Button>
            </div>

            {/* Lecture vocale interactive - NOUVEAU */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-green-600" aria-hidden="true" />
                <div>
                  <p className="font-heading text-green-700">🔊 {t('speech')}</p>
                  <p className="text-xs text-green-600 font-body">{t('speech_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.speechEnabled}
                onCheckedChange={toggleSpeech}
                aria-label={settings.speechEnabled ? t('speech_off') : t('speech_on')}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Contraste élevé */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-[#0077A8]" aria-hidden="true" />
                <div>
                  <p className="font-heading text-[#0077A8]">👁 {t('high_contrast')}</p>
                  <p className="text-sm text-gray-600 font-body">{t('high_contrast_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
                aria-label={t('high_contrast')}
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            {/* Lecture de page complète */}
            <div className="space-y-3">
              <Button
                onClick={handleReadPage}
                className={`w-full h-14 rounded-xl font-heading text-lg ${
                  isSpeaking 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-[#00AEEF] hover:bg-[#0077A8] text-white'
                }`}
                aria-label={isSpeaking ? t('stop_reading') : t('read_page')}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-5 h-5 mr-2" aria-hidden="true" />
                    {t('stop_reading')}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" aria-hidden="true" />
                    📖 {t('read_page')}
                  </>
                )}
              </Button>
            </div>

            {/* Info accessibilité */}
            <div className="bg-[#FFF4B2] rounded-xl p-4 border border-[#FFD700]">
              <p className="text-sm font-body text-[#0077A8]">
                <strong>💡 {t('tip')} :</strong> {t('tip_text')}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsOpen(false)}
            className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-heading"
            aria-label={t('close')}
          >
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('close')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}