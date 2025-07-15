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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, RotateCcw, Loader2 } from 'lucide-react';
import { supabase, HeroSection } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { HeroGeometric } from '@/components/ui/hero-geometric';

const heroSchema = z.object({
  badge_text: z.string().min(1, 'Le texte du badge est requis'),
  title_line1: z.string().min(1, 'La première ligne du titre est requise'),
  title_line2: z.string().min(1, 'La deuxième ligne du titre est requise'),
  description: z.string().min(1, 'La description est requise'),
  background_image_url: z.string().url().optional().or(z.literal('')),
  cta_text: z.string().min(1, 'Le texte du bouton est requis'),
  cta_link: z.string().min(1, 'Le lien du bouton est requis'),
  is_active: z.boolean()
});

type HeroFormData = z.infer<typeof heroSchema>;

const HeroEditor = () => {
  const [heroData, setHeroData] = useState<HeroSection | null>(null);
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
    setValue
  } = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      badge_text: '',
      title_line1: '',
      title_line2: '',
      description: '',
      background_image_url: '',
      cta_text: '',
      cta_link: '',
      is_active: true
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const heroSection = data[0];
        setHeroData(heroSection);
        reset({
          badge_text: heroSection.badge_text,
          title_line1: heroSection.title_line1,
          title_line2: heroSection.title_line2,
          description: heroSection.description,
          background_image_url: heroSection.background_image_url || '',
          cta_text: heroSection.cta_text,
          cta_link: heroSection.cta_link,
          is_active: heroSection.is_active
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la section hero.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: HeroFormData) => {
    setSaving(true);
    try {
      if (heroData) {
        // Mise à jour
        const { error } = await supabase
          .from('hero_sections')
          .update({
            ...data,
            background_image_url: data.background_image_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', heroData.id);

        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('hero_sections')
          .insert([{
            ...data,
            background_image_url: data.background_image_url || null
          }]);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "La section hero a été sauvegardée avec succès.",
      });

      // Recharger les données
      await loadHeroData();
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

  const handleReset = () => {
    if (heroData) {
      reset({
        badge_text: heroData.badge_text,
        title_line1: heroData.title_line1,
        title_line2: heroData.title_line2,
        description: heroData.description,
        background_image_url: heroData.background_image_url || '',
        cta_text: heroData.cta_text,
        cta_link: heroData.cta_link,
        is_active: heroData.is_active
      });
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Section Hero</h1>
          <p className="text-gray-400">
            Gérez le contenu de la section principale de votre portfolio
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Éditer' : 'Aperçu'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Aperçu en temps réel</CardTitle>
            <CardDescription>
              Voici comment apparaîtra votre section hero sur le site
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-slate-950">
              <HeroGeometric
                badge={watchedValues.badge_text}
                title1={watchedValues.title_line1}
                title2={watchedValues.title_line2}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Edit Mode */
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="content" className="data-[state=active]:bg-slate-700">
              Contenu
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Paramètres
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="content" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Contenu Principal</CardTitle>
                  <CardDescription>
                    Modifiez les textes affichés dans la section hero
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="badge_text" className="text-gray-300">
                      Texte du Badge
                    </Label>
                    <Input
                      id="badge_text"
                      {...register('badge_text')}
                      placeholder="Portfolio Développeur"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {errors.badge_text && (
                      <p className="text-sm text-red-400">{errors.badge_text.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title_line1" className="text-gray-300">
                        Titre - Ligne 1
                      </Label>
                      <Input
                        id="title_line1"
                        {...register('title_line1')}
                        placeholder="Nyzox"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {errors.title_line1 && (
                        <p className="text-sm text-red-400">{errors.title_line1.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title_line2" className="text-gray-300">
                        Titre - Ligne 2
                      </Label>
                      <Input
                        id="title_line2"
                        {...register('title_line2')}
                        placeholder="Full-Stack & UI/UX Designer"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {errors.title_line2 && (
                        <p className="text-sm text-red-400">{errors.title_line2.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Crafting exceptional digital experiences through innovative design and cutting-edge technology."
                      rows={3}
                      className="bg-slate-700 border-slate-600 text-white resize-none"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-400">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cta_text" className="text-gray-300">
                        Texte du Bouton
                      </Label>
                      <Input
                        id="cta_text"
                        {...register('cta_text')}
                        placeholder="Travaillons ensemble"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {errors.cta_text && (
                        <p className="text-sm text-red-400">{errors.cta_text.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cta_link" className="text-gray-300">
                        Lien du Bouton
                      </Label>
                      <Input
                        id="cta_link"
                        {...register('cta_link')}
                        placeholder="#contact"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {errors.cta_link && (
                        <p className="text-sm text-red-400">{errors.cta_link.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Paramètres Avancés</CardTitle>
                  <CardDescription>
                    Configuration et options supplémentaires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="background_image_url" className="text-gray-300">
                      Image de Fond (URL)
                    </Label>
                    <Input
                      id="background_image_url"
                      {...register('background_image_url')}
                      placeholder="https://example.com/image.jpg"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {errors.background_image_url && (
                      <p className="text-sm text-red-400">{errors.background_image_url.message}</p>
                    )}
                  </div>

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

            {/* Actions */}
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
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>

              {isDirty && (
                <Alert className="w-auto bg-orange-500/10 border-orange-500/20">
                  <AlertDescription className="text-orange-400">
                    Vous avez des modifications non sauvegardées
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </Tabs>
      )}
    </div>
  );
};

export default HeroEditor;