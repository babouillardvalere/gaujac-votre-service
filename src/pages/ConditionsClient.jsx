import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Sparkles, CheckCircle, Wrench, FileText, User, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ConditionsClient() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    const nom = sessionStorage.getItem('user_nom');
    if (!nom) {
      navigate(createPageUrl('IdentiteClient'));
    }
  }, [navigate]);

  const handleAccept = () => {
    sessionStorage.setItem('conditions_accepted', 'true');
    navigate(createPageUrl('ChoixHebergement'));
  };

  const isFrench = lang === 'fr';

  return (
    <div className="min-h-screen px-4 py-6" role="main" aria-label="Conditions et informations importantes">
      <h1 className="sr-only">Veuillez lire les conditions avant de continuer</h1>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <CardTitle className="text-xl font-heading text-white">
              {isFrench ? "📋 Informations importantes" : "📋 Important information"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-5">
                
                {/* 1. Horaires intervention technique */}
                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">
                      {isFrench ? "📌 1. Horaires d'intervention technique" : "📌 1. Technical intervention hours"}
                    </h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm space-y-3">
                    <div>
                      <p className="font-semibold text-[#0077A8]">{isFrench ? "Basse saison :" : "Low season:"}</p>
                      <p>9h00 → 12h00</p>
                      <p>13h30 → 18h30</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0077A8]">{isFrench ? "Haute saison :" : "High season:"}</p>
                      <p>{isFrench ? "Dimanche → Vendredi : 8h30 → 12h00 et 14h00 → 20h00" : "Sunday → Friday: 8:30am → 12pm and 2pm → 8pm"}</p>
                      <p>{isFrench ? "Samedi (journée continue) : 8h30 → 20h00" : "Saturday (continuous): 8:30am → 8pm"}</p>
                    </div>
                    <div className="bg-[#FFA500]/20 rounded-lg p-3 border border-[#FFA500]/40">
                      <p className="font-semibold text-[#FFA500]">{isFrench ? "⚠️ Astreintes (20h → 23h) :" : "⚠️ On-call (8pm → 11pm):"}</p>
                      <p className="text-xs mt-1">{isFrench ? "Uniquement les urgences :" : "Emergencies only:"}</p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        <li>💧 {isFrench ? "Plus d'eau" : "No water"}</li>
                        <li>🔥 {isFrench ? "Plus de gaz" : "No gas"}</li>
                        <li>⚡ {isFrench ? "Plus d'électricité" : "No electricity"}</li>
                        <li>🐝 {isFrench ? "Guêpes / Frelons" : "Wasps / Hornets"}</li>
                      </ul>
                      <p className="text-xs mt-2 italic text-gray-600">
                        {isFrench ? "Autres demandes → traitées le lendemain" : "Other requests → handled next day"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Horaires intervention ménage */}
                <div className="bg-[#FFD700]/10 rounded-xl p-4 border border-[#FFD700]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#FFD700]" />
                    <h3 className="font-heading text-[#0077A8]">
                      {isFrench ? "📌 2. Horaires d'intervention ménage" : "📌 2. Housekeeping hours"}
                    </h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm space-y-2">
                    <p className="font-semibold">9h00 → 16h00</p>
                    <p className="text-xs">
                      {isFrench 
                        ? "Samedi & dimanche (juillet/août) : possibilité d'interventions renforcées selon disponibilité" 
                        : "Saturday & Sunday (July/August): possible reinforced interventions based on availability"}
                    </p>
                    <p className="text-xs italic text-gray-600">
                      {isFrench ? "Hors de ces horaires → intervention le lendemain" : "Outside these hours → next day intervention"}
                    </p>
                  </div>
                </div>

                {/* 3. Ce que vous pouvez déclarer */}
                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">
                      {isFrench ? "📌 3. Ce que vous pouvez déclarer" : "📌 3. What you can report"}
                    </h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p className="mb-2">{isFrench ? "Vous pouvez signaler :" : "You can report:"}</p>
                    <ul className="space-y-1 text-xs">
                      <li>🔧 {isFrench ? "Problème technique (eau, gaz, électricité…)" : "Technical problem (water, gas, electricity...)"}</li>
                      <li>🧹 {isFrench ? "Problème de ménage (literie, vaisselle…)" : "Housekeeping issue (bedding, dishes...)"}</li>
                      <li>🐝 {isFrench ? "Nuisibles (guêpes, frelons, rongeurs)" : "Pests (wasps, hornets, rodents)"}</li>
                      <li>🪑 {isFrench ? "Matériel cassé" : "Broken equipment"}</li>
                      <li>⚠️ {isFrench ? "Dysfonctionnements divers" : "Various malfunctions"}</li>
                    </ul>
                    <p className="mt-3 text-xs font-semibold text-[#0077A8]">
                      ✔ {isFrench ? "La description est obligatoire pour traiter efficacement votre demande." : "Description is required to process your request effectively."}
                    </p>
                  </div>
                </div>

                {/* 4. Informations personnelles */}
                <div className="bg-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="font-heading text-[#0077A8]">
                      {isFrench ? "📌 4. Informations personnelles" : "📌 4. Personal information"}
                    </h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p className="mb-2">
                      {isFrench 
                        ? "Les informations recueillies (nom, prénom, dates de séjour, logement/emplacement) servent uniquement à :" 
                        : "The information collected (name, stay dates, accommodation) is used only to:"}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>✓ {isFrench ? "Vérifier que vous êtes bien client du camping" : "Verify that you are a campsite guest"}</li>
                      <li>✓ {isFrench ? "Assurer le suivi correct de votre intervention" : "Ensure proper follow-up of your request"}</li>
                      <li>✓ {isFrench ? "Améliorer la qualité du service" : "Improve service quality"}</li>
                    </ul>
                  </div>
                </div>

                {/* 5. Délais de traitement */}
                <div className="bg-[#FFA500]/10 rounded-xl p-4 border border-[#FFA500]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="w-5 h-5 text-[#FFA500]" />
                    <h3 className="font-heading text-[#0077A8]">
                      {isFrench ? "📌 5. Délais de traitement" : "📌 5. Processing times"}
                    </h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p className="font-semibold text-[#FFA500] mb-2">
                      🚨 {isFrench ? "Les urgences passent en priorité." : "Emergencies are prioritized."}
                    </p>
                    <p className="mb-2">
                      {isFrench ? "Les interventions non urgentes sont réalisées selon :" : "Non-urgent interventions are carried out based on:"}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• {isFrench ? "L'ordre d'arrivée" : "Order of arrival"}</li>
                      <li>• {isFrench ? "La disponibilité des équipes" : "Team availability"}</li>
                      <li>• {isFrench ? "Le type de problème" : "Type of problem"}</li>
                    </ul>
                  </div>
                </div>

              </div>
            </ScrollArea>

            <div className="mt-6 pt-4 border-t border-[#00AEEF]/20">
              <p className="font-body text-sm text-gray-600 mb-3">
                ✔ {isFrench ? "Pour continuer, merci d'accepter les conditions ci-dessous." : "To continue, please accept the conditions below."}
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={setAccepted}
                  className="mt-1 data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]"
                />
                <span className="font-body text-sm text-gray-700">
                  {isFrench ? "J'ai lu et j'accepte les conditions" : "I have read and accept the conditions"}
                </span>
              </label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!accepted}
              className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4 disabled:opacity-50 text-lg focus:ring-4 focus:ring-[#FFD700]"
              aria-label="J'accepte les conditions et je continue"
              role="button"
            >
              <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
              {isFrench ? "ACCEPTER" : "ACCEPT"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}