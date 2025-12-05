import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useTranslation } from './translations';

export default function BureauAuthDialog({ open, onOpenChange, onSuccess }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    
    setIsLoading(true);
    setError(false);
    
    try {
      // Vérifier le mot de passe via LLM (accès au secret)
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Compare le mot de passe fourni "${password}" avec le mot de passe bureau secret. Réponds UNIQUEMENT "true" si identique, "false" sinon. Mot de passe bureau attendu: utilise la variable d'environnement bureau_password qui vaut "GAUJAC-DIR2025" par défaut.`,
        response_json_schema: {
          type: "object",
          properties: {
            match: { type: "boolean" }
          }
        }
      });
      
      // Vérification locale en fallback
      const isValid = password === 'GAUJAC-DIR2025' || result?.match === true;
      
      if (isValid) {
        sessionStorage.setItem('bureau_authenticated', 'true');
        sessionStorage.setItem('bureau_auth_time', new Date().toISOString());
        onSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        setError(true);
      }
    } catch (err) {
      // En cas d'erreur, vérification locale
      if (password === 'GAUJAC-DIR2025') {
        sessionStorage.setItem('bureau_authenticated', 'true');
        sessionStorage.setItem('bureau_auth_time', new Date().toISOString());
        onSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        setError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-[#FFA500]/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#FFA500]" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center mb-4">
          <h2 className="font-heading text-xl text-[#0077A8] mb-2">🔐 {t('connexion_bureau')}</h2>
          <p className="font-body text-sm text-gray-600">
            {t('acces_reserve_bureau')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">{t('mot_de_passe_bureau')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFA500]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={`pl-10 pr-10 h-12 rounded-xl font-body ${error ? 'border-red-500' : 'border-[#FFA500]/30'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFA500]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading text-sm text-red-600">{t('mot_de_passe_incorrect_bureau')}</p>
                <p className="font-body text-xs text-red-500">{t('acces_reserve_direction')}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!password.trim() || isLoading}
            className="w-full h-12 bg-[#FFA500] hover:bg-[#e69500] rounded-xl font-heading"
          >
            {isLoading ? t('verification') : t('se_connecter')}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-500 font-body"
          >
            {t('annuler')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}