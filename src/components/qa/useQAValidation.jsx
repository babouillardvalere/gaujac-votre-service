import { useCallback } from 'react';
import QAConfig from './QAConfig';
import errorLogger from './ErrorLogger';
import { toast } from 'sonner';
import { validateOperationalDescription } from '../getOperationalDescription';

// Hook pour validations CRITICAL (toujours actives)
export function useQAValidation() {
  const validateIntervention = useCallback((interventionData) => {
    // Validation 1 : tâches obligatoires
    const result = QAConfig.criticalValidations.validateIntervention(interventionData);
    
    if (!result.valid) {
      errorLogger.log('error', 'data_integrity', result.error, {
        severity: 'CRITICAL',
        entity: 'InterventionClient',
        data: interventionData
      });
      
      toast.error(result.error, { duration: 5000 });
      return false;
    }
    
    // Validation 2 : description opérationnelle obligatoire
    const descResult = validateOperationalDescription(interventionData);
    
    if (!descResult.valid) {
      errorLogger.log('error', 'data_integrity', descResult.error, {
        severity: 'CRITICAL',
        entity: 'InterventionClient',
        data: interventionData
      });
      
      toast.error(descResult.error, { duration: 5000 });
      return false;
    }
    
    return true;
  }, []);

  const validateWorkItem = useCallback((workItemData) => {
    const result = QAConfig.criticalValidations.validateWorkItem(workItemData);
    
    if (!result.valid) {
      errorLogger.log('error', 'data_integrity', result.error, {
        severity: 'CRITICAL',
        entity: 'WorkItem',
        data: workItemData
      });
      
      toast.error(result.error, { duration: 5000 });
      return false;
    }
    
    return true;
  }, []);

  const validateMission = useCallback((missionData) => {
    const result = QAConfig.criticalValidations.validateMission(missionData);
    
    if (!result.valid) {
      errorLogger.log('error', 'data_integrity', result.error, {
        severity: 'CRITICAL',
        entity: 'MissionDirection',
        data: missionData
      });
      
      toast.error(result.error, { duration: 5000 });
      return false;
    }
    
    return true;
  }, []);

  return {
    validateIntervention,
    validateWorkItem,
    validateMission
  };
}