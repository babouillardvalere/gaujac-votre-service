import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function DemanderPhotosDialog({ 
  numeroLogement,
  serviceType, // 'menage' ou 'technique'
  description,
  lang = 'fr'
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!message.trim()) {
      toast.error(lang === 'fr' ? 'Veuillez préciser la demande' : 'Please specify the request');
      return;
    }

    setSending(true);

    try {
      // Créer une notification pour le service
      await base44.entities.Notification.create({
        destinataire_type: 'collaborateur',
        type: 'demande_photos',
        titre: lang === 'fr' 
          ? `📸 Demande de photos - ${numeroLogement}`
          : `📸 Photo request - ${numeroLogement}`,
        message: `${lang === 'fr' ? 'Réception demande' : 'Reception requests'}: ${message}`,
        hebergement: numeroLogement,
        metadata: {
          service: serviceType,
          demandeur: 'Réception',
          description
        }
      });

      // Créer une tâche
      await base44.entities.Tache.create({
        titre: lang === 'fr' 
          ? `📸 Photos demandées - ${numeroLogement}`
          : `📸 Photos requested - ${numeroLogement}`,
        description: message,
        categorie: serviceType,
        priorite: 'normale',
        statut: 'a_faire',
        hebergement: numeroLogement,
        assignee: serviceType === 'menage' ? 'Équipe ménage' : 'Équipe technique',
        date_echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      });

      toast.success(lang === 'fr' 
        ? '✅ Demande envoyée au service'
        : '✅ Request sent to the service'
      );
      
      setOpen(false);
      setMessage('');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
          <Camera className="w-4 h-4 mr-2" />
          {lang === 'fr' 
            ? `📣 Demander photos ${serviceType === 'menage' ? 'ménage' : 'technique'}`
            : `📣 Request ${serviceType === 'menage' ? 'housekeeping' : 'technical'} photos`
          }
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lang === 'fr' 
              ? `📸 Demander des photos au service ${serviceType === 'menage' ? 'ménage' : 'technique'}`
              : `📸 Request photos from ${serviceType === 'menage' ? 'housekeeping' : 'technical'} service`
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <strong>{lang === 'fr' ? 'Locatif' : 'Accommodation'}:</strong> {numeroLogement}
            </p>
            <p className="text-sm text-gray-600">
              <strong>{lang === 'fr' ? 'Sujet' : 'Subject'}:</strong> {description}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {lang === 'fr' ? 'Message pour le service' : 'Message for the service'}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={lang === 'fr' 
                ? 'Ex: Merci de prendre des photos de l\'état de la terrasse avant nettoyage'
                : 'Ex: Please take photos of the terrace condition before cleaning'
              }
            />
          </div>

          <Button
            onClick={handleSendRequest}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              lang === 'fr' ? 'Envoi...' : 'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Envoyer la demande' : 'Send request'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}