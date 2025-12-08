import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function DirectionDeshivernage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDatePopup, setShowDatePopup] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('liste'); // liste, kanban, gantt
  const [dates, setDates] = useState({ debut: '', fin: '' });
  const [newMission, setNewMission] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    services: []
  });

  // Vérifier si les dates de déshivernage sont déjà définies
  useEffect(() => {
    const savedDates = localStorage.getItem('deshivernage_dates');
    if (savedDates) {
      const parsed = JSON.parse(savedDates);
      setDates(parsed);
      setShowDatePopup(false);
    }
  }, []);

  // Récupération des missions
  const { data: missions = [] } = useQuery({
    queryKey: ['missions', 'DESHIVERNAGE'],
    queryFn: async () => {
      const allMissions = await base44.entities.Mission.list();
      return allMissions.filter(m => m.type === 'DESHIVERNAGE');
    }
  });

  // Création de mission
  const createMission = useMutation({
    mutationFn: (data) => base44.entities.Mission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['missions']);
      setShowForm(false);
      setNewMission({ titre: '', description: '', date_debut: '', date_fin: '', services: [] });
      toast.success(lang === 'fr' ? 'Mission créée' : 'Mission created');
    }
  });

  // Mise à jour du statut
  const updateStatut = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.Mission.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries(['missions']);
    }
  });

  const handleSubmit = () => {
    if (!newMission.titre || !newMission.date_debut || !newMission.date_fin) {
      toast.error(lang === 'fr' ? 'Remplissez tous les champs obligatoires' : 'Fill all required fields');
      return;
    }
    createMission.mutate({
      ...newMission,
      type: 'DESHIVERNAGE',
      statut: 'A_FAIRE'
    });
  };

  const toggleService = (service) => {
    setNewMission(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const validateDates = () => {
    if (!dates.debut || !dates.fin) {
      toast.error(lang === 'fr' ? 'Remplissez les deux dates' : 'Fill both dates');
      return;
    }
    if (new Date(dates.debut) >= new Date(dates.fin)) {
      toast.error(lang === 'fr' ? 'La date de fin doit être après la date de début' : 'End date must be after start date');
      return;
    }
    localStorage.setItem('deshivernage_dates', JSON.stringify(dates));
    setShowDatePopup(false);
    toast.success(lang === 'fr' ? 'Dates enregistrées' : 'Dates saved');
  };

  const cycleStatut = (mission) => {
    const statuts = ['A_FAIRE', 'EN_COURS', 'TERMINE'];
    const currentIndex = statuts.indexOf(mission.statut);
    const nextStatut = statuts[(currentIndex + 1) % statuts.length];
    updateStatut.mutate({ id: mission.id, statut: nextStatut });
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'A_FAIRE':
        return <Badge variant="outline" className="flex items-center gap-1"><Circle className="w-3 h-3" /> {lang === 'fr' ? 'À faire' : 'To do'}</Badge>;
      case 'EN_COURS':
        return <Badge className="bg-blue-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {lang === 'fr' ? 'En cours' : 'In progress'}</Badge>;
      case 'TERMINE':
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {lang === 'fr' ? 'Terminé' : 'Done'}</Badge>;
      default:
        return null;
    }
  };

  const getServiceBadge = (service) => {
    const colors = {
      TECHNIQUE: 'bg-[#00AEEF]',
      MENAGE: 'bg-[#FFD700] text-[#0077A8]',
      ACCUEIL: 'bg-[#22c55e]',
      ANIMATION: 'bg-[#a855f7]'
    };
    return <Badge className={colors[service]}>{service}</Badge>;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🌞</span>
              <h1 className="font-handwritten text-4xl text-[#00AEEF]">
                {lang === 'fr' ? 'Déshivernage' : 'Spring Opening'}
              </h1>
            </div>
            {!showDatePopup && (
              <Button onClick={() => setShowForm(!showForm)} className="bg-[#00AEEF]">
                <Plus className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Nouvelle mission' : 'New mission'}
              </Button>
            )}
          </div>
          <p className="text-gray-600 font-body">
            {lang === 'fr' ? 'Planification des travaux d\'ouverture de saison' : 'Season opening work planning'}
          </p>

          {!showDatePopup && dates.debut && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#0077A8]" />
              <span className="text-gray-600">
                {lang === 'fr' ? 'Période' : 'Period'}: <strong>{dates.debut}</strong> → <strong>{dates.fin}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowDatePopup(true)}>
                {lang === 'fr' ? 'Modifier' : 'Edit'}
              </Button>
            </div>
          )}
        </div>

        {/* Popup dates */}
        <Dialog open={showDatePopup} onOpenChange={setShowDatePopup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-[#0077A8]">
                {lang === 'fr' ? 'Définir les dates de déshivernage' : 'Set spring opening dates'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  {lang === 'fr' ? 'Date début déshivernage' : 'Opening start date'}
                </label>
                <Input
                  type="date"
                  value={dates.debut}
                  onChange={(e) => setDates({ ...dates, debut: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  {lang === 'fr' ? 'Date fin prévue' : 'Expected end date'}
                </label>
                <Input
                  type="date"
                  value={dates.fin}
                  onChange={(e) => setDates({ ...dates, fin: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={validateDates} className="bg-[#00AEEF]">
                {t('valider')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Formulaire de création */}
        {!showDatePopup && showForm && (
          <Card className="mb-6 border-2 border-[#00AEEF]/30">
            <CardHeader>
              <CardTitle className="font-heading text-[#0077A8]">
                {lang === 'fr' ? 'Créer une mission' : 'Create a mission'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={lang === 'fr' ? 'Titre de la mission' : 'Mission title'}
                value={newMission.titre}
                onChange={(e) => setNewMission({ ...newMission, titre: e.target.value })}
              />
              <Textarea
                placeholder={lang === 'fr' ? 'Description détaillée' : 'Detailed description'}
                value={newMission.description}
                onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">{lang === 'fr' ? 'Date début' : 'Start date'}</label>
                  <Input
                    type="date"
                    value={newMission.date_debut}
                    onChange={(e) => setNewMission({ ...newMission, date_debut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">{lang === 'fr' ? 'Date fin' : 'End date'}</label>
                  <Input
                    type="date"
                    value={newMission.date_fin}
                    onChange={(e) => setNewMission({ ...newMission, date_fin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  {lang === 'fr' ? 'Services assignés' : 'Assigned services'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['TECHNIQUE', 'MENAGE', 'ACCUEIL', 'ANIMATION'].map(service => (
                    <div key={service} className="flex items-center gap-2">
                      <Checkbox
                        checked={newMission.services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {t('annuler')}
                </Button>
                <Button onClick={handleSubmit} className="bg-[#00AEEF]">
                  {t('ajouter')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vue modes */}
        {!showDatePopup && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === 'liste' ? 'default' : 'outline'}
            onClick={() => setViewMode('liste')}
            size="sm"
          >
            📋 Liste
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}
            size="sm"
          >
            📊 Kanban
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            onClick={() => setViewMode('gantt')}
            size="sm"
          >
            📅 Gantt
          </Button>
        </div>

        )}

        {/* Vue Liste */}
        {!showDatePopup && viewMode === 'liste' && (
          <div className="space-y-4">
            {missions.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center text-gray-500">
                  {lang === 'fr' ? 'Aucune mission pour le moment' : 'No missions yet'}
                </CardContent>
              </Card>
            ) : (
              missions.map(mission => (
                <Card key={mission.id} className="border-2 border-[#00AEEF]/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-heading text-lg text-[#0077A8] mb-1">{mission.titre}</h3>
                        <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cycleStatut(mission)}
                      >
                        {getStatutBadge(mission.statut)}
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{mission.date_debut} → {mission.date_fin}</span>
                      </div>
                      <div className="flex gap-1">
                        {mission.services?.map(service => (
                          <span key={service}>{getServiceBadge(service)}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Vue Kanban */}
        {!showDatePopup && viewMode === 'kanban' && (
          <div className="grid grid-cols-3 gap-4">
            {['A_FAIRE', 'EN_COURS', 'TERMINE'].map(statut => (
              <Card key={statut} className="border-2 border-[#00AEEF]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-heading">
                    {statut === 'A_FAIRE' && (lang === 'fr' ? 'À faire' : 'To do')}
                    {statut === 'EN_COURS' && (lang === 'fr' ? 'En cours' : 'In progress')}
                    {statut === 'TERMINE' && (lang === 'fr' ? 'Terminé' : 'Done')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {missions.filter(m => m.statut === statut).map(mission => (
                    <Card key={mission.id} className="border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => cycleStatut(mission)}>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-1">{mission.titre}</h4>
                        <p className="text-xs text-gray-500 mb-2">{mission.date_debut} - {mission.date_fin}</p>
                        <div className="flex gap-1 flex-wrap">
                          {mission.services?.map(s => (
                            <Badge key={s} className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vue Gantt */}
        {!showDatePopup && viewMode === 'gantt' && (
          <Card className="border-2 border-[#00AEEF]/30">
            <CardContent className="p-4">
              <div className="space-y-2">
                {missions.map(mission => {
                  const debut = new Date(mission.date_debut);
                  const fin = new Date(mission.date_fin);
                  const duree = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={mission.id} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-medium truncate">{mission.titre}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className={`absolute h-full rounded-full flex items-center px-2 text-xs text-white ${
                            mission.statut === 'TERMINE' ? 'bg-green-500' :
                            mission.statut === 'EN_COURS' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(duree * 2, 100)}%` }}
                        >
                          {duree}j
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 w-32">
                        {mission.date_debut}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}