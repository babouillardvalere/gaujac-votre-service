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
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      page: 'CollaborateurTechnique'
    },
    { 
      id: 'menage', 
      icon: Sparkles, 
      color: 'from-sky-500 to-blue-500',
      bgColor: 'from-sky-50 to-blue-50',
      page: 'CollaborateurMenage'
    },
    { 
      id: 'bureau', 
      icon: Building2, 
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={() => selectedRole ? setSelectedRole(null) : navigate('/Home')}
              className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-light text-slate-800">
              {t('collaborateur')}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    className={`w-full group bg-gradient-to-r ${role.bgColor} hover:shadow-md rounded-xl p-5 text-left transition-all border border-slate-100`}
                  >
                    <div className="flex items-center">
                      <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <role.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {t(`acces_${role.id}`)}
                        </h3>
                      </div>
                      <Lock className="w-5 h-5 text-slate-400" />
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
                <div className={`p-6 bg-gradient-to-r ${selectedRole.bgColor} rounded-xl`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${selectedRole.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <selectedRole.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {t(`acces_${selectedRole.id}`)}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-slate-600">{t('mot_de_passe')}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={!password}
                  className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 disabled:opacity-50"
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