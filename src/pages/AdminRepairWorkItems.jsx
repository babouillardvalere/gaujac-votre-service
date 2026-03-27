import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBestDescription } from '@/lib/workItems';
import { Loader2, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PAGE ADMIN — Réparation des WorkItems sans description_operationnelle
 * 
 * WorkThen 5 : migration des interventions legacy
 */
export default function AdminRepairWorkItems() {
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [results, setResults] = useState(null);
  const [auditResult, setAuditResult] = useState(null);

  const handleAudit = async () => {
    setAuditing(true);
    setAuditResult(null);
    try {
      const items = await base44.entities.WorkItem.list('-created_date', 500);
      
      const withDesc = items.filter(wi => wi.description_operationnelle?.trim());
      const withoutDesc = items.filter(wi => !wi.description_operationnelle?.trim());
      const repairable = withoutDesc.filter(wi => getBestDescription(wi));
      const irrecuperable = withoutDesc.filter(wi => !getBestDescription(wi));

      setAuditResult({
        total: items.length,
        withDesc: withDesc.length,
        withoutDesc: withoutDesc.length,
        repairable: repairable.length,
        irrecuperable: irrecuperable.length,
        irreparableItems: irrecuperable.slice(0, 10) // preview max 10
      });
    } catch (e) {
      toast.error('Erreur audit: ' + e.message);
    } finally {
      setAuditing(false);
    }
  };

  const handleRepair = async () => {
    setLoading(true);
    setResults(null);
    let repaired = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const items = await base44.entities.WorkItem.list('-created_date', 500);
      const toRepair = items.filter(wi => !wi.description_operationnelle?.trim());

      for (const wi of toRepair) {
        const bestDesc = getBestDescription(wi);
        if (!bestDesc) {
          skipped++;
          continue;
        }
        try {
          await base44.entities.WorkItem.update(wi.id, {
            description_operationnelle: bestDesc
          });
          repaired++;
        } catch (e) {
          errors++;
          console.error('Erreur réparation WorkItem', wi.id, e);
        }
      }

      setResults({ repaired, skipped, errors, total: toRepair.length });
      toast.success(`✅ ${repaired} WorkItems réparés`);
    } catch (e) {
      toast.error('Erreur réparation: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Réparation WorkItems legacy</h1>
            <p className="text-gray-500 text-sm">Corrige les interventions sans description opérationnelle</p>
          </div>
        </div>

        {/* Règle métier rappel */}
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-orange-800 font-semibold text-sm mb-1">⚠️ Règle métier</p>
            <p className="text-orange-700 text-sm">
              Aucune intervention ne peut être prise en charge sans description exploitable. 
              Cet outil remplit automatiquement <code>description_operationnelle</code> en utilisant 
              les fallbacks disponibles : <code>description_probleme</code> → <code>description</code> → tâches.
            </p>
          </CardContent>
        </Card>

        {/* Étape 1 : Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étape 1 — Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAudit} disabled={auditing} variant="outline" className="w-full">
              {auditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Analyser tous les WorkItems
            </Button>

            {auditResult && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-700">{auditResult.total}</div>
                  <div className="text-xs text-gray-500">Total WorkItems</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{auditResult.withDesc}</div>
                  <div className="text-xs text-green-600">Avec description ✓</div>
                </div>
                <div className="bg-yellow-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{auditResult.repairable}</div>
                  <div className="text-xs text-yellow-600">Réparables (fallback dispo)</div>
                </div>
                <div className="bg-red-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{auditResult.irrecuperable}</div>
                  <div className="text-xs text-red-600">Irrécupérables (aucun fallback)</div>
                </div>

                {auditResult.irreparableItems.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-red-700 mb-2">
                      WorkItems irrécupérables (aperçu — {auditResult.irrecuperable} au total) :
                    </p>
                    <div className="space-y-1">
                      {auditResult.irreparableItems.map(wi => (
                        <div key={wi.id} className="text-xs bg-red-50 border border-red-200 rounded p-2 flex justify-between items-center">
                          <span className="font-mono text-red-800">{wi.id.slice(0, 8)}…</span>
                          <span className="text-gray-600">{wi.hebergement || '(sans logement)'} — {wi.service}</span>
                          <Badge variant="destructive" className="text-xs">invalide</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Étape 2 : Réparation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étape 2 — Réparation automatique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Remplit <code>description_operationnelle</code> pour tous les WorkItems qui en sont dépourvus,
              en utilisant le meilleur fallback disponible. Les WorkItems sans aucun fallback sont ignorés.
            </p>
            <Button
              onClick={handleRepair}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wrench className="w-4 h-4 mr-2" />}
              Lancer la réparation
            </Button>

            {results && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">{results.repaired} WorkItems réparés</span>
                </div>
                {results.skipped > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{results.skipped} ignorés (aucun fallback disponible)</span>
                  </div>
                )}
                {results.errors > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{results.errors} erreurs (voir console)</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Rapport : {results.repaired} réparés / {results.skipped} irrécupérables / {results.errors} erreurs — sur {results.total} WorkItems traités
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rappel flux */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-blue-800 font-semibold text-sm mb-2">📋 Flux corrigés par cette page</p>
            <ul className="text-blue-700 text-sm space-y-1 list-disc ml-4">
              <li>Contrôle inventaire arrivée → WorkItem TECHNIQUE/MÉNAGE</li>
              <li>Signalement séjour → WorkItem TECHNIQUE/MÉNAGE</li>
              <li>Mission Direction → WorkItem service</li>
            </ul>
            <p className="text-blue-600 text-xs mt-3">
              Après réparation, relancez l'audit pour vérifier que le nombre "irrécupérables" est à 0.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}