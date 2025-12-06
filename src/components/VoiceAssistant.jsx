import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { createPageUrl } from '../utils';
import { getLanguage } from './translations';

const translations = {
  fr: {
    listening: 'À l\'écoute...',
    click_to_speak: 'Appuyer pour parler',
    voice_command: 'Commande vocale',
    command_not_understood: 'Commande non comprise. Dites "Aide" pour la liste des commandes.',
    help_message: 'Dites : Accueil, Client, Signaler un problème, Suivi, Avis, Collaborateur, Bureau, Changer la langue, Augmenter le texte, Réduire le texte, Mode contraste, ou Aide.',
    navigating_to: 'Navigation vers',
    home: 'Accueil',
    client: 'Client',
    report: 'Signalement',
    tracking: 'Suivi',
    reviews: 'Avis',
    staff: 'Collaborateur',
    office: 'Bureau',
    language: 'Langue',
    text_increased: 'Texte agrandi',
    text_decreased: 'Texte réduit',
    contrast_enabled: 'Contraste activé',
    contrast_disabled: 'Contraste désactivé',
    speech_enabled: 'Lecture vocale activée',
    speech_disabled: 'Lecture vocale désactivée',
    confirm_send: 'Voulez-vous envoyer ce signalement ? Dites Oui ou Non.',
    confirm_access: 'Voulez-vous autoriser l\'accès à votre hébergement ? Dites Oui ou Non.',
    yes: 'Oui',
    no: 'Non',
    urgent_yes: 'Urgence activée',
    urgent_no: 'Urgence désactivée',
    access_authorized: 'Accès autorisé',
    access_denied: 'Accès refusé',
    describe_problem: 'Décrivez votre problème',
    transcribing: 'Transcription en cours...',
    hey_camping: 'Camping Paradis à votre écoute'
  },
  en: {
    listening: 'Listening...',
    click_to_speak: 'Click to speak',
    voice_command: 'Voice command',
    command_not_understood: 'Command not understood. Say "Help" for the list of commands.',
    help_message: 'Say: Home, Client, Report a problem, Tracking, Reviews, Staff, Office, Change language, Increase text, Decrease text, Contrast mode, or Help.',
    navigating_to: 'Navigating to',
    home: 'Home',
    client: 'Client',
    report: 'Report',
    tracking: 'Tracking',
    reviews: 'Reviews',
    staff: 'Staff',
    office: 'Office',
    language: 'Language',
    text_increased: 'Text increased',
    text_decreased: 'Text decreased',
    contrast_enabled: 'Contrast enabled',
    contrast_disabled: 'Contrast disabled',
    speech_enabled: 'Voice reading enabled',
    speech_disabled: 'Voice reading disabled',
    confirm_send: 'Do you want to send this report? Say Yes or No.',
    confirm_access: 'Do you want to authorize access to your accommodation? Say Yes or No.',
    yes: 'Yes',
    no: 'No',
    urgent_yes: 'Urgent enabled',
    urgent_no: 'Urgent disabled',
    access_authorized: 'Access authorized',
    access_denied: 'Access denied',
    describe_problem: 'Describe your problem',
    transcribing: 'Transcribing...',
    hey_camping: 'Camping Paradis listening'
  }
};

export default function VoiceAssistant({ 
  enabled, 
  onAccessibilityChange,
  onFormFieldChange 
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLanguage() || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;

  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    recognitionInstance.maxAlternatives = 3;

    let silenceTimer;
    let finalTranscript = '';

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Afficher le transcript en cours
      setTranscript(finalTranscript + interimTranscript);

      // Réinitialiser le timer de silence
      clearTimeout(silenceTimer);
      
      // Si on a un transcript final, attendre 1.5 secondes de silence avant de traiter
      if (finalTranscript.trim()) {
        silenceTimer = setTimeout(() => {
          const command = finalTranscript.trim();
          if (command) {
            setTranscript(command);
            handleVoiceCommand(command.toLowerCase());
            finalTranscript = '';
            recognitionInstance.stop();
          }
        }, 1500);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        speak(t('command_not_understood'));
      }
      setIsListening(false);
      clearTimeout(silenceTimer);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimer);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [enabled, lang]);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, [lang]);

  const handleVoiceCommand = useCallback((command) => {
    const cmd = command.toLowerCase().trim();

    // Navigation commands
    if (cmd.includes('accueil') || cmd.includes('home')) {
      speak(t('navigating_to') + ' ' + t('home'));
      navigate(createPageUrl('Home'));
      return;
    }

    if (cmd.includes('client') || (cmd.includes('ouvrir') && cmd.includes('client'))) {
      speak(t('navigating_to') + ' ' + t('client'));
      navigate(createPageUrl('IdentiteClient'));
      return;
    }

    if (cmd.includes('signaler') || cmd.includes('problème') || cmd.includes('problem') || cmd.includes('report')) {
      speak(t('navigating_to') + ' ' + t('report'));
      navigate(createPageUrl('Signalement'));
      return;
    }

    if (cmd.includes('suivi') || cmd.includes('tracking')) {
      speak(t('navigating_to') + ' ' + t('tracking'));
      navigate(createPageUrl('SuiviIntervention'));
      return;
    }

    if (cmd.includes('avis') || cmd.includes('review')) {
      speak(t('navigating_to') + ' ' + t('reviews'));
      navigate(createPageUrl('MeilleursAvis'));
      return;
    }

    if (cmd.includes('collaborateur') || cmd.includes('staff')) {
      speak(t('navigating_to') + ' ' + t('staff'));
      navigate(createPageUrl('Collaborateur'));
      return;
    }

    if (cmd.includes('bureau') || cmd.includes('office')) {
      speak(t('navigating_to') + ' ' + t('office'));
      navigate(createPageUrl('Bureau'));
      return;
    }

    if (cmd.includes('langue') || cmd.includes('language')) {
      speak(t('navigating_to') + ' ' + t('language'));
      navigate(createPageUrl('ChoixLangue'));
      return;
    }

    // Accessibility commands
    if (cmd.includes('augment') || cmd.includes('increase') || cmd.includes('plus grand')) {
      if (onAccessibilityChange) {
        onAccessibilityChange('increaseFontSize');
        speak(t('text_increased'));
      }
      return;
    }

    if (cmd.includes('rédui') || cmd.includes('reduce') || cmd.includes('decrease') || cmd.includes('plus petit')) {
      if (onAccessibilityChange) {
        onAccessibilityChange('decreaseFontSize');
        speak(t('text_decreased'));
      }
      return;
    }

    if (cmd.includes('contraste')) {
      if (onAccessibilityChange) {
        onAccessibilityChange('toggleContrast');
        speak(t('contrast_enabled'));
      }
      return;
    }

    if (cmd.includes('lecture vocale') || cmd.includes('voice reading')) {
      if (onAccessibilityChange) {
        onAccessibilityChange('toggleSpeech');
        speak(t('speech_enabled'));
      }
      return;
    }

    // Form commands (Signalement page)
    if (location.pathname.includes('Signalement') && onFormFieldChange) {
      if (cmd.includes('gaz') || cmd.includes('gas')) {
        onFormFieldChange('category', 'gaz');
        speak('Catégorie gaz sélectionnée');
        return;
      }

      if (cmd.includes('électricité') || cmd.includes('electricity')) {
        onFormFieldChange('category', 'electricite');
        speak('Catégorie électricité sélectionnée');
        return;
      }

      if (cmd.includes('eau') || cmd.includes('plomberie') || cmd.includes('water') || cmd.includes('plumbing')) {
        onFormFieldChange('category', 'eau_plomberie');
        speak('Catégorie eau et plomberie sélectionnée');
        return;
      }

      if (cmd.includes('ménage') || cmd.includes('cleaning')) {
        onFormFieldChange('category', 'menage');
        speak('Catégorie ménage sélectionnée');
        return;
      }

      if (cmd.includes('nuisible') || cmd.includes('pest')) {
        onFormFieldChange('category', 'nuisibles');
        speak('Catégorie nuisibles sélectionnée');
        return;
      }

      if (cmd.includes('mobilier') || cmd.includes('cassé') || cmd.includes('furniture') || cmd.includes('broken')) {
        onFormFieldChange('category', 'mobilier_casse');
        speak('Catégorie mobilier cassé sélectionnée');
        return;
      }

      if (cmd.includes('urgence oui') || cmd.includes('urgent yes')) {
        onFormFieldChange('urgent', true);
        speak(t('urgent_yes'));
        return;
      }

      if (cmd.includes('urgence non') || cmd.includes('not urgent') || cmd.includes('urgence désactivée')) {
        onFormFieldChange('urgent', false);
        speak(t('urgent_no'));
        return;
      }

      if (cmd.includes('autorise') && cmd.includes('accès')) {
        onFormFieldChange('access', true);
        speak(t('access_authorized'));
        return;
      }

      if (cmd.includes('autorise pas') || cmd.includes('refuse') || cmd.includes('deny access')) {
        onFormFieldChange('access', false);
        speak(t('access_denied'));
        return;
      }

      if (cmd.includes('décrire') || cmd.includes('describe')) {
        speak(t('describe_problem'));
        // Start continuous transcription
        startContinuousTranscription();
        return;
      }
    }

    // Help command
    if (cmd.includes('aide') || cmd.includes('help')) {
      speak(t('help_message'));
      return;
    }

    // Confirmation commands
    if (cmd.includes('oui') || cmd.includes('yes')) {
      if (onFormFieldChange) {
        onFormFieldChange('confirm', true);
        speak(t('yes'));
      }
      return;
    }

    if (cmd.includes('non') || cmd.includes('no')) {
      if (onFormFieldChange) {
        onFormFieldChange('confirm', false);
        speak(t('no'));
      }
      return;
    }

    // Command not understood
    speak(t('command_not_understood'));
  }, [location, navigate, speak, onAccessibilityChange, onFormFieldChange, lang, t]);

  const startContinuousTranscription = () => {
    if (!recognition) return;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const transcribedText = [];
    
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcribedText.push(result[0].transcript);
          if (onFormFieldChange) {
            onFormFieldChange('description', transcribedText.join('. '));
          }
        }
      }
    };

    recognition.start();
    setIsListening(true);
    speak(t('transcribing'));
  };

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        setTranscript('');
        recognition.start();
        setIsListening(true);
        
        // Parler après un petit délai pour ne pas interférer avec la reconnaissance
        setTimeout(() => {
          speak(t('hey_camping'));
        }, 300);
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={toggleListening}
        className={`fixed bottom-36 left-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:ring-4 focus:ring-[#FFD700] ${
          isListening 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-[#00AEEF] hover:bg-[#0077A8]'
        } text-white`}
        aria-label={isListening ? t('listening') : t('click_to_speak')}
        title={isListening ? t('listening') : t('click_to_speak')}
      >
        {isListening ? (
          <Volume2 className="w-7 h-7 animate-pulse" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="fixed bottom-52 left-4 z-40 bg-red-500 text-white px-4 py-3 rounded-lg text-sm font-bold shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-4 bg-white rounded animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-4 bg-white rounded animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-4 bg-white rounded animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>🎤 {t('listening')}</span>
          </div>
        </div>
      )}

      {/* Transcript display (for debugging) */}
      {transcript && (
        <div className="fixed bottom-24 left-4 right-4 z-40 bg-white border-2 border-[#00AEEF] rounded-lg p-3 text-sm shadow-lg max-w-xs">
          <p className="text-[#0077A8] font-heading mb-1">{t('voice_command')}:</p>
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
    </>
  );
}