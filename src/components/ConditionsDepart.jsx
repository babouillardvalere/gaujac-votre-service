import React from 'react';
import { useTranslation } from './translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Camera, Wrench, FileText, PenTool, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConditionsDepart() {
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';

  return (
    <div className="space-y-4">
      {/* 3.1 Horaires & règles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-red-500 rounded-xl">
          <CardHeader className="bg-red-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <Clock className="w-5 h-5" />
              {isFrench ? '📌 Horaires & règles de départ' : '📌 Departure times & rules'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="bg-red-100 p-4 rounded-lg border-2 border-red-400">
              <p className="font-heading text-red-800 text-lg">
                🕙 {isFrench ? 'Départ : 10h maximum' : 'Departure: 10am maximum'}
              </p>
              <p className="text-sm font-body text-red-700 mt-2">
                ⏳ {isFrench ? 'Dépassement → facturation automatique' : 'Late departure → automatic billing'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.2 Locatif à rendre propre */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-orange-500 rounded-xl">
          <CardHeader className="bg-orange-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              {isFrench ? '🧽 Locatif à rendre propre' : '🧽 Rental to be returned clean'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700 mb-3">
              {isFrench 
                ? 'Le locatif doit être rendu dans l\'état où vous l\'avez trouvé :' 
                : 'The rental must be returned in the condition you found it:'}
            </p>
            <div className="space-y-2 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Vaisselle propre et rangée' : 'Dishes clean and put away'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Frigo vidé & nettoyé' : 'Fridge emptied & cleaned'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Micro-onde nettoyé' : 'Microwave cleaned'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Sol propre' : 'Clean floor'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Poubelles vidées' : 'Trash emptied'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Terrasse rangée' : 'Terrace tidied'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Couvertures pliées' : 'Blankets folded'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>✔</span>
                <span className="font-body">{isFrench ? 'Meubles remis en place' : 'Furniture put back'}</span>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-300">
              <p className="font-heading text-red-800 mb-2">
                ⚠ {isFrench ? 'Le ménage ne comprend pas :' : 'Cleaning does not include:'}
              </p>
              <ul className="space-y-1 text-sm font-body text-red-700">
                <li>• {isFrench ? 'Nettoyage frigo' : 'Fridge cleaning'}</li>
                <li>• {isFrench ? 'Nettoyage micro-ondes' : 'Microwave cleaning'}</li>
                <li>• {isFrench ? 'Vaisselle' : 'Dishes'}</li>
                <li>• {isFrench ? 'Poubelles' : 'Trash'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.3 Inventaire de départ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-2 border-purple-500 rounded-xl">
          <CardHeader className="bg-purple-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <FileText className="w-5 h-5" />
              {isFrench ? '🧪 Inventaire DE DÉPART (Prérempli)' : '🧪 DEPARTURE Inventory (Pre-filled)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700 mb-3">
              {isFrench 
                ? 'L\'inventaire rempli à l\'arrivée revient automatiquement ici :' 
                : 'The inventory filled at arrival automatically returns here:'}
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span>✔</span>
                <span className="font-body text-gray-700">{isFrench ? 'Objets validés' : 'Validated items'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span>❌</span>
                <span className="font-body text-gray-700">{isFrench ? 'Objets manquants signalés' : 'Reported missing items'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span>📸</span>
                <span className="font-body text-gray-700">{isFrench ? 'Photos d\'arrivée accessibles' : 'Arrival photos accessible'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span>➕</span>
                <span className="font-body text-gray-700">
                  {isFrench ? 'Le client peut modifier si un objet a été cassé pendant le séjour' : 'Guest can modify if item broken during stay'}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
              <p className="text-sm font-body text-yellow-900">
                {isFrench 
                  ? 'Si un dégât est déclaré → fiche dégâts automatique.' 
                  : 'If damage is reported → automatic damage report.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.4 Propreté finale */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-2 border-blue-500 rounded-xl">
          <CardHeader className="bg-blue-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Info className="w-5 h-5" />
              {isFrench ? '🧹 Propreté finale' : '🧹 Final cleanliness'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-body text-gray-700 mb-3">
              {isFrench ? '3 niveaux de satisfaction :' : '3 satisfaction levels:'}
            </p>
            <div className="space-y-2">
              <div className="bg-red-50 p-3 rounded-lg border border-red-300">
                <span className="text-2xl mr-2">😠</span>
                <span className="font-heading text-red-700">
                  {isFrench ? 'Pas satisfaisant (ouvre un commentaire obligatoire)' : 'Not satisfactory (requires comment)'}
                </span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                <span className="text-2xl mr-2">😐</span>
                <span className="font-heading text-yellow-700">
                  {isFrench ? 'Correct (commentaire facultatif)' : 'Okay (optional comment)'}
                </span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-300">
                <span className="text-2xl mr-2">😄</span>
                <span className="font-heading text-green-700">
                  {isFrench ? 'Très propre (validation directe)' : 'Very clean (direct validation)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.5 Photos de départ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-2 border-green-500 rounded-xl">
          <CardHeader className="bg-green-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Camera className="w-5 h-5" />
              {isFrench ? '📸 Photos de départ (Facultatives mais utiles)' : '📸 Departure photos (Optional but useful)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700 mb-3">
              {isFrench ? 'Le client peut ajouter :' : 'Guest can add:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 {isFrench ? 'Cuisine' : 'Kitchen'}</div>
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 {isFrench ? 'Salle de bain' : 'Bathroom'}</div>
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 WC</div>
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 {isFrench ? 'Chambres' : 'Bedrooms'}</div>
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 {isFrench ? 'Séjour' : 'Living room'}</div>
              <div className="bg-blue-50 p-2 rounded text-center font-body text-sm">📸 {isFrench ? 'Terrasse' : 'Terrace'}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
              <p className="text-sm font-body text-yellow-900">
                📌 {isFrench ? 'UTILE SI : casse, saleté, matériel déplacé.' : 'USEFUL IF: damage, dirt, moved equipment.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.6 Déclarer un dégât */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-2 border-red-500 rounded-xl">
          <CardHeader className="bg-red-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <Wrench className="w-5 h-5" />
              {isFrench ? '🛠️ Déclarer un dégât' : '🛠️ Report damage'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <p className="font-body text-gray-700 mb-3">
              {isFrench ? 'En cas de :' : 'In case of:'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
                <span>💥</span>
                <span className="font-body text-sm">{isFrench ? 'Casse' : 'Breakage'}</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 p-2 rounded">
                <span>🚪</span>
                <span className="font-body text-sm">{isFrench ? 'Porte qui ferme mal' : 'Door that doesn\'t close properly'}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                <span>🧯</span>
                <span className="font-body text-sm">{isFrench ? 'Fuite eau' : 'Water leak'}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
                <span>🔥</span>
                <span className="font-body text-sm">{isFrench ? 'Problème gaz' : 'Gas problem'}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded">
                <span>⚡</span>
                <span className="font-body text-sm">{isFrench ? 'Problème électrique' : 'Electrical problem'}</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                <span>🐜</span>
                <span className="font-body text-sm">{isFrench ? 'Nuisibles' : 'Pests'}</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300 mt-3">
              <p className="text-sm font-body text-yellow-900">
                → {isFrench 
                  ? 'Une intervention technique/ménage se crée automatiquement.' 
                  : 'A technical/housekeeping intervention is created automatically.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.7 Remarques */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-2 border-purple-500 rounded-xl">
          <CardHeader className="bg-purple-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <FileText className="w-5 h-5" />
              {isFrench ? '📝 Remarques' : '📝 Comments'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-body text-gray-700">
              {isFrench 
                ? 'Champ libre + dictée vocale disponible pour vos observations.' 
                : 'Free field + voice dictation available for your observations.'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3.8 Signature électronique */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="border-2 border-[#00AEEF] rounded-xl">
          <CardHeader className="bg-[#e6f7ff] pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0077A8]">
              <PenTool className="w-5 h-5" />
              {isFrench ? '✒️ Signature électronique' : '✒️ Electronic signature'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-body text-gray-700">
              {isFrench 
                ? 'Pour valider le départ et figer l\'état du locatif.' 
                : 'To validate the departure and freeze the rental condition.'}
            </p>
            <div className="bg-[#00AEEF]/10 p-4 rounded-lg border-2 border-[#00AEEF] mt-3">
              <p className="font-heading text-[#0077A8] font-semibold">
                📌 {isFrench 
                  ? 'Votre signature confirme l\'état des lieux de départ.' 
                  : 'Your signature confirms the departure inventory.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}