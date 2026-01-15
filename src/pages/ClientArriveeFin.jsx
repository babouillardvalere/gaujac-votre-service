import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, ClipboardList } from "lucide-react";
import Logo from "../components/Logo";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";

export default function ClientArriveeFin() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const receipt = location.state;

  useEffect(() => {
    if (!receipt) {
      navigate(createPageUrl('ClientMenu'));
    }
  }, [receipt, navigate]);

  if (!receipt) return null;

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-8 flex flex-col items-center">
      <Logo className="h-16 mb-8" />
      
      <Card className="w-full border-2 border-green-500 shadow-xl mb-6">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-green-700">
            ✅ {lang === "fr" ? "Contrôle inventaire validé" : "Inventory check validated"}
          </h1>
          
          <div className="bg-gray-50 p-6 rounded-lg text-left border border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">{lang === "fr" ? "Hébergement" : "Accommodation"}</p>
              <p className="font-semibold">{receipt.categorie} {receipt.numero}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === "fr" ? "Client" : "Guest"}</p>
              <p className="font-semibold">{receipt.prenom} {receipt.nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === "fr" ? "Dates" : "Dates"}</p>
              <p className="font-semibold">{receipt.dateArrivee} → {receipt.dateDepart}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === "fr" ? "Autorisation accès" : "Access auth"}</p>
              <p className="font-semibold">
                {receipt.autorisationAcces === 'oui' 
                  ? (lang === "fr" ? "✅ Oui" : "✅ Yes") 
                  : (lang === "fr" ? "❌ Non (Présence requise)" : "❌ No (Presence required)")}
              </p>
            </div>
          </div>

          {receipt.evaluationProprete && (
            <div className="border-t pt-4 mb-4">
              <p className="text-sm text-gray-500">{lang === "fr" ? "Appréciation globale" : "Overall rating"}</p>
              <p className="font-semibold">
                {receipt.evaluationProprete === "pas_satisfaisant" ? "😠 " + (lang === "fr" ? "Insatisfaisant" : "Unsatisfactory") :
                 receipt.evaluationProprete === "correct" ? "😐 " + (lang === "fr" ? "Correct" : "Correct") :
                 receipt.evaluationProprete === "tres_propre" ? "😄 " + (lang === "fr" ? "Très propre" : "Very clean") : ""}
              </p>
              {receipt.commentaireProprete && (
                <p className="text-sm text-gray-600 mt-1 italic">"{receipt.commentaireProprete}"</p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="font-semibold mb-3">
              {lang === "fr" ? "📋 Interventions générées (détail complet) :" : "📋 Generated interventions (full detail):"}
            </p>
            {receipt.interventionsSummary.technique > 0 || receipt.interventionsSummary.menage > 0 || receipt.interventionsSummary.reception > 0 ? (
              <div className="space-y-3">
                {/* Technique */}
                {receipt.workItemsParService?.TECHNIQUE?.length > 0 && (
                  <div className="border-l-4 border-blue-500 pl-3 bg-blue-50 p-2 rounded">
                    <p className="font-bold text-blue-700 mb-2">🔧 {lang === "fr" ? "Technique" : "Technical"} ({receipt.workItemsParService.TECHNIQUE.length})</p>
                    {receipt.workItemsParService.TECHNIQUE.map((wi, idx) => (
                      <div key={idx} className="text-xs space-y-1 mb-2 last:mb-0">
                        {wi.taches?.map((t, tidx) => (
                          <div key={tidx} className="flex items-start gap-1">
                            <span className="text-blue-600">•</span>
                            <span className="text-gray-700">{t.texte.split('\n')[0]}</span>
                          </div>
                        ))}
                        <p className="text-gray-500 italic">
                          {lang === "fr" ? "Statut" : "Status"}: {wi.statut === 'A_FAIRE' ? (lang === "fr" ? "En attente" : "Pending") : wi.statut}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ménage */}
                {receipt.workItemsParService?.MENAGE?.length > 0 && (
                  <div className="border-l-4 border-yellow-500 pl-3 bg-yellow-50 p-2 rounded">
                    <p className="font-bold text-yellow-700 mb-2">🧹 {lang === "fr" ? "Ménage" : "Housekeeping"} ({receipt.workItemsParService.MENAGE.length})</p>
                    {receipt.workItemsParService.MENAGE.map((wi, idx) => (
                      <div key={idx} className="text-xs space-y-1 mb-2 last:mb-0">
                        {wi.taches?.map((t, tidx) => (
                          <div key={tidx} className="flex items-start gap-1">
                            <span className="text-yellow-600">•</span>
                            <span className="text-gray-700">{t.texte.split('\n')[0]}</span>
                          </div>
                        ))}
                        <p className="text-gray-500 italic">
                          {lang === "fr" ? "Statut" : "Status"}: {wi.statut === 'A_FAIRE' ? (lang === "fr" ? "En attente" : "Pending") : wi.statut}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Réception */}
                {receipt.workItemsParService?.RECEPTION?.length > 0 && (
                  <div className="border-l-4 border-green-500 pl-3 bg-green-50 p-2 rounded">
                    <p className="font-bold text-green-700 mb-2">🏠 {lang === "fr" ? "Réception" : "Reception"} ({receipt.workItemsParService.RECEPTION.length})</p>
                    {receipt.workItemsParService.RECEPTION.map((wi, idx) => (
                      <div key={idx} className="text-xs space-y-1 mb-2 last:mb-0">
                        {wi.taches?.map((t, tidx) => (
                          <div key={tidx} className="flex items-start gap-1">
                            <span className="text-green-600">•</span>
                            <span className="text-gray-700">{t.texte.split('\n')[0]}</span>
                          </div>
                        ))}
                        <p className="text-gray-500 italic">
                          {lang === "fr" ? "Statut" : "Status"}: {wi.statut === 'A_FAIRE' ? (lang === "fr" ? "En attente" : "Pending") : wi.statut}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-green-600 bg-green-50 p-2 rounded flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {lang === "fr" ? "Aucune anomalie signalée" : "No anomalies reported"}
              </p>
            )}
          </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate(createPageUrl('ClientSuiviInventaire'))}
              variant="outline"
              className="w-full h-14 text-lg border-2 border-indigo-100 hover:bg-indigo-50 text-indigo-700"
            >
              <ClipboardList className="mr-2 w-5 h-5" />
              {lang === "fr" ? "Voir les interventions" : "View interventions"}
            </Button>

            <Button 
              onClick={() => navigate(createPageUrl('ClientMenu'))}
              className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-white font-heading text-lg"
            >
              <Home className="mr-2 w-5 h-5" />
              {lang === "fr" ? "Retour à l'accueil" : "Back to home"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-gray-400 text-sm text-center">
        {lang === "fr" ? "Ce contrôle est désormais clos et archivé." : "This check is now closed and archived."}
      </p>
    </div>
  );
}