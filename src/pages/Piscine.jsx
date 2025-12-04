import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, Eye, EyeOff, Droplet, Thermometer, FlaskConical, 
  Plus, AlertTriangle, CheckCircle, Loader2, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PASSWORD = '2024TECH';

export default function Piscine() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date_mesure: format(new Date(), 'yyyy-MM-dd'),
    heure: format(new Date(), 'HH:mm'),
    chlore: '',
    ph: '',
    temperature: '',
    observation: '',
    technicien: ''
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('tech_authenticated');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const { data: mesures = [], isLoading } = useQuery({
    queryKey: ['piscine-mesures'],
    queryFn: () => base44.entities.Piscine.filter({}, '-date_mesure', 100),
    enabled: isAuthenticated
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Piscine.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['piscine-mesures'] });
      toast.success('Mesure enregistrée !');
      setShowForm(false);
      setFormData({
        date_mesure: format(new Date(), 'yyyy-MM-dd'),
        heure: format(new Date(), 'HH:mm'),
        chlore: '',
        ph: '',
        temperature: '',
        observation: '',
        technicien: ''
      });
    }
  });

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('tech_authenticated', 'true');
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  const handleSubmit = () => {
    const chlore = parseFloat(formData.chlore);
    const ph = parseFloat(formData.ph);
    const temperature = parseFloat(formData.temperature);

    // Vérification des valeurs anormales
    const alerte = chlore < 1 || chlore > 3 || ph < 7.2 || ph > 7.6 || temperature < 20 || temperature > 32;

    createMutation.mutate({
      ...formData,
      chlore,
      ph,
      temperature,
      alerte
    });
  };

  const isValueNormal = (type, value) => {
    if (type === 'chlore') return value >= 1 && value <= 3;
    if (type === 'ph') return value >= 7.2 && value <= 7.6;
    if (type === 'temperature') return value >= 20 && value <= 32;
    return true;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-[#00AEEF]">
            <Logo className="h-16 mb-4" />
            <CardTitle className="text-xl font-heading text-white flex items-center justify-center gap-2">
              <Droplet className="w-5 h-5" />
              Entretien Piscine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00AEEF]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
                className="pl-10 pr-10 h-12 border-[#00AEEF]/30 rounded-xl font-body"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-[#00AEEF]" /> : <Eye className="w-4 h-4 text-[#00AEEF]" />}
              </button>
            </div>
            <Button onClick={handleLogin} className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading">
              Accéder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Logo className="h-12" />
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle mesure
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden mb-6">
              <CardHeader className="pb-3 bg-[#00AEEF] text-white">
                <CardTitle className="text-lg font-heading">Nouvelles mesures</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">Date</label>
                    <Input
                      type="date"
                      value={formData.date_mesure}
                      onChange={(e) => setFormData({ ...formData, date_mesure: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Heure</label>
                    <Input
                      type="time"
                      value={formData.heure}
                      onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 flex items-center gap-1">
                      <FlaskConical className="w-4 h-4" /> Chlore (mg/L)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.chlore}
                      onChange={(e) => setFormData({ ...formData, chlore: e.target.value })}
                      placeholder="1.0 - 3.0"
                    />
                    <p className="text-xs text-slate-400 mt-1">Normal: 1-3 mg/L</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 flex items-center gap-1">
                      <Droplet className="w-4 h-4" /> pH
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.ph}
                      onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                      placeholder="7.2 - 7.6"
                    />
                    <p className="text-xs text-slate-400 mt-1">Normal: 7.2-7.6</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 flex items-center gap-1">
                      <Thermometer className="w-4 h-4" /> Temp. (°C)
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Technicien</label>
                  <Input
                    value={formData.technicien}
                    onChange={(e) => setFormData({ ...formData, technicien: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600">Observation</label>
                  <Textarea
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    placeholder="Remarques, actions effectuées..."
                    className="min-h-20"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-[#00AEEF] text-[#0077A8] rounded-xl font-heading"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.chlore || !formData.ph || !formData.temperature || createMutation.isPending}
                    className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Historique */}
        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="pb-3 bg-[#00AEEF]">
            <CardTitle className="text-lg font-heading text-white flex items-center gap-2">
              <Droplet className="w-5 h-5" />
              Historique des mesures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
              </div>
            ) : mesures.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Aucune mesure enregistrée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-slate-500">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Chlore</th>
                      <th className="pb-3">pH</th>
                      <th className="pb-3">Temp.</th>
                      <th className="pb-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesures.map((mesure) => (
                      <tr key={mesure.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 text-sm">
                          <div>{format(new Date(mesure.date_mesure), 'dd/MM/yyyy')}</div>
                          <div className="text-xs text-slate-400">{mesure.heure}</div>
                        </td>
                        <td className="py-3">
                          <span className={`font-medium ${isValueNormal('chlore', mesure.chlore) ? 'text-emerald-600' : 'text-red-600'}`}>
                            {mesure.chlore} mg/L
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-medium ${isValueNormal('ph', mesure.ph) ? 'text-emerald-600' : 'text-red-600'}`}>
                            {mesure.ph}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-medium ${isValueNormal('temperature', mesure.temperature) ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {mesure.temperature}°C
                          </span>
                        </td>
                        <td className="py-3">
                          {mesure.alerte ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Alerte
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              OK
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}