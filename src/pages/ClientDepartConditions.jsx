import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Clock, AlertCircle, Trash, Key, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartConditions() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const typeLogement = sessionStorage.getItem('depart_type_logement');
  const categorie = sessionStorage.getItem('depart_categorie');

  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  const [checklistItems, setChecklistItems] = useState({
    vaisselle: false,
    frigo: false,
    micro_onde: false,
    poubelles: false,
    terrasse: false,
    cles: false
  });

  useEffect(() => {
    if (!typeLogement) {
      navigate(createPageUrl('ClientDepartIdentification'));
    }
  }, [typeLogement, navigate]);

  const handleChecklistToggle = (key) => {
    setChecklistItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecklistDone = Object.values(checklistItems).every(v => v);

  const handleContinue = () => {
    if (!conditionsAccepted) {
      toast.error(lang === 'fr' 
        ? 'Veuillez accepter les conditions'
        : 'Please accept the conditions');
      return;
    }

    if (!allChecklistDone) {
      toast.error(lang === 'fr' 
        ? 'Veuillez cocher tous les éléments de la checklist'
        : 'Please check all checklist items');
      return;
    }

    navigate(createPageUrl('ClientDepartInventaire'));
  };

  const heureDepart = typeLogement === 'emplacement' ? '12h00' : '10h00';

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartLogement'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            ℹ️ {lang === 'fr' ? 'Conditions de départ' : 'Departure conditions'}
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            {lang === 'fr' ? 'Veuillez lire attentivement' : 'Please read carefully'}
          </p>

          {/* Horaires */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {lang === 'fr' ? 'Horaires de départ' : 'Departure times'}
              </h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <strong>{lang === 'fr' ? 'Départ officiel' : 'Official checkout'}:</strong> {heureDepart} {lang === 'fr' ? 'maximum' : 'at the latest'}
                </p>
                <p className="text-gray-600">
                  {typeLogement === 'emplacement' 
                    ? (lang === 'fr' ? 'L\'emplacement doit être libéré avant 12h.' : 'The pitch must be vacated before 12pm.')
                    : (lang === 'fr' ? 'Le logement doit être libéré au plus tard à 10h.' : 'The accommodation must be vacated by 10am at the latest.')}
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  ℹ️ {lang === 'fr' 
                    ? 'En cas de départ anticipé, pas besoin de prévenir, mais complétez l\'état des lieux.'
                    : 'For early departure, no need to notify, but complete the inventory.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* État attendu */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-3">
                ✔️ {lang === 'fr' ? 'Ce qui doit être fait' : 'What should be done'}
              </h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  {lang === 'fr' ? 'Vaisselle propre et rangée' : 'Dishes clean and stored'}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl">🧊</span>
                  {lang === 'fr' ? 'Frigo vidé' : 'Fridge emptied'}
                </p>
                {typeLogement === 'mobilhome' && (
                  <>
                    <p className="flex items-center gap-2">
                      <span className="text-xl">📻</span>
                      {lang === 'fr' ? 'Micro-onde vidé' : 'Microwave emptied'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-xl">🧹</span>
                      {lang === 'fr' ? 'Sol grossièrement propre' : 'Floor roughly clean'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-xl">🪑</span>
                      {lang === 'fr' ? 'Terrasse rangée' : 'Terrace tidy'}
                    </p>
                  </>
                )}
                <p className="flex items-center gap-2">
                  <span className="text-xl">🗑️</span>
                  {lang === 'fr' ? 'Poubelles vidées' : 'Trash emptied'}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  {lang === 'fr' ? 'Clé + carte barrière déposées à l\'accueil' : 'Key + barrier card returned to reception'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ménage NON inclus */}
          <Card className="border-2 border-red-300 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ❌ {lang === 'fr' ? 'Le forfait ménage n\'inclut PAS' : 'Cleaning package does NOT include'}
              </h2>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• {lang === 'fr' ? 'Nettoyage du frigo' : 'Fridge cleaning'}</p>
                <p>• {lang === 'fr' ? 'Nettoyage du micro-onde' : 'Microwave cleaning'}</p>
                <p>• {lang === 'fr' ? 'Vaisselle non faite / non rangée' : 'Undone / unorganized dishes'}</p>
                <p>• {lang === 'fr' ? 'Évacuation des poubelles' : 'Trash removal'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tri déchets */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-3 flex items-center gap-2">
                <Trash className="w-5 h-5" />
                ♻️ {lang === 'fr' ? 'Tri et déchets' : 'Sorting and waste'}
              </h2>
              <div className="space-y-2 text-sm">
                <p className="font-heading text-gray-700">
                  {lang === 'fr' ? 'Points de tri situés entre :' : 'Sorting points located between:'}
                </p>
                <p>• {lang === 'fr' ? 'Terrains de pétanque' : 'Pétanque courts'}</p>
                <p>• {lang === 'fr' ? 'Grand parking' : 'Main parking'}</p>
                <div className="mt-3 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-400 rounded" />
                    {lang === 'fr' ? 'Bac jaune : tri sélectif' : 'Yellow bin: recyclables'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-600 rounded" />
                    {lang === 'fr' ? 'Bac vert : ordures ménagères' : 'Green bin: household waste'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-white border-2 border-gray-400 rounded" />
                    {lang === 'fr' ? 'Conteneur verre' : 'Glass container'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ce que vous pouvez déclarer */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-3">
                📝 {lang === 'fr' ? 'Ce que vous pouvez déclarer' : 'What you can report'}
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-heading text-gray-700">🔧 {lang === 'fr' ? 'Problèmes techniques' : 'Technical issues'}</p>
                  <p className="text-xs text-gray-600">
                    {lang === 'fr' 
                      ? 'Porte/fenêtre, gaz, eau, électricité, appareils cassés...'
                      : 'Door/window, gas, water, electricity, broken appliances...'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-gray-700">🧹 {lang === 'fr' ? 'Problèmes ménage' : 'Cleaning issues'}</p>
                  <p className="text-xs text-gray-600">
                    {lang === 'fr' 
                      ? 'Vaisselle manquante, logement sale, literie tachée...'
                      : 'Missing dishes, dirty accommodation, stained bedding...'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-gray-700">🛠️ {lang === 'fr' ? 'Objets cassés/manquants' : 'Broken/missing items'}</p>
                  <p className="text-xs text-gray-600">
                    {lang === 'fr' 
                      ? 'Vaisselle, chaises, transats, couverts, accessoires...'
                      : 'Dishes, chairs, sun loungers, cutlery, accessories...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist obligatoire */}
          <Card className="border-2 border-[#FFD700]/60 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                ✅ {lang === 'fr' ? 'Checklist avant validation' : 'Checklist before validation'}
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Checkbox
                    checked={checklistItems.vaisselle}
                    onCheckedChange={() => handleChecklistToggle('vaisselle')}
                  />
                  <span className="text-sm font-heading">
                    🍽️ {lang === 'fr' ? 'Vaisselle propre et rangée' : 'Dishes clean and stored'}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Checkbox
                    checked={checklistItems.frigo}
                    onCheckedChange={() => handleChecklistToggle('frigo')}
                  />
                  <span className="text-sm font-heading">
                    🧊 {lang === 'fr' ? 'Frigo vidé' : 'Fridge emptied'}
                  </span>
                </label>

                {typeLogement === 'mobilhome' && (
                  <>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <Checkbox
                        checked={checklistItems.micro_onde}
                        onCheckedChange={() => handleChecklistToggle('micro_onde')}
                      />
                      <span className="text-sm font-heading">
                        📻 {lang === 'fr' ? 'Micro-onde vidé' : 'Microwave emptied'}
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <Checkbox
                        checked={checklistItems.terrasse}
                        onCheckedChange={() => handleChecklistToggle('terrasse')}
                      />
                      <span className="text-sm font-heading">
                        🪑 {lang === 'fr' ? 'Terrasse rangée' : 'Terrace tidy'}
                      </span>
                    </label>
                  </>
                )}

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Checkbox
                    checked={checklistItems.poubelles}
                    onCheckedChange={() => handleChecklistToggle('poubelles')}
                  />
                  <span className="text-sm font-heading">
                    🗑️ {lang === 'fr' ? 'Poubelles vidées' : 'Trash emptied'}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Checkbox
                    checked={checklistItems.cles}
                    onCheckedChange={() => handleChecklistToggle('cles')}
                  />
                  <span className="text-sm font-heading">
                    🔑 {lang === 'fr' ? 'Clé + carte barrière déposées' : 'Key + barrier card returned'}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Urgences astreintes */}
          <Card className="border-2 border-red-300 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                🚨 {lang === 'fr' ? 'Urgences - Astreintes (20h → 23h)' : 'Emergencies - On-call (8pm → 11pm)'}
              </h2>
              <div className="space-y-2 text-sm">
                <p className="font-heading text-gray-700">
                  {lang === 'fr' ? 'Uniquement les urgences vitales :' : 'Only vital emergencies:'}
                </p>
                <p className="text-gray-600">• {lang === 'fr' ? 'Pas d\'eau' : 'No water'}</p>
                <p className="text-gray-600">• {lang === 'fr' ? 'Pas de gaz' : 'No gas'}</p>
                <p className="text-gray-600">• {lang === 'fr' ? 'Pas d\'électricité' : 'No electricity'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ {lang === 'fr' 
                    ? 'Autres demandes → traitées le matin suivant'
                    : 'Other requests → processed the next morning'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card className="border-2 border-gray-300 rounded-xl mb-4">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg text-[#0077A8] mb-3">
                🔒 {lang === 'fr' ? 'Informations personnelles' : 'Personal information'}
              </h2>
              <p className="text-sm text-gray-600">
                {lang === 'fr' 
                  ? 'Les données (nom, prénom, dates, n° logement) seront utilisées uniquement pour vérifier le dossier, comparer l\'état des lieux arrivée → départ, et éditer le PDF final. Aucune utilisation commerciale.'
                  : 'Data (name, dates, accommodation number) will be used only to verify the file, compare arrival → departure conditions, and generate the final PDF. No commercial use.'}
              </p>
            </CardContent>
          </Card>

          {/* Message final */}
          <Card className="border-2 border-[#FFD700]/60 rounded-xl mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                {lang === 'fr' 
                  ? '📋 Vous allez maintenant compléter l\'inventaire de départ. Les objets non cochés ou signalés seront automatiquement transmis au service concerné (Technique / Ménage). Merci de procéder avec attention.'
                  : '📋 You will now complete the departure inventory. Unchecked or reported items will be automatically forwarded to the relevant service (Technical / Housekeeping). Please proceed carefully.'}
              </p>
            </CardContent>
          </Card>

          {/* Acceptation conditions */}
          <Card className="border-2 border-[#00AEEF] rounded-xl mb-6">
            <CardContent className="p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={conditionsAccepted}
                  onCheckedChange={setConditionsAccepted}
                  className="mt-1"
                />
                <span className="text-sm font-heading text-gray-700">
                  {lang === 'fr' 
                    ? 'J\'ai lu et j\'accepte les conditions de départ. Je confirme avoir effectué la checklist ci-dessus.'
                    : 'I have read and accept the departure conditions. I confirm I have completed the checklist above.'}
                </span>
              </label>
            </CardContent>
          </Card>

          <Button
            onClick={handleContinue}
            disabled={!conditionsAccepted || !allChecklistDone}
            className="w-full h-14 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading text-lg disabled:opacity-50"
          >
            {lang === 'fr' ? 'Continuer vers inventaire' : 'Continue to inventory'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}