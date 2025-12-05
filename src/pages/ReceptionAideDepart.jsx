import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import FicheDegatsDepart from '../components/reception/FicheDegatsDepart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ReceptionAideDepart() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    client_nom: '',
    client_prenom: '',
    numero_logement: ''
  });

  const [dossierTrouve, setDossierTrouve] = useState(null);
  const [recherche, setRecherche] = useState(false);
  const [proprete, setProprete] = useState('correct');
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rechercherDossier = async () => {
    if (!searchData.client_nom || !searchData.client_prenom || !searchData.numero_logement) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    setRecherche(true);

    try {
      const dossiers = await base44.entities.DossierArrivee.list();
      const dossier = dossiers.find(d => 
        d.client_nom.toLowerCase() === searchData.client_nom.toLowerCase() &&
        d.client_prenom.toLowerCase() === searchData.client_prenom.toLowerCase() &&
        d.numero_logement === searchData.numero_logement &&
        d.statut === 'finalise'
      );

      if (dossier) {
        setDossierTrouve(dossier);
        toast.success(lang === 'fr' ? '✅ Dossier trouvé !' : '✅ File found!');
      } else {
        toast.error(lang === 'fr' 
          ? '❌ Aucun dossier trouvé'
          : '❌ No file found'
        );
      }
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur de recherche' : 'Search error');
    } finally {
      setRecherche(false);
    }
  };

  const handleValiderDepart = async () => {
    if (!dossierTrouve) return;

    setSubmitting(true);

    try {
      await base44.entities.DepartCheck.create({
        client_nom: dossierTrouve.client_nom,
        client_prenom: dossierTrouve.client_prenom,
        date_arrivee: dossierTrouve.date_arrivee,
        date_depart: dossierTrouve.date_depart,
        type_logement: dossierTrouve.type_logement,
        categorie_logement: dossierTrouve.categorie_logement,
        numero_logement: dossierTrouve.numero_logement,
        photos_json: {},
        evaluation_proprete: proprete,
        commentaire_proprete: commentaire,
        date_soumission: new Date().toISOString()
      });

      if (proprete === 'pas_satisfaisant') {
        await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'nettoyage',
          description: `Propreté insatisfaisante au départ - ${commentaire}`,
          urgent: true,
          client_nom: dossierTrouve.client_nom,
          client_prenom: dossierTrouve.client_prenom,
          date_arrivee: dossierTrouve.date_arrivee,
          date_depart: dossierTrouve.date_depart,
          logement: dossierTrouve.numero_logement,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          commentaire_interne: '[RÉCEPTION] Constaté au départ'
        });
      }

      toast.success(lang === 'fr' ? '✅ Départ enregistré !' : '✅ Departure registered!');
      
      setTimeout(() => {
        navigate(createPageUrl('Reception'));
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ReceptionAssistance'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            🚗 {lang === 'fr' ? 'Aide Départ Client' : 'Guest Departure Assistance'}
          </h1>

          {!dossierTrouve ? (
            <Card className="border-2 border-[#FFA500]/30 rounded-xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heading text-lg text-[#0077A8]">
                  {lang === 'fr' ? 'Rechercher le dossier d\'arrivée' : 'Search arrival file'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('nom')} *</Label>
                    <Input
                      value={searchData.client_nom}
                      onChange={(e) => setSearchData(prev => ({ ...prev, client_nom: e.target.value }))}
                      className="border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>{t('prenom')} *</Label>
                    <Input
                      value={searchData.client_prenom}
                      onChange={(e) => setSearchData(prev => ({ ...prev, client_prenom: e.target.value }))}
                      className="border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{lang === 'fr' ? 'Numéro de locatif' : 'Accommodation number'} *</Label>
                    <Input
                      value={searchData.numero_logement}
                      onChange={(e) => setSearchData(prev => ({ ...prev, numero_logement: e.target.value.toUpperCase() }))}
                      placeholder="Ex: R01, D14, E23"
                      className="border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={rechercherDossier}
                  disabled={recherche}
                  className="w-full bg-[#00AEEF] hover:bg-[#0077A8]"
                >
                  {recherche ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {lang === 'fr' ? 'Recherche...' : 'Searching...'}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      {lang === 'fr' ? 'Rechercher' : 'Search'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="resume" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="resume">
                  {lang === 'fr' ? 'Résumé' : 'Summary'}
                </TabsTrigger>
                <TabsTrigger value="degats">
                  {lang === 'fr' ? 'Dégâts / Manques' : 'Damages / Missing'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resume" className="mt-6 space-y-6">
                <Card className="border-2 border-green-300 bg-green-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-green-800 mb-2">✅ Dossier trouvé</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Client:</strong> {dossierTrouve.client_nom} {dossierTrouve.client_prenom}</p>
                      <p><strong>Locatif:</strong> {dossierTrouve.numero_logement} - {dossierTrouve.categorie_logement}</p>
                      <p><strong>Dates:</strong> {dossierTrouve.date_arrivee} → {dossierTrouve.date_depart}</p>
                      <p><strong>Personnes:</strong> {(dossierTrouve.nombre_adultes || 0) + (dossierTrouve.nombre_enfants || 0) + (dossierTrouve.nombre_adolescents || 0) + (dossierTrouve.nombre_bebes || 0)}</p>
                      {dossierTrouve.nombre_animaux > 0 && (
                        <p><strong>Animaux:</strong> 🐾 {dossierTrouve.nombre_animaux}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-300 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                        {lang === 'fr' ? 'État de propreté au départ' : 'Cleanliness on departure'}
                      </h3>
                      <div className="flex gap-3">
                        {[
                          { value: 'pas_satisfaisant', emoji: '😠', label: 'Pas satisfaisant' },
                          { value: 'correct', emoji: '😐', label: 'Correct' },
                          { value: 'tres_propre', emoji: '😊', label: 'Très propre' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setProprete(opt.value)}
                            className={`flex-1 p-3 rounded-xl border-2 ${
                              proprete === opt.value ? 'border-[#FFA500] bg-orange-50' : 'border-gray-300'
                            }`}
                          >
                            <div className="text-3xl">{opt.emoji}</div>
                            <div className="text-xs mt-1">{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>{lang === 'fr' ? 'Commentaire' : 'Comment'}</Label>
                      <Textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        className="border-2 border-gray-200 rounded-xl"
                        rows={3}
                        placeholder={lang === 'fr' ? 'Observations...' : 'Observations...'}
                      />
                    </div>

                    <Button
                      onClick={handleValiderDepart}
                      disabled={submitting}
                      className="w-full bg-[#FFA500] hover:bg-[#FF8C00]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {lang === 'fr' ? 'Validation...' : 'Validating...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {lang === 'fr' ? 'Valider le départ' : 'Validate departure'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="degats" className="mt-6">
                <FicheDegatsDepart
                  dossierDepart={dossierTrouve}
                  onValidate={(interventions) => {
                    toast.success(lang === 'fr' 
                      ? `✅ ${interventions.length} intervention(s) créée(s)`
                      : `✅ ${interventions.length} intervention(s) created`
                    );
                  }}
                  lang={lang}
                />
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
}