import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText, Camera, MessageSquare, AlertCircle } from 'lucide-react';
import { useTranslation } from '../translations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_CONFIG = {
  creation: { icon: FileText, color: 'text-blue-600', label_fr: 'Création', label_en: 'Created' },
  prise_en_charge: { icon: User, color: 'text-green-600', label_fr: 'Prise en charge', label_en: 'Taken over' },
  photo_avant_ajoutee: { icon: Camera, color: 'text-purple-600', label_fr: 'Photo avant ajoutée', label_en: 'Before photo added' },
  en_cours: { icon: Clock, color: 'text-blue-600', label_fr: 'En cours', label_en: 'In progress' },
  attente: { icon: AlertCircle, color: 'text-orange-600', label_fr: 'Mis en attente', label_en: 'Put on hold' },
  photo_apres_ajoutee: { icon: Camera, color: 'text-purple-600', label_fr: 'Photo après ajoutée', label_en: 'After photo added' },
  resolu: { icon: FileText, color: 'text-green-600', label_fr: 'Résolu', label_en: 'Resolved' },
  avis_client_ajoute: { icon: MessageSquare, color: 'text-yellow-600', label_fr: 'Avis client ajouté', label_en: 'Client review added' },
  document_ajoute: { icon: FileText, color: 'text-indigo-600', label_fr: 'Document ajouté', label_en: 'Document added' },
  commentaire_ajoute: { icon: MessageSquare, color: 'text-gray-600', label_fr: 'Commentaire ajouté', label_en: 'Comment added' },
  statut_change: { icon: AlertCircle, color: 'text-orange-600', label_fr: 'Statut modifié', label_en: 'Status changed' },
  priorite_modifiee: { icon: AlertCircle, color: 'text-red-600', label_fr: 'Priorité modifiée', label_en: 'Priority changed' },
  assignation_modifiee: { icon: User, color: 'text-blue-600', label_fr: 'Assignation modifiée', label_en: 'Assignment changed' }
};

export default function InterventionHistorique({ logs = [] }) {
  const { lang } = useTranslation();

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.horodatage) - new Date(a.horodatage)
  );

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-[#0077A8] flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {lang === 'fr' ? 'Historique détaillé' : 'Detailed history'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {lang === 'fr' ? 'Aucun historique disponible' : 'No history available'}
          </p>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log, index) => {
              const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.commentaire_ajoute;
              const Icon = config.icon;
              const label = lang === 'fr' ? config.label_fr : config.label_en;

              return (
                <div 
                  key={log.id || index}
                  className="flex gap-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div className={`mt-1 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#0077A8]">{label}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.horodatage), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                      {log.utilisateur_role && (
                        <Badge variant="outline" className="text-xs">
                          {log.utilisateur_role === 'admin' ? '👤 Staff' : '👤 Client'}
                        </Badge>
                      )}
                    </div>
                    
                    {log.utilisateur && (
                      <p className="text-sm text-gray-700">
                        <User className="w-3 h-3 inline mr-1" />
                        {log.utilisateur}
                      </p>
                    )}
                    
                    {log.commentaire && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {log.commentaire}
                      </p>
                    )}

                    {(log.ancienne_valeur || log.nouvelle_valeur) && (
                      <div className="text-xs space-y-1">
                        {log.ancienne_valeur && (
                          <p className="text-red-600">
                            <span className="font-medium">Avant:</span> {log.ancienne_valeur}
                          </p>
                        )}
                        {log.nouvelle_valeur && (
                          <p className="text-green-600">
                            <span className="font-medium">Après:</span> {log.nouvelle_valeur}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">
                          Détails techniques
                        </summary>
                        <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}