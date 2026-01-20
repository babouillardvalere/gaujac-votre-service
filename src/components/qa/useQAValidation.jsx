import { useCallback } from 'react';
import { shouldRunQA } from './QAConfig';
import { 
  validateBeforeWorkItemCreation,
  validateBeforeInterventionCreation,
  validateBeforeMissionCreation 
} from './ValidationRules';
import errorLogger from './ErrorLogger';
import { toast } from 'sonner';

/**
 * Hook QA - validation non-bloquante pour monitoring
 * NE JAMAIS utiliser pour bloquer l'UI en contexte READ
 * Utiliser uniquement pour logging/warnings
 */
export function useQAValidation() {
  /**
   * Valide une intervention (non-bloquant en READ, bloquant en CREATE)
   */
  const validateIntervention = useCallback((interventionData, context = 'READ') => {
    if (!shouldRunQA(context)) {
      return true; // QA désactivé ou contexte READ
    }

    const result = validateBeforeInterventionCreation(interventionData, { 
      context, 
      strict: context !== 'READ' 
    });
    
    if (!result.ok) {
      errorLogger.log('error', 'data_integrity', result.message, {
        severity: result.level || 'CRITICAL',
        entity: 'InterventionClient',
        context
      });
      
      if (context === 'CREATE') {
        toast.error(result.message, { duration: 5000 });
      } else {
        console.warn('[QA] Intervention validation warning:', result.message);
      }
      
      return context === 'READ'; // En READ, on continue quand même
    }
    
    return true;
  }, []);

  /**
   * Valide un WorkItem (non-bloquant en READ, bloquant en CREATE)
   */
  const validateWorkItem = useCallback((workItemData, context = 'READ') => {
    if (!shouldRunQA(context)) {
      return true;
    }

    const result = validateBeforeWorkItemCreation(workItemData, { 
      context, 
      strict: context !== 'READ' 
    });
    
    if (!result.ok) {
      errorLogger.log('error', 'data_integrity', result.message, {
        severity: result.level || 'CRITICAL',
        entity: 'WorkItem',
        context
      });
      
      if (context === 'CREATE') {
        toast.error(result.message, { duration: 5000 });
      } else {
        console.warn('[QA] WorkItem validation warning:', result.message);
      }
      
      return context === 'READ';
    }
    
    return true;
  }, []);

  /**
   * Valide une mission (non-bloquant en READ, bloquant en CREATE)
   */
  const validateMission = useCallback((missionData, context = 'READ') => {
    if (!shouldRunQA(context)) {
      return true;
    }

    const result = validateBeforeMissionCreation(missionData, { 
      context, 
      strict: context !== 'READ' 
    });
    
    if (!result.ok) {
      errorLogger.log('error', 'data_integrity', result.message, {
        severity: result.level || 'CRITICAL',
        entity: 'MissionDirection',
        context
      });
      
      if (context === 'CREATE') {
        toast.error(result.message, { duration: 5000 });
      } else {
        console.warn('[QA] Mission validation warning:', result.message);
      }
      
      return context === 'READ';
    }
    
    return true;
  }, []);

  return {
    validateIntervention,
    validateWorkItem,
    validateMission
  };
}