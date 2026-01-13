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

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">
                {lang === "fr" ? "Bilan des interventions :" : "Interventions summary:"}
              </p>
              {receipt.interventionsSummary.technique > 0 || receipt.interventionsSummary.menage > 0 || receipt.interventionsSummary.reception > 0 ? (
                <div className="space-y-2">
                  {receipt.interventionsSummary.technique > 0 && (
                    <div className="flex items-center text-blue-700 bg-blue-50 p-2 rounded">
                      <span className="mr-2">🔧</span>
                      <span className="font-medium">{lang === "fr" ? "Technique" : "Technical"}:</span>
                      <span className="ml-auto font-bold">{receipt.interventionsSummary.technique}</span>
                    </div>
                  )}
                  {receipt.interventionsSummary.menage > 0 && (
                    <div className="flex items-center text-yellow-700 bg-yellow-50 p-2 rounded">
                      <span className="mr-2">🧹</span>
                      <span className="font-medium">{lang === "fr" ? "Ménage" : "Housekeeping"}:</span>
                      <span className="ml-auto font-bold">{receipt.interventionsSummary.menage}</span>
                    </div>
                  )}
                  {receipt.interventionsSummary.reception > 0 && (
                    <div className="flex items-center text-green-700 bg-green-50 p-2 rounded">
                      <span className="mr-2">🏠</span>
                      <span className="font-medium">{lang === "fr" ? "Réception" : "Reception"}:</span>
                      <span className="ml-auto font-bold">{receipt.interventionsSummary.reception}</span>
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
            {receipt.pdfUrl ? (
              <Button 
                onClick={() => window.open(receipt.pdfUrl, '_blank')}
                className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-lg shadow-md"
              >
                <Download className="mr-2 w-5 h-5" />
                {lang === "fr" ? "Télécharger le récapitulatif (PDF)" : "Download summary (PDF)"}
              </Button>
            ) : (
              <div className="p-3 bg-gray-100 rounded text-gray-500 italic">
                {lang === "fr" ? "PDF en cours de génération..." : "PDF generating..."}
              </div>
            )}

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
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-900"
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