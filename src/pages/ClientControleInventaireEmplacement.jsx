import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";
import Logo from "../components/Logo";
import { uploadCompressedImage } from "../components/imageCompression";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/* ============================================================
   CLIENT – CONTRÔLE INVENTAIRE ARRIVÉE EMPLACEMENT
   (TECHNIQUE UNIQUEMENT)
============================================================ */

export default function ClientControleInventaireEmplacement() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const numero = sessionStorage.getItem("arrivee_numero");
  const typeEmplacement = sessionStorage.getItem("arrivee_type_emplacement"); // tente, van, camping-car, caravane

  const [selectedDemandes, setSelectedDemandes] = useState([]);
  const [description, setDescription] = useState("");
  const [urgentDeclaration, setUrgentDeclaration] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!nom || !prenom || !numero || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
    }
  }, []);

  const demandesTechniques = [
    { id: 'frigo', emoji: '🧊', label: lang === 'fr' ? 'Demande de frigo' : 'Fridge request' },
    { id: 'eau', emoji: '💧', label: lang === 'fr' ? 'Eau' : 'Water' },
    { id: 'electricite', emoji: '⚡', label: lang === 'fr' ? 'Électricité' : 'Electricity' },
    { id: 'espace_vert', emoji: '🌿', label: lang === 'fr' ? 'Espace vert' : 'Green space' },
    { id: 'souris', emoji: '🐭', label: lang === 'fr' ? 'Souris' : 'Mice' },
    { id: 'guepes', emoji: '🐝', label: lang === 'fr' ? 'Guêpes' : 'Wasps' },
    { id: 'frelons', emoji: '🐝', label: lang === 'fr' ? 'Frelons' : 'Hornets' },
    { id: 'fourmis', emoji: '🐜', label: lang === 'fr' ? 'Fourmis' : 'Ants' },
    { id: 'moustiques', emoji: '🦟', label: lang === 'fr' ? 'Moustiques' : 'Mosquitoes' }
  ];

  const toggleDemande = (id) => {
    setSelectedDemandes(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleUploadPhoto = async (file) => {
    if (!file) return null;
    try {
      const result = await uploadCompressedImage(file, (compressed) =>
        base44.integrations.Core.UploadFile({ file: compressed })
      );
      return result.file_url;
    } catch (e) {
      console.error(e);
      toast.error("Erreur upload photo");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (selectedDemandes.length === 0 && !description.trim()) {
      toast.error(lang === 'fr' ? "Veuillez sélectionner au moins une demande ou décrire le problème" : "Please select at least one request");
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = null;
      if (photo) {
        photoUrl = await handleUploadPhoto(photo);
      }

      // Créer FicheArrivee emplacement
      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        type_logement: "emplacement",
        categorie_logement: typeEmplacement || "emplacement",
        evaluation_proprete: "correct"
      });

      // Créer intervention technique
      if (selectedDemandes.length > 0) {
        const intervention = await base44.entities.Intervention.create({
          sejour_id: `ARR-${numero}-${dateArrivee.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
          type: "technique",
          statut: "OUVERTE",
          logement: numero,
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          fiche_arrivee_id: fiche.id,
          contexte: "ARRIVEE",
          origine: "ARRIVEE",
          urgent: urgentDeclaration,
          categorie: selectedDemandes[0],
          description: description || `Demande emplacement: ${selectedDemandes.map(d => demandesTechniques.find(dt => dt.id === d)?.label).join(', ')}`,
          technique_statut: "OUVERTE"
        });

        await base44.entities.InterventionEvent.create({
          intervention_id: intervention.id,
          service: "TECHNIQUE",
          type: "DEMANDE_RECUE",
          at: new Date().toISOString(),
          auteur: "Système",
          message: "Votre demande a bien été enregistrée et transmise à nos équipes.",
          visible_client: true
        });

        // Notification bureau
        await base44.entities.Notification.create({
          type: urgentDeclaration ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
          titre: `${urgentDeclaration ? '🔴 URGENT - ' : ''}Intervention emplacement - ${nom} ${prenom}`,
          message: `Arrivée emplacement ${numero} - ${selectedDemandes.length} demande(s)`,
          destinataire_role: 'RECEPTION',
          statut: 'non_lu'
        });
      }

      toast.success(lang === "fr" ? "Demande envoyée avec succès" : "Request sent successfully");
      navigate(createPageUrl("ClientMenu"));
    } catch (e) {
      console.error(e);
      toast.error(lang === "fr" ? "Erreur lors de l'envoi" : "Error while sending");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <h1 className="text-2xl font-bold text-center mb-6">
        {lang === "fr" ? "Contrôle arrivée - Emplacement" : "Arrival check - Pitch"} {numero}
      </h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            {nom} {prenom} • {dateArrivee} → {dateDepart}
          </p>
          <p className="text-xs text-gray-500 mt-1">Type : {typeEmplacement || "Emplacement"}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-semibold mb-3 text-[#0077A8]">
            {lang === "fr" ? "Demandes techniques disponibles" : "Available technical requests"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {demandesTechniques.map((demande) => (
              <button
                key={demande.id}
                onClick={() => toggleDemande(demande.id)}
                className={`p-4 border-2 rounded-lg text-center ${
                  selectedDemandes.includes(demande.id)
                    ? "bg-[#e6f7ff] border-[#00AEEF]"
                    : "border-gray-300"
                }`}
              >
                <div className="text-3xl mb-1">{demande.emoji}</div>
                <div className="text-sm font-semibold">{demande.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <label className="font-semibold mb-2 block text-[#0077A8]">
            {lang === "fr" ? "Description / Précisions" : "Description / Details"}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={lang === "fr" ? "Décrivez votre demande..." : "Describe your request..."}
            className="min-h-24"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700 mb-1">
                {lang === "fr" ? "Ce problème empêche-t-il votre installation immédiate ?" : "Does this prevent your immediate installation?"}
              </p>
              <p className="text-xs text-gray-500">
                {lang === "fr" ? "À cocher uniquement si l'emplacement n'est pas utilisable" : "Check only if the pitch is not usable"}
              </p>
            </div>
            <Button
              variant={urgentDeclaration ? "default" : "outline"}
              className={urgentDeclaration ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={() => setUrgentDeclaration(!urgentDeclaration)}
            >
              {urgentDeclaration ? "🔴 URGENT" : "⚪ Non"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <label className="font-semibold mb-2 block text-[#0077A8]">
            {lang === "fr" ? "Photo (facultatif)" : "Photo (optional)"}
          </label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="photo-upload"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
          <label
            htmlFor="photo-upload"
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#00AEEF]/50 rounded-lg cursor-pointer hover:bg-[#e6f7ff]"
          >
            📸 {lang === "fr" ? "Ajouter une photo" : "Add a photo"}
          </label>
          {photo && <p className="text-sm text-green-600 mt-2">✅ Photo ajoutée</p>}
        </CardContent>
      </Card>

      <Button 
        className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8]" 
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
        {lang === "fr" ? "Envoyer" : "Send"}
      </Button>
    </div>
  );
}