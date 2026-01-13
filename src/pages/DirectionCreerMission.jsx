import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { toast } from 'sonner';

export default function DirectionCreerMission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(1); // 1=type, 2=zones, 3=taches, 4=recap
  
  const [typeMission, setTypeMission] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [objectif, setObjectif] = useState('');
  const [priorite, setPriorite] = useState('NORMALE');
  const [datePlanifiee, setDatePlanifiee] = useState('');
  
  const [zones, setZones] = useState([]);
  const [nouvelleZone, setNouvelleZone] = useState({
    type_zone: 'hebergement',
    numero: '',
    categorie: '',
    etat_avant: 'fonctionnel'
  });
  
  const [tachesParService, setTachesParService] = useState({
    TECHNIQUE: [],
    MENAGE: []
  });
  
  const [nouvelleTache, setNouvelleTache] = useState({ TECHNIQUE: '', MENAGE: '' });

  const createMissionMutation = useMutation({
    mutationFn: async (missionData) => {
      const user = await base44.auth.me();
      
      // 1. Créer la MissionDirection (conteneur)
      const mission = await base44.entities.MissionDirection.create({
        type_mission: missionData.type_mission,
        titre: missionData.titre,
        description: missionData.description,
        objectif: missionData.objectif,
        priorite: missionData.priorite,
        date_planifiee: missionData.date_planifiee,
        zones: missionData.zones,
        statut: 'A_FAIRE',
        createur: user.full_name || user.email,
        date_creation: new Date().toISOString(),
        mission_direction: true,
        services_intervenants: [],
        actions_prevues: [],
        validation_cloture: {
          etats_apres_renseignes: false,
          resultats_services_renseignes: false,
          cloture_autorisee: false
        }
      });

      // 2. Générer les WorkItems pour chaque service
      const workItemsACreer = [];
      
      // WorkItems TECHNIQUE
      missionData.taches_technique.forEach((tache, idx) => {
        missionData.zones.forEach(zone => {
          workItemsACreer.push({
            type: 'MISSION_DIRECTION',
            service: 'TECHNIQUE',
            titre: `${missionData.type_mission} - ${tache}`,
            description: `Zone: ${zone.numero} (${zone.categorie})`,
            hebergement: zone.numero,
            type_hebergement: zone.categorie,
            mission_direction_id: mission.id,
            statut: 'A_FAIRE',
            priorite: missionData.priorite,
            taches: [{
              numero: idx + 1,
              texte: tache,
              faite: false
            }]
          });
        });
      });
      
      // WorkItems MENAGE
      missionData.taches_menage.forEach((tache, idx) => {
        missionData.zones.forEach(zone => {
          workItemsACreer.push({
            type: 'MISSION_DIRECTION',
            service: 'MENAGE',
            titre: `${missionData.type_mission} - ${tache}`,
            description: `Zone: ${zone.numero} (${zone.categorie})`,
            hebergement: zone.numero,
            type_hebergement: zone.categorie,
            mission_direction_id: mission.id,
            statut: 'A_FAIRE',
            priorite: missionData.priorite,
            taches: [{
              numero: idx + 1,
              texte: tache,
              faite: false
            }]
          });
        });
      });

      if (workItemsACreer.length > 0) {
        await base44.entities.WorkItem.bulkCreate(workItemsACreer);
      }

      // 3. Créer événement historique
      await base44.entities.HistoriqueEvent.create({
        type_event: 'MISSION_DIRECTION_CREEE',
        titre: `Mission ${missionData.type_mission} créée: ${missionData.titre}`,
        description: `${workItemsACreer.length} tâche(s) générée(s) pour ${missionData.zones.length} zone(s)`,
        service: 'DIRECTION',
        collaborateur: user.full_name || user.email,
        mission_direction_id: mission.id,
        metadata: {
          zones_count: missionData.zones.length,
          workitems_count: workItemsACreer.length,
          services: ['TECHNIQUE', 'MENAGE'].filter(s => 
            workItemsACreer.some(w => w.service === s)
          )
        }
      });

      return { mission, workItemsCount: workItemsACreer.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['missions-direction-list'] });
      queryClient.invalidateQueries({ queryKey: ['bureau-workitems'] });
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
      
      toast.success(`✅ Mission créée avec ${result.workItemsCount} tâche(s) opérationnelle(s)`);
      navigate(createPageUrl('MissionsDirection'));
    },
    onError: (error) => {
      console.error('Erreur création mission:', error);
      toast.error('❌ Erreur lors de la création de la mission');
    }
  });

  const ajouterZone = () => {
    if (!nouvelleZone.numero || !nouvelleZone.categorie) {
      toast.error('Numéro et catégorie obligatoires');
      return;
    }
    
    if (zones.some(z => z.numero === nouvelleZone.numero)) {
      toast.error('Cette zone existe déjà');
      return;
    }

    setZones([...zones, { ...nouvelleZone }]);
    setNouvelleZone({
      type_zone: 'hebergement',
      numero: '',
      categorie: '',
      etat_avant: 'fonctionnel'
    });
  };

  const supprimerZone = (numero) => {
    setZones(zones.filter(z => z.numero !== numero));
  };

  const ajouterTache = (service) => {
    const texte = nouvelleTache[service]?.trim();
    if (!texte) {
      toast.error('Texte de tâche requis');
      return;
    }
    
    setTachesParService({
      ...tachesParService,
      [service]: [...tachesParService[service], texte]
    });
    
    setNouvelleTache({ ...nouvelleTache, [service]: '' });
  };

  const supprimerTache = (service, index) => {
    setTachesParService({
      ...tachesParService,
      [service]: tachesParService[service].filter((_, i) => i !== index)
    });
  };

  const handleValiderCreation = () => {
    if (!titre.trim()) {
      toast.error('Titre obligatoire');
      return;
    }

    if (zones.length === 0) {
      toast.error('Ajoutez au moins une zone');
      return;
    }

    const totalTaches = tachesParService.TECHNIQUE.length + tachesParService.MENAGE.length;
    if (totalTaches === 0) {
      toast.error('Ajoutez au moins une tâche (Technique ou Ménage)');
      return;
    }

    createMissionMutation.mutate({
      type_mission: typeMission,
      titre: titre.trim(),
      description: description.trim(),
      objectif: objectif.trim(),
      priorite,
      date_planifiee: datePlanifiee || null,
      zones,
      taches_technique: tachesParService.TECHNIQUE,
      taches_menage: tachesParService.MENAGE
    });
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-purple-600 text-center mb-2">
            🏢 Créer une Mission Direction
          </h1>
          <p className="text-center text-gray-600 font-body">
            Modèle unifié : MissionDirection + WorkItems
          </p>
        </motion.div>

        {/* Progression */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step <= etape ? 'bg-purple-600 w-12' : 'bg-gray-200 w-8'
              }`}
            />
          ))}
        </div>

        {/* Étape 1 : Type et informations */}
        {etape === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="font-heading text-purple-700">1️⃣ Type et informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-bold mb-2 block">Type de mission *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['HIVERNAGE', 'DESHIVERNAGE', 'INTERVENTION'].map(type => (
                      <Button
                        key={type}
                        onClick={() => setTypeMission(type)}
                        variant={typeMission === type ? 'default' : 'outline'}
                        className={`h-16 ${
                          typeMission === type
                            ? type === 'HIVERNAGE' ? 'bg-blue-600' :
                              type === 'DESHIVERNAGE' ? 'bg-yellow-600' : 'bg-purple-600'
                            : ''
                        }`}
                      >
                        {type === 'HIVERNAGE' ? '❄️ Hivernage' :
                         type === 'DESHIVERNAGE' ? '🌞 Déshivernage' :
                         '🔧 Intervention'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold mb-2 block">Titre *</label>
                  <Input
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex: Hivernage zone A - décembre 2025"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold mb-2 block">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description détaillée de la mission..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold mb-2 block">Objectif (POURQUOI)</label>
                  <Input
                    value={objectif}
                    onChange={(e) => setObjectif(e.target.value)}
                    placeholder="Ex: Protéger les installations contre le gel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold mb-2 block">Priorité</label>
                    <Select value={priorite} onValueChange={setPriorite}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMALE">Normale</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                        <SelectItem value="CRITIQUE">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">Date planifiée</label>
                    <Input
                      type="date"
                      value={datePlanifiee}
                      onChange={(e) => setDatePlanifiee(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!typeMission || !titre.trim()) {
                      toast.error('Type et titre obligatoires');
                      return;
                    }
                    setEtape(2);
                  }}
                  className="w-full bg-purple-600 h-12"
                >
                  Suivant →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Étape 2 : Zones */}
        {etape === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="font-heading text-purple-700">2️⃣ Zones concernées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold mb-1 block">Type de zone</label>
                      <Select
                        value={nouvelleZone.type_zone}
                        onValueChange={(v) => setNouvelleZone({ ...nouvelleZone, type_zone: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hebergement">Hébergement</SelectItem>
                          <SelectItem value="emplacement">Emplacement</SelectItem>
                          <SelectItem value="secteur">Secteur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">Numéro *</label>
                      <Input
                        value={nouvelleZone.numero}
                        onChange={(e) => setNouvelleZone({ ...nouvelleZone, numero: e.target.value })}
                        placeholder="Ex: M03"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">Catégorie *</label>
                      <Input
                        value={nouvelleZone.categorie}
                        onChange={(e) => setNouvelleZone({ ...nouvelleZone, categorie: e.target.value })}
                        placeholder="Ex: MH Premium 2ch"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">État avant</label>
                      <Select
                        value={nouvelleZone.etat_avant}
                        onValueChange={(v) => setNouvelleZone({ ...nouvelleZone, etat_avant: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fonctionnel">Fonctionnel</SelectItem>
                          <SelectItem value="partiellement_fonctionnel">Partiellement fonctionnel</SelectItem>
                          <SelectItem value="non_fonctionnel">Non fonctionnel</SelectItem>
                          <SelectItem value="hors_service">Hors service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={ajouterZone} className="w-full mt-3 bg-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter cette zone
                  </Button>
                </div>

                {zones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-purple-900">{zones.length} zone(s) ajoutée(s)</h4>
                    {zones.map((zone, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border-2 border-purple-200">
                        <div className="flex-1">
                          <span className="font-bold text-purple-700">
                            📍 {zone.numero}
                          </span>
                          <span className="text-sm text-gray-600 ml-3">
                            {zone.categorie}
                          </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {zone.type_zone}
                          </Badge>
                        </div>
                        <button
                          onClick={() => supprimerZone(zone.numero)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setEtape(1)} variant="outline" className="flex-1">
                    ← Précédent
                  </Button>
                  <Button
                    onClick={() => {
                      if (zones.length === 0) {
                        toast.error('Ajoutez au moins une zone');
                        return;
                      }
                      setEtape(3);
                    }}
                    className="flex-1 bg-purple-600"
                  >
                    Suivant →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Étape 3 : Tâches par service */}
        {etape === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="font-heading text-purple-700">3️⃣ Tâches par service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tâches TECHNIQUE */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                  <h4 className="font-bold text-blue-900 mb-3">🧰 Service TECHNIQUE</h4>
                  
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={nouvelleTache.TECHNIQUE}
                      onChange={(e) => setNouvelleTache({ ...nouvelleTache, TECHNIQUE: e.target.value })}
                      placeholder="Ex: Vérifier la plomberie"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          ajouterTache('TECHNIQUE');
                        }
                      }}
                    />
                    <Button onClick={() => ajouterTache('TECHNIQUE')} className="bg-blue-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {tachesParService.TECHNIQUE.length > 0 && (
                    <div className="space-y-2">
                      {tachesParService.TECHNIQUE.map((tache, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-3 border border-blue-200">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm">{tache}</span>
                          <button
                            onClick={() => supprimerTache('TECHNIQUE', idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tâches MENAGE */}
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
                  <h4 className="font-bold text-yellow-900 mb-3">🧽 Service MÉNAGE</h4>
                  
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={nouvelleTache.MENAGE}
                      onChange={(e) => setNouvelleTache({ ...nouvelleTache, MENAGE: e.target.value })}
                      placeholder="Ex: Nettoyage complet"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          ajouterTache('MENAGE');
                        }
                      }}
                    />
                    <Button onClick={() => ajouterTache('MENAGE')} className="bg-yellow-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {tachesParService.MENAGE.length > 0 && (
                    <div className="space-y-2">
                      {tachesParService.MENAGE.map((tache, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-3 border border-yellow-200">
                          <span className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm">{tache}</span>
                          <button
                            onClick={() => supprimerTache('MENAGE', idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setEtape(2)} variant="outline" className="flex-1">
                    ← Précédent
                  </Button>
                  <Button onClick={() => setEtape(4)} className="flex-1 bg-purple-600">
                    Suivant →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Étape 4 : Récapitulatif */}
        {etape === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="font-heading text-purple-700">4️⃣ Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-3">
                  <div>
                    <Badge className={
                      typeMission === 'HIVERNAGE' ? 'bg-blue-600' :
                      typeMission === 'DESHIVERNAGE' ? 'bg-yellow-600' : 'bg-purple-600'
                    }>
                      {typeMission}
                    </Badge>
                    <Badge className="ml-2 bg-purple-100 text-purple-700">{priorite}</Badge>
                  </div>
                  <h3 className="font-heading text-xl text-purple-900">{titre}</h3>
                  {description && <p className="text-sm text-gray-700">{description}</p>}
                  {objectif && <p className="text-sm text-purple-700 italic">Objectif: {objectif}</p>}
                  {datePlanifiee && (
                    <p className="text-sm text-gray-600">📅 Planifiée le: {datePlanifiee}</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">📍 {zones.length} zone(s)</h4>
                  <div className="space-y-1">
                    {zones.map((z, idx) => (
                      <p key={idx} className="text-sm text-blue-800">
                        • {z.numero} ({z.categorie}) - État: {z.etat_avant}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">
                      🧰 TECHNIQUE ({tachesParService.TECHNIQUE.length})
                    </h4>
                    {tachesParService.TECHNIQUE.map((t, i) => (
                      <p key={i} className="text-sm text-blue-800">• {t}</p>
                    ))}
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-2">
                      🧽 MÉNAGE ({tachesParService.MENAGE.length})
                    </h4>
                    {tachesParService.MENAGE.map((t, i) => (
                      <p key={i} className="text-sm text-yellow-800">• {t}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                  <h4 className="font-bold text-green-900 mb-2">📊 Total WorkItems à créer</h4>
                  <p className="text-2xl font-bold text-green-700">
                    {(tachesParService.TECHNIQUE.length + tachesParService.MENAGE.length) * zones.length}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    = {tachesParService.TECHNIQUE.length + tachesParService.MENAGE.length} tâche(s) × {zones.length} zone(s)
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setEtape(3)} variant="outline" className="flex-1">
                    ← Précédent
                  </Button>
                  <Button
                    onClick={handleValiderCreation}
                    disabled={createMissionMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                  >
                    {createMissionMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    Créer la mission
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}