import React from 'react';
import { useTranslation } from './translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Camera, Wrench, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConditionsArrivee() {
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';

  return (
    <div className="space-y-4">
      {/* 2.1 Avant de commencer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-[#00AEEF] rounded-xl">
          <CardHeader className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] text-white pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {isFrench ? '🎉 Bienvenue au Camping Paradis !' : '🎉 Welcome to Camping Paradis!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-body text-gray-700 leading-relaxed">
              {isFrench 
                ? 'Merci de remplir ces informations afin de préparer au mieux votre installation et votre séjour. Cela nous permet de vous offrir un service optimal !' 
                : 'Please fill in this information to best prepare your installation and stay. This allows us to offer you optimal service!'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.2 État du locatif */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-orange-500 rounded-xl">
          <CardHeader className="bg-orange-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              {isFrench ? '🧼 État du locatif à l\'arrivée' : '🧼 Rental condition on arrival'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700">
              {isFrench 
                ? 'Nous faisons toujours un contrôle avant votre arrivée, mais si vous constatez :' 
                : 'We always check before your arrival, but if you notice:'}
            </p>
            <div className="space-y-2 bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-body">{isFrench ? 'Vaisselle sale' : 'Dirty dishes'}</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-body">{isFrench ? 'Sol non propre' : 'Unclean floor'}</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-body">{isFrench ? 'Odeur désagréable' : 'Unpleasant smell'}</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-body">{isFrench ? 'WC ou douche mal nettoyé' : 'Poorly cleaned toilet/shower'}</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-body">{isFrench ? 'Poussière excessive' : 'Excessive dust'}</span>
              </div>
            </div>
            <div className="bg-[#00AEEF]/10 p-4 rounded-lg border-2 border-[#00AEEF]">
              <p className="font-heading text-[#0077A8] font-semibold">
                👉 {isFrench ? 'Signalez-le immédiatement avant de vous installer.' : 'Report it immediately before settling in.'}
              </p>
              <p className="text-sm text-gray-600 mt-2 font-body">
                {isFrench 
                  ? '🟦 Cela protège votre caution et permet d\'envoyer le ménage.' 
                  : '🟦 This protects your deposit and allows us to send housekeeping.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.3 Inventaire */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-2 border-purple-500 rounded-xl">
          <CardHeader className="bg-purple-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <Info className="w-5 h-5" />
              {isFrench ? '🧪 Inventaire à vérifier' : '🧪 Inventory to check'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700">
              {isFrench 
                ? 'Un inventaire interactif sera affiché selon votre catégorie de locatif.' 
                : 'An interactive inventory will be displayed according to your rental category.'}
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span>✔</span>
                <span className="font-body text-gray-700">
                  {isFrench ? 'Valider les objets présents en touchant les icônes' : 'Validate present items by tapping icons'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span>❗</span>
                <span className="font-body text-gray-700">
                  {isFrench ? 'Laisser non coché = objet manquant / cassé' : 'Leave unchecked = missing/broken item'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span>📸</span>
                <span className="font-body text-gray-700">
                  {isFrench ? 'Ajouter une photo (facultatif, mais recommandé)' : 'Add a photo (optional, but recommended)'}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
              <p className="text-sm font-body text-yellow-900">
                📌 {isFrench 
                  ? 'En cas d\'objet cassé ou manquant → une intervention ménage/technique est déclenchée automatiquement.' 
                  : 'If an item is broken or missing → a housekeeping/technical intervention is triggered automatically.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.4 Photos d'arrivée */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-2 border-green-500 rounded-xl">
          <CardHeader className="bg-green-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Camera className="w-5 h-5" />
              {isFrench ? '🎯 Photos d\'arrivée (Fortement recommandé)' : '🎯 Arrival photos (Highly recommended)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="font-body text-gray-700">
              {isFrench 
                ? 'Les photos ne sont pas obligatoires, SAUF si :' 
                : 'Photos are not mandatory, EXCEPT if:'}
            </p>
            <div className="space-y-2 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span>📌</span>
                <span className="font-body">{isFrench ? 'Problème de propreté' : 'Cleanliness issue'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>📌</span>
                <span className="font-body">{isFrench ? 'Matériel cassé' : 'Broken equipment'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <span>📌</span>
                <span className="font-body">{isFrench ? 'Doute sur l\'état général' : 'Doubt about general condition'}</span>
              </div>
            </div>
            <div className="bg-[#00AEEF]/10 p-4 rounded-lg border-2 border-[#00AEEF]">
              <p className="font-heading text-[#0077A8] font-semibold">
                👉 {isFrench ? 'Elles vous protègent en cas de litige au départ.' : 'They protect you in case of dispute at departure.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.5 Déclarer un problème */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-2 border-red-500 rounded-xl">
          <CardHeader className="bg-red-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <Wrench className="w-5 h-5" />
              {isFrench ? '🛠️ Déclarer un problème à l\'arrivée' : '🛠️ Report a problem on arrival'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <p className="font-body text-gray-700 mb-3">
              {isFrench ? 'Vous pouvez déclarer :' : 'You can report:'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                <span>🔧</span>
                <span className="font-body text-sm">{isFrench ? 'Technique : eau / gaz / électricité / chauffe-eau' : 'Technical: water / gas / electricity / water heater'}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded">
                <span>🧹</span>
                <span className="font-body text-sm">{isFrench ? 'Ménage : literie, vaisselle, sol, poussière' : 'Housekeeping: bedding, dishes, floor, dust'}</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 p-2 rounded">
                <span>🐝</span>
                <span className="font-body text-sm">{isFrench ? 'Nuisibles : guêpes, frelons, rongeurs' : 'Pests: wasps, hornets, rodents'}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
                <span>🪑</span>
                <span className="font-body text-sm">{isFrench ? 'Matériel cassé (⚠ peut engager caution)' : 'Broken equipment (⚠ may involve deposit)'}</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 p-2 rounded">
                <span>⚠</span>
                <span className="font-body text-sm">{isFrench ? 'Dysfonctionnements divers' : 'Various malfunctions'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.6 Délais d'intervention */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-2 border-[#FFD700] rounded-xl">
          <CardHeader className="bg-yellow-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              {isFrench ? '⏱️ Délais d\'intervention' : '⏱️ Intervention times'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-heading text-[#0077A8] mb-2">🔧 {isFrench ? 'Technique' : 'Technical'}</h4>
              <p className="text-sm font-body text-gray-700">
                {isFrench ? 'Basse saison : 9h–12h / 13h30–18h30' : 'Low season: 9am–12pm / 1:30pm–6:30pm'}
              </p>
              <p className="text-sm font-body text-gray-700">
                {isFrench ? 'Haute saison : 8h30–12h / 14h–20h' : 'High season: 8:30am–12pm / 2pm–8pm'}
              </p>
              <p className="text-sm font-body text-gray-700 font-semibold">
                {isFrench ? 'Samedi non-stop : 8h30–20h' : 'Saturday non-stop: 8:30am–8pm'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-heading text-green-700 mb-2">🧹 {isFrench ? 'Ménage' : 'Housekeeping'}</h4>
              <p className="text-sm font-body text-gray-700">9h–16h</p>
              <p className="text-sm font-body text-gray-700">
                {isFrench ? 'Week-ends d\'été : renfort' : 'Summer weekends: reinforcement'}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h4 className="font-heading text-red-700 mb-2">🌙 {isFrench ? 'Astreinte 20h–23h' : 'On-call 8pm–11pm'}</h4>
              <p className="text-sm font-body text-red-800 font-semibold">
                {isFrench ? 'Uniquement urgences :' : 'Emergencies only:'}
              </p>
              <div className="space-y-1 mt-2">
                <p className="text-sm">💧 {isFrench ? 'Plus d\'eau' : 'No water'}</p>
                <p className="text-sm">🔥 {isFrench ? 'Plus de gaz' : 'No gas'}</p>
                <p className="text-sm">⚡ {isFrench ? 'Plus d\'électricité' : 'No electricity'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.7 Tri & Poubelles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-2 border-green-600 rounded-xl">
          <CardHeader className="bg-green-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              ♻️ {isFrench ? 'Tri & Poubelles' : 'Sorting & Trash'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="bg-green-100 p-4 rounded-lg border-2 border-green-400">
              <p className="font-heading text-green-800 text-lg mb-3">
                ♻️ {isFrench ? 'Tri sélectif (obligatoire)' : 'Selective sorting (mandatory)'}
              </p>
              <p className="font-body text-green-700 mb-3">
                {isFrench 
                  ? 'Point de tri situé entre les hébergements :' 
                  : 'Sorting point located between accommodations:'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-400">
                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🟡</span>
                </div>
                <div>
                  <p className="font-heading text-yellow-800">
                    {isFrench ? 'Poubelle jaune' : 'Yellow bin'}
                  </p>
                  <p className="text-sm font-body text-yellow-700">
                    {isFrench ? 'Recyclage (carton, plastique, métal)' : 'Recycling (cardboard, plastic, metal)'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-400">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🟢</span>
                </div>
                <div>
                  <p className="font-heading text-green-800">
                    {isFrench ? 'Poubelle verte' : 'Green bin'}
                  </p>
                  <p className="text-sm font-body text-green-700">
                    {isFrench ? 'Ordures ménagères' : 'Household waste'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-400">
                <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">♻️</span>
                </div>
                <div>
                  <p className="font-heading text-blue-800">
                    {isFrench ? 'Conteneur verre' : 'Glass container'}
                  </p>
                  <p className="text-sm font-body text-blue-700">
                    {isFrench ? 'Bouteilles / bocaux' : 'Bottles / jars'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2.8 Informations personnelles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="border-2 border-[#00AEEF] rounded-xl">
          <CardHeader className="bg-[#e6f7ff] pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0077A8]">
              <Info className="w-5 h-5" />
              {isFrench ? '🧾 Informations personnelles' : '🧾 Personal information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-body text-gray-700 mb-3">
              {isFrench ? 'Servent uniquement à :' : 'Used only for:'}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="font-body text-gray-700">{isFrench ? 'Vérifier que vous êtes client' : 'Verify you are a guest'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="font-body text-gray-700">{isFrench ? 'Garantir un suivi rapide' : 'Ensure quick follow-up'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="font-body text-gray-700">{isFrench ? 'Améliorer les services' : 'Improve services'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="font-body text-gray-700">{isFrench ? 'Générer les documents d\'arrivée' : 'Generate arrival documents'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}