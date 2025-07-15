import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  Image, 
  File, 
  Trash2, 
  Copy, 
  Download, 
  Search,
  Filter,
  Loader2,
  Check,
  X,
  Eye,
  Edit
} from 'lucide-react';
import { supabase, MediaFile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const MediaManager = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [editForm, setEditForm] = useState({ alt_text: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers médias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // Validation du fichier
        if (file.size > 10 * 1024 * 1024) { // 10MB max
          toast({
            title: "Erreur",
            description: `Le fichier ${file.name} est trop volumineux (max 10MB).`,
            variant: "destructive",
          });
          continue;
        }

        // Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          toast({
            title: "Erreur",
            description: `Impossible d'uploader ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-media')
          .getPublicUrl(filePath);

        // Sauvegarder les métadonnées en base
        const mediaData = {
          filename: fileName,
          original_filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          width: null,
          height: null,
          alt_text: '',
          description: '',
          tags: [],
          is_optimized: false
        };

        // Si c'est une image, obtenir les dimensions
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = async () => {
            mediaData.width = img.width;
            mediaData.height = img.height;
            
            const { error: dbError } = await supabase
              .from('media_files')
              .insert([mediaData]);

            if (dbError) {
              console.error('Erreur DB:', dbError);
            }
          };
          img.src = URL.createObjectURL(file);
        } else {
          const { error: dbError } = await supabase
            .from('media_files')
            .insert([mediaData]);

          if (dbError) {
            console.error('Erreur DB:', dbError);
          }
        }
      }

      toast({
        title: "Succès",
        description: "Fichiers uploadés avec succès.",
      });

      await loadMediaFiles();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload des fichiers.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteFile = async (file: MediaFile) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${file.original_filename} ?`)) {
      return;
    }

    try {
      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from('portfolio-media')
        .remove([file.file_path]);

      if (storageError) {
        console.error('Erreur suppression storage:', storageError);
      }

      // Supprimer de la base
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Fichier supprimé avec succès.",
      });

      await loadMediaFiles();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier.",
        variant: "destructive",
      });
    }
  };

  const copyUrl = async (file: MediaFile) => {
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(file.file_path);

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Succès",
        description: "URL copiée dans le presse-papiers.",
      });
    } catch (error) {
      console.error('Erreur copie:', error);
      toast({
        title: "Erreur",
        description: "Impossible de copier l'URL.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (file: MediaFile) => {
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(file.file_path);

    const link = document.createElement('a');
    link.href = publicUrl;
    link.download = file.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (file: MediaFile) => {
    setEditingFile(file);
    setEditForm({
      alt_text: file.alt_text || '',
      description: file.description || ''
    });
  };

  const saveEdit = async () => {
    if (!editingFile) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({
          alt_text: editForm.alt_text,
          description: editForm.description
        })
        .eq('id', editingFile.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Métadonnées mises à jour.",
      });

      setEditingFile(null);
      await loadMediaFiles();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les métadonnées.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return File;
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesFilter = filter === 'all' || 
      (filter === 'images' && file.mime_type.startsWith('image/')) ||
      (filter === 'documents' && !file.mime_type.startsWith('image/'));
    
    const matchesSearch = 
      file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.alt_text && file.alt_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestionnaire de Médias</h1>
          <p className="text-gray-400">
            Gérez vos images et fichiers
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher des fichiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'images', label: 'Images' },
                { key: 'documents', label: 'Documents' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption.key)}
                  className={filter === filterOption.key 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                    : "border-slate-700 text-gray-300 hover:text-white hover:bg-slate-700"
                  }
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('portfolio-media')
            .getPublicUrl(file.file_path);
          
          const FileIcon = getFileIcon(file.mime_type);

          return (
            <Card 
              key={file.id} 
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedFile(file);
                setIsDialogOpen(true);
              }}
            >
              <CardContent className="p-0">
                <div className="aspect-square bg-slate-700 rounded-t-lg overflow-hidden">
                  {file.mime_type.startsWith('image/') ? (
                    <img 
                      src={publicUrl} 
                      alt={file.alt_text || file.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-medium truncate mb-2">
                    {file.original_filename}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{formatFileSize(file.file_size)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.mime_type.split('/')[0]}
                    </Badge>
                  </div>
                  
                  {file.width && file.height && (
                    <p className="text-xs text-gray-500 mt-1">
                      {file.width} × {file.height}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFiles.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Aucun fichier ne correspond à vos critères.'
                : 'Aucun fichier uploadé pour le moment.'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Uploader vos premiers fichiers
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedFile.original_filename}
                </DialogTitle>
                <DialogDescription>
                  Détails et actions pour ce fichier
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                    {selectedFile.mime_type.startsWith('image/') ? (
                      <img 
                        src={supabase.storage.from('portfolio-media').getPublicUrl(selectedFile.file_path).data.publicUrl} 
                        alt={selectedFile.alt_text || selectedFile.original_filename}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(selectedFile)}
                      className="flex-1 border-slate-700 text-gray-300 hover:text-white"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(selectedFile)}
                      className="flex-1 border-slate-700 text-gray-300 hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
                
                {/* Details and Edit */}
                <div className="space-y-6">
                  {/* File Info */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Taille</p>
                          <p className="text-white">{formatFileSize(selectedFile.file_size)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Type</p>
                          <p className="text-white">{selectedFile.mime_type}</p>
                        </div>
                        {selectedFile.width && selectedFile.height && (
                          <>
                            <div>
                              <p className="text-gray-400">Largeur</p>
                              <p className="text-white">{selectedFile.width}px</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Hauteur</p>
                              <p className="text-white">{selectedFile.height}px</p>
                            </div>
                          </>
                        )}
                        <div className="col-span-2">
                          <p className="text-gray-400">Uploadé le</p>
                          <p className="text-white">
                            {new Date(selectedFile.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Metadata Edit */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Métadonnées</CardTitle>
                        {editingFile?.id === selectedFile.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFile(null)}
                              className="border-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(selectedFile)}
                            className="border-slate-600 text-gray-300 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingFile?.id === selectedFile.id ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Texte alternatif</Label>
                            <Input
                              value={editForm.alt_text}
                              onChange={(e) => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
                              placeholder="Description de l'image pour l'accessibilité"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Description</Label>
                            <Textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Description détaillée du fichier"
                              rows={3}
                              className="bg-slate-700 border-slate-600 text-white resize-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Texte alternatif</p>
                            <p className="text-white">
                              {selectedFile.alt_text || <span className="text-gray-500 italic">Non défini</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Description</p>
                            <p className="text-white">
                              {selectedFile.description || <span className="text-gray-500 italic">Non définie</span>}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Danger Zone */}
                  <Card className="bg-slate-800 border-red-500/20">
                    <CardHeader>
                      <CardTitle className="text-red-400 text-lg">Zone de danger</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => deleteFile(selectedFile)}
                        variant="outline"
                        className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer définitivement
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaManager;