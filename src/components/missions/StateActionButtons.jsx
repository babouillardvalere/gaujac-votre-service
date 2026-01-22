import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '../translations';
import { getAvailableActions } from '../workflowStateService';

/**
 * Boutons d'action conditionnés par état
 * Affiche uniquement les actions valides pour l'état actuel
 */
export default function StateActionButtons({
  state,
  onPrendreEnCharge,
  onMetteEnAttente,
  onTerminer,
  onReprendre,
  isLoading = false,
  disabled = false,
  collaborateurNom = ''
}) {
  const { t, lang } = useTranslation();
  const actions = getAvailableActions(state);

  if (!actions || actions.length === 0) {
    return null;
  }

  const renderButton = (action) => {
    const iconProps = { className: 'w-4 h-4 mr-2' };
    const commonProps = {
      disabled: isLoading || disabled,
      variant: action.id === 'terminer' ? 'default' : 'outline'
    };

    const iconMap = {
      'Play': <Play {...iconProps} />,
      'Pause': <Pause {...iconProps} />,
      'CheckCircle': <CheckCircle {...iconProps} />,
      'Clock': <Clock {...iconProps} />
    };

    const handlers = {
      'prendre_en_charge': () => {
        if (!collaborateurNom.trim()) {
          alert(lang === 'fr' ? 'Remplissez votre nom' : 'Enter your name');
          return;
        }
        onPrendreEnCharge?.();
      },
      'reporter': onMetteEnAttente,
      'mettre_en_attente': onMetteEnAttente,
      'terminer': onTerminer,
      'reprendre': onReprendre
    };

    return (
      <Button
        key={action.id}
        onClick={handlers[action.id]}
        {...commonProps}
        className={action.id === 'terminer' ? 'bg-green-500 hover:bg-green-600' : ''}
      >
        {iconMap[action.icon]}
        {t(action.label)}
      </Button>
    );
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map(action => renderButton(action))}
    </div>
  );
}