import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Phone, Wifi, Coffee, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ConditionsClient() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    // Vérifier que l'identité a été saisie
    const nom = sessionStorage.getItem('user_nom');
    if (!nom) {
      navigate(createPageUrl('IdentiteClient'));
    }
  }, [navigate]);

  const handleAccept = () => {
    sessionStorage.setItem('conditions_accepted', 'true');
    navigate(createPageUrl('ChoixHebergement'));
  };

  return (
    <div className="min-h-screen px-4 py-6">
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
              Informations importantes
            </CardTitle>
            <p className="text-white/80 text-sm font-body">
              Veuillez lire attentivement avant de continuer
            </p>
          </CardHeader>
          
          <CardContent className="pt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Horaires d'intervention */}
                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">Horaires d'intervention</h3>
                  </div>
                  <div className="font-body text-gray-700 space-y-2 text-sm">
                    <p><strong>Basse saison (avril-mai, septembre) :</strong></p>
                    <p>• Lundi au vendredi : 9h00 - 12h00 / 14h00 - 18h00</p>
                    <p>• Samedi : 9h00 - 12h00</p>
                    <p className="mt-2"><strong>Haute saison (juin-août) :</strong></p>
                    <p>• Tous les jours : 8h30 - 12h30 / 14h00 - 19h00</p>
                  </div>
                </div>

                {/* Astreintes */}
                <div className="bg-[#FFA500]/10 rounded-xl p-4 border border-[#FFA500]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#FFA500]" />
                    <h3 className="font-heading text-[#0077A8]">Astreintes urgentes</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p><strong>De 20h00 à 23h00</strong>, une astreinte est disponible <strong>uniquement</strong> pour :</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>🔥 Problème de gaz</li>
                      <li>💧 Fuite d'eau importante</li>
                      <li>⚡ Coupure électrique totale</li>
                    </ul>
                    <p className="mt-2 text-[#FFA500] font-medium">
                      Après 23h, contactez les services d'urgence (15, 17, 18).
                    </p>
                  </div>
                </div>

                {/* Règles ménage */}
                <div className="bg-[#FFD700]/10 rounded-xl p-4 border border-[#FFD700]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#FFD700]" />
                    <h3 className="font-heading text-[#0077A8]">Règles du ménage</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm space-y-2">
                    <p>• Le ménage de fin de séjour est inclus (sauf vaisselle).</p>
                    <p>• Merci de <strong>vider les poubelles</strong> et <strong>laver la vaisselle</strong> avant votre départ.</p>
                    <p>• Les draps et serviettes doivent être déposés sur les lits.</p>
                    <p>• Un état des lieux sera effectué après votre départ.</p>
                  </div>
                </div>

                {/* Infos accueil */}
                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">Informations pratiques</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#00AEEF]" />
                      <p><strong>Accueil :</strong> 04 66 XX XX XX</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#00AEEF]" />
                      <p><strong>WiFi :</strong> CampingParadis / mdp : gaujac2024</p>
                    </div>
                    <p>• <strong>Pain & viennoiseries :</strong> Commande à l'accueil avant 18h</p>
                    <p>• <strong>Épicerie :</strong> Ouverte de 8h à 20h en haute saison</p>
                    <p>• <strong>Piscine :</strong> 10h - 20h (short de bain interdit)</p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Checkbox acceptation */}
            <div className="mt-6 pt-4 border-t border-[#00AEEF]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={setAccepted}
                  className="mt-1 data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]"
                />
                <span className="font-body text-sm text-gray-700">
                  J'ai lu et j'accepte les conditions d'intervention et les règles du camping.
                </span>
              </label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!accepted}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              J'accepte les conditions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}