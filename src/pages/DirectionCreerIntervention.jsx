import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { toast } from 'sonner';

export default function DirectionCreerIntervention() {
  const navigate = useNavigate();
  const location = useLocation();
  const { typeIntervention, datePlanifiee, typeHebergement, numerosHebergement = [] } = location.state || {};

  const [taches, setTaches] = useState([]);
  const [nouvelleTache, setNouvelleTache] = useState('');
  const [service, setService] = useState('TECHNIQUE');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState('NORMALE');

  const handleAjouterTache = () => {
    if (!nouvelleTache.trim()) {
      toast.error('Veuillez saisir une tâche');
      return;
    }

    setTaches([...taches, {
      numero: taches.length + 1,
      texte: nouvelleTache.trim()
    }]);
    setNouvelleTache('');
  };

  const handleSupprimerTache = (numero) => {
    const newTaches = taches
      .filter(t => t.numero !== numero)
      .map((t, index) => ({ ...t, numero: index + 1 }));
    setTaches(newTaches);
  };

  const handleCreer = () => {
    // LOG CRITIQUE : vérifier payload AVANT envoi
    console.log('[DIRECTION-CREER] Payload avant génération:', {
      type: typeIntervention,
      zones: numerosHebergement,
      zones_count: numerosHebergement?.length || 0,
      taches_count: taches?.length || 0,
      service
    });

    // Validation QA stricte
    if (taches.length === 0) {
      toast.error('❌ Ajoutez au moins une tâche pour cette intervention');
      return;
    }

    if (!numerosHebergement || numerosHebergement.length === 0) {
      console.error('[DIRECTION-CREER] CRITICAL: Aucune zone dans numerosHebergement');
      toast.error('❌ Aucun hébergement sélectionné. Veuillez recommencer le processus.');
      return;
    }

    // Génération automatique : une intervention PAR hébergement
    const interventions = numerosHebergement.map(numero => ({
      typeIntervention,
      datePlanifiee,
      typeHebergement,
      numeroHebergement: numero,
      service,
      description: description.trim(),
      priorite,
      taches,
      source: 'direction'
    }));

    console.log(`[DIRECTION-CREER] ✅ ${interventions.length} intervention(s) générées pour ${numerosHebergement.length} zone(s)`);
    navigate(createPageUrl('DirectionRecapIntervention'), { state: { interventions } });
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            🔧 Créer une intervention
          </h1>
          <p className="text-center text-gray-600 font-body mb-2">
            Étape 5/5 - Configuration finale
          </p>
          <p className="text-center text-purple-700 font-heading text-lg">
            {numerosHebergement.length > 1 
              ? `${numerosHebergement.length} hébergements sélectionnés`
              : `${numerosHebergement[0]} (${typeHebergement})`
            }
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Tâches */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <h2 className="font-heading text-lg text-purple-700 mb-4">Liste des tâches</h2>
            
            <div className="space-y-2 mb-4">
              {taches.map((tache) => (
                <div key={tache.numero} className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg">
                  <span className="font-bold text-purple-600">{tache.numero}️⃣</span>
                  <span className="flex-1 font-body">{tache.texte}</span>
                  <button
                    onClick={() => handleSupprimerTache(tache.numero)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={nouvelleTache}
                onChange={(e) => setNouvelleTache(e.target.value)}
                placeholder="Nouvelle tâche..."
                onKeyPress={(e) => e.key === 'Enter' && handleAjouterTache()}
              />
              <Button onClick={handleAjouterTache} className="bg-purple-600">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Service */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <h2 className="font-heading text-lg text-purple-700 mb-4">Service assigné *</h2>
            <RadioGroup value={service} onValueChange={setService}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="TECHNIQUE" id="tech" />
                <Label htmlFor="tech" className="font-heading cursor-pointer">
                  🧰 Technique
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MENAGE" id="menage" />
                <Label htmlFor="menage" className="font-heading cursor-pointer">
                  🧽 Ménage
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <h2 className="font-heading text-lg text-purple-700 mb-4">Description détaillée</h2>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'intervention... (facultatif)"
              className="min-h-[100px]"
            />
          </div>

          {/* Priorité */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <h2 className="font-heading text-lg text-purple-700 mb-4">Priorité</h2>
            <RadioGroup value={priorite} onValueChange={setPriorite}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="NORMALE" id="normale" />
                <Label htmlFor="normale" className="font-heading cursor-pointer">
                  ◯ Normale
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="URGENTE" id="urgente" />
                <Label htmlFor="urgente" className="font-heading cursor-pointer">
                  ⚠️ Urgente
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Créer */}
          <Button onClick={handleCreer} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-lg">
            ➕ Créer l'intervention
          </Button>
        </div>
      </div>
    </div>
  );
}