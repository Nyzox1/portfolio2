import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, RotateCcw, Loader2, Plus, Trash2, User, Award, Code, Palette } from 'lucide-react';
import { supabase, AboutSection } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const skillSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  level: z.number().min(0).max(100),
  category: z.string().min(1, 'La catégorie est requise')
});

const statSchema = z.object({
  label: z.string().min(1, 'Le label est requis'),
  value: z.string().min(1, 'La valeur est requise'),
  icon: z.string().optional()
});

const aboutSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  profile_image_url: z.string().url().optional().or(z.literal('')),
  skills: z.array(skillSchema),
  stats: z.array(statSchema),
  cv_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean()
});

type AboutFormData = z.infer<typeof aboutSchema>;

const AboutEditor = () => {
  const [aboutData, setAboutData] = useState<AboutSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    control
  } = useForm<AboutFormData>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      title: 'À propos de moi',
      description: '',
      profile_image_url: '',
      skills: [],
      stats: [],
      cv_url: '',
      is_active: true
    }
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'skills'
  });

  const { fields: statFields, append: appendStat, remove: removeStat } = useFieldArray({
    control,
    name: 'stats'
  });

  const watchedValues = watch();

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from('about_sections')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const aboutSection = data[0];
        setAboutData(aboutSection);
        reset({
          title: aboutSection.title,
          description: aboutSection.description,
          profile_image_url: aboutSection.profile_image_url || '',
          skills: aboutSection.skills || [],
          stats: aboutSection.stats || [],
          cv_url: aboutSection.cv_url || '',
          is_active: aboutSection.is_active
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la section à propos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AboutFormData) => {
    setSaving(true);
    try {
      if (aboutData) {
        const { error } = await supabase
          .from('about_sections')
          .update({
            ...data,
            profile_image_url: data.profile_image_url || null,
            cv_url: data.cv_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', aboutData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('about_sections')
          .insert([{
            ...data,
            profile_image_url: data.profile_image_url || null,
            cv_url: data.cv_url || null
          }]);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "La section à propos a été sauvegardée avec succès.",
      });

      await loadAboutData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    appendSkill({ name: '', level: 80, category: 'Frontend' });
  };

  const addStat = () => {
    appendStat({ label: '', value: '', icon: 'Award' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Section À propos</h1>
          <p className="text-gray-400">
            Gérez le contenu de votre présentation personnelle
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreviewMode(!previewMode)}
          className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
        >
          <Eye className="w-4 h-4 mr-2" />
          {previewMode ? 'Éditer' : 'Aperçu'}
        </Button>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="content" className="data-[state=active]:bg-slate-700">
            Contenu
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-slate-700">
            Compétences
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-slate-700">
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
            Paramètres
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="content" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Informations Principales</CardTitle>
                <CardDescription>
                  Modifiez votre présentation personnelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Titre de la section
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="À propos de moi"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Parlez de vous, votre parcours, vos passions..."
                    rows={6}
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-400">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile_image_url" className="text-gray-300">
                      Photo de profil (URL)
                    </Label>
                    <Input
                      id="profile_image_url"
                      {...register('profile_image_url')}
                      placeholder="https://example.com/photo.jpg"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cv_url" className="text-gray-300">
                      CV (URL)
                    </Label>
                    <Input
                      id="cv_url"
                      {...register('cv_url')}
                      placeholder="https://example.com/cv.pdf"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Compétences</CardTitle>
                    <CardDescription>
                      Gérez vos compétences techniques avec leur niveau
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addSkill}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillFields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4 p-4 bg-slate-700 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-gray-300">Nom</Label>
                      <Input
                        {...register(`skills.${index}.name`)}
                        placeholder="React"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label className="text-gray-300">Niveau</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...register(`skills.${index}.level`, { valueAsNumber: true })}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-gray-300">Catégorie</Label>
                      <Input
                        {...register(`skills.${index}.category`)}
                        placeholder="Frontend"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {skillFields.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    Aucune compétence ajoutée. Cliquez sur "Ajouter" pour commencer.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Statistiques</CardTitle>
                    <CardDescription>
                      Ajoutez des statistiques impressionnantes
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addStat}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {statFields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4 p-4 bg-slate-700 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-gray-300">Label</Label>
                      <Input
                        {...register(`stats.${index}.label`)}
                        placeholder="Projets réalisés"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label className="text-gray-300">Valeur</Label>
                      <Input
                        {...register(`stats.${index}.value`)}
                        placeholder="50+"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label className="text-gray-300">Icône</Label>
                      <Input
                        {...register(`stats.${index}.icon`)}
                        placeholder="Award"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStat(index)}
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {statFields.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    Aucune statistique ajoutée. Cliquez sur "Ajouter" pour commencer.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Paramètres</CardTitle>
                <CardDescription>
                  Configuration de la section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_active"
                    checked={watchedValues.is_active}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="text-gray-300">
                    Section active
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                type="submit"
                disabled={saving || !isDirty}
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
                    Sauvegarder
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty}
                className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </form>
      </Tabs>
    </div>
  );
};

export default AboutEditor;