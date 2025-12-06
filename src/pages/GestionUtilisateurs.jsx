import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UserCog, Shield, Mail, Calendar, Edit, Save, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const ROLES_CONFIG = {
  admin: {
    label_fr: 'Administrateur',
    label_en: 'Administrator',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '👑',
    permissions: [
      { key: 'bureau', label_fr: 'Accès Bureau', label_en: 'Office Access' },
      { key: 'reception', label_fr: 'Accès Réception', label_en: 'Reception Access' },
      { key: 'technique', label_fr: 'Accès Technique', label_en: 'Technical Access' },
      { key: 'menage', label_fr: 'Accès Ménage', label_en: 'Housekeeping Access' },
      { key: 'gestion_users', label_fr: 'Gestion utilisateurs', label_en: 'User Management' },
      { key: 'statistiques', label_fr: 'Statistiques', label_en: 'Statistics' },
    ]
  },
  reception: {
    label_fr: 'Réceptionniste',
    label_en: 'Receptionist',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '🎫',
    permissions: [
      { key: 'reception', label_fr: 'Accès Réception', label_en: 'Reception Access' },
      { key: 'arrivees', label_fr: 'Gestion Arrivées', label_en: 'Arrivals Management' },
      { key: 'departs', label_fr: 'Gestion Départs', label_en: 'Departures Management' },
      { key: 'assistance', label_fr: 'Assistance Clients', label_en: 'Guest Assistance' },
    ]
  },
  technicien: {
    label_fr: 'Technicien',
    label_en: 'Technician',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🔧',
    permissions: [
      { key: 'technique', label_fr: 'Interventions Techniques', label_en: 'Technical Interventions' },
      { key: 'materiel', label_fr: 'Gestion Matériel', label_en: 'Equipment Management' },
      { key: 'attente', label_fr: 'Interventions en attente', label_en: 'Pending Interventions' },
    ]
  },
  menage: {
    label_fr: 'Personnel Ménage',
    label_en: 'Housekeeping Staff',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '🧹',
    permissions: [
      { key: 'menage', label_fr: 'Interventions Ménage', label_en: 'Cleaning Interventions' },
      { key: 'materiel', label_fr: 'Gestion Matériel', label_en: 'Equipment Management' },
    ]
  },
  user: {
    label_fr: 'Utilisateur',
    label_en: 'User',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '👤',
    permissions: []
  }
};

