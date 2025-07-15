import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RotateCcw, Loader2, Settings, Palette, Globe, Shield } from 'lucide-react';
import { supabase, SiteSettings } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const socialLinksSchema = z.object({
  github: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal(''))
});

const seoSettingsSchema = z.object({
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image: z.string().url().optional().or(z.literal(''))
});

const settingsSchema = z.object({
  site_title: z.string().min(1, 'Le titre du site est requis'),
  site_description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  favicon_url: z.string().url().optional().or(z.literal('')),
  primary_color: z.string().min(1, 'La couleur primaire est requise'),
  secondary_color: z.string().min(1, 'La couleur secondaire est requise'),
  social_links: socialLinksSchema,
  seo_settings: seoSettingsSchema
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const SettingsManager = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_title: '',
      site_description: '',
      logo_url: '',
      favicon_url: '',
      primary_color: '#8B5CF6',
      secondary_color: '#EC4899',
      social_links: {
        github: '',
        linkedin: '',
        twitter: '',
        instagram: '',
        email: ''
      },
      seo_settings: {
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
        og_image: ''
      }
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const settings = data[0];
        setSettings(settings);
        reset({
          site_title: settings.site_title,
          site_description: settings.site_description || '',
          logo_url: settings.logo_url || '',
          favicon_url: settings.favicon_url || '',
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          social_links: {
            github: settings.social_links?.github || '',
            linkedin: settings.social_links?.linkedin || '',
            twitter: settings.social_links?.twitter || '',
            instagram: settings.social_links?.instagram || '',
            email: settings.social_links?.email || ''
          },
          seo_settings: {
            meta_title: settings.seo_settings?.meta_title || '',
            meta_description: settings.seo_settings?.meta_description || '',
            meta_keywords: settings.seo_settings?.meta_keywords || '',
            og_title: settings.seo_settings?.og_title || '',
            og_description: settings.seo_settings?.og_description || '',
            og_image: settings.seo_settings?.og_image || ''
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const settingsData = {
        ...data,
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
        updated_at: new Date().toISOString()
      };

      if (settings) {
        const { error } = await supabase
          .from('site_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Les paramètres ont été sauvegardés avec succès.",
      });

      await loadSettings();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      reset({
        site_title: settings.site_title,
        site_description: settings.site_description || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        social_links: {
          github: settings.social_links?.github || '',
          linkedin: settings.social_links?.linkedin || '',
          twitter: settings.social_links?.twitter || '',
          instagram: settings.social_links?.instagram || '',
          email: settings.social_links?.email || ''
        },
        seo_settings: {
          meta_title: settings.seo_settings?.meta_title || '',
          meta_description: settings.seo_settings?.meta_description || '',
          meta_keywords: settings.seo_settings?.meta_keywords || '',
          og_title: settings.seo_settings?.og_title || '',
          og_description: settings.seo_settings?.og_description || '',
          og_image: settings.seo_settings?.og_image || ''
        }
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
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres du Site</h1>
        <p className="text-gray-400">
          Configurez les paramètres généraux de votre portfolio
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700">
            <Settings className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="design" className="data-[state=active]:bg-slate-700">
            <Palette className="w-4 h-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-slate-700">
            <Globe className="w-4 h-4 mr-2" />
            Réseaux Sociaux
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Informations Générales</CardTitle>
                <CardDescription>
                  Paramètres de base de votre site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site_title" className="text-gray-300">
                      Titre du site *
                    </Label>
                    <Input
                      id="site_title"
                      {...register('site_title')}
                      placeholder="Mon Portfolio"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {errors.site_title && (
                      <p className="text-sm text-red-400">{errors.site_title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url" className="text-gray-300">
                      Logo (URL)
                    </Label>
                    <Input
                      id="logo_url"
                      {...register('logo_url')}
                      placeholder="https://example.com/logo.png"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_description" className="text-gray-300">
                    Description du site
                  </Label>
                  <Textarea
                    id="site_description"
                    {...register('site_description')}
                    placeholder="Description de votre portfolio..."
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon_url" className="text-gray-300">
                    Favicon (URL)
                  </Label>
                  <Input
                    id="favicon_url"
                    {...register('favicon_url')}
                    placeholder="https://example.com/favicon.ico"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Couleurs du Thème</CardTitle>
                <CardDescription>
                  Personnalisez les couleurs de votre site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color" className="text-gray-300">
                      Couleur primaire *
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="primary_color"
                        type="color"
                        {...register('primary_color')}
                        className="w-16 h-10 bg-slate-700 border-slate-600 cursor-pointer"
                      />
                      <Input
                        {...register('primary_color')}
                        placeholder="#8B5CF6"
                        className="flex-1 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    {errors.primary_color && (
                      <p className="text-sm text-red-400">{errors.primary_color.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color" className="text-gray-300">
                      Couleur secondaire *
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="secondary_color"
                        type="color"
                        {...register('secondary_color')}
                        className="w-16 h-10 bg-slate-700 border-slate-600 cursor-pointer"
                      />
                      <Input
                        {...register('secondary_color')}
                        placeholder="#EC4899"
                        className="flex-1 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    {errors.secondary_color && (
                      <p className="text-sm text-red-400">{errors.secondary_color.message}</p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-6 bg-slate-700 rounded-lg">
                  <h3 className="text-white mb-4">Aperçu des couleurs</h3>
                  <div className="flex gap-4">
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: watchedValues.primary_color }}
                    >
                      Primaire
                    </div>
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: watchedValues.secondary_color }}
                    >
                      Secondaire
                    </div>
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ 
                        background: `linear-gradient(135deg, ${watchedValues.primary_color}, ${watchedValues.secondary_color})` 
                      }}
                    >
                      Gradient
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Réseaux Sociaux</CardTitle>
                <CardDescription>
                  Liens vers vos profils sur les réseaux sociaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-gray-300">
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      {...register('social_links.github')}
                      placeholder="https://github.com/username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-gray-300">
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      {...register('social_links.linkedin')}
                      placeholder="https://linkedin.com/in/username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-gray-300">
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      {...register('social_links.twitter')}
                      placeholder="https://twitter.com/username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-gray-300">
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      {...register('social_links.instagram')}
                      placeholder="https://instagram.com/username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email de contact
                    </Label>
                    <Input
                      id="email"
                      {...register('social_links.email')}
                      placeholder="contact@example.com"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Référencement SEO</CardTitle>
                <CardDescription>
                  Optimisez votre site pour les moteurs de recherche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="meta_title" className="text-gray-300">
                    Titre Meta
                  </Label>
                  <Input
                    id="meta_title"
                    {...register('seo_settings.meta_title')}
                    placeholder="Titre qui apparaît dans les résultats de recherche"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description" className="text-gray-300">
                    Description Meta
                  </Label>
                  <Textarea
                    id="meta_description"
                    {...register('seo_settings.meta_description')}
                    placeholder="Description qui apparaît dans les résultats de recherche"
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords" className="text-gray-300">
                    Mots-clés (séparés par des virgules)
                  </Label>
                  <Input
                    id="meta_keywords"
                    {...register('seo_settings.meta_keywords')}
                    placeholder="développeur, web, portfolio, react"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="og_title" className="text-gray-300">
                      Titre Open Graph
                    </Label>
                    <Input
                      id="og_title"
                      {...register('seo_settings.og_title')}
                      placeholder="Titre pour les réseaux sociaux"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="og_image" className="text-gray-300">
                      Image Open Graph (URL)
                    </Label>
                    <Input
                      id="og_image"
                      {...register('seo_settings.og_image')}
                      placeholder="https://example.com/og-image.jpg"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description" className="text-gray-300">
                    Description Open Graph
                  </Label>
                  <Textarea
                    id="og_description"
                    {...register('seo_settings.og_description')}
                    placeholder="Description pour les réseaux sociaux"
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                  />
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
                onClick={handleReset}
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

export default SettingsManager;