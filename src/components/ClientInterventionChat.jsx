import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Wrench, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const translations = {
  fr: {
    chat_title: 'Discussion avec le technicien',
    send_message: 'Envoyer',
    placeholder: 'Votre message...',
    no_messages: 'Aucun message. Démarrez la conversation !',
    chat_available: 'Le chat est disponible une fois l\'intervention prise en charge.',
    technician: 'Technicien',
    you: 'Vous',
    open_chat: 'Discuter',
    close: 'Fermer'
  },
  en: {
    chat_title: 'Chat with technician',
    send_message: 'Send',
    placeholder: 'Your message...',
    no_messages: 'No messages. Start the conversation!',
    chat_available: 'Chat is available once the intervention is assigned.',
    technician: 'Technician',
    you: 'You',
    open_chat: 'Chat',
    close: 'Close'
  }
};

export default function ClientInterventionChat({ incident, clientNom }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr'][key];
  const dateLocale = lang === 'en' ? enUS : fr;

  // Récupérer les messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', incident.id],
    queryFn: () => base44.entities.Message.filter({ incident_id: incident.id }, 'created_date', 100),
    enabled: isOpen && !!incident.pris_par,
    refetchInterval: isOpen ? 5000 : false
  });

  // Marquer les messages du collaborateur comme lus
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const unreadCollabMessages = messages.filter(m => m.expediteur_type === 'collaborateur' && !m.lu);
      unreadCollabMessages.forEach(m => {
        base44.entities.Message.update(m.id, { lu: true });
      });
    }
  }, [isOpen, messages]);

  // Scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Envoyer un message
  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      incident_id: incident.id,
      expediteur_type: 'client',
      expediteur_nom: clientNom || 'Client',
      contenu: content
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', incident.id] });
      setMessage('');
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Nombre de messages non lus du collaborateur
  const unreadCount = messages.filter(m => m.expediteur_type === 'collaborateur' && !m.lu).length;

  // Chat uniquement si intervention prise en charge
  if (!incident.pris_par) {
    return null;
  }

  return (
    <>
      {/* Bouton pour ouvrir le chat */}
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[#0077A8] hover:bg-[#005f85] rounded-xl font-heading relative"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {t('open_chat')} - {incident.pris_par}
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Modal Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="border-2 border-[#00AEEF] rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <CardHeader className="bg-[#00AEEF] text-white p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-base flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {t('chat_title')}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-white/80 text-xs">{incident.pris_par}</p>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t('no_messages')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isClient = msg.expediteur_type === 'client';
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                  isClient
                                    ? 'bg-[#00AEEF] text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {isClient ? (
                                    <User className="w-3 h-3" />
                                  ) : (
                                    <Wrench className="w-3 h-3" />
                                  )}
                                  <span className="text-xs font-medium opacity-80">
                                    {isClient ? t('you') : msg.expediteur_nom || t('technician')}
                                  </span>
                                </div>
                                <p className="text-sm">{msg.contenu}</p>
                                <p className={`text-xs mt-1 ${isClient ? 'text-white/60' : 'text-gray-400'}`}>
                                  {format(new Date(msg.created_date), 'HH:mm', { locale: dateLocale })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('placeholder')}
                        className="flex-1 rounded-xl border-[#00AEEF]/30"
                        disabled={sendMutation.isPending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || sendMutation.isPending}
                        className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl"
                      >
                        {sendMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}