export default function GestionUtilisateurs() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', full_name: '' });

  // Vérifier que l'utilisateur connecté est admin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEditingUser(null);
      toast.success(lang === 'fr' ? 'Utilisateur mis à jour' : 'User updated');
    },
    onError: () => {
      toast.error(lang === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
    }
  });

  const filteredUsers = searchQuery.trim()
    ? users.filter(u => {
        const query = searchQuery.toLowerCase();
        return u.full_name?.toLowerCase().includes(query) ||
               u.email?.toLowerCase().includes(query) ||
               u.role?.toLowerCase().includes(query);
      })
    : users;

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({ role: user.role || 'user', full_name: user.full_name || '' });
  };

  const handleSave = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      data: editForm
    });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full border-2 border-red-300">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="font-heading text-2xl text-red-800 mb-2">
              {lang === 'fr' ? 'Accès refusé' : 'Access denied'}
            </h2>
            <p className="text-gray-600 mb-4">
              {lang === 'fr'
                ? 'Seuls les administrateurs peuvent accéder à cette page.'
                : 'Only administrators can access this page.'}
            </p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(createPageUrl('Bureau'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{lang === 'fr' ? 'Retour' : 'Back'}</span>
            </button>
          </div>

          <Logo className="h-16 mb-6" />

          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              <UserCog className="w-12 h-12 inline-block mr-2" />
              {lang === 'fr' ? 'Gestion des Utilisateurs' : 'User Management'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Attribution des rôles et permissions' : 'Role and permission assignment'}
            </p>
          </div>

          {/* Barre de recherche */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par nom, email ou rôle...' : 'Search by name, email or role...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-[#00AEEF] rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Légende des rôles */}
          <Card className="border-2 border-gray-200 rounded-xl mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-[#0077A8]">
                {lang === 'fr' ? '📋 Rôles disponibles' : '📋 Available roles'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ROLES_CONFIG).map(([roleKey, roleData]) => (
                  <div key={roleKey} className={`p-4 rounded-lg border-2 ${roleData.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{roleData.icon}</span>
                      <span className="font-heading text-lg">
                        {lang === 'fr' ? roleData.label_fr : roleData.label_en}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {roleData.permissions.map(perm => (
                        <p key={perm.key} className="text-xs flex items-center gap-1">
                          <span className="text-green-600">✓</span>
                          {lang === 'fr' ? perm.label_fr : perm.label_en}
                        </p>
                      ))}
                      {roleData.permissions.length === 0 && (
                        <p className="text-xs text-gray-500">
                          {lang === 'fr' ? 'Accès limité' : 'Limited access'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liste des utilisateurs */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
            <CardHeader>
              <CardTitle className="font-heading text-[#0077A8]">
                {lang === 'fr' ? '👥 Utilisateurs' : '👥 Users'} ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {lang === 'fr' ? 'Aucun utilisateur trouvé' : 'No user found'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(user => {
                    const roleData = ROLES_CONFIG[user.role] || ROLES_CONFIG.user;
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-[#00AEEF] transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{roleData.icon}</span>
                            <div>
                              <p className="font-heading text-lg text-gray-900">{user.full_name || user.email}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${roleData.color} border`}>
                              {lang === 'fr' ? roleData.label_fr : roleData.label_en}
                            </Badge>
                            {user.created_date && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(user.created_date).toLocaleDateString(lang)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleEdit(user)}
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Modifier' : 'Edit'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog d'édition */}
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-[#0077A8]">
                  {lang === 'fr' ? 'Modifier l\'utilisateur' : 'Edit user'}
                </DialogTitle>
              </DialogHeader>

              {editingUser && (
                <div className="space-y-6 py-4">
                  <div>
                    <Label className="font-heading text-gray-700 mb-2 block">
                      {lang === 'fr' ? 'Email' : 'Email'}
                    </Label>
                    <Input
                      value={editingUser.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'fr' ? 'L\'email ne peut pas être modifié' : 'Email cannot be changed'}
                    </p>
                  </div>

                  <div>
                    <Label className="font-heading text-gray-700 mb-2 block">
                      {lang === 'fr' ? 'Nom complet' : 'Full name'}
                    </Label>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder={lang === 'fr' ? 'Nom complet' : 'Full name'}
                      className="border-2 border-gray-200 focus:border-[#00AEEF]"
                    />
                  </div>

                  <div>
                    <Label className="font-heading text-gray-700 mb-2 block">
                      {lang === 'fr' ? 'Rôle' : 'Role'}
                    </Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-[#00AEEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES_CONFIG).map(([roleKey, roleData]) => (
                          <SelectItem key={roleKey} value={roleKey}>
                            <div className="flex items-center gap-2">
                              <span>{roleData.icon}</span>
                              <span>{lang === 'fr' ? roleData.label_fr : roleData.label_en}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aperçu des permissions */}
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="font-heading text-sm text-gray-700 mb-3">
                      {lang === 'fr' ? '🔐 Permissions accordées :' : '🔐 Granted permissions:'}
                    </p>
                    <div className="space-y-1">
                      {ROLES_CONFIG[editForm.role]?.permissions.map(perm => (
                        <p key={perm.key} className="text-sm flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {lang === 'fr' ? perm.label_fr : perm.label_en}
                        </p>
                      ))}
                      {(!ROLES_CONFIG[editForm.role]?.permissions || ROLES_CONFIG[editForm.role].permissions.length === 0) && (
                        <p className="text-sm text-gray-500">
                          {lang === 'fr' ? 'Aucune permission spécifique' : 'No specific permissions'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#00AEEF] hover:bg-[#0077A8]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}