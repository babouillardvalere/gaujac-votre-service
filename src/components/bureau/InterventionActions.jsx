import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Eye, Trash2, AlertTriangle, Star, Clock, User, Home, Calendar, Loader2 } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const categoryLabels = {
  gaz: '🔥 Gaz', eau: '💧 Eau/Fuite', electricite: '⚡ Électricité', plomberie: '🔧 Plomberie',
  espace_vert: '🌿 Espace vert', divers_technique: '🛠 Divers', mobilier: '🧰 Mobilier', structurel: '🏚 Structurel',
  souris: '🐭 Souris', guepes: '🐝 Guêpes', frelons: '🐝 Frelons', fourmis: '🐜 Fourmis', moustiques: '🦟 Moustiques',
  literie: '🛏 Literie', nettoyage: '🧽 Nettoyage', vaisselle: '🍽 Vaisselle', 
  poubelle: '🗑 Poubelle', produit_manquant: '🧴 Produit manquant'
};

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴'
};

export default function InterventionActions({ incident, onUpdate }) {
  const queryClient = useQueryClient();
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  
  const [editForm, setEditForm] = useState({
    categorie: incident.categorie,
    statut: incident.statut,
    pris_par: incident.pris_par || '',
    date_saisie: incident.date_saisie ? format(new Date(incident.date_saisie), "yyyy-MM-dd'T'HH:mm") : '',
    description: incident.description || '',
    urgent: incident.urgent || false
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.update(incident.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-incidents'] });
      toast.success('Intervention modifiée');
      setShowEditDialog(false);
      if (onUpdate) onUpdate();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Incident.delete(incident.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-incidents'] });
      toast.success('Intervention supprimée');
      setShowDeleteDialog(false);
      if (onUpdate) onUpdate();
    }
  });

  const handleEdit = () => {
    updateMutation.mutate({
      categorie: editForm.categorie,
      statut: editForm.statut,
      pris_par: editForm.pris_par || null,
      date_saisie: editForm.date_saisie ? new Date(editForm.date_saisie).toISOString() : incident.date_saisie,
      description: editForm.description,
      urgent: editForm.urgent
    });
  };

  const handleDelete = () => {
    if (!deleteReason.trim()) {
      toast.error('Veuillez saisir un motif de suppression');
      return;
    }
    // Log the deletion reason (could be stored in a separate entity if needed)
    console.log('Suppression intervention:', {
      incident_id: incident.id,
      raison_suppression: deleteReason,
      date_suppression: new Date().toISOString(),
      supprime_par: 'Bureau'
    });
    deleteMutation.mutate();
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-4 h-4 text-[#0077A8]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEditDialog(true); }} className="cursor-pointer">
            <Edit className="w-4 h-4 mr-2 text-[#00AEEF]" />
            <span className="font-body">Modifier l'intervention</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowViewDialog(true); }} className="cursor-pointer">
            <Eye className="w-4 h-4 mr-2 text-[#FFD700]" />
            <span className="font-body">Voir le descriptif</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }} className="cursor-pointer text-red-600 focus:text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="font-body">Supprimer l'intervention</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Voir Descriptif */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
              Fiche intervention #{incident.logement || incident.emplacement}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Client */}
            <div className="bg-[#e6f7ff] rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div><span className="text-gray-500">Nom:</span> {incident.client_prenom} {incident.client_nom}</div>
                <div><span className="text-gray-500">Prénom:</span> {incident.client_prenom}</div>
              </div>
            </div>

            {/* Séjour */}
            <div className="bg-[#FFF4B2] rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates de séjour
              </h4>
              <div className="text-sm font-body">
                {incident.date_arrivee && format(new Date(incident.date_arrivee), 'dd MMMM yyyy', { locale: fr })} 
                {' → '}
                {incident.date_depart && format(new Date(incident.date_depart), 'dd MMMM yyyy', { locale: fr })}
              </div>
            </div>

            {/* Hébergement */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Hébergement
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div><span className="text-gray-500">Type:</span> {incident.logement ? '🏠 Mobil-home' : '⛺ Emplacement'}</div>
                <div><span className="text-gray-500">Numéro:</span> <strong className="text-[#0077A8]">{incident.logement || incident.emplacement}</strong></div>
              </div>
            </div>

            {/* Problèmes choisis */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2">🔧 Problèmes signalés</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className={incident.type === 'technique' ? 'bg-[#00AEEF]' : 'bg-[#FFD700] text-[#0077A8]'}>
                  {categoryLabels[incident.categorie]}
                </Badge>
                {incident.urgent && <Badge className="bg-red-500 text-white">🚨 URGENT</Badge>}
                {incident.sous_categorie && incident.sous_categorie.split(', ').map(cat => (
                  <span key={cat} className="text-2xl" title={cat}>{categoryEmojis[cat]}</span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border-2 border-[#00AEEF]/30 rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2">📝 Description complète</h4>
              <p className="font-body text-gray-700 whitespace-pre-wrap">{incident.description}</p>
            </div>

            {/* Statut & Timeline */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historique de l'intervention
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#FFD700] mt-1.5"></div>
                  <div>
                    <p className="font-heading text-sm text-[#0077A8]">Création de la demande</p>
                    <p className="text-xs text-gray-500 font-body">
                      {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                
                {incident.pris_par && incident.date_debut && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#00AEEF] mt-1.5"></div>
                    <div>
                      <p className="font-heading text-sm text-[#0077A8]">Prise en charge par {incident.pris_par}</p>
                      <p className="text-xs text-gray-500 font-body">
                        {format(new Date(incident.date_debut), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                
                {(incident.statut === 'en_attente_materiel' || incident.motif_attente) && incident.attente_date && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#FFA500] mt-1.5"></div>
                    <div>
                      <p className="font-heading text-sm text-[#FFA500]">🟨 En attente</p>
                      {incident.motif_attente && (
                        <p className="text-xs text-gray-700 font-body mt-1">
                          📝 Motif : <span className="font-medium">{incident.motif_attente}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-body">
                        ⏱ Date : {format(new Date(incident.attente_date), 'dd/MM/yyyy – HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                
                {incident.statut === 'resolu' && incident.date_resolution && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5"></div>
                    <div>
                      <p className="font-heading text-sm text-green-600">Résolu</p>
                      <p className="text-xs text-gray-500 font-body">
                        {format(new Date(incident.date_resolution), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        {incident.date_saisie && ` - Durée: ${formatDuration(differenceInMinutes(new Date(incident.date_resolution), new Date(incident.date_saisie)))}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statut actuel */}
            <div className="flex items-center justify-between p-4 bg-[#00AEEF]/10 rounded-xl">
              <span className="font-heading text-[#0077A8]">Statut actuel</span>
              <Badge className={
                incident.statut === 'resolu' ? 'bg-green-500 text-white' :
                incident.statut === 'en_cours' ? 'bg-[#00AEEF] text-white' :
                incident.statut === 'en_attente_materiel' ? 'bg-[#FFA500] text-white' :
                'bg-[#FFD700] text-[#0077A8]'
              }>
                {incident.statut === 'resolu' ? '✅ Résolu' :
                 incident.statut === 'en_cours' ? '🔄 En cours' :
                 incident.statut === 'en_attente_materiel' ? '⏸️ En attente' :
                 '🕐 En attente'}
              </Badge>
            </div>

            {/* Intervenant */}
            {incident.pris_par && (
              <div className="bg-[#00AEEF]/10 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">👷 Intervenant assigné</h4>
                <p className="font-heading text-[#0077A8] text-lg">{incident.pris_par}</p>
                {incident.commentaire_interne && (
                  <p className="text-sm font-body text-gray-600 mt-2 italic">Note: {incident.commentaire_interne}</p>
                )}
              </div>
            )}

            {/* Avis client */}
            {incident.note_client && (
              <div className="bg-[#FFD700]/20 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">⭐ Avis client</h4>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= incident.note_client ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 font-heading text-[#0077A8]">{incident.note_client}/5</span>
                </div>
                {incident.commentaire_client && (
                  <p className="font-body text-gray-700 bg-white p-3 rounded-lg italic">"{incident.commentaire_client}"</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#00AEEF]" />
              Modifier l'intervention
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Catégorie</label>
              <Select value={editForm.categorie} onValueChange={(v) => setEditForm({ ...editForm, categorie: v })}>
                <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Statut</label>
              <Select value={editForm.statut} onValueChange={(v) => setEditForm({ ...editForm, statut: v })}>
                <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">🕐 En attente</SelectItem>
                  <SelectItem value="en_cours">🔄 En cours</SelectItem>
                  <SelectItem value="en_attente_materiel">⏸️ Reporté (attente matériel)</SelectItem>
                  <SelectItem value="resolu">✅ Résolu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Technicien assigné</label>
              <Input
                value={editForm.pris_par}
                onChange={(e) => setEditForm({ ...editForm, pris_par: e.target.value })}
                placeholder="Nom du technicien"
                className="border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Date et heure</label>
              <Input
                type="datetime-local"
                value={editForm.date_saisie}
                onChange={(e) => setEditForm({ ...editForm, date_saisie: e.target.value })}
                className="border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="border-[#00AEEF]/30 rounded-xl font-body min-h-24"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#FFA500]/10 rounded-xl">
              <Checkbox
                checked={editForm.urgent}
                onCheckedChange={(checked) => setEditForm({ ...editForm, urgent: checked })}
                className="data-[state=checked]:bg-[#FFA500]"
              />
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FFA500]" />
                <span className="font-body text-sm">Intervention urgente</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending}
              className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Voulez-vous supprimer cette intervention ?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-body text-sm text-gray-700">
                Cette action supprimera définitivement l'intervention.
              </p>
              <p className="font-body text-sm text-gray-700 mt-2">
                Merci de saisir un motif pour éviter les erreurs ou abus.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-body text-gray-600">
                <strong>Intervention:</strong> #{incident.logement || incident.emplacement} - {categoryLabels[incident.categorie]}
              </p>
              <p className="text-sm font-body text-gray-600">
                <strong>Client:</strong> {incident.client_prenom} {incident.client_nom}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Motif de suppression *</label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Saisissez le motif de suppression..."
                className="border-red-300 rounded-xl font-body min-h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteReason(''); }} className="rounded-xl">
              ❌ Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!deleteReason.trim() || deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 rounded-xl font-heading"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}