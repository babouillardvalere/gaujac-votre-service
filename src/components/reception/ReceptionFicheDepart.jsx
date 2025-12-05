import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FicheDegatsDepart from './FicheDegatsDepart';
import { ArrowLeft, Download, Mail, Users, Dog, Calendar, Home, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ReceptionFicheDepart({ dossier, onClose, lang = 'fr' }) {
  const [interventionsCreees, setInterventionsCreees] = useState([]);

  const hasDegats = 
    dossier.evaluation_proprete === 'pas_satisfaisant' ||
    dossier.objets_modifies?.length > 0 ||
    dossier.commentaire_proprete;

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

          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            📋 {lang === 'fr' ? 'Dossier Départ' : 'Departure File'}
          </h1>

          {/* Informations client */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
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
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Propreté déclarée' : 'Declared cleanliness'}</p>
                  <p className="font-heading">
                    {dossier.evaluation_proprete === 'tres_propre' ? '😊 ' + (lang === 'fr' ? 'Très propre' : 'Very clean') :
                     dossier.evaluation_proprete === 'correct' ? '😐 ' + (lang === 'fr' ? 'Correct' : 'Correct') :
                     '😠 ' + (lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets */}
          <Tabs defaultValue={hasDegats ? "degats" : "resume"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resume">
                {lang === 'fr' ? 'Résumé' : 'Summary'}
              </TabsTrigger>
              <TabsTrigger value="degats" className={hasDegats ? 'text-orange-600' : ''}>
                {hasDegats && <AlertTriangle className="w-4 h-4 mr-2" />}
                {lang === 'fr' ? 'Fiche dégâts' : 'Damage report'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-6">
              {/* État du départ */}
              {dossier.objets_modifies?.length > 0 && (
                <Card className="border-2 border-red-300 rounded-xl mb-6">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-xl text-red-700 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {lang === 'fr' ? 'Objets modifiés/cassés' : 'Modified/broken items'}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {dossier.objets_modifies.map((obj, idx) => (
                        <div key={idx} className="text-3xl bg-red-100 p-2 rounded-lg opacity-60">
                          {obj}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {dossier.commentaire_proprete && (
                <Card className="border-2 border-gray-300 rounded-xl mb-6">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                      💬 {lang === 'fr' ? 'Commentaire client' : 'Client comment'}
                    </h2>
                    <p className="text-gray-700">{dossier.commentaire_proprete}</p>
                  </CardContent>
                </Card>
              )}

              {dossier.photo_proprete && (
                <Card className="border-2 border-gray-300 rounded-xl mb-6">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                      📷 {lang === 'fr' ? 'Photo client' : 'Client photo'}
                    </h2>
                    <img src={dossier.photo_proprete} alt="Photo" className="rounded-lg max-w-full" />
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
            </TabsContent>

            <TabsContent value="degats" className="mt-6">
              {hasDegats && (
                <Card className="border-2 border-orange-300 bg-orange-50 rounded-xl mb-6">
                  <CardContent className="p-4">
                    <p className="text-sm text-orange-800 font-body">
                      {lang === 'fr'
                        ? '⚠️ Ce départ présente des anomalies. Sélectionnez les dégâts constatés pour créer automatiquement des interventions.'
                        : '⚠️ This departure has anomalies. Select the damages found to automatically create interventions.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <FicheDegatsDepart 
                dossierDepart={dossier}
                onValidate={setInterventionsCreees}
                lang={lang}
              />

              {interventionsCreees.length > 0 && (
                <Card className="border-2 border-green-400 bg-green-50 rounded-xl mt-6">
                  <CardContent className="p-6">
                    <h3 className="font-heading text-lg text-green-800 mb-3">
                      ✅ {lang === 'fr' ? 'Interventions créées' : 'Interventions created'}
                    </h3>
                    <div className="space-y-2">
                      {interventionsCreees.map((interv, idx) => (
                        <div key={idx} className="text-sm">
                          {interv.type === 'menage' && '🧹 ' + (lang === 'fr' ? 'Intervention ménage' : 'Housekeeping intervention')}
                          {interv.type === 'technique' && '🔧 ' + (lang === 'fr' ? 'Intervention technique' : 'Technical intervention')}
                          {interv.type === 'inventaire' && '📦 ' + (lang === 'fr' ? 'Alerte inventaire' : 'Inventory alert')}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}