import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Filter, Calendar, User, MapPin, Eye, EyeOff, Award, ChevronDown, ChevronUp, Loader2, Zap, Smile, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
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
    dateSejourFrom: '',
    dateSejourTo: '',
    hebergement: '',
    reactiviteMin: '',
    reactiviteMax: '',
    amabiliteMin: '',
    amabiliteMax: '',
    qualiteMin: '',
    qualiteMax: '',
    noteGlobaleMin: '',
    noteGlobaleMax: ''
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

  // Filtrage combiné
  const filteredAvis = avis.filter(a => {
    if (filters.nom && !`${a.client_nom} ${a.client_prenom}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.hebergement && !a.logement_ou_emplacement?.toLowerCase().includes(filters.hebergement.toLowerCase())) return false;
    
    // Dates de publication
    if (filters.dateFrom && a.created_date && new Date(a.created_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && a.created_date && new Date(a.created_date) > new Date(filters.dateTo + 'T23:59:59')) return false;
    
    // Dates de séjour
    if (filters.dateSejourFrom && a.date_arrivee && new Date(a.date_arrivee) < new Date(filters.dateSejourFrom)) return false;
    if (filters.dateSejourTo && a.date_depart && new Date(a.date_depart) > new Date(filters.dateSejourTo)) return false;
    
    // Notes avec min/max
    if (filters.reactiviteMin && a.note_reactivite < parseInt(filters.reactiviteMin)) return false;
    if (filters.reactiviteMax && a.note_reactivite > parseInt(filters.reactiviteMax)) return false;
    if (filters.amabiliteMin && a.note_amabilite < parseInt(filters.amabiliteMin)) return false;
    if (filters.amabiliteMax && a.note_amabilite > parseInt(filters.amabiliteMax)) return false;
    if (filters.qualiteMin && a.note_intervention < parseInt(filters.qualiteMin)) return false;
    if (filters.qualiteMax && a.note_intervention > parseInt(filters.qualiteMax)) return false;
    if (filters.noteGlobaleMin && a.note_globale < parseFloat(filters.noteGlobaleMin)) return false;
    if (filters.noteGlobaleMax && a.note_globale > parseFloat(filters.noteGlobaleMax)) return false;
    
    return true;
  });

  // Tri amélioré
  const sortedAvis = [...filteredAvis].sort((a, b) => {
    switch (sortBy) {
      case 'recent': return new Date(b.created_date) - new Date(a.created_date);
      case 'ancien': return new Date(a.created_date) - new Date(b.created_date);
      case 'meilleur': return b.note_globale - a.note_globale;
      case 'pire': return a.note_globale - b.note_globale;
      case 'reactivite_haute': return b.note_reactivite - a.note_reactivite;
      case 'reactivite_basse': return a.note_reactivite - b.note_reactivite;
      case 'amabilite_haute': return b.note_amabilite - a.note_amabilite;
      case 'amabilite_basse': return a.note_amabilite - b.note_amabilite;
      case 'qualite_haute': return b.note_intervention - a.note_intervention;
      case 'qualite_basse': return a.note_intervention - b.note_intervention;
      default: return 0;
    }
  });

  // Statistiques
  const totalAvis = avis.length;
  const moyenneGlobale = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_globale || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneReactivite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_reactivite || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneAmabilite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_amabilite || 0), 0) / totalAvis).toFixed(2) : 0;
  const moyenneQualite = totalAvis > 0 ? (avis.reduce((s, a) => s + (a.note_intervention || 0), 0) / totalAvis).toFixed(2) : 0;

  // Distribution des notes pour chaque catégorie
  const getDistribution = (field) => [1, 2, 3, 4, 5].map(n => ({
    name: `${n}⭐`,
    value: avis.filter(a => Math.round(a[field]) === n).length,
    note: n
  }));

  const distributionReactivite = getDistribution('note_reactivite');
  const distributionAmabilite = getDistribution('note_amabilite');
  const distributionQualite = getDistribution('note_intervention');

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

  const resetFilters = () => {
    setFilters({
      nom: '', dateFrom: '', dateTo: '', dateSejourFrom: '', dateSejourTo: '',
      hebergement: '', reactiviteMin: '', reactiviteMax: '', amabiliteMin: '',
      amabiliteMax: '', qualiteMin: '', qualiteMax: '', noteGlobaleMin: '', noteGlobaleMax: ''
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className={`border-2 ${color} rounded-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
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

  const DistributionChart = ({ data, title, color, icon: Icon, average }) => (
    <Card className="border-2 border-gray-200 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading text-[#0077A8] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </span>
          <Badge className="bg-[#FFD700] text-[#0077A8]">Moy: {average}/5</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1 text-center">
          {data.map((d, i) => (
            <div key={i} className="text-xs">
              <div className="font-heading text-[#0077A8]">{d.value}</div>
              <div className="text-gray-400">{d.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const NoteFilterSelect = ({ label, minValue, maxValue, onMinChange, onMaxChange }) => (
    <div className="space-y-1">
      <label className="text-xs font-body text-gray-500">{label}</label>
      <div className="flex gap-1">
        <Select value={minValue} onValueChange={onMinChange}>
          <SelectTrigger className="border-[#FFA500]/30 rounded-lg text-xs h-8">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>-</SelectItem>
            {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={maxValue} onValueChange={onMaxChange}>
          <SelectTrigger className="border-[#FFA500]/30 rounded-lg text-xs h-8">
            <SelectValue placeholder="Max" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>-</SelectItem>
            {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≤{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
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
        <StatCard title="Total avis" value={totalAvis} icon={Star} color="border-[#00AEEF]" bgColor="bg-[#00AEEF]" />
        <StatCard title="Note globale" value={`${moyenneGlobale}/5`} icon={Star} color="border-[#FFD700]" bgColor="bg-[#FFD700]" />
        <StatCard title="⚡ Réactivité" value={`${moyenneReactivite}/5`} icon={Zap} color="border-[#FFA500]" bgColor="bg-[#FFA500]" />
        <StatCard title="😊 Amabilité" value={`${moyenneAmabilite}/5`} icon={Smile} color="border-green-500" bgColor="bg-green-500" />
        <StatCard title="✨ Qualité" value={`${moyenneQualite}/5`} icon={Sparkles} color="border-purple-500" bgColor="bg-purple-500" />
      </div>

      {/* 3 Graphiques séparés */}
      <div className="grid md:grid-cols-3 gap-4">
        <DistributionChart
          data={distributionReactivite}
          title="⚡ Réactivité de l'intervention"
          color="#FFA500"
          icon={Zap}
          average={moyenneReactivite}
        />
        <DistributionChart
          data={distributionAmabilite}
          title="😊 Amabilité du collaborateur"
          color="#22c55e"
          icon={Smile}
          average={moyenneAmabilite}
        />
        <DistributionChart
          data={distributionQualite}
          title="✨ Qualité globale"
          color="#8b5cf6"
          icon={Sparkles}
          average={moyenneQualite}
        />
      </div>

      {/* Filtres et tri */}
      <Card className="border-2 border-[#FFA500]/30 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Recherche & Filtres combinés
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-gray-500">
                Réinitialiser
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-[#FFA500]">
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Avancé
              </Button>
            </div>
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
                <SelectItem value="meilleur">Meilleure note globale</SelectItem>
                <SelectItem value="pire">Note globale la plus basse</SelectItem>
                <SelectItem value="reactivite_haute">Réactivité ↑</SelectItem>
                <SelectItem value="reactivite_basse">Réactivité ↓</SelectItem>
                <SelectItem value="amabilite_haute">Amabilité ↑</SelectItem>
                <SelectItem value="amabilite_basse">Amabilité ↓</SelectItem>
                <SelectItem value="qualite_haute">Qualité ↑</SelectItem>
                <SelectItem value="qualite_basse">Qualité ↓</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 flex items-center">
              {sortedAvis.length} avis trouvé(s)
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-3 border-t border-gray-100">
              {/* Dates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-body text-gray-500">Date avis du</label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body text-gray-500">Date avis au</label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body text-gray-500">Séjour du</label>
                  <Input type="date" value={filters.dateSejourFrom} onChange={(e) => setFilters({ ...filters, dateSejourFrom: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body text-gray-500">Séjour au</label>
                  <Input type="date" value={filters.dateSejourTo} onChange={(e) => setFilters({ ...filters, dateSejourTo: e.target.value })} className="border-[#FFA500]/30 rounded-xl" />
                </div>
              </div>

              {/* Filtres par notes combinées */}
              <div className="bg-[#FFA500]/10 rounded-xl p-3">
                <label className="text-xs font-heading text-[#0077A8] mb-3 block">⭐ Filtrer par notes (combinable)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NoteFilterSelect
                    label="⚡ Réactivité"
                    minValue={filters.reactiviteMin}
                    maxValue={filters.reactiviteMax}
                    onMinChange={(v) => setFilters({ ...filters, reactiviteMin: v })}
                    onMaxChange={(v) => setFilters({ ...filters, reactiviteMax: v })}
                  />
                  <NoteFilterSelect
                    label="😊 Amabilité"
                    minValue={filters.amabiliteMin}
                    maxValue={filters.amabiliteMax}
                    onMinChange={(v) => setFilters({ ...filters, amabiliteMin: v })}
                    onMaxChange={(v) => setFilters({ ...filters, amabiliteMax: v })}
                  />
                  <NoteFilterSelect
                    label="✨ Qualité"
                    minValue={filters.qualiteMin}
                    maxValue={filters.qualiteMax}
                    onMinChange={(v) => setFilters({ ...filters, qualiteMin: v })}
                    onMaxChange={(v) => setFilters({ ...filters, qualiteMax: v })}
                  />
                  <NoteFilterSelect
                    label="🌟 Note globale"
                    minValue={filters.noteGlobaleMin}
                    maxValue={filters.noteGlobaleMax}
                    onMinChange={(v) => setFilters({ ...filters, noteGlobaleMin: v })}
                    onMaxChange={(v) => setFilters({ ...filters, noteGlobaleMax: v })}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste complète des avis */}
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
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{avisItem.logement_ou_emplacement}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Séjour: {avisItem.date_arrivee} → {avisItem.date_depart}</span>
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

              {/* Notes détaillées */}
              <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">⚡ Réactivité</p>
                  {renderStars(avisItem.note_reactivite)}
                  <p className="text-xs font-heading text-[#0077A8] mt-1">{avisItem.note_reactivite}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">😊 Amabilité</p>
                  {renderStars(avisItem.note_amabilite)}
                  <p className="text-xs font-heading text-[#0077A8] mt-1">{avisItem.note_amabilite}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">✨ Qualité</p>
                  {renderStars(avisItem.note_intervention)}
                  <p className="text-xs font-heading text-[#0077A8] mt-1">{avisItem.note_intervention}/5</p>
                </div>
              </div>

              {/* Commentaire complet */}
              {avisItem.commentaire && (
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">💬 Commentaire:</p>
                  <p className="font-body text-gray-700 text-sm">"{avisItem.commentaire}"</p>
                </div>
              )}

              {/* Statut visibilité */}
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