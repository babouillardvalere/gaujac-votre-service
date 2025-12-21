import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import NotificationPreferencesPanel from '../components/notifications/NotificationPreferencesPanel';
import { motion } from 'framer-motion';

export default function PreferencesNotifications() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user?.email);
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#00AEEF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Logo className="h-16 mb-6" />
          <h1 className="font-handwritten text-2xl text-red-600 mb-4">
            Accès réservé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder aux préférences de notifications.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>

          <Logo className="h-16 mb-6" />

          <NotificationPreferencesPanel userEmail={userEmail} />
        </motion.div>
      </div>
    </div>
  );
}