import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench, Sparkles, Building2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const PASSWORDS = {
  technique: 'tech2024',
  menage: 'menage2024',
  bureau: 'bureau2024'
};

export default function Collaborateur() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState('');

  const roles = [
    { 
      id: 'technique', 
      icon: Wrench, 
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      page: 'CollaborateurTechnique'
    },
    { 
      id: 'menage', 
      icon: Sparkles, 
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      page: 'CollaborateurMenage'
    },
    { 
      id: 'bureau', 
      icon: Building2, 
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      page: 'Bureau'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setPassword('');
  };

  const handleLogin = () => {
    if (password === PASSWORDS[selectedRole.id]) {
      sessionStorage.setItem('collaborateur_role', selectedRole.id);
      navigate(createPageUrl(selectedRole.page));
    } else {
      toast.error(t('mot_de_passe_incorrect'));
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-[#00AEEF]">
            <button 
              onClick={() => selectedRole ? setSelectedRole(null) : navigate('/Home')}
              className="flex items-center text-white/80 hover:text-white transition-colors mb-4 font-body"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-heading text-white">
              {t('collaborateur')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!selectedRole ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full group bg-white hover:bg-[#e6f7ff] rounded-xl p-5 text-left transition-all border-2 border-[#00AEEF]/30 hover:border-[#00AEEF]"
                  >
                    <div className="flex items-center">
                      <div className={`w-14 h-14 ${role.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <role.icon className={`w-7 h-7 ${role.textColor}`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-heading text-[#0077A8]">
                          {t(`acces_${role.id}`)}
                        </h3>
                      </div>
                      <Lock className="w-5 h-5 text-[#00AEEF]" />
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 bg-[#e6f7ff] rounded-xl border border-[#00AEEF]/30">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${selectedRole.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <selectedRole.icon className={`w-7 h-7 ${selectedRole.textColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading text-[#0077A8]">
                        {t(`acces_${selectedRole.id}`)}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-heading text-[#0077A8]">{t('mot_de_passe')}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-12 border-[#00AEEF]/30 focus:border-[#00AEEF] rounded-xl font-body"
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={!password}
                  className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white font-heading rounded-xl shadow-lg disabled:opacity-50"
                >
                  {t('confirmer')}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}