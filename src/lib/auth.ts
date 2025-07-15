/**
 * Service d'authentification simplifié et robuste
 */

import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  email_verified: boolean;
  last_login_at?: string;
  login_attempts: number;
  locked_until?: string;
  preferences: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  global_signup_enabled: boolean;
  email_verification_required: boolean;
  password_min_length: number;
  max_login_attempts: number;
  session_timeout_hours: number;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private currentProfile: UserProfile | null = null;
  private settings: SystemSettings | null = null;
  private initialized = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialise le service d'authentification
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // console.log('🔄 Initialisation AuthService...');
      
      // Récupérer la session actuelle
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // console.warn('⚠️ Erreur getSession:', error.message);
        // Ne pas bloquer l'initialisation pour cette erreur
      }

      if (session?.user) {
        // console.log('👤 Session trouvée, chargement du profil...');
        this.currentUser = session.user;
        await this.loadUserProfile(session.user.id);
      } else {
        // console.log('👤 Aucune session active');
      }

      // Charger les paramètres système
      await this.loadSystemSettings();

      this.initialized = true;
      // console.log('✅ AuthService initialisé');
    } catch (error) {
      // console.error('❌ Erreur initialisation AuthService:', error);
      this.initialized = true; // Marquer comme initialisé même en cas d'erreur
    }
  }

  /**
   * Charge le profil utilisateur
   */
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      // console.log('📊 Chargement profil pour:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // console.warn('⚠️ Erreur chargement profil:', error.message);
        
        // Si le profil n'existe pas, le créer
        if (error.code === 'PGRST116') {
          // console.log('🔧 Création du profil manquant...');
          await this.createMissingProfile(userId);
          return;
        }
        
        this.currentProfile = null;
        return;
      }

      this.currentProfile = profile;
      // console.log('✅ Profil chargé:', profile.role, profile.status);
    } catch (error) {
      // console.warn('⚠️ Erreur loadUserProfile:', error);
      this.currentProfile = null;
    }
  }

  /**
   * Crée un profil manquant
   */
  private async createMissingProfile(userId: string): Promise<void> {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const profileData = {
        id: userId,
        role: 'user' as const,
        status: 'active' as const,
        email_verified: true,
        login_attempts: 0,
        preferences: {},
        metadata: {}
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        // console.error('❌ Erreur création profil:', error);
        return;
      }

      this.currentProfile = data;
      // console.log('✅ Profil créé:', data.role);
    } catch (error) {
      // console.error('❌ Erreur createMissingProfile:', error);
    }
  }

  /**
   * Charge les paramètres système
   */
  private async loadSystemSettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) {
        // console.warn('⚠️ Erreur paramètres système:', error.message);
        this.setDefaultSettings();
        return;
      }

      const settings: any = {};
      data?.forEach(setting => {
        const value = setting.setting_value;
        
        // Conversion des types
        if (value === 'true') settings[setting.setting_key] = true;
        else if (value === 'false') settings[setting.setting_key] = false;
        else if (!isNaN(Number(value))) settings[setting.setting_key] = Number(value);
        else settings[setting.setting_key] = value;
      });

      this.settings = {
        global_signup_enabled: settings.global_signup_enabled ?? true,
        email_verification_required: settings.email_verification_required ?? false,
        password_min_length: settings.password_min_length ?? 8,
        max_login_attempts: settings.max_login_attempts ?? 5,
        session_timeout_hours: settings.session_timeout_hours ?? 24
      };

      // console.log('⚙️ Paramètres système chargés');
    } catch (error) {
      // console.warn('⚠️ Erreur loadSystemSettings:', error);
      this.setDefaultSettings();
    }
  }

  private setDefaultSettings(): void {
    this.settings = {
      global_signup_enabled: true,
      email_verification_required: false,
      password_min_length: 8,
      max_login_attempts: 5,
      session_timeout_hours: 24
    };
  }

  /**
   * Connexion
   */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }> {
    try {
      // console.log('🔑 Tentative connexion:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // console.error('❌ Erreur connexion:', error.message);
        await this.logLoginAttempt(email, false, error.message);
        return { user: null, session: null, error };
      }

      if (data.user) {
        // console.log('✅ Connexion réussie');
        this.currentUser = data.user;
        await this.loadUserProfile(data.user.id);
        await this.updateLastLogin(data.user.id);
        await this.logLoginAttempt(email, true);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      // console.error('❌ Erreur signIn:', error);
      return { user: null, session: null, error: error as Error };
    }
  }

  /**
   * Inscription
   */
  async signUp(email: string, password: string, fullName?: string): Promise<{
    user: User | null;
    error: Error | null;
  }> {
    try {
      // console.log('📝 Inscription:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        // console.error('❌ Erreur inscription:', error.message);
        return { user: null, error };
      }

      // console.log('✅ Inscription réussie');
      return { user: data.user, error: null };
    } catch (error) {
      // console.error('❌ Erreur signUp:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // console.log('👋 Déconnexion...');
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        this.currentUser = null;
        this.currentProfile = null;
        // console.log('✅ Déconnexion réussie');
      }

      return { error };
    } catch (error) {
      // console.error('❌ Erreur signOut:', error);
      return { error: error as Error };
    }
  }

  /**
   * Création d'utilisateur (admin)
   */
  async createUser(email: string, password: string, fullName: string, role: string = 'user'): Promise<{
    user: User | null;
    error: Error | null;
  }> {
    try {
      if (!this.hasRole('admin')) {
        throw new Error('Permissions insuffisantes');
      }

      // console.log('👥 Création utilisateur:', email, role);

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName
        },
        email_confirm: true
      });

      if (error) throw error;

      // Créer/mettre à jour le profil
      if (data.user) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            role,
            status: 'active',
            email_verified: true
          });
      }

      // console.log('✅ Utilisateur créé');
      return { user: data.user, error: null };
    } catch (error) {
      // console.error('❌ Erreur createUser:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Utilitaires
   */
  private async logLoginAttempt(email: string, success: boolean, errorType?: string): Promise<void> {
    try {
      await supabase
        .from('login_attempts')
        .insert([{
          email,
          success,
          error_type: errorType,
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      // console.warn('⚠️ Erreur log tentative:', error);
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      // console.warn('⚠️ Erreur update last login:', error);
    }
  }

  /**
   * Getters
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  getSystemSettings(): SystemSettings | null {
    return this.settings;
  }

  hasRole(role: string): boolean {
    if (!this.currentProfile || this.currentProfile.status !== 'active') {
      return false;
    }
    
    const roleHierarchy: Record<string, number> = {
      'super_admin': 4,
      'admin': 3,
      'editor': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[this.currentProfile.role] || 0;
    const requiredLevel = roleHierarchy[role] || 0;

    return userLevel >= requiredLevel;
  }

  isActive(): boolean {
    return this.currentProfile?.status === 'active';
  }

  async isSignupEnabled(): Promise<boolean> {
    if (!this.settings) {
      await this.loadSystemSettings();
    }
    return this.settings?.global_signup_enabled ?? true;
  }
}

// Instance singleton
export const authService = AuthService.getInstance();