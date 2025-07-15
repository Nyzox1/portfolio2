import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Github, 
  Save, 
  X, 
  Loader2,
  Star,
  Eye,
  EyeOff,
  Filter,
  Search
} from 'lucide-react';
import { supabase, Project } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const projectSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  image_url: z.string().url().optional().or(z.literal('')),
  tags: z.string(),
  category: z.string().min(1, 'La catégorie est requise'),
  live_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().min(0)
});

type ProjectFormData = z.infer<typeof projectSchema>;

const ProjectsManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      tags: '',
      category: '',
      live_url: '',
      github_url: '',
      is_featured: false,
      is_published: true,
      sort_order: 0
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      reset({
        title: project.title,
        description: project.description,
        image_url: project.image_url || '',
        tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
        category: project.category,
        live_url: project.live_url || '',
        github_url: project.github_url || '',
        is_featured: project.is_featured,
        is_published: project.is_published,
        sort_order: project.sort_order
      });
    } else {
      setEditingProject(null);
      reset({
        title: '',
        description: '',
        image_url: '',
        tags: '',
        category: '',
        live_url: '',
        github_url: '',
        is_featured: false,
        is_published: true,
        sort_order: projects.length
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
    reset();
  };

  const onSubmit = async (data: ProjectFormData) => {
    setSaving(true);
    try {
      const projectData = {
        ...data,
        image_url: data.image_url || null,
        live_url: data.live_url || null,
        github_url: data.github_url || null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        updated_at: new Date().toISOString()
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Le projet a été modifié avec succès.",
        });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Le projet a été créé avec succès.",
        });
      }

      await loadProjects();
      closeDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le projet.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le projet a été supprimé avec succès.",
      });

      await loadProjects();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet.",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_featured: !project.is_featured })
        .eq('id', project.id);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const togglePublished = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_published: !project.is_published })
        .eq('id', project.id);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || 
      (filter === 'published' && project.is_published) ||
      (filter === 'featured' && project.is_featured) ||
      (filter === 'draft' && !project.is_published);
    
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.category.toLowerCase().includes(searchTerm.toLowerCase());

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
          <h1 className="text-3xl font-bold text-white">Gestion des Projets</h1>
          <p className="text-gray-400">
            Gérez votre portfolio de projets
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'published', label: 'Publiés' },
                { key: 'featured', label: 'Vedettes' },
                { key: 'draft', label: 'Brouillons' }
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
            <CardContent className="p-0">
              {project.image_url && (
                <div className="relative">
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {project.is_featured && (
                      <Badge className="bg-yellow-500 text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Vedette
                      </Badge>
                    )}
                    {!project.is_published && (
                      <Badge variant="secondary">
                        Brouillon
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFeatured(project)}
                      className="text-gray-400 hover:text-yellow-400"
                    >
                      <Star className={`w-4 h-4 ${project.is_featured ? 'fill-current text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublished(project)}
                      className="text-gray-400 hover:text-green-400"
                    >
                      {project.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {Array.isArray(project.tags) && project.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {Array.isArray(project.tags) && project.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {project.live_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    {project.github_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(project)}
                      className="border-slate-600 text-gray-300 hover:text-white"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteProject(project)}
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <p className="text-gray-400 text-lg">
              {searchTerm || filter !== 'all' 
                ? 'Aucun projet ne correspond à vos critères.'
                : 'Aucun projet créé pour le moment.'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button
                onClick={() => openDialog()}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier projet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Modifiez les informations du projet' : 'Créez un nouveau projet pour votre portfolio'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Titre *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Mon Super Projet"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {errors.title && (
                  <p className="text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-300">Catégorie *</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="Web App"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {errors.category && (
                  <p className="text-sm text-red-400">{errors.category.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Description détaillée du projet..."
                rows={4}
                className="bg-slate-800 border-slate-600 text-white resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-gray-300">Image (URL)</Label>
              <Input
                id="image_url"
                {...register('image_url')}
                placeholder="https://example.com/image.jpg"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-gray-300">Technologies (séparées par des virgules)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="React, TypeScript, Node.js"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="live_url" className="text-gray-300">URL du site</Label>
                <Input
                  id="live_url"
                  {...register('live_url')}
                  placeholder="https://monprojet.com"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="github_url" className="text-gray-300">URL GitHub</Label>
                <Input
                  id="github_url"
                  {...register('github_url')}
                  placeholder="https://github.com/user/repo"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={watchedValues.is_featured}
                  onCheckedChange={(checked) => setValue('is_featured', checked)}
                />
                <Label htmlFor="is_featured" className="text-gray-300">
                  Projet vedette
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={watchedValues.is_published}
                  onCheckedChange={(checked) => setValue('is_published', checked)}
                />
                <Label htmlFor="is_published" className="text-gray-300">
                  Publié
                </Label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingProject ? 'Modifier' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManager;