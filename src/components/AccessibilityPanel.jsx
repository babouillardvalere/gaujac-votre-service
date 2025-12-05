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
    current_size: 'Taille actuelle',
    // Nouvelles traductions
    daltonism_mode: 'Mode Daltonien',
    daltonism_desc: 'Adapter les couleurs pour les différents types de daltonisme',
    disabled: 'Désactivé',
    protanopia: 'Protanopie',
    deuteranopia: 'Deutéranopie',
    tritanopia: 'Tritanopie',
    easy_reading: 'Mode facile à lire',
    easy_reading_desc: 'Phrases courtes et vocabulaire simplifié',
    focus_mode: 'Mode concentration',
    focus_mode_desc: 'Réduit les distractions visuelles (TDAH)',
    big_buttons: 'Navigation simplifiée',
    big_buttons_desc: 'Grosses zones cliquables',
    haptic_feedback: 'Retour tactile',
    haptic_feedback_desc: 'Vibrations sur les actions (mobile)',
    subtitles: 'Sous-titres automatiques',
    subtitles_desc: 'Transcription des messages vocaux',
    cursor_size: 'Curseur visible',
    cursor_size_desc: 'Taille du curseur renforcée',
    cursor_small: 'Petite',
    cursor_medium: 'Moyenne',
    cursor_large: 'Très grande',
    guided_mode: 'Lecture guidée',
    guided_mode_desc: 'Cadre lumineux sur l\'élément actif',
    visual_section: 'Vision',
    cognitive_section: 'Cognition',
    motor_section: 'Motricité',
    audio_section: 'Audio',
    contact_section: 'Besoin d\'aide ? Contactez-nous',
    call_camping: 'Appeler le camping',
    send_email: 'Envoyer un email',
    phone_copied: 'Numéro copié',
    call_us: 'Appelez-nous au 04 66 61 67 57',
    contact_help: 'Pour joindre le camping, appuyez ici pour appeler, ou ici pour envoyer un email.'
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
    current_size: 'Current size',
    // New translations
    daltonism_mode: 'Color Blind Mode',
    daltonism_desc: 'Adapt colors for different types of color blindness',
    disabled: 'Disabled',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia',
    easy_reading: 'Easy Reading',
    easy_reading_desc: 'Short sentences and simplified vocabulary',
    focus_mode: 'Focus Mode',
    focus_mode_desc: 'Reduce visual distractions (ADHD)',
    big_buttons: 'Simplified Navigation',
    big_buttons_desc: 'Large clickable areas',
    haptic_feedback: 'Haptic Feedback',
    haptic_feedback_desc: 'Vibrations on actions (mobile)',
    subtitles: 'Auto Subtitles',
    subtitles_desc: 'Voice message transcription',
    cursor_size: 'Visible Cursor',
    cursor_size_desc: 'Enhanced cursor size',
    cursor_small: 'Small',
    cursor_medium: 'Medium',
    cursor_large: 'Very Large',
    guided_mode: 'Guided Reading',
    guided_mode_desc: 'Highlighted frame on active element',
    visual_section: 'Vision',
    cognitive_section: 'Cognition',
    motor_section: 'Motor Skills',
    audio_section: 'Audio',
    contact_section: 'Need help? Contact us',
    call_camping: 'Call the campsite',
    send_email: 'Send an email',
    phone_copied: 'Number copied',
    call_us: 'Call us at 04 66 61 67 57',
    contact_help: 'To contact the campsite, press here to call, or here to send an email.'
  }
};

