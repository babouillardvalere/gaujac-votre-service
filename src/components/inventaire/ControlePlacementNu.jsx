import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import SignaturePad from '../SignaturePad';
import { toast } from 'sonner';
import { shouldCreateMissions, createEmplacementNuMissions, getProblemLabel } from './emplacementNuWorkflow';
import { base44 } from '@/api/base44Client';

/**
 * CONTRÔLE D'ÉTAT POUR EMPLACEMENTS NUS
 * Structure spécifique, différente des hébergements équipés
 * Pas d'inventaire d'objets, mais signalement de problèmes
 */
export default function ControlePlacementNu({
  numero,
  categorie,
  clientNom,
  clientPrenom,
  dateArrivee,
  dateDepart,
  lang,
  onSubmitSuccess
}) {
  const [autorisationAcces, setAutorisationAcces] = useState('');
  const [plagesHoraires, setPlagesHoraires] = useState([]);
  const [nouvellePlage, setNouvellePlage] = useState('');
  const [problemes, setProblemes] = useState({});
  const [urgences, setUrgences] = useState({});
  const [appreciationEtat, setAppreciationEtat] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES_PROBLEMES = {
    technique: [
      { id: 'gaz', label: lang === 'fr' ? 'Gaz' : 'Gas', icon: '🔥' },
      { id: 'eau_plomberie', label: lang === 'fr' ? 'Eau / Fuite / Plomberie' : 'Water / Leak / Plumbing', icon: '💧' },
      { id: 'electricite', label: lang === 'fr' ? 'Électricité' : 'Electricity', icon: '⚡' },
      { id: 'technique_divers', label: lang === 'fr' ? 'Problème technique divers' : 'Other technical issue', icon: '🛠' }
    ],
    espaces_verts: [
      { id: 'espace_vert', label: lang === 'fr' ? 'Espace vert' : 'Green space', icon: '🌿' }
    ],
    mobilier: [
      { id: 'mobilier_casse', label: lang === 'fr' ? 'Mobilier cassé / matériel' : 'Broken furniture / equipment', icon: '🧰' }
    ],
    structure: [
      { id: 'probleme_structurel', label: lang === 'fr' ? 'Problème structurel' : 'Structural issue', icon: '🏚' }
    ],
    nuisances: [
      { id: 'souris', label: lang === 'fr' ? 'Souris' : 'Mice', icon: '🐭' },
      { id: 'guepes', label: lang === 'fr' ? 'Guêpes / Frelons' : 'Wasps / Hornets', icon: '🐝' },
      { id: 'fourmis', label: lang === 'fr' ? 'Fourmis' : 'Ants', icon: '🐜' },
      { id: 'moustiques', label: lang === 'fr' ? 'Moustiques (zone emplacement)' : 'Mosquitoes (area)', icon: '🦟' }
    ]
  };

  const toggleProbleme = (problemeId) => {
    setProblemes(prev => ({
      ...prev,
      [problemeId]: !prev[problemeId]
    }));
  };

  const toggleUrgence = (problemeId) => {
    setUrgences(prev => ({
      ...prev,
      [problemeId]: !prev[problemeId]
    }));
  };

  const problemeSelectiones = Object.keys(problemes).filter(k => problemes[k]);

  const handleSubmit = async () => {
    // VALIDATION
    if (!autorisationAcces) {
      toast.error(lang === 'fr' ? 'Veuillez indiquer l\'autorisation d\'accès' : 'Please indicate access authorization');
      return;
    }

    if (!signature) {
      toast.error(lang === 'fr' ? 'Veuillez signer le document' : 'Please sign the document');
      return;
    }

    const willCreateMissions = shouldCreateMissions(problemes, appreciationEtat);

    if (willCreateMissions && appreciationEtat === '') {
    toast.error(lang === 'fr' ? 'Veuillez évaluer l\'état global de l\'emplacement' : 'Please rate overall pitch condition');
    return;
    }

    if (autorisationAcces === 'non' && plagesHoraires.length === 0) {
    toast.error(lang === 'fr' ? 'Veuillez indiquer au moins une plage horaire d\'accès' : 'Please add at least one access time slot');
    return;
    }

    setSubmitting(true);
    toast.loading(lang === 'fr' ? 'Traitement...' : 'Processing...', { id: 'submit' });

    try {
      // 1. Créer enregistrement contrôle
      const controle = await base44.entities.DossierArrivee.create({
        code_dossier: `CTRL-${numero}-${dateArrivee.replace(/-/g, '')}`,
        client_nom: clientNom,
        client_prenom: clientPrenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        categorie_logement: categorie,
        type_logement: 'emplacement',
        etape_actuelle: 4,
        etape_1_terminee: true,
        etape_2_terminee: true,
        etape_3_terminee: true,
        etape_4_terminee: true,
        inventaire_json: {
          type: 'emplacement_nu',
          problemes: Object.keys(problemes).filter(k => problemes[k]),
          urgences: Object.keys(urgences).filter(k => urgences[k]),
          appreciation: appreciationEtat,
          commentaire
        },
        signature,
        evaluation_proprete: appreciationEtat,
        remarques: commentaire,
        statut: 'termine',
        horodatage_creation: new Date().toISOString()
      });

      console.log('[EMP_NU_CONTROL] Contrôle créé:', controle.id);

      // 2. Créer missions SI nécessaire
      if (willCreateMissions) {
        const missions = await createEmplacementNuMissions({
          numero,
          categorie,
          clientNom,
          clientPrenom,
          dateArrivee,
          dateDepart,
          problemes,
          urgences,
          appreciationEtat,
          commentaire,
          autorisationAcces,
          plagesHoraires,
          lang,
          base44
        });

        console.log('[EMP_NU_MISSIONS] Créées:', missions.length);

        // 3. Créer historique
        await base44.entities.HistoriqueEvent.create({
          type_event: 'CONTROLE_INVENTAIRE_VALIDE',
          titre: `Contrôle emplacement nu ${numero}`,
          description: `${clientPrenom} ${clientNom} - ${categorie} N°${numero} - ${missions.length} mission(s) créée(s)`,
          service: 'RECEPTION',
          hebergement: numero,
          type_hebergement: `Emplacement nu - ${categorie}`,
          client_nom: clientNom,
          client_prenom: clientPrenom,
          urgent: missions.some(m => m.hasUrgent),
          metadata: {
            type: 'emplacement_nu',
            missions_count: missions.length,
            problemes_count: problemeSelectiones.length,
            appreciation: appreciationEtat
          }
        });
      } else {
        // Contrôle conforme, pas de mission
        await base44.entities.HistoriqueEvent.create({
          type_event: 'CONTROLE_INVENTAIRE_VALIDE',
          titre: `Contrôle emplacement nu ${numero} - CONFORME`,
          description: `${clientPrenom} ${clientNom} - Emplacement en bon état, aucune mission créée`,
          service: 'RECEPTION',
          hebergement: numero,
          type_hebergement: `Emplacement nu - ${categorie}`,
          client_nom: clientNom,
          client_prenom: clientPrenom,
          urgent: false,
          metadata: {
            type: 'emplacement_nu',
            status: 'conforme'
          }
        });
      }

      toast.dismiss('submit');
      toast.success(
        lang === 'fr'
          ? 'Contrôle validé avec succès'
          : 'Control validated successfully'
      );

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('[EMP_NU_SUBMIT] ERROR:', err);
      toast.dismiss('submit');
      toast.error(lang === 'fr' ? 'Erreur lors de la validation' : 'Validation error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* EN-TÊTE */}
      <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">
            📋 {lang === "fr" ? "Contrôle inventaire" : "Inventory check"}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">{lang === "fr" ? "Type d'hébergement" : "Accommodation type"}</p>
              <p className="font-bold text-lg">{lang === "fr" ? "Emplacement nu" : "Bare pitch"}</p>
            </div>
            <div>
              <p className="text-gray-600">{lang === "fr" ? "Catégorie" : "Category"}</p>
              <p className="font-bold text-lg">{categorie}</p>
            </div>
            <div>
              <p className="text-gray-600">{lang === "fr" ? "Numéro" : "Number"}</p>
              <p className="font-bold text-lg">{numero}</p>
            </div>
            <div>
              <p className="text-gray-600">{lang === "fr" ? "Client" : "Guest"}</p>
              <p className="font-bold text-lg">{clientPrenom} {clientNom}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-600">{lang === "fr" ? "Période de séjour" : "Stay period"}</p>
              <p className="font-bold text-lg">{dateArrivee} → {dateDepart}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AUTORISATION D'ACCÈS */}
      <Card className="mb-6 border-2 border-[#FFA500]">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3 flex items-center gap-2">
            🔐 {lang === "fr" ? "Autorisation d'accès *" : "Access authorization *"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {lang === "fr" 
              ? "Autorisez-vous notre intervenant à entrer dans votre emplacement en votre absence ?"
              : "Do you authorize our staff to enter your pitch in your absence?"}
          </p>
          <RadioGroup value={autorisationAcces} onValueChange={setAutorisationAcces}>
            <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${autorisationAcces === 'oui' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              <RadioGroupItem value="oui" id="acces-oui" />
              <Label htmlFor="acces-oui" className="cursor-pointer flex-1 font-medium">
                ✔ {lang === "fr" ? "Oui" : "Yes"}
              </Label>
            </div>
            <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${autorisationAcces === 'non' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
              <RadioGroupItem value="non" id="acces-non" />
              <Label htmlFor="acces-non" className="cursor-pointer flex-1 font-medium">
                ✖ {lang === "fr" ? "Non" : "No"}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* SIGNALEMENT DES PROBLÈMES */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚠️ {lang === "fr" ? "Signalement des problèmes" : "Report problems"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(CATEGORIES_PROBLEMES).map(([categorie, items]) => (
            <div key={categorie}>
              <h4 className="font-semibold text-sm text-gray-700 mb-3 capitalize">
                {categorie === 'technique' && '🛠️ ' + (lang === 'fr' ? 'Problèmes techniques' : 'Technical problems')}
                {categorie === 'espaces_verts' && '🌿 ' + (lang === 'fr' ? 'Espace vert' : 'Green space')}
                {categorie === 'mobilier' && '🧰 ' + (lang === 'fr' ? 'Mobilier & Matériel' : 'Furniture & Equipment')}
                {categorie === 'structure' && '🏚 ' + (lang === 'fr' ? 'Problème structurel' : 'Structural issue')}
                {categorie === 'nuisances' && '🐭 ' + (lang === 'fr' ? 'Nuisances & Animaux' : 'Pests & Animals')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleProbleme(item.id)}
                    className={`p-3 border-2 rounded-lg transition-all text-left text-sm font-medium ${
                      problemes[item.id]
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Urgence si problèmes */}
          {problemeSelectiones.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3">
                ⚠️ {lang === "fr" ? "Niveau d'urgence" : "Urgency level"}
              </h4>
              <div className="space-y-2">
                {problemeSelectiones.map(problemId => {
                  const allItems = Object.values(CATEGORIES_PROBLEMES).flat();
                  const probleme = allItems.find(p => p.id === problemId);
                  return (
                    <label key={problemId} className="flex items-center space-x-2 p-2 hover:bg-red-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={urgences[problemId] || false}
                        onChange={() => toggleUrgence(problemId)}
                        className="w-4 h-4"
                      />
                      <span>{probleme?.icon} {probleme?.label} {lang === 'fr' ? '- Urgent?' : '- Urgent?'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* APPRÉCIATION GLOBALE */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            😊 {lang === "fr" ? "Appréciation globale de l'état de l'emplacement *" : "Overall pitch condition rating *"}
          </h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant={appreciationEtat === "insatisfaisant" ? "default" : "outline"}
              onClick={() => setAppreciationEtat("insatisfaisant")}
              className={appreciationEtat === "insatisfaisant" ? "bg-red-500" : ""}
            >
              😠 {lang === "fr" ? "Insatisfaisant" : "Unsatisfactory"}
            </Button>
            <Button
              variant={appreciationEtat === "correct" ? "default" : "outline"}
              onClick={() => setAppreciationEtat("correct")}
              className={appreciationEtat === "correct" ? "bg-gray-500" : ""}
            >
              😐 {lang === "fr" ? "Correct" : "Correct"}
            </Button>
            <Button
              variant={appreciationEtat === "bon" ? "default" : "outline"}
              onClick={() => setAppreciationEtat("bon")}
              className={appreciationEtat === "bon" ? "bg-green-500" : ""}
            >
              😄 {lang === "fr" ? "Très bon état" : "Excellent condition"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* COMMENTAIRE LIBRE */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            💬 {lang === "fr" ? "Commentaire (facultatif)" : "Comments (optional)"}
          </h3>
          <Textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={lang === "fr" ? "Vos remarques..." : "Your comments..."}
            className="h-24"
          />
        </CardContent>
      </Card>

      {/* Résumé avant validation */}
      <Card className="bg-gray-50 border-gray-300">
        <CardContent className="p-4 text-sm">
          <p className="font-semibold mb-2">{lang === "fr" ? "Résumé :" : "Summary:"}</p>
          <ul className="space-y-1 text-gray-700">
            <li>✓ {lang === "fr" ? "Autorisation d'accès :" : "Access authorization:"} <strong>{autorisationAcces === 'oui' ? '✔ Oui' : autorisationAcces === 'non' ? '✖ Non' : lang === 'fr' ? 'Non défini' : 'Not set'}</strong></li>
            <li>✓ {lang === "fr" ? "Problèmes signalés :" : "Reported problems:"} <strong>{problemeSelectiones.length || 'Aucun'}</strong></li>
            {problemeSelectiones.length > 0 && (
              <li className="ml-4 text-xs text-gray-600">
                {problemeSelectiones.map(p => (
                  <div key={p}>• {getProblemLabel(p, lang)} {urgences[p] ? '🔴' : ''}</div>
                ))}
              </li>
            )}
            <li>✓ {lang === "fr" ? "État global :" : "Overall condition:"} <strong>{appreciationEtat ? (appreciationEtat === 'insatisfaisant' ? '😠' : appreciationEtat === 'correct' ? '😐' : '😄') : lang === 'fr' ? 'Non défini' : 'Not set'}</strong></li>
            {shouldCreateMissions(problemes, appreciationEtat) && (
              <li className="mt-2 p-2 bg-orange-100 rounded text-orange-900">
                ⚠️ {lang === 'fr' ? 'Des missions seront créées à la validation' : 'Missions will be created upon validation'}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Signature */}
      <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

      {/* Bouton validation */}
      <Button
        onClick={handleSubmit}
        className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] mt-6 text-lg font-semibold"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
        {lang === "fr" ? "Valider le contrôle" : "Confirm control"}
      </Button>
    </div>
  );
}