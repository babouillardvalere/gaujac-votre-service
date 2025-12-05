import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Camera, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoManagerReception({ 
  numeroLogement, 
  onPhotosSelected, 
  selectedPhotos = [],
  lang = 'fr'
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Récupérer les photos disponibles des interventions récentes
  const { data: interventions = [] } = useQuery({
    queryKey: ['interventions-photos', numeroLogement],
    queryFn: async () => {
      const allInterventions = await base44.entities.Incident.list();
      return allInterventions.filter(i => 
        (i.logement === numeroLogement || i.emplacement === numeroLogement) &&
        (i.photo_avant_url || i.photo_apres_url || i.photo_url)
      );
    },
    enabled: !!numeroLogement
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhoto = {
        url: file_url,
        source: 'upload',
        timestamp: new Date().toISOString(),
        description: 'Photo importée par réception'
      };
      onPhotosSelected([...selectedPhotos, newPhoto]);
      toast.success(lang === 'fr' ? '✅ Photo ajoutée' : '✅ Photo added');
      setDialogOpen(false);
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPhoto = (photoUrl, source, description) => {
    const newPhoto = {
      url: photoUrl,
      source,
      timestamp: new Date().toISOString(),
      description
    };
    onPhotosSelected([...selectedPhotos, newPhoto]);
    toast.success(lang === 'fr' ? '✅ Photo sélectionnée' : '✅ Photo selected');
  };

  const handleRemovePhoto = (index) => {
    const updated = selectedPhotos.filter((_, i) => i !== index);
    onPhotosSelected(updated);
  };

  const photosMenage = interventions.filter(i => i.type === 'menage');
  const photosTechnique = interventions.filter(i => i.type === 'technique');

  return (
    <div className="space-y-4">
      {/* Photos sélectionnées */}
      {selectedPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {selectedPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img 
                src={photo.url} 
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
              />
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <Badge className="absolute bottom-1 left-1 text-xs bg-white/90 text-gray-800">
                {photo.source === 'menage' ? '🧹' : photo.source === 'technique' ? '🔧' : '📤'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-12 border-2 border-dashed border-gray-300">
            <ImageIcon className="w-5 h-5 mr-2" />
            {lang === 'fr' 
              ? `📸 Ajouter des photos ${selectedPhotos.length > 0 ? `(${selectedPhotos.length})` : ''}`
              : `📸 Add photos ${selectedPhotos.length > 0 ? `(${selectedPhotos.length})` : ''}`
            }
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === 'fr' ? '📸 Ajouter des photos' : '📸 Add photos'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">
                <Upload className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Importer' : 'Import'}
              </TabsTrigger>
              <TabsTrigger value="menage">
                <span className="mr-2">🧹</span>
                {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
              </TabsTrigger>
              <TabsTrigger value="technique">
                <span className="mr-2">🔧</span>
                {lang === 'fr' ? 'Technique' : 'Technical'}
              </TabsTrigger>
            </TabsList>

            {/* Import direct */}
            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {lang === 'fr' 
                      ? 'Importez une photo envoyée par WhatsApp, email, ou toute autre source'
                      : 'Import a photo sent by WhatsApp, email, or any other source'
                    }
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-5 h-5 mr-2" />
                        {uploading 
                          ? (lang === 'fr' ? 'Upload...' : 'Uploading...') 
                          : (lang === 'fr' ? 'Choisir un fichier' : 'Choose file')
                        }
                      </span>
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos ménage */}
            <TabsContent value="menage" className="space-y-4">
              {photosMenage.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    {lang === 'fr' 
                      ? 'Aucune photo du ménage disponible pour ce locatif'
                      : 'No housekeeping photos available for this accommodation'
                    }
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photosMenage.map(intervention => (
                    <React.Fragment key={intervention.id}>
                      {intervention.photo_avant_url && (
                        <Card 
                          className="cursor-pointer hover:border-green-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_avant_url, 
                            'menage',
                            `Ménage - Avant intervention - ${new Date(intervention.photo_avant_timestamp || intervention.created_date).toLocaleDateString()}`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_avant_url} 
                              alt="Ménage avant"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              Avant - {new Date(intervention.photo_avant_timestamp || intervention.created_date).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {intervention.photo_apres_url && (
                        <Card 
                          className="cursor-pointer hover:border-green-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_apres_url, 
                            'menage',
                            `Ménage - Après intervention - ${new Date(intervention.photo_apres_timestamp || intervention.date_resolution).toLocaleDateString()}`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_apres_url} 
                              alt="Ménage après"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              Après - {new Date(intervention.photo_apres_timestamp || intervention.date_resolution).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {intervention.photo_url && (
                        <Card 
                          className="cursor-pointer hover:border-green-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_url, 
                            'menage',
                            `Ménage - ${intervention.description || 'Photo'}`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_url} 
                              alt="Ménage"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              {new Date(intervention.created_date).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Photos technique */}
            <TabsContent value="technique" className="space-y-4">
              {photosTechnique.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    {lang === 'fr' 
                      ? 'Aucune photo technique disponible pour ce locatif'
                      : 'No technical photos available for this accommodation'
                    }
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photosTechnique.map(intervention => (
                    <React.Fragment key={intervention.id}>
                      {intervention.photo_avant_url && (
                        <Card 
                          className="cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_avant_url, 
                            'technique',
                            `Technique - ${intervention.categorie} - Avant`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_avant_url} 
                              alt="Technique avant"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              {intervention.categorie} - Avant
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {intervention.photo_apres_url && (
                        <Card 
                          className="cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_apres_url, 
                            'technique',
                            `Technique - ${intervention.categorie} - Après`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_apres_url} 
                              alt="Technique après"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              {intervention.categorie} - Après
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {intervention.photo_url && (
                        <Card 
                          className="cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => handleSelectPhoto(
                            intervention.photo_url, 
                            'technique',
                            `Technique - ${intervention.categorie}`
                          )}
                        >
                          <CardContent className="p-2">
                            <img 
                              src={intervention.photo_url} 
                              alt="Technique"
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-center mt-1">
                              {intervention.categorie}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Alerte si aucune photo */}
      {selectedPhotos.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              💡 {lang === 'fr' 
                ? 'Aucune photo n\'est obligatoire. Vous pouvez valider sans photos.'
                : 'No photo is required. You can validate without photos.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}