import { cleanAllDuplicates } from './missionDirectionFactory';

/**
 * DÉDUPLICATION - DÉLÈGUE AU MODULE FACTORY
 * @deprecated Utiliser directement cleanAllDuplicates() de missionDirectionFactory
 */
export async function deduplicateMissions() {
  return await cleanAllDuplicates();
}