const defaultSettings = {
  fontSize: 100,
  highContrast: false,
  speechEnabled: false,
  daltonismMode: 'disabled', // disabled, protanopia, deuteranopia, tritanopia
  easyReading: false,
  focusMode: false,
  bigButtons: false,
  hapticFeedback: false,
  subtitles: false,
  cursorSize: 'small', // small, medium, large
  guidedMode: false
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
  
  // Contraste
  if (settings.highContrast) {
    document.body.classList.add('high-contrast-mode');
  } else {
    document.body.classList.remove('high-contrast-mode');
  }
  
  // Daltonisme
  document.body.setAttribute('data-daltonism-mode', settings.daltonismMode || 'disabled');
  
  // Easy reading
  if (settings.easyReading) {
    document.body.classList.add('easy-reading-mode');
  } else {
    document.body.classList.remove('easy-reading-mode');
  }
  
  // Focus mode
  if (settings.focusMode) {
    document.body.classList.add('focus-mode');
  } else {
    document.body.classList.remove('focus-mode');
  }
  
  // Big buttons
  if (settings.bigButtons) {
    document.body.classList.add('big-buttons-mode');
  } else {
    document.body.classList.remove('big-buttons-mode');
  }
  
  // Cursor size
  document.body.setAttribute('data-cursor-size', settings.cursorSize || 'small');
  
  // Guided mode
  if (settings.guidedMode) {
    document.body.classList.add('guided-mode');
  } else {
    document.body.classList.remove('guided-mode');
  }
  
  // Speech
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
      /* Contraste élevé */
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
      
      /* Daltonisme - Protanopie (rouge-vert) */
      body[data-daltonism-mode="protanopia"] {
        filter: url('#protanopia-filter');
      }
      body[data-daltonism-mode="protanopia"] .bg-red-500,
      body[data-daltonism-mode="protanopia"] .text-red-500 {
        background-color: #0077A8 !important;
        color: #0077A8 !important;
      }
      body[data-daltonism-mode="protanopia"] .bg-green-500,
      body[data-daltonism-mode="protanopia"] .text-green-500 {
        background-color: #FFD700 !important;
        color: #FFD700 !important;
      }
      
      /* Daltonisme - Deutéranopie (rouge-vert) */
      body[data-daltonism-mode="deuteranopia"] {
        filter: brightness(1.1) saturate(1.3);
      }
      body[data-daltonism-mode="deuteranopia"] .bg-red-500 {
        background-color: #FF6B00 !important;
      }
      body[data-daltonism-mode="deuteranopia"] .bg-green-500 {
        background-color: #0099FF !important;
      }
      
      /* Daltonisme - Tritanopie (bleu-jaune) */
      body[data-daltonism-mode="tritanopia"] .bg-blue-500 {
        background-color: #CC0066 !important;
      }
      body[data-daltonism-mode="tritanopia"] .text-blue-500 {
        color: #CC0066 !important;
      }
      
      /* Mode facile à lire */
      .easy-reading-mode {
        line-height: 1.8 !important;
        letter-spacing: 0.05em !important;
      }
      .easy-reading-mode * {
        font-family: Arial, sans-serif !important;
        line-height: 1.8 !important;
      }
      .easy-reading-mode p, .easy-reading-mode span {
        max-width: 70ch !important;
      }
      
      /* Mode concentration/focus (TDAH) */
      .focus-mode * {
        animation: none !important;
        transition: none !important;
      }
      .focus-mode [class*="opacity-"],
      .focus-mode [class*="blur-"] {
        opacity: 1 !important;
        filter: none !important;
      }
      .focus-mode .fixed:not(.z-50):not([role="dialog"]) {
        display: none !important;
      }
      
      /* Gros boutons */
      .big-buttons-mode button,
      .big-buttons-mode a,
      .big-buttons-mode [role="button"],
      .big-buttons-mode input,
      .big-buttons-mode textarea {
        min-height: 60px !important;
        min-width: 60px !important;
        padding: 16px !important;
        font-size: 1.2em !important;
      }
      
      /* Curseur personnalisé */
      body[data-cursor-size="medium"] * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="8" fill="black" stroke="white" stroke-width="2"/></svg>') 16 16, auto !important;
      }
      body[data-cursor-size="large"] * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="12" fill="red" stroke="white" stroke-width="3"/></svg>') 24 24, auto !important;
      }
      
      /* Mode guidé */
      .guided-mode *:focus {
        outline: 4px solid #FFD700 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.8) !important;
      }
      
      /* Focus clavier */
      *:focus {
        outline: 3px solid #FFD700 !important;
        outline-offset: 2px !important;
      }
      
      /* Zones cliquables minimum */
      button, a, input, textarea, select, [role="button"], [tabindex="0"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Indicateur lecture vocale */
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

  const triggerHaptic = () => {
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const updateSettingWithHaptic = useCallback((key, value) => {
    updateSetting(key, value);
    triggerHaptic();
  }, [settings]);

  const toggleDaltonismMode = (mode) => {
    updateSettingWithHaptic('daltonismMode', mode);
  };

  const toggleEasyReading = () => {
    updateSettingWithHaptic('easyReading', !settings.easyReading);
  };

  const toggleFocusMode = () => {
    updateSettingWithHaptic('focusMode', !settings.focusMode);
  };

  const toggleBigButtons = () => {
    updateSettingWithHaptic('bigButtons', !settings.bigButtons);
  };

  const toggleHapticFeedback = () => {
    const newValue = !settings.hapticFeedback;
    updateSetting('hapticFeedback', newValue);
    if (newValue && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const toggleSubtitles = () => {
    updateSettingWithHaptic('subtitles', !settings.subtitles);
  };

  const changeCursorSize = (size) => {
    updateSettingWithHaptic('cursorSize', size);
  };

  const toggleGuidedMode = () => {
    updateSettingWithHaptic('guidedMode', !settings.guidedMode);
  };

  const handleCallCamping = () => {
    const phoneNumber = '0466616757';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard.writeText('04 66 61 67 57');
      alert(t('call_us'));
      speakText(t('call_us'), true);
    }
    triggerHaptic();
  };

  const handleSendEmail = () => {
    const email = 'campingdomainedegaujac@gmail.com';
    const subject = encodeURIComponent('[Assistance accessibilité – Application Camping Paradis]');
    window.location.href = `mailto:${email}?subject=${subject}`;
    triggerHaptic();
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

          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* === SECTION VISION === */}
            <div className="border-b-2 border-[#00AEEF] pb-4">
              <h2 className="font-heading text-[#0077A8] text-xl mb-4">👁️ {t('visual_section')}</h2>
            
            {/* Taille du texte */}
            <div className="space-y-3 mb-4">
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

            {/* Contraste élevé */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
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

            {/* Mode Daltonien */}
            <div className="space-y-3 mb-4">
              <h3 className="font-heading text-[#0077A8] text-base">🎨 {t('daltonism_mode')}</h3>
              <p className="text-sm text-gray-600 font-body">{t('daltonism_desc')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => toggleDaltonismMode('disabled')}
                  variant={settings.daltonismMode === 'disabled' ? 'default' : 'outline'}
                  className={`h-12 ${settings.daltonismMode === 'disabled' ? 'bg-[#00AEEF] text-white' : 'border-[#00AEEF]'}`}
                >
                  {t('disabled')}
                </Button>
                <Button
                  onClick={() => toggleDaltonismMode('protanopia')}
                  variant={settings.daltonismMode === 'protanopia' ? 'default' : 'outline'}
                  className={`h-12 ${settings.daltonismMode === 'protanopia' ? 'bg-[#00AEEF] text-white' : 'border-[#00AEEF]'}`}
                >
                  {t('protanopia')}
                </Button>
                <Button
                  onClick={() => toggleDaltonismMode('deuteranopia')}
                  variant={settings.daltonismMode === 'deuteranopia' ? 'default' : 'outline'}
                  className={`h-12 ${settings.daltonismMode === 'deuteranopia' ? 'bg-[#00AEEF] text-white' : 'border-[#00AEEF]'}`}
                >
                  {t('deuteranopia')}
                </Button>
                <Button
                  onClick={() => toggleDaltonismMode('tritanopia')}
                  variant={settings.daltonismMode === 'tritanopia' ? 'default' : 'outline'}
                  className={`h-12 ${settings.daltonismMode === 'tritanopia' ? 'bg-[#00AEEF] text-white' : 'border-[#00AEEF]'}`}
                >
                  {t('tritanopia')}
                </Button>
              </div>
            </div>
            </div>

            {/* === SECTION COGNITION === */}
            <div className="border-b-2 border-purple-500 pb-4">
              <h2 className="font-heading text-purple-700 text-xl mb-4">🧠 {t('cognitive_section')}</h2>
            
            {/* Mode facile à lire */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📖</div>
                <div>
                  <p className="font-heading text-purple-700">🧠 {t('easy_reading')}</p>
                  <p className="text-sm text-purple-600 font-body">{t('easy_reading_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.easyReading}
                onCheckedChange={toggleEasyReading}
                aria-label={t('easy_reading')}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Mode concentration */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="font-heading text-orange-700">🎯 {t('focus_mode')}</p>
                  <p className="text-sm text-orange-600 font-body">{t('focus_mode_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.focusMode}
                onCheckedChange={toggleFocusMode}
                aria-label={t('focus_mode')}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>

            {/* Mode guidé */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📘</div>
                <div>
                  <p className="font-heading text-indigo-700">📘 {t('guided_mode')}</p>
                  <p className="text-sm text-indigo-600 font-body">{t('guided_mode_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.guidedMode}
                onCheckedChange={toggleGuidedMode}
                aria-label={t('guided_mode')}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            </div>

            {/* === SECTION MOTRICITÉ === */}
            <div className="border-b-2 border-blue-500 pb-4">
              <h2 className="font-heading text-blue-700 text-xl mb-4">🖱️ {t('motor_section')}</h2>
            
            {/* Navigation simplifiée */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🖱️</div>
                <div>
                  <p className="font-heading text-blue-700">🖱️ {t('big_buttons')}</p>
                  <p className="text-sm text-blue-600 font-body">{t('big_buttons_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.bigButtons}
                onCheckedChange={toggleBigButtons}
                aria-label={t('big_buttons')}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {/* Curseur personnalisé */}
            <div className="space-y-3 mb-4">
              <h3 className="font-heading text-blue-700 text-base">🖱️ {t('cursor_size')}</h3>
              <p className="text-sm text-blue-600 font-body">{t('cursor_size_desc')}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => changeCursorSize('small')}
                  variant={settings.cursorSize === 'small' ? 'default' : 'outline'}
                  className={`h-12 ${settings.cursorSize === 'small' ? 'bg-blue-500 text-white' : 'border-blue-500'}`}
                >
                  {t('cursor_small')}
                </Button>
                <Button
                  onClick={() => changeCursorSize('medium')}
                  variant={settings.cursorSize === 'medium' ? 'default' : 'outline'}
                  className={`h-12 ${settings.cursorSize === 'medium' ? 'bg-blue-500 text-white' : 'border-blue-500'}`}
                >
                  {t('cursor_medium')}
                </Button>
                <Button
                  onClick={() => changeCursorSize('large')}
                  variant={settings.cursorSize === 'large' ? 'default' : 'outline'}
                  className={`h-12 ${settings.cursorSize === 'large' ? 'bg-blue-500 text-white' : 'border-blue-500'}`}
                >
                  {t('cursor_large')}
                </Button>
              </div>
            </div>

            {/* Retour haptique */}
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📳</div>
                <div>
                  <p className="font-heading text-pink-700">📳 {t('haptic_feedback')}</p>
                  <p className="text-sm text-pink-600 font-body">{t('haptic_feedback_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={toggleHapticFeedback}
                aria-label={t('haptic_feedback')}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>
            </div>

            {/* === SECTION AUDIO === */}
            <div className="pb-4">
              <h2 className="font-heading text-green-700 text-xl mb-4">🔊 {t('audio_section')}</h2>
            
            {/* Lecture vocale interactive */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200 mb-4">
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

            {/* Sous-titres */}
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">💬</div>
                <div>
                  <p className="font-heading text-teal-700">💬 {t('subtitles')}</p>
                  <p className="text-sm text-teal-600 font-body">{t('subtitles_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.subtitles}
                onCheckedChange={toggleSubtitles}
                aria-label={t('subtitles')}
                className="data-[state=checked]:bg-teal-500"
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

            {/* === SECTION CONTACT === */}
            <div className="border-t-2 border-[#FFD700] pt-4 mt-4">
              <h2 className="font-heading text-[#0077A8] text-xl mb-4">📞 {t('contact_section')}</h2>
              <p className="text-sm text-gray-600 font-body mb-4">{t('contact_help')}</p>
              
              <div className="space-y-3">
                {/* Bouton Appeler */}
                <Button
                  onClick={handleCallCamping}
                  className="w-full h-16 bg-[#00AEEF] hover:bg-[#FFD700] text-white hover:text-[#0077A8] rounded-xl font-heading text-lg transition-all shadow-lg"
                  aria-label={t('call_camping')}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>📞 {t('call_camping')}</span>
                  </div>
                </Button>

                {/* Bouton Email */}
                <Button
                  onClick={handleSendEmail}
                  className="w-full h-16 bg-[#0077A8] hover:bg-[#FFD700] text-white hover:text-[#0077A8] rounded-xl font-heading text-lg transition-all shadow-lg"
                  aria-label={t('send_email')}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>✉️ {t('send_email')}</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Info accessibilité */}
            <div className="bg-[#FFF4B2] rounded-xl p-4 border border-[#FFD700] mt-4">
              <p className="text-sm font-body text-[#0077A8]">
                <strong>💡 {t('tip')} :</strong> {t('tip_text')}
              </p>
            </div>
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