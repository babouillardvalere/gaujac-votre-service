import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, User } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

const categoryLabels = {
  gaz: '🔥 Gaz', eau: '💧 Eau/Fuite', electricite: '⚡ Électricité', plomberie: '🔧 Plomberie',
  chauffe_eau: '🚿 Chauffe-eau', serrure: '🔐 Serrure', climatiseur: '❄️ Climatiseur', chauffage: '🔥 Chauffage',
  espace_vert: '🌿 Espace vert', divers_technique: '🛠 Divers', mobilier: '🧰 Mobilier', structurel: '🏚 Structurel',
  immobilier: '🏠 Immobilier', materiel: '📦 Matériel',
  souris: '🐭 Souris', guepes: '🐝 Guêpes', frelons: '🐝 Frelons', fourmis: '🐜 Fourmis', moustiques: '🦟 Moustiques',
  nuisibles: '🐀 Nuisibles',
  literie: '🛏 Literie', nettoyage: '🧽 Nettoyage', vaisselle: '🍽 Vaisselle', menage: '🧹 Ménage',
  poubelle: '🗑 Poubelle', produit_manquant: '🧴 Produit manquant', autre: '❓ Autre'
};

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  chauffe_eau: '🚿', serrure: '🔐', climatiseur: '❄️', chauffage: '🔥',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  immobilier: '🏠', materiel: '📦', nuisibles: '🐀',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', menage: '🧹',
  poubelle: '🗑', produit_manquant: '🧴', autre: '❓'
};

const formatDuration = (minutes) => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
};

export default function BureauInterventionDetailDialog({ selectedIncident, onClose, lang }) {
  if (!selectedIncident) return null;

  return (
    <Dialog open={!!selectedIncident} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="intervention-detail-description">
        <DialogHeader>
          <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
            <span className="text-xl">{categoryEmojis[selectedIncident.categorie]}</span>
            {lang === 'fr' ? 'Fiche intervention' : 'Intervention details'} #{selectedIncident?.hebergement || selectedIncident?.numero_hebergement}
          </DialogTitle>
        </DialogHeader>
        <div id="intervention-detail-description" className="sr-only">
          {lang === 'fr' ? 'Détails complets de l\'intervention' : 'Complete intervention details'}
        </div>

        <div className="space-y-4">
          {/* Client */}
          <div className="bg-[#e6f7ff] rounded-xl p-4">
            <h4 className="font-heading text-[#0077A8] mb-2">👤 Client</h4>
            <div className="grid grid-cols-2 gap-2 text-sm font-body">
              <div><span className="text-gray-500">Nom:</span> {selectedIncident.client_prenom} {selectedIncident.client_nom}</div>
              <div>
                <span className="text-gray-500">{lang === 'fr' ? 'Séjour' : 'Stay'}:</span>{' '}
                {selectedIncident.date_arrivee && format(new Date(selectedIncident.date_arrivee), 'dd/MM/yyyy')} →{' '}
                {selectedIncident.date_depart && format(new Date(selectedIncident.date_depart), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          {/* Hébergement */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-heading text-[#0077A8] mb-2">🏠 Hébergement</h4>
            <div className="grid grid-cols-2 gap-2 text-sm font-body">
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                {selectedIncident.type_hebergement || (selectedIncident.logement ? 'Mobil-home' : 'Emplacement')}
              </div>
              <div>
                <span className="text-gray-500">Numéro:</span>{' '}
                <strong>{selectedIncident.logement || selectedIncident.emplacement || selectedIncident.hebergement || selectedIncident.numero_hebergement}</strong>
              </div>
            </div>
          </div>

          {/* Détail HistoriqueEvent (contrôle inventaire, etc.) */}
          {!selectedIncident.isWorkItem && selectedIncident.type_event && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-heading text-blue-700 mb-2">📋 Détail événement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{selectedIncident.type_event?.replace(/_/g, ' ')}</span>
                </div>
                {selectedIncident.description && (
                  <div>
                    <span className="text-gray-500 block mb-1">Description:</span>
                    <p className="bg-white p-3 rounded border whitespace-pre-wrap">{selectedIncident.description}</p>
                  </div>
                )}
                {selectedIncident.metadata && (
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-white p-3 rounded border text-xs">
                    {selectedIncident.metadata.total_anomalies !== undefined && (
                      <div>
                        <span className="text-gray-500">Anomalies:</span>{' '}
                        <span className={`font-bold ${selectedIncident.metadata.total_anomalies > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {selectedIncident.metadata.total_anomalies}
                        </span>
                      </div>
                    )}
                    {selectedIncident.metadata.technique !== undefined && (
                      <div><span className="text-gray-500">🔧 Technique:</span> <strong>{selectedIncident.metadata.technique}</strong></div>
                    )}
                    {selectedIncident.metadata.menage !== undefined && (
                      <div><span className="text-gray-500">🧹 Ménage:</span> <strong>{selectedIncident.metadata.menage}</strong></div>
                    )}
                    {selectedIncident.metadata.reception !== undefined && (
                      <div><span className="text-gray-500">🏠 Réception:</span> <strong>{selectedIncident.metadata.reception}</strong></div>
                    )}
                  </div>
                )}
                {selectedIncident.metadata?.total_anomalies === 0 && (
                  <div className="mt-2 p-2 bg-green-100 rounded text-green-700 text-xs font-semibold">
                    ✅ Inventaire conforme — aucune intervention générée
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statut WorkItem si applicable */}
          {selectedIncident.isWorkItem && selectedIncident.workItemData && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-heading text-purple-700 mb-2">📊 Statut opérationnel</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className={
                  selectedIncident.workItemData.statut === 'TERMINEE' ? 'bg-green-500 text-white' :
                  selectedIncident.workItemData.statut === 'EN_COURS' ? 'bg-blue-500 text-white' :
                  selectedIncident.workItemData.statut === 'EN_ATTENTE' ? 'bg-orange-500 text-white' :
                  'bg-gray-500 text-white'
                }>
                  {selectedIncident.workItemData.statut}
                </Badge>
                {selectedIncident.workItemData.service && (
                  <Badge className={
                    selectedIncident.workItemData.service === 'TECHNIQUE' ? 'bg-blue-100 text-blue-700' :
                    selectedIncident.workItemData.service === 'MENAGE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }>
                    {selectedIncident.workItemData.service}
                  </Badge>
                )}
                {selectedIncident.workItemData.collaborateur && (
                  <Badge variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {selectedIncident.workItemData.collaborateur}
                  </Badge>
                )}
              </div>
              {/* Tâches */}
              {selectedIncident.workItemData.taches?.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-purple-700">📋 Tâches ({selectedIncident.workItemData.taches.filter(t => t.faite).length}/{selectedIncident.workItemData.taches.length} terminées)</p>
                  {selectedIncident.workItemData.taches.map((t, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-2 rounded border-l-4 ${t.faite ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'}`}>
                      <span className="text-xs font-bold text-gray-500">#{t.numero}</span>
                      <span className="text-sm flex-1">{t.texte}</span>
                      {t.faite && <span className="text-green-600 text-xs">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chronologie */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-heading text-[#0077A8] mb-3">📋 {lang === 'fr' ? 'Chronologie détaillée' : 'Detailed timeline'}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00AEEF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-heading text-sm text-[#0077A8]">Demande créée</p>
                  <p className="text-xs text-gray-500">
                    {selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy à HH:mm')}
                  </p>
                  {selectedIncident.urgent && <Badge className="bg-red-500 text-white text-xs mt-1">URGENT</Badge>}
                </div>
              </div>
              {selectedIncident.date_debut && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFA500] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-sm text-[#0077A8]">Prise en charge</p>
                    <p className="text-xs text-gray-500">{format(new Date(selectedIncident.date_debut), 'dd/MM/yyyy à HH:mm')}</p>
                    {selectedIncident.pris_par && <p className="text-xs text-gray-600">par {selectedIncident.pris_par}</p>}
                  </div>
                </div>
              )}
              {selectedIncident.date_resolution && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-sm text-green-600">Résolu</p>
                    <p className="text-xs text-gray-500">{format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy à HH:mm')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intervention */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-heading text-[#0077A8] mb-2">🛠 Intervention</h4>
            <div className="space-y-2 text-sm font-body">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Catégorie:</span>
                <Badge className={selectedIncident.type === 'technique' ? 'bg-[#00AEEF]' : 'bg-[#FFD700] text-[#0077A8]'}>
                  {categoryLabels[selectedIncident.categorie] || selectedIncident.categorie || '—'}
                </Badge>
                {selectedIncident.urgent && <Badge className="bg-red-500 text-white">URGENT</Badge>}
              </div>
              <div><span className="text-gray-500">Description:</span></div>
              <p className="bg-white p-3 rounded-lg border whitespace-pre-wrap">
                {selectedIncident.description_operationnelle || selectedIncident.description || '—'}
              </p>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-heading text-[#0077A8] mb-2">⏱ Timing</h4>
            <div className="grid grid-cols-2 gap-2 text-sm font-body">
              <div><span className="text-gray-500">Signalé:</span> {selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy HH:mm')}</div>
              <div><span className="text-gray-500">Pris en charge:</span> {selectedIncident.date_debut ? format(new Date(selectedIncident.date_debut), 'HH:mm') : '-'}</div>
              <div><span className="text-gray-500">Résolu:</span> {selectedIncident.date_resolution ? format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm') : '-'}</div>
              <div>
                <span className="text-gray-500">Durée:</span>{' '}
                {selectedIncident.date_resolution && selectedIncident.date_saisie
                  ? formatDuration(differenceInMinutes(new Date(selectedIncident.date_resolution), new Date(selectedIncident.date_saisie)))
                  : '-'}
              </div>
            </div>
          </div>

          {/* Photos */}
          {(selectedIncident.photo_avant_url || selectedIncident.photo_apres_url || selectedIncident.photo_url) && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <h4 className="font-heading text-[#0077A8] mb-3">📷 Preuves visuelles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedIncident.photo_url && (
                  <div>
                    <p className="text-xs font-heading text-gray-600 mb-1">📸 Photo client</p>
                    <img src={selectedIncident.photo_url} alt="Photo signalement" className="w-full h-32 object-cover rounded-lg border-2 border-gray-300" />
                  </div>
                )}
                {selectedIncident.photo_avant_url && (
                  <div>
                    <p className="text-xs font-heading text-orange-600 mb-1">📷 Photo AVANT</p>
                    <img src={selectedIncident.photo_avant_url} alt="Photo avant" className="w-full h-32 object-cover rounded-lg border-2 border-orange-300" />
                  </div>
                )}
                {selectedIncident.photo_apres_url && (
                  <div>
                    <p className="text-xs font-heading text-green-600 mb-1">📷 Photo APRÈS</p>
                    <img src={selectedIncident.photo_apres_url} alt="Photo après" className="w-full h-32 object-cover rounded-lg border-2 border-green-300" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Avis client */}
          {selectedIncident.note_client && (
            <div className="bg-[#FFD700]/20 rounded-xl p-4">
              <h4 className="font-heading text-[#0077A8] mb-2">⭐ {lang === 'fr' ? 'Avis client' : 'Guest review'}</h4>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-5 h-5 ${s <= selectedIncident.note_client ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                ))}
                <span className="ml-2 font-heading text-[#0077A8]">{selectedIncident.note_client}/5</span>
              </div>
              {selectedIncident.commentaire_client && (
                <p className="font-body text-gray-700 bg-white p-3 rounded-lg">"{selectedIncident.commentaire_client}"</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}