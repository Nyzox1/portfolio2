import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  RotateCcw, 
  Loader2, 
  Settings, 
  Shield, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const systemSettingsSchema = z.object({
  global_signup_enabled: z.boolean(),
  email_verification_required: z.boolean(),
  password_min_length: z.number().min(6).max(50),
  max_login_attempts: z.number().min(3).max(20),
  session_timeout_hours: z.number().min(1).max(168), // 1 semaine max
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface SystemSetting {
  setting_key: string;
  setting_value: any;
  description: string;
  updated_at: string;
  updated_by?: string;
}

interface DashboardStats {
  active_users: number;
  suspended_users: number;
  new_users_30d: number;
  failed_logins_24h: number;
  active_sessions: number;
  signup_enabled: boolean;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { profile, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      global_signup_enabled: true,
      email_verification_required: true,
      password_min_length: 8,
      max_login_attempts: 5,
      session_timeout_hours: 24
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    if (isSuperAdmin) {
      loadSystemSettings();
      loadDashboardStats();
    }
  }, [isSuperAdmin]);

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);

      // Convertir en format de formulaire
      const formData: any = {};
      data?.forEach(setting => {
        let value = setting.setting_value;
        
        // Convertir les valeurs selon le type
        if (typeof value === 'string') {
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (!isNaN(Number(value))) value = Number(value);
        }
        
        formData[setting.setting_key] = value;
      });

      reset(formData);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres système.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const onSubmit = async (data: SystemSettingsFormData) => {
    setSaving(true);
    try {
      // Mettre à jour chaque paramètre
      for (const [key, value] of Object.entries(data)) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            setting_value: value,
            updated_at: new Date().toISOString(),
            updated_by: profile?.id
          })
          .eq('setting_key', key);

        if (error) throw error;
      }

      // Logger l'action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile?.id,
          action: 'system_settings_updated',
          resource_type: 'system_settings',
          new_values: data,
          metadata: { updated_settings: Object.keys(data) }
        });

      toast({
        title: "Succès",
        description: "Les paramètres système ont été mis à jour.",
      });

      await loadSystemSettings();
      await loadDashboardStats();
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
    const formData: any = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      if (typeof value === 'string') {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);
      }
      
      formData[setting.setting_key] = value;
    });

    reset(formData);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md bg-red-500/10 border-red-500/20">
          <Shield className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            Accès réservé aux super administrateurs uniquement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-white">Paramètres Système</h1>
        <p className="text-gray-400">
          Configuration globale et sécurité du système
        </p>
      </div>

      {/* Statistiques du système */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-white">{stats.active_users}</p>
                </div>
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Suspendus</p>
                  <p className="text-2xl font-bold text-white">{stats.suspended_users}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Nouveaux (30j)</p>
                  <p className="text-2xl font-bold text-white">{stats.new_users_30d}</p>
                </div>
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Échecs (24h)</p>
                  <p className="text-2xl font-bold text-white">{stats.failed_logins_24h}</p>
                </div>
                <Shield className="w-6 h-6 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sessions actives</p>
                  <p className="text-2xl font-bold text-white">{stats.active_sessions}</p>
                </div>
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Inscriptions</p>
                  <Badge variant={stats.signup_enabled ? "default" : "destructive"}>
                    {stats.signup_enabled ? "Activées" : "Désactivées"}
                  </Badge>
                </div>
                <CheckCircle className={`w-6 h-6 ${stats.signup_enabled ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="authentication" className="data-[state=active]:bg-slate-700">
            <Key className="w-4 h-4 mr-2" />
            Authentification
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-700">
            <Settings className="w-4 h-4 mr-2" />
            Système
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Paramètres de Sécurité</CardTitle>
                <CardDescription>
                  Configuration des règles de sécurité et d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password_min_length" className="text-gray-300">
                      Longueur minimale du mot de passe
                    </Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      min="6"
                      max="50"
                      {...register('password_min_length', { valueAsNumber: true })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {errors.password_min_length && (
                      <p className="text-sm text-red-400">{errors.password_min_length.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_login_attempts" className="text-gray-300">
                      Tentatives de connexion max
                    </Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      min="3"
                      max="20"
                      {...register('max_login_attempts', { valueAsNumber: true })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {errors.max_login_attempts && (
                      <p className="text-sm text-red-400">{errors.max_login_attempts.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_timeout_hours" className="text-gray-300">
                    Durée de session (heures)
                  </Label>
                  <Input
                    id="session_timeout_hours"
                    type="number"
                    min="1"
                    max="168"
                    {...register('session_timeout_hours', { valueAsNumber: true })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {errors.session_timeout_hours && (
                    <p className="text-sm text-red-400">{errors.session_timeout_hours.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Durée avant expiration automatique des sessions (1-168 heures)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contrôle des Inscriptions</CardTitle>
                <CardDescription>
                  Gérez qui peut créer un compte sur votre système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-gray-300 font-medium">
                      Autoriser les nouvelles inscriptions
                    </Label>
                    <p className="text-sm text-gray-400">
                      Permet aux nouveaux utilisateurs de créer un compte
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.global_signup_enabled}
                    onCheckedChange={(checked) => setValue('global_signup_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-gray-300 font-medium">
                      Vérification email obligatoire
                    </Label>
                    <p className="text-sm text-gray-400">
                      Exige la confirmation de l'email avant activation du compte
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.email_verification_required}
                    onCheckedChange={(checked) => setValue('email_verification_required', checked)}
                  />
                </div>

                {!watchedValues.global_signup_enabled && (
                  <Alert className="bg-orange-500/10 border-orange-500/20">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <AlertDescription className="text-orange-400">
                      Les inscriptions sont désactivées. Seuls les administrateurs peuvent créer de nouveaux comptes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Informations Système</CardTitle>
                <CardDescription>
                  État actuel et configuration du système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Version</h4>
                    <p className="text-gray-300">v1.0.0</p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Base de données</h4>
                    <p className="text-gray-300">PostgreSQL (Supabase)</p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Dernière mise à jour</h4>
                    <p className="text-gray-300">
                      {settings.find(s => s.setting_key === 'global_signup_enabled')?.updated_at ? 
                        new Date(settings.find(s => s.setting_key === 'global_signup_enabled')!.updated_at).toLocaleDateString('fr-FR') :
                        'Jamais'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Environnement</h4>
                    <p className="text-gray-300">Production</p>
                  </div>
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

            {isDirty && (
              <Alert className="w-auto bg-orange-500/10 border-orange-500/20">
                <AlertDescription className="text-orange-400">
                  Modifications non sauvegardées
                </AlertDescription>
              </Alert>
            )}
          </div>
        </form>
      </Tabs>
    </div>
  );
};

export default SystemSettings;