import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar } from 'lucide-react';
import { useTranslation } from '../translations';

export default function SuiviRechercheBar({ search, setSearch, filters, setFilters, onSearch }) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-4 mb-6">
      {/* Barre de recherche principale */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={lang === 'fr' ? 'Nom et prénom (obligatoire)' : 'Name and first name (required)'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-2 border-purple-300/50 rounded-xl"
          />
        </div>
        <Button
          onClick={onSearch}
          className="bg-[#00AEEF] hover:bg-[#0077A8] text-white px-6"
        >
          <Search className="w-4 h-4 mr-2" />
          {lang === 'fr' ? 'Rechercher' : 'Search'}
        </Button>
      </div>

      {/* Filtres par dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-heading text-purple-700 mb-1 block flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {lang === 'fr' ? 'Date d\'arrivée (obligatoire)' : 'Arrival date (required)'}
          </label>
          <Input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
            className="border-2 border-purple-300/50 rounded-xl"
            required
          />
        </div>
        <div>
          <label className="text-xs font-heading text-purple-700 mb-1 block flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {lang === 'fr' ? 'Date de départ (obligatoire)' : 'Departure date (required)'}
          </label>
          <Input
            type="date"
            value={filters.dateFin}
            onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
            className="border-2 border-purple-300/50 rounded-xl"
            required
          />
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-heading text-purple-700 mb-1 block flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {lang === 'fr' ? 'Statut' : 'Status'}
          </label>
          <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
            <SelectTrigger className="border-purple-300/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{lang === 'fr' ? 'Tous les statuts' : 'All statuses'}</SelectItem>
              <SelectItem value="en_attente">{lang === 'fr' ? '⏳ À traiter' : '⏳ To process'}</SelectItem>
              <SelectItem value="en_cours">{lang === 'fr' ? '🔵 En cours' : '🔵 In progress'}</SelectItem>
              <SelectItem value="termine">{lang === 'fr' ? '✅ Terminé' : '✅ Completed'}</SelectItem>
              <SelectItem value="non_requis">{lang === 'fr' ? '⚪ Non requis' : '⚪ Not required'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-heading text-purple-700 mb-1 block">
            {lang === 'fr' ? 'Service' : 'Department'}
          </label>
          <Select value={filters.service} onValueChange={(v) => setFilters({ ...filters, service: v })}>
            <SelectTrigger className="border-purple-300/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{lang === 'fr' ? 'Tous services' : 'All departments'}</SelectItem>
              <SelectItem value="technique">🔧 {lang === 'fr' ? 'Technique' : 'Technical'}</SelectItem>
              <SelectItem value="menage">🧹 {lang === 'fr' ? 'Ménage' : 'Housekeeping'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-heading text-purple-700 mb-1 block">
            {lang === 'fr' ? 'Type d\'objet' : 'Item type'}
          </label>
          <Select value={filters.typeObjet} onValueChange={(v) => setFilters({ ...filters, typeObjet: v })}>
            <SelectTrigger className="border-purple-300/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{lang === 'fr' ? 'Tous types' : 'All types'}</SelectItem>
              <SelectItem value="manquant">{lang === 'fr' ? '📦 Manquant' : '📦 Missing'}</SelectItem>
              <SelectItem value="casse">{lang === 'fr' ? '🔨 Cassé' : '🔨 Broken'}</SelectItem>
              <SelectItem value="sale">{lang === 'fr' ? '🧼 Sale' : '🧼 Dirty'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}