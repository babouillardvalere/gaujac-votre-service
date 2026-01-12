import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Calendar, Clock, MapPin, CheckCircle, AlertTriangle, 
  Edit, Save, X, Plus, Trash2, FileText, Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MissionDirectionFiche({ mission, onClose, lang = 'fr' }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(mission);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MissionDirection.update(mission.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions-direction'] });
      toast.success(lang === 'fr' ? 'Mission mise à jour' : 'Mission updated');
      setEditMode(false);
    }
  });

  const handleSave = () => {
    // Vérifier les conditions de clôture
    const validation = {
      etats_apres_renseignes: formData.zones?.every(z => z.etat_apres) || false,
      resultats_services_renseignes: formData.services_intervenants?.every(s => s.resultat) || false,
      cloture_autorisee: false
    };
    
    validation.cloture_autorisee = validation.etats_apres_renseignes && validation.resultats_services_renseignes;

    updateMutation.mutate({
      ...formData,
      validation_cloture: validation
    });
  };

  const handleCloturer = () => {
    if (!formData.validation_cloture?.cloture_autorisee) {
      toast.error(lang === 'fr' 
        ? 'Impossible de clôturer : tous les états APRÈS et résultats doivent être renseignés'
        : 'Cannot close: all AFTER states and results must be filled');
      return;
    }

    updateMutation.mutate({
      ...formData,
      statut: 'TERMINEE',
      date_fin_reelle: new Date().toISOString()
    });
  };

  const addZone = () => {
    setFormData(prev => ({
      ...prev,
      zones: [...(prev.zones || []), { type_zone: 'hebergement', numero: '', etat_avant: '', etat_apres: '' }]
    }));
  };

  const updateZone = (index, field, value) => {
    const newZones = [...(formData.zones || [])];
    newZones[index][field] = value;
    setFormData({ ...formData, zones: newZones });
  };

  const removeZone = (index) => {
    const newZones = [...(formData.zones || [])];
    newZones.splice(index, 1);
    setFormData({ ...formData, zones: newZones });
  };

  const addServiceIntervenant = () => {
    setFormData(prev => ({
      ...prev,
      services_intervenants: [...(prev.services_intervenants || []), { 
        service: 'TECHNIQUE', 
        agent: '', 
        zone_perimetre: '', 
        action_realisee: '', 
        resultat: '' 
      }]
    }));
  };

  const updateServiceIntervenant = (index, field, value) => {
    const newServices = [...(formData.services_intervenants || [])];
    newServices[index][field] = value;
    setFormData({ ...formData, services_intervenants: newServices });
  };

  const removeServiceIntervenant = (index) => {
    const newServices = [...(formData.services_intervenants || [])];
    newServices.splice(index, 1);
    setFormData({ ...formData, services_intervenants: newServices });
  };

  const getStatutBadge = (statut) => {
    const badges = {
      'A_FAIRE': <Badge className="bg-orange-500">À faire</Badge>,
      'EN_COURS': <Badge className="bg-blue-500">En cours</Badge>,
      'EN_ATTENTE': <Badge className="bg-gray-500">En attente</Badge>,
      'TERMINEE': <Badge className="bg-green-500">Terminée</Badge>,
      'ANNULEE': <Badge className="bg-red-500">Annulée</Badge>
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  const etatIcons = {
    fonctionnel: '⬜',
    partiellement_fonctionnel: '⚠️',
    non_fonctionnel: '❌',
    hors_service: '🔒',
    fonctionnel_avec_reserve: '⚠️'
  };

  const resultatIcons = {
    conforme: '✅',
    partiel: '⚠️',
    echoue: '❌',
    reporte: '⏸'
  };

  const tempsEstime = formData.temps_estime_minutes || 0;
  const tempsReel = formData.temps_reel_minutes || 0;
  const ecartTemps = tempsReel - tempsEstime;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-heading text-2xl text-purple-700">
              {formData.type_mission === 'HIVERNAGE' ? '❄️' : '🌞'} {formData.titre}
            </h2>
            {getStatutBadge(formData.statut)}
            {formData.priorite === 'URGENTE' && (
              <Badge className="bg-red-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          {formData.description && (
            <p className="text-gray-600">{formData.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                size="sm"
                disabled={formData.statut === 'TERMINEE'}
              >
                <Edit className="w-4 h-4 mr-1" />
                {lang === 'fr' ? 'Modifier' : 'Edit'}
              </Button>
              {formData.statut !== 'TERMINEE' && formData.validation_cloture?.cloture_autorisee && (
                <Button
                  onClick={handleCloturer}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {lang === 'fr' ? 'Clôturer' : 'Close'}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={handleSave} className="bg-purple-600" size="sm">
                <Save className="w-4 h-4 mr-1" />
                {lang === 'fr' ? 'Enregistrer' : 'Save'}
              </Button>
              <Button onClick={() => { setEditMode(false); setFormData(mission); }} variant="outline" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Validation de clôture */}
      {formData.statut !== 'TERMINEE' && (
        <Card className="border-2 border-purple-300">
          <CardContent className="p-4">
            <h3 className="font-heading text-purple-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {lang === 'fr' ? 'Validation de clôture' : 'Closure validation'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {formData.validation_cloture?.etats_apres_renseignes ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-sm">
                  {lang === 'fr' ? 'États APRÈS renseignés pour toutes les zones' : 'AFTER states filled for all zones'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {formData.validation_cloture?.resultats_services_renseignes ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-sm">
                  {lang === 'fr' ? 'Résultats de tous les services renseignés' : 'Results of all services filled'}
                </span>
              </div>
              {!formData.validation_cloture?.cloture_autorisee && (
                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                  ⚠️ {lang === 'fr' 
                    ? 'La mission ne peut pas être clôturée tant que toutes les informations ne sont pas complètes'
                    : 'The mission cannot be closed until all information is complete'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="qui" className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="qui">👤 QUI</TabsTrigger>
          <TabsTrigger value="quoi">📋 QUOI</TabsTrigger>
          <TabsTrigger value="ou">📍 OÙ</TabsTrigger>
          <TabsTrigger value="quand">📅 QUAND</TabsTrigger>
          <TabsTrigger value="comment">🔧 COMMENT</TabsTrigger>
          <TabsTrigger value="combien">⏱ COMBIEN</TabsTrigger>
          <TabsTrigger value="pourquoi">❓ POURQUOI</TabsTrigger>
        </TabsList>

        {/* QUI */}
        <TabsContent value="qui" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👤 QUI intervient ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{lang === 'fr' ? 'Créateur' : 'Creator'}</Label>
                {editMode ? (
                  <Input 
                    value={formData.createur || ''}
                    onChange={(e) => setFormData({...formData, createur: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{formData.createur || '-'}</p>
                )}
              </div>

              <div>
                <Label>{lang === 'fr' ? 'Intervenants assignés' : 'Assigned staff'}</Label>
                {editMode ? (
                  <Input 
                    value={formData.intervenants_assignes?.join(', ') || ''}
                    onChange={(e) => setFormData({...formData, intervenants_assignes: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Marc, Julie, Thomas"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.intervenants_assignes?.map((agent, i) => (
                      <Badge key={i} variant="outline">{agent}</Badge>
                    )) || '-'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUOI */}
        <TabsContent value="quoi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 QUOI faire ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type de mission</Label>
                <Badge className={formData.type_mission === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                  {formData.type_mission === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{lang === 'fr' ? 'Actions prévues (checklist)' : 'Planned actions (checklist)'}</Label>
                  {editMode && (
                    <Button 
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        actions_prevues: [...(prev.actions_prevues || []), { action: '', effectuee: false }]
                      }))}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {formData.actions_prevues?.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={action.effectuee}
                        onChange={(e) => {
                          if (!editMode) return;
                          const newActions = [...formData.actions_prevues];
                          newActions[i].effectuee = e.target.checked;
                          setFormData({...formData, actions_prevues: newActions});
                        }}
                        disabled={!editMode}
                        className="w-4 h-4"
                      />
                      {editMode ? (
                        <Input 
                          value={action.action}
                          onChange={(e) => {
                            const newActions = [...formData.actions_prevues];
                            newActions[i].action = e.target.value;
                            setFormData({...formData, actions_prevues: newActions});
                          }}
                          className="flex-1"
                        />
                      ) : (
                        <span className={action.effectuee ? 'line-through text-gray-500' : ''}>{action.action}</span>
                      )}
                      {editMode && (
                        <Button
                          onClick={() => {
                            const newActions = [...formData.actions_prevues];
                            newActions.splice(i, 1);
                            setFormData({...formData, actions_prevues: newActions});
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OÙ */}
        <TabsContent value="ou" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📍 OÙ intervenir ?</CardTitle>
                {editMode && (
                  <Button onClick={addZone} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    {lang === 'fr' ? 'Ajouter zone' : 'Add zone'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* États des lieux AVANT/APRÈS */}
              <div className="space-y-3">
                {formData.zones?.map((zone, i) => (
                  <Card key={i} className="border-2 border-gray-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-heading text-purple-700">
                          Zone {i + 1}: {zone.type_zone} {zone.numero}
                        </h4>
                        {editMode && (
                          <Button onClick={() => removeZone(i)} size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      {editMode ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Type zone</Label>
                            <Select value={zone.type_zone} onValueChange={(v) => updateZone(i, 'type_zone', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hebergement">🏠 Hébergement</SelectItem>
                                <SelectItem value="emplacement">⛺ Emplacement</SelectItem>
                                <SelectItem value="secteur">📍 Secteur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Numéro / Périmètre</Label>
                            <Input 
                              value={zone.numero}
                              onChange={(e) => updateZone(i, 'numero', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">État AVANT</Label>
                            <Select value={zone.etat_avant} onValueChange={(v) => updateZone(i, 'etat_avant', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fonctionnel">⬜ Fonctionnel</SelectItem>
                                <SelectItem value="partiellement_fonctionnel">⚠️ Partiellement</SelectItem>
                                <SelectItem value="non_fonctionnel">❌ Non fonctionnel</SelectItem>
                                <SelectItem value="hors_service">🔒 Hors service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">État APRÈS</Label>
                            <Select value={zone.etat_apres} onValueChange={(v) => updateZone(i, 'etat_apres', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fonctionnel">⬜ Fonctionnel</SelectItem>
                                <SelectItem value="fonctionnel_avec_reserve">⚠️ Fonctionnel avec réserve</SelectItem>
                                <SelectItem value="non_fonctionnel">❌ Non fonctionnel</SelectItem>
                                <SelectItem value="hors_service">🔒 Hors service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">État AVANT</p>
                            <p className="font-heading">
                              {etatIcons[zone.etat_avant]} {zone.etat_avant?.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">État APRÈS</p>
                            <p className="font-heading">
                              {etatIcons[zone.etat_apres]} {zone.etat_apres?.replace(/_/g, ' ') || (
                                <span className="text-red-500">⚠️ Non renseigné</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formData.zones?.length === 0 && (
                <p className="text-center text-gray-400 py-4">
                  {lang === 'fr' ? 'Aucune zone définie' : 'No zone defined'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUAND */}
        <TabsContent value="quand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 QUAND ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Date de création</Label>
                  <p className="font-body">{formData.date_creation && format(new Date(formData.date_creation), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date planifiée</Label>
                  {editMode ? (
                    <Input 
                      type="date"
                      value={formData.date_planifiee || ''}
                      onChange={(e) => setFormData({...formData, date_planifiee: e.target.value})}
                    />
                  ) : (
                    <p className="font-body">{formData.date_planifiee && format(new Date(formData.date_planifiee), 'dd/MM/yyyy')}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date réelle de début</Label>
                  <p className="font-body">{formData.date_debut_reelle ? format(new Date(formData.date_debut_reelle), 'dd/MM/yyyy HH:mm') : '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date réelle de fin</Label>
                  <p className="font-body">{formData.date_fin_reelle ? format(new Date(formData.date_fin_reelle), 'dd/MM/yyyy HH:mm') : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMENT */}
        <TabsContent value="comment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 COMMENT ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Procédure suivie</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.procedure_suivie || ''}
                    onChange={(e) => setFormData({...formData, procedure_suivie: e.target.value})}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded">{formData.procedure_suivie || '-'}</p>
                )}
              </div>

              <div>
                <Label>Outils et moyens utilisés</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.outils_moyens || ''}
                    onChange={(e) => setFormData({...formData, outils_moyens: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded">{formData.outils_moyens || '-'}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox"
                    checked={formData.problemes_rencontres || false}
                    onChange={(e) => editMode && setFormData({...formData, problemes_rencontres: e.target.checked})}
                    disabled={!editMode}
                    className="w-4 h-4"
                  />
                  <Label>Problèmes rencontrés ?</Label>
                </div>
                {formData.problemes_rencontres && (
                  <>
                    <Label className="text-xs text-red-600">Description obligatoire</Label>
                    {editMode ? (
                      <Textarea 
                        value={formData.problemes_description || ''}
                        onChange={(e) => setFormData({...formData, problemes_description: e.target.value})}
                        rows={4}
                        className="border-red-300"
                      />
                    ) : (
                      <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                        {formData.problemes_description || <span className="text-red-500">Non renseigné</span>}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Suivi par service intervenant */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-heading text-purple-700">
                    👷 Suivi par service intervenant
                  </Label>
                  {editMode && (
                    <Button onClick={addServiceIntervenant} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.services_intervenants?.map((serviceInt, i) => (
                    <Card key={i} className="border-2 border-purple-200">
                      <CardContent className="p-3 space-y-2">
                        {editMode ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Select value={serviceInt.service} onValueChange={(v) => updateServiceIntervenant(i, 'service', v)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TECHNIQUE">🧰 Technique</SelectItem>
                                  <SelectItem value="MENAGE">🧹 Ménage</SelectItem>
                                  <SelectItem value="POLYVALENT">⚡ Polyvalent</SelectItem>
                                  <SelectItem value="AUTRE">📦 Autre</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={() => removeServiceIntervenant(i)} size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <Input 
                              placeholder="Agent"
                              value={serviceInt.agent || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'agent', e.target.value)}
                            />
                            <Input 
                              placeholder="Zone / Périmètre"
                              value={serviceInt.zone_perimetre || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'zone_perimetre', e.target.value)}
                            />
                            <Textarea 
                              placeholder="Action réalisée"
                              value={serviceInt.action_realisee || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'action_realisee', e.target.value)}
                              rows={2}
                            />
                            <Select value={serviceInt.resultat || ''} onValueChange={(v) => updateServiceIntervenant(i, 'resultat', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Résultat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conforme">✅ Conforme</SelectItem>
                                <SelectItem value="partiel">⚠️ Partiel</SelectItem>
                                <SelectItem value="echoue">❌ Échoué</SelectItem>
                                <SelectItem value="reporte">⏸ Reporté</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge>{serviceInt.service}</Badge>
                              {serviceInt.resultat && (
                                <span className="text-lg">{resultatIcons[serviceInt.resultat]}</span>
                              )}
                            </div>
                            <p className="text-sm"><strong>Agent:</strong> {serviceInt.agent || '-'}</p>
                            <p className="text-sm"><strong>Zone:</strong> {serviceInt.zone_perimetre || '-'}</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">{serviceInt.action_realisee || '-'}</p>
                            {serviceInt.resultat && (
                              <p className="text-sm">
                                <strong>Résultat:</strong> {resultatIcons[serviceInt.resultat]} {serviceInt.resultat}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {formData.services_intervenants?.length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      {lang === 'fr' ? 'Aucun service intervenant' : 'No intervening service'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUAND */}
        <TabsContent value="quand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 QUAND ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Date de création</Label>
                  <p className="font-body">{formData.date_creation && format(new Date(formData.date_creation), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date planifiée</Label>
                  {editMode ? (
                    <Input 
                      type="date"
                      value={formData.date_planifiee || ''}
                      onChange={(e) => setFormData({...formData, date_planifiee: e.target.value})}
                    />
                  ) : (
                    <p className="font-body">{formData.date_planifiee && format(new Date(formData.date_planifiee), 'dd/MM/yyyy')}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date réelle de début</Label>
                  <p className="font-body">{formData.date_debut_reelle ? format(new Date(formData.date_debut_reelle), 'dd/MM/yyyy HH:mm') : '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Date réelle de fin</Label>
                  <p className="font-body">{formData.date_fin_reelle ? format(new Date(formData.date_fin_reelle), 'dd/MM/yyyy HH:mm') : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMENT */}
        <TabsContent value="comment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 COMMENT ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Procédure suivie</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.procedure_suivie || ''}
                    onChange={(e) => setFormData({...formData, procedure_suivie: e.target.value})}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded">{formData.procedure_suivie || '-'}</p>
                )}
              </div>

              <div>
                <Label>Outils et moyens utilisés</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.outils_moyens || ''}
                    onChange={(e) => setFormData({...formData, outils_moyens: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded">{formData.outils_moyens || '-'}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox"
                    checked={formData.problemes_rencontres || false}
                    onChange={(e) => editMode && setFormData({...formData, problemes_rencontres: e.target.checked})}
                    disabled={!editMode}
                    className="w-4 h-4"
                  />
                  <Label>Problèmes rencontrés ?</Label>
                </div>
                {formData.problemes_rencontres && (
                  <>
                    <Label className="text-xs text-red-600">Description obligatoire</Label>
                    {editMode ? (
                      <Textarea 
                        value={formData.problemes_description || ''}
                        onChange={(e) => setFormData({...formData, problemes_description: e.target.value})}
                        rows={4}
                        className="border-red-300"
                      />
                    ) : (
                      <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                        {formData.problemes_description || <span className="text-red-500">Non renseigné</span>}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Suivi par service intervenant */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-heading text-purple-700">
                    👷 Suivi par service intervenant
                  </Label>
                  {editMode && (
                    <Button onClick={addServiceIntervenant} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.services_intervenants?.map((serviceInt, i) => (
                    <Card key={i} className="border-2 border-purple-200">
                      <CardContent className="p-3 space-y-2">
                        {editMode ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Select value={serviceInt.service} onValueChange={(v) => updateServiceIntervenant(i, 'service', v)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TECHNIQUE">🧰 Technique</SelectItem>
                                  <SelectItem value="MENAGE">🧹 Ménage</SelectItem>
                                  <SelectItem value="POLYVALENT">⚡ Polyvalent</SelectItem>
                                  <SelectItem value="AUTRE">📦 Autre</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={() => removeServiceIntervenant(i)} size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <Input 
                              placeholder="Agent"
                              value={serviceInt.agent || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'agent', e.target.value)}
                            />
                            <Input 
                              placeholder="Zone / Périmètre"
                              value={serviceInt.zone_perimetre || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'zone_perimetre', e.target.value)}
                            />
                            <Textarea 
                              placeholder="Action réalisée"
                              value={serviceInt.action_realisee || ''}
                              onChange={(e) => updateServiceIntervenant(i, 'action_realisee', e.target.value)}
                              rows={2}
                            />
                            <Select value={serviceInt.resultat || ''} onValueChange={(v) => updateServiceIntervenant(i, 'resultat', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Résultat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conforme">✅ Conforme</SelectItem>
                                <SelectItem value="partiel">⚠️ Partiel</SelectItem>
                                <SelectItem value="echoue">❌ Échoué</SelectItem>
                                <SelectItem value="reporte">⏸ Reporté</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge>{serviceInt.service}</Badge>
                              {serviceInt.resultat && (
                                <span className="text-lg">{resultatIcons[serviceInt.resultat]}</span>
                              )}
                            </div>
                            <p className="text-sm"><strong>Agent:</strong> {serviceInt.agent || '-'}</p>
                            <p className="text-sm"><strong>Zone:</strong> {serviceInt.zone_perimetre || '-'}</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">{serviceInt.action_realisee || '-'}</p>
                            {serviceInt.resultat && (
                              <p className="text-sm">
                                <strong>Résultat:</strong> {resultatIcons[serviceInt.resultat]} {serviceInt.resultat}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {formData.services_intervenants?.length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      {lang === 'fr' ? 'Aucun service intervenant' : 'No intervening service'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMBIEN */}
        <TabsContent value="combien" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⏱ COMBIEN de temps ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temps estimé (minutes)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      value={formData.temps_estime_minutes || ''}
                      onChange={(e) => setFormData({...formData, temps_estime_minutes: parseInt(e.target.value) || 0})}
                    />
                  ) : (
                    <p className="text-lg font-heading text-blue-600">{tempsEstime} min</p>
                  )}
                </div>
                <div>
                  <Label>Temps réel (minutes)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      value={formData.temps_reel_minutes || ''}
                      onChange={(e) => setFormData({...formData, temps_reel_minutes: parseInt(e.target.value) || 0})}
                    />
                  ) : (
                    <p className="text-lg font-heading text-green-600">{tempsReel} min</p>
                  )}
                </div>
              </div>

              {tempsReel > 0 && (
                <Card className={`border-2 ${ecartTemps > 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
                  <CardContent className="p-3">
                    <p className="text-sm font-heading">
                      Écart: {ecartTemps > 0 ? '+' : ''}{ecartTemps} min
                      {ecartTemps > 0 ? ' (⚠️ Dépassement)' : ' (✅ Dans les temps)'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POURQUOI */}
        <TabsContent value="pourquoi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">❓ POURQUOI ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Objectif de la mission</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.objectif || ''}
                    onChange={(e) => setFormData({...formData, objectif: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">{formData.objectif || '-'}</p>
                )}
              </div>

              <div>
                <Label>Commentaire du directeur (facultatif)</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.commentaire_direction || ''}
                    onChange={(e) => setFormData({...formData, commentaire_direction: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded">{formData.commentaire_direction || '-'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Récapitulatif final (si mission terminée) */}
      {formData.statut === 'TERMINEE' && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mission clôturée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ La mission est figée et archivée dans l'historique</p>
            <p>✅ Toutes les données sont exploitables pour audit et retour d'expérience</p>
            {formData.date_fin_reelle && (
              <p className="text-gray-600">
                Clôturée le {format(new Date(formData.date_fin_reelle), 'dd/MM/yyyy à HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}