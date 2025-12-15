import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { addEvent } from "../services/interventionService";
import type { ServiceIntervention, TimelineType, AttenteRaison } from "../services/types";
import { toast } from "sonner";

const TYPES: { value: TimelineType; label: string }[] = [
  { value: "PRISE_EN_CHARGE", label: "👤 Prise en charge" },
  { value: "ARRIVEE_SUR_SITE", label: "🚗 Arrivée sur site" },
  { value: "EN_COURS", label: "🔧 Intervention en cours" },
  { value: "MISE_EN_ATTENTE", label: "⏸ Mise en attente" },
  { value: "REPRISE", label: "▶️ Reprise" },
  { value: "TERMINEE", label: "✅ Terminé" },
  { value: "DEPART_SERVICE", label: "🚶 Départ du service" }
];

const WAIT_REASONS: { value: AttenteRaison; label: string }[] = [
  { value: "attente_materiel", label: "Attente de matériel" },
  { value: "attente_fournisseur", label: "Attente du fournisseur" },
  { value: "client_absent", label: "Client absent" },
  { value: "piece_specifique", label: "Besoin d'une pièce spécifique" },
  { value: "second_technicien", label: "Besoin d'un second technicien" },
  { value: "autre", label: "Autre" }
];

export default function ServiceUpdatePanel(props: {
  interventionId: string;
  service: ServiceIntervention;
  auteur: string;
  onUpdate?: () => void;
}) {
  const [type, setType] = useState<TimelineType>("PRISE_EN_CHARGE");
  const [message, setMessage] = useState<string>("");

  const [attenteRaison, setAttenteRaison] = useState<AttenteRaison>("attente_materiel");
  const [attenteMotif, setAttenteMotif] = useState<string>("");
  const [attenteDelai, setAttenteDelai] = useState<string>("");

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Le message est obligatoire");
      return;
    }

    try {
      await addEvent({
        interventionId: props.interventionId,
        service: props.service,
        type,
        auteur: props.auteur,
        message,
        attente: type === "MISE_EN_ATTENTE"
          ? { raison: attenteRaison, motif: attenteMotif, delai: attenteDelai }
          : undefined
      });

      toast.success("Événement enregistré");
      setMessage("");
      props.onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="font-semibold">🛠 Mise à jour service</div>

      <Select value={type} onValueChange={(v) => setType(v as TimelineType)}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {type === "MISE_EN_ATTENTE" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={attenteRaison} onValueChange={(v) => setAttenteRaison(v as AttenteRaison)}>
            <SelectTrigger><SelectValue placeholder="Raison" /></SelectTrigger>
            <SelectContent>
              {WAIT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            placeholder="Délai estimé" 
            value={attenteDelai} 
            onChange={(e) => setAttenteDelai(e.target.value)} 
          />
          <Input 
            placeholder="Motif détaillé" 
            value={attenteMotif} 
            onChange={(e) => setAttenteMotif(e.target.value)} 
          />
        </div>
      )}

      <Input 
        placeholder="Message (obligatoire)" 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />

      <Button className="w-full" onClick={submit}>
        ✅ Enregistrer étape
      </Button>
    </div>
  );
}