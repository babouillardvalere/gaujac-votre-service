import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const PASSWORD = 'GAUJAC2025';

export default function Collaborateur() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (password === PASSWORD) {
      sessionStorage.setItem('collaborateur_authenticated', 'true');
      navigate(createPageUrl('MenuCollaborateur'));
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo className="h-24 mx-auto" />
        </div>

        <Card className="shadow-xl border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="text-center bg-[#00AEEF] pb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-heading text-white">
              Espace Collaborateurs
            </CardTitle>
            <p className="text-white/80 font-body text-sm mt-2">
              Accès réservé au personnel
            </p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00AEEF]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 border-[#00AEEF]/30 rounded-xl font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00AEEF]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!password}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white font-heading rounded-xl shadow-lg disabled:opacity-50"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}