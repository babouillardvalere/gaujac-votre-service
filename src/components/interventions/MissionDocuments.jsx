import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye, Trash2, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TYPE_ICONS = {
  pdf: '📄',
  image: '🖼️',
  rapport: '📊',
  planning: '📅',
  checklist: '✅',
  autre: '📎'
};

export default function MissionDocuments({ missionId, documents = [], canAdd = true }) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newDoc, setNewDoc] = useState({
    nom_fichier: '',
    type_fichier: 'autre',
    description: '',
    file: null
  });

  const createDocMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.InterventionDocument.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      queryClient.invalidateQueries({ queryKey: ['mission-documents', missionId] });
      toast.success('Document ajouté à la mission');
      setShowAddDialog(false);
      resetForm();
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.InterventionDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      queryClient.invalidateQueries({ queryKey: ['mission-documents', missionId] });
      toast.success('Document supprimé');
    }
  });

  const resetForm = () => {
    setNewDoc({
      nom_fichier: '',
      type_fichier: 'autre',
      description: '',
      file: null
    });
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewDoc({
      ...newDoc,
      file: file,
      nom_fichier: file.name
    });
  };

  const handleUpload = async () => {
    if (!newDoc.file || !newDoc.nom_fichier) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: newDoc.file });
      
      const user = await base44.auth.me();
      
      await createDocMutation.mutateAsync({
        mission_id: missionId,
        nom_fichier: newDoc.nom_fichier,
        type_fichier: newDoc.type_fichier,
        url_fichier: file_url,
        taille: newDoc.file.size,
        description: newDoc.description,
        ajoute_par: user.email,
        visible_client: false
      });
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload du fichier');
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-purple-700 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents mission
            <Badge variant="outline">{documents.length}</Badge>
          </CardTitle>
          {canAdd && (
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucun document attaché
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{TYPE_ICONS[doc.type_fichier] || '📎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-purple-800 truncate">{doc.nom_fichier}</p>
                    {doc.description && (
                      <p className="text-xs text-gray-600">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.type_fichier}
                      </Badge>
                      {doc.taille && (
                        <span className="text-xs text-gray-500">
                          {(doc.taille / 1024).toFixed(1)} Ko
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(doc.url_fichier, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = doc.url_fichier;
                      a.download = doc.nom_fichier;
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canAdd && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Supprimer ce document ?')) {
                          deleteDocMutation.mutate(doc.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-purple-700">
                <Upload className="w-5 h-5 inline mr-2" />
                Ajouter un document à la mission
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Fichier *
                </label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type de document *
                </label>
                <Select value={newDoc.type_fichier} onValueChange={(v) => setNewDoc({...newDoc, type_fichier: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                    <SelectItem value="image">🖼️ Image</SelectItem>
                    <SelectItem value="rapport">📊 Rapport</SelectItem>
                    <SelectItem value="planning">📅 Planning</SelectItem>
                    <SelectItem value="checklist">✅ Checklist</SelectItem>
                    <SelectItem value="autre">📎 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                  placeholder="Description du document..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                  className="flex-1"
                  disabled={uploading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !newDoc.file}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Upload...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}