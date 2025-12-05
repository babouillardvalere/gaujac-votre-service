import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Search, Filter, Calendar, User, MapPin, Eye, EyeOff, Award, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function BureauAvis() {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filters, setFilters] = useState({
    nom: '',
    dateFrom: '',
    dateTo: '',
    hebergement: '',
    noteMin: '',
    noteMax: '',
    reactiviteMin: '',
    amabiliteMin: '',
    qualiteMin: ''
  });

  const { data: avis = [], isLoading } = useQuery({
    queryKey: ['bureau-avis'],
    queryFn: () => base44.entities.Avis.list('-created_date', 500)
  });

  const updateAvisMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Avis.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-avis'] });
      toast.success('Avis mis à jour');
    }
  });

  // Filtrage
  const filteredAvis = avis.filter(a => {
    if (filters.nom && !`${a.client_nom} ${a.client_prenom}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.hebergement && !a.logement_ou_emplacement?.toLowerCase().includes(filters.hebergement.toLowerCase())) return false;
    if (filters.dateFrom && a.created_date && new Date(a.created_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && a.created_date && new Date(a.created_date) > new Date(filters.dateTo + 'T23:59:59')) return false;
    if (filters.noteMin && a.note_globale < parseFloat(filters.noteMin)) return false;
    if (filters.noteMax && a.note_globale > parseFloat(filters.noteMax)) return false;
    if (filters.reactiviteMin && a.note_reactivite < parseInt(filters.reactiviteMin)) return false;
    if (filters.amabiliteMin && a.note_amabilite < parseInt(filters.amabiliteMin)) return false;
    if (filters.qualiteMin && a.note_intervention < parseInt(filters.qualiteMin)) return false;
    return true;
  });

  // Tri
  const sortedAvis = [...filteredAvis].sort((a, b) => {
    switch (sortBy) {
      case 'recent': return new Date(b.created_date) - new Date(a.created_date);
      case 'ancien': return new Date(a.created_date) - new Date(b.created_date);
      case 'meilleur': return b.note_globale - a.note_globale;
      case 'pire': return a.note_globale - b.note_globale;
      case 'reactivite': return b.note_reactivite - a.note_reactivite;
      case 'amabilite': return b.note_amabilite - a.note_amabilite;
      case 'qualite': return b.note_intervention - a.note_intervention;
      default: return 0;
    }
  });

  // Statistiques
  const totalAvis = avis.length;
  const moyenneGlobale = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_globale || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneReactivite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_reactivite || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneAmabilite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_amabilite || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneQualite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_intervention || 0), 0) / totalAvis).toFixed(2) : 0;

  // Distribution des notes
  const distributionGlobale = [1, 2, 3, 4, 5].map(n => ({
    name: `${n}⭐`,
    value: avis.filter(a => Math.round(a.note_globale) === n).length,
    note: n
  }));

  const distributionReactivite = [1, 2, 3, 4, 5].map(n => ({
    name: `${n}⭐`,
    value: avis.filter(a => a.note_reactivite === n).length,
    note: n
  }));

  const distributionAmabilite = [1, 2, 3, 4, 5].map(n => ({
    name: `${n}⭐`,
    value: avis.filter(a => a.note_amabilite === n).length,
    note: n
  }));

  const distributionQualite = [1, 2, 3, 4, 5].map(n => ({
    name: `${n}⭐`,
    value: avis.filter(a => a.note_intervention === n).length,
    note: n
  }));

  const toggleMisEnAvant = (avisItem) => {
    updateAvisMutation.mutate({
      id: avisItem.id,
      data: { mis_en_avant: !avisItem.mis_en_avant }
    });
  };

  const renderStars = (note) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= note ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className={`border-2 ${color} rounded-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color.replace('border', 'bg').replace('/30', '')} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-body text-gray-600">{title}</p>
            <p className="text-xl font-heading text-[#0077A8]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DistributionChart = ({ data, title, color }) => (
    <Card className="border-2 border-gray-200 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading text-[#0077A8]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total avis" value={totalAvis} icon={Star} color="border-[#00AEEF]" />
        <StatCard title="Note globale" value={`${moyenneGlobale}/5`} icon={Star} color="border-[#FFD700]" />
        <StatCard title="Réactivité" value={`${moyenneReactivite}/5`} icon={Star} color="border-[#FFA500]" />
        <StatCard title="Amabilité" value={`${moyenneAmabilite}/5`} icon={Star} color="border-green-500" />
        <StatCard title="Qualité" value={`${moyenneQualite}/5`} icon={Star} color="border-purple-500" />
      </div>

      {/* Graphiques */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DistributionChart data={distributionGlobale} title="⭐ Note globale" color="#FFD700" />
        <DistributionChart data={distributionReactivite} title="⚡ Réactivité" color="#FFA500" />
        <DistributionChart data={distributionAmabilite} title="😊 Amabilité" color="#22c55e" />
        <DistributionChart data={distributionQualite} title="✨ Qualité" color="#8b5cf6" />
      </div>

      {/* Filtres et tri */}
      <Card className="border-2 border-[#FFA500]/30 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Recherche & Filtres
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Nom client"
              value={filters.nom}
              onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
              className="border-[#FFA500]/30 rounded-xl"
            />
            <Input
              placeholder="N° hébergement"
              value={filters.hebergement}
              onChange={(e) => setFilters({ ...filters, hebergement: e.target.value })}
              className="border-[#FFA500]/30 rounded-xl"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="border-[#FFA500]/30 rounded-xl">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="ancien">Plus ancien</SelectItem>
                <SelectItem value="meilleur">Meilleure note</SelectItem>
                <SelectItem value="pire">Note la plus basse</SelectItem>
                <SelectItem value="reactivite">Par réactivité</SelectItem>
                <SelectItem value="amabilite">Par amabilité</SelectItem>
                <SelectItem value="qualite">Par qualité</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ nom: '', dateFrom: '', dateTo: '', hebergement: '', noteMin: '', noteMax: '', reactiviteMin: '', amabiliteMin: '', qualiteMin: '' })} className="rounded-xl">
              Réinitialiser
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t">
              <Input type="date" placeholder="Du" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
              <Input type="date" placeholder="Au" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
              <Select value={filters.reactiviteMin} onValueChange={(v) => setFilters({ ...filters, reactiviteMin: v })}>
                <SelectTrigger className="border-[#FFA500]/30 rounded-xl">
                  <SelectValue placeholder="Réactivité min" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Toutes</SelectItem>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥ {n}⭐</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.amabiliteMin} onValueChange={(v) => setFilters({ ...filters, amabiliteMin: v })}>
                <SelectTrigger className="border-[#FFA500]/30 rounded-xl">
                  <SelectValue placeholder="Amabilité min" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Toutes</SelectItem>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥ {n}⭐</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.qualiteMin} onValueChange={(v) => setFilters({ ...filters, qualiteMin: v })}>
                <SelectTrigger className="border-[#FFA500]/30 rounded-xl">
                  <SelectValue placeholder="Qualité min" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Toutes</SelectItem>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥ {n}⭐</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xs text-gray-500">{sortedAvis.length} avis trouvé(s)</p>
        </CardContent>
      </Card>

      {/* Liste des avis */}
      <div className="space-y-4">
        {sortedAvis.map(avisItem => (
          <Card key={avisItem.id} className={`border-2 rounded-xl ${avisItem.mis_en_avant ? 'border-[#FFD700] bg-[#FFD700]/5' : 'border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#00AEEF]" />
                    <span className="font-heading text-[#0077A8]">{avisItem.client_prenom} {avisItem.client_nom}</span>
                    {avisItem.mis_en_avant && <Badge className="bg-[#FFD700] text-[#0077A8]"><Award className="w-3 h-3 mr-1" />Mis en avant</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{avisItem.logement_ou_emplacement}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{avisItem.date_arrivee} → {avisItem.date_depart}</span>
                    {avisItem.created_date && <span>Publié le {format(new Date(avisItem.created_date), 'dd/MM/yyyy HH:mm')}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(Math.round(avisItem.note_globale))}
                    <span className="font-heading text-[#0077A8] ml-2">{avisItem.note_globale?.toFixed(1)}/5</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMisEnAvant(avisItem)}
                    className={avisItem.mis_en_avant ? 'text-[#FFD700]' : 'text-gray-400'}
                  >
                    <Award className="w-4 h-4 mr-1" />
                    {avisItem.mis_en_avant ? 'Retirer' : 'Mettre en avant'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">⚡ Réactivité</p>
                  {renderStars(avisItem.note_reactivite)}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">😊 Amabilité</p>
                  {renderStars(avisItem.note_amabilite)}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">✨ Qualité</p>
                  {renderStars(avisItem.note_intervention)}
                </div>
              </div>

              {avisItem.commentaire && (
                <div className="bg-white border rounded-lg p-3">
                  <p className="font-body text-gray-700 text-sm italic">"{avisItem.commentaire}"</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 text-xs">
                {avisItem.note_globale >= 4 ? (
                  <Badge className="bg-green-100 text-green-700"><Eye className="w-3 h-3 mr-1" />Visible publiquement</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700"><EyeOff className="w-3 h-3 mr-1" />Non visible (note {"<"} 4)</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}