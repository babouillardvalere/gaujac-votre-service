import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { degatsCategories, getDegatsLabel } from './IconesDegats';
import { Upload, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function FicheDegatsDepart({ dossierDepart, onValidate, lang = 'fr' }) {
  const [degatsSelectionnes, setDegatsSelectionnes] = useState([]);
  const [commentaire, setCommentaire] = useState('');
  const [photoReception, setPhotoReception] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleDegat = (categorieId, degatId) => {
    const key = `${categorieId}:${degatId}`;
    if (degatsSelectionnes.includes(key)) {
      setDegatsSelectionnes(prev => prev.filter(d => d !== key));
    } else {
      setDegatsSelectionnes(prev => [...prev, key]);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoReception(file_url);
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async () => {
    if (degatsSelectionnes.length === 0) {
      toast.error(lang === 'fr' ? 'Sélectionnez au moins un dégât' : 'Select at least one damage');
      return;
    }

    setSubmitting(true);

    try {
      // Grouper les dégâts par catégorie
      const degatsMenage = degatsSelectionnes.filter(d => d.startsWith('menage:'));
      const degatsTechnique = degatsSelectionnes.filter(d => d.startsWith('technique:'));
      const degatsInventaire = degatsSelectionnes.filter(d => d.startsWith('inventaire:'));

      // Créer les interventions
      const interventionsCreees = [];

      // Intervention Ménage
      if (degatsMenage.length > 0) {
        const description = degatsMenage.map(d => {
          const degatId = d.split(':')[1];
          return getDegatsLabel(degatId, 'menage', lang);
        }).join(', ');

        const intervention = await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'nettoyage',
          description: `🧹 Dégâts constatés au départ : ${description}`,
          urgent: true,
          client_nom: dossierDepart.client_nom,
          client_prenom: dossierDepart.client_prenom,
          date_arrivee: dossierDepart.date_arrivee,
          date_depart: dossierDepart.date_depart,
          logement: dossierDepart.numero_logement,
          photo_url: photoReception || dossierDepart.photo_proprete || '',
          commentaire_interne: commentaire,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          date_saisie: new Date().toISOString()
        });
        interventionsCreees.push({ type: 'menage', id: intervention.id });
      }

      // Intervention Technique
      if (degatsTechnique.length > 0) {
        const description = degatsTechnique.map(d => {
          const degatId = d.split(':')[1];
          return getDegatsLabel(degatId, 'technique', lang);
        }).join(', ');

        const intervention = await base44.entities.Incident.create({
          type: 'technique',
          categorie: 'divers_technique',
          description: `🔧 Dégâts constatés au départ : ${description}`,
          urgent: true,
          client_nom: dossierDepart.client_nom,
          client_prenom: dossierDepart.client_prenom,
          date_arrivee: dossierDepart.date_arrivee,
          date_depart: dossierDepart.date_depart,
          logement: dossierDepart.numero_logement,
          photo_url: photoReception || dossierDepart.photo_proprete || '',
          commentaire_interne: commentaire,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          date_saisie: new Date().toISOString()
        });
        interventionsCreees.push({ type: 'technique', id: intervention.id });
      }

      // Alerte Inventaire
      if (degatsInventaire.length > 0) {
        const description = degatsInventaire.map(d => {
          const degatId = d.split(':')[1];
          return getDegatsLabel(degatId, 'inventaire', lang);
        }).join(', ');

        const intervention = await base44.entities.Incident.create({
          type: 'technique',
          categorie: 'mobilier_casse',
          description: `📦 Problème inventaire au départ : ${description}`,
          urgent: false,
          client_nom: dossierDepart.client_nom,
          client_prenom: dossierDepart.client_prenom,
          date_arrivee: dossierDepart.date_arrivee,
          date_depart: dossierDepart.date_depart,
          logement: dossierDepart.numero_logement,
          photo_url: photoReception || '',
          commentaire_interne: commentaire,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          date_saisie: new Date().toISOString()
        });
        interventionsCreees.push({ type: 'inventaire', id: intervention.id });
      }

      toast.success(lang === 'fr' 
        ? `✅ ${interventionsCreees.length} intervention(s) créée(s) !`
        : `✅ ${interventionsCreees.length} intervention(s) created!`
      );

      if (onValidate) onValidate(interventionsCreees);

    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur envoi' : 'Send error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ménage */}
      <Card className="border-2 border-yellow-300 rounded-xl">
        <CardContent className="p-6">
          <h3 className="font-heading text-lg text-[#0077A8] mb-4 flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {degatsCategories.menage.map(degat => {
              const key = `menage:${degat.id}`;
              const isSelected = degatsSelectionnes.includes(key);
              return (
                <button
                  key={degat.id}
                  onClick={() => toggleDegat('menage', degat.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected ? 'bg-red-100 border-red-400 scale-110' : 'bg-white border-gray-300 hover:border-yellow-400'
                  }`}
                >
                  <div className="text-3xl mb-1">{degat.icon}</div>
                  <p className="text-xs font-heading text-gray-700">
                    {lang === 'fr' ? degat.label_fr : degat.label_en}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technique */}
      <Card className="border-2 border-blue-300 rounded-xl">
        <CardContent className="p-6">
          <h3 className="font-heading text-lg text-[#0077A8] mb-4 flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            {lang === 'fr' ? 'Technique' : 'Technical'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {degatsCategories.technique.map(degat => {
              const key = `technique:${degat.id}`;
              const isSelected = degatsSelectionnes.includes(key);
              return (
                <button
                  key={degat.id}
                  onClick={() => toggleDegat('technique', degat.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected ? 'bg-red-100 border-red-400 scale-110' : 'bg-white border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="text-3xl mb-1">{degat.icon}</div>
                  <p className="text-xs font-heading text-gray-700">
                    {lang === 'fr' ? degat.label_fr : degat.label_en}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inventaire */}
      <Card className="border-2 border-purple-300 rounded-xl">
        <CardContent className="p-6">
          <h3 className="font-heading text-lg text-[#0077A8] mb-4 flex items-center gap-2">
            <span className="text-2xl">📦</span>
            {lang === 'fr' ? 'Inventaire' : 'Inventory'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {degatsCategories.inventaire.map(degat => {
              const key = `inventaire:${degat.id}`;
              const isSelected = degatsSelectionnes.includes(key);
              return (
                <button
                  key={degat.id}
                  onClick={() => toggleDegat('inventaire', degat.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected ? 'bg-red-100 border-red-400 scale-110' : 'bg-white border-gray-300 hover:border-purple-400'
                  }`}
                >
                  <div className="text-3xl mb-1">{degat.icon}</div>
                  <p className="text-xs font-heading text-gray-700">
                    {lang === 'fr' ? degat.label_fr : degat.label_en}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Commentaire */}
      <Card className="border-2 border-gray-300 rounded-xl">
        <CardContent className="p-6">
          <h3 className="font-heading text-lg text-[#0077A8] mb-3">
            💬 {lang === 'fr' ? 'Note interne (facultatif)' : 'Internal note (optional)'}
          </h3>
          <Textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={lang === 'fr' ? 'Détails supplémentaires...' : 'Additional details...'}
            className="border-2 border-gray-200 mb-4"
            rows={3}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-reception"
          />
          <label htmlFor="photo-reception">
            <Button type="button" variant="outline" className="w-full" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? (lang === 'fr' ? 'Upload...' : 'Uploading...') : 
                          (lang === 'fr' ? 'Ajouter photo réception' : 'Add reception photo')}
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* Validation */}
      {degatsSelectionnes.length > 0 && (
        <Card className="border-2 border-orange-400 bg-orange-50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="font-heading text-orange-800">
                {lang === 'fr' 
                  ? `${degatsSelectionnes.length} dégât(s) sélectionné(s)`
                  : `${degatsSelectionnes.length} damage(s) selected`}
              </p>
            </div>
            <Button
              onClick={handleValidate}
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting 
                ? (lang === 'fr' ? 'Envoi...' : 'Sending...') 
                : (lang === 'fr' ? 'Envoyer aux équipes' : 'Send to teams')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}