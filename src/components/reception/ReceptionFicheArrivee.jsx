import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Mail, Users, Dog, Calendar, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ReceptionFicheArrivee({ dossier, onClose, lang = 'fr' }) {
  const { data: inventaire } = useQuery({
    queryKey: ['inventaire-arrivee', dossier.inventaire_id],
    queryFn: async () => {
      if (!dossier.inventaire_id) return null;
      const inventaires = await base44.entities.ControleInventaireArrivee.list();
      return inventaires.find(inv => inv.id === dossier.inventaire_id);
    },
    enabled: !!dossier.inventaire_id
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['interventions-arrivee', dossier.id],
    queryFn: async () => {
      const allInterventions = await base44.entities.Incident.list();
      const menageIds = dossier.interventions_menage || [];
      const techniqueIds = dossier.interventions_technique || [];
      const ids = [...menageIds, ...techniqueIds];
      return allInterventions.filter(i => ids.includes(i.id));
    },
    enabled: !!(dossier.interventions_menage?.length || dossier.interventions_technique?.length)
  });

  const handleGenererPDF = async () => {
    toast.info(lang === 'fr' ? 'Génération du PDF...' : 'Generating PDF...');
    // TODO: Implémenter génération PDF
  };

  const handleEnvoyerEmail = async () => {
    toast.info(lang === 'fr' ? 'Envoi par email...' : 'Sending by email...');
    // TODO: Implémenter envoi email
  };

  const totalPersonnes = (dossier.nombre_adultes || 0) + (dossier.nombre_enfants || 0);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour à la liste' : 'Back to list'}</span>
          </button>

          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-6">
            📋 {lang === 'fr' ? 'Dossier Arrivée' : 'Arrival File'}
          </h1>

          {/* Informations client */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                👤 {lang === 'fr' ? 'Informations client' : 'Guest information'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Nom' : 'Name'}</p>
                  <p className="font-heading text-lg">{dossier.client_nom} {dossier.client_prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Code dossier' : 'File code'}</p>
                  <p className="font-heading text-lg">{dossier.code_dossier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Dates' : 'Dates'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {dossier.date_arrivee} → {dossier.date_depart}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Hébergement' : 'Accommodation'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {dossier.numero_logement} - {dossier.categorie_logement}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Personnes' : 'People'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {totalPersonnes} {lang === 'fr' ? 'pers' : 'ppl'}
                    {dossier.nombre_adultes && dossier.nombre_enfants && 
                      ` (${dossier.nombre_adultes}A / ${dossier.nombre_enfants}E)`}
                  </p>
                </div>
                {dossier.nombre_animaux > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">{lang === 'fr' ? 'Animaux' : 'Pets'}</p>
                    <p className="font-heading flex items-center gap-2">
                      <Dog className="w-4 h-4" />
                      {dossier.nombre_animaux}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventaire */}
          {inventaire && (
            <Card className="border-2 border-gray-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                  ✔️ {lang === 'fr' ? 'Contrôle Inventaire' : 'Inventory Check'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{lang === 'fr' ? 'Objets validés' : 'Validated items'}</p>
                    <p className="font-heading">{inventaire.objets_valides?.length || 0}</p>
                  </div>
                  {inventaire.objets_manquants?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{lang === 'fr' ? 'Objets manquants/cassés' : 'Missing/broken items'}</p>
                      <div className="space-y-2">
                        {inventaire.objets_manquants.map((obj, idx) => (
                          <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="font-heading text-sm">{obj.objet}</p>
                            {obj.commentaire && <p className="text-xs text-gray-600">{obj.commentaire}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">{lang === 'fr' ? 'Propreté' : 'Cleanliness'}</p>
                    <p className="font-heading">
                      {inventaire.evaluation_proprete === 'tres_propre' ? '😊 ' + (lang === 'fr' ? 'Très propre' : 'Very clean') :
                       inventaire.evaluation_proprete === 'correct' ? '😐 ' + (lang === 'fr' ? 'Correct' : 'Correct') :
                       '😞 ' + (lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interventions générées */}
          {interventions.length > 0 && (
            <Card className="border-2 border-orange-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                  🔧 {lang === 'fr' ? 'Interventions créées' : 'Created interventions'}
                </h2>
                <div className="space-y-2">
                  {interventions.map(interv => (
                    <div key={interv.id} className={`p-3 rounded-lg border ${
                      interv.type === 'menage' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className="font-heading text-sm">{interv.sous_categorie || interv.categorie}</p>
                      <p className="text-xs text-gray-600">{interv.description}</p>
                      <span className={`text-xs font-bold ${interv.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                        {interv.urgent ? '🔴 URGENT' : '🟢 NORMAL'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenererPDF}
              className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8]"
            >
              <Download className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Générer PDF' : 'Generate PDF'}
            </Button>
            <Button
              onClick={handleEnvoyerEmail}
              variant="outline"
              className="flex-1 border-2 border-[#00AEEF] text-[#00AEEF]"
            >
              <Mail className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Envoyer par email' : 'Send by email'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}