import { useState, useEffect } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService, UserProfile } from '@/lib/auth';

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // console.log('🔄 Initialisation useAuth...');
        
        // Initialiser le service d'authentification
        await authService.initialize();

        if (!mounted) return;

        // Récupérer la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // console.warn('⚠️ Erreur getSession:', error.message);
          
          // Gérer les erreurs de token de rafraîchissement
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Refresh Token Not Found')) {
            // console.log('🔄 Token invalide, nettoyage...');
            await authService.signOut();
          }
        }

        if (mounted) {
          setSession(session);
          setAuthUser(session?.user ?? null);

          if (session?.user) {
            const userProfile = authService.getCurrentProfile();
            setProfile(userProfile);
            updateRoles(userProfile);
          } else {
            setProfile(null);
            updateRoles(null);
          }

          setLoading(false);
          setInitializing(false);
        }
      } catch (error) {
        // console.error('❌ Erreur initialize useAuth:', error);
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    initialize();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 Auth state changed:', event);

        if (!mounted) return;

        setSession(session);
        setAuthUser(session?.user ?? null);

        if (session?.user) {
          // Recharger le profil
          await authService.initialize();
          const userProfile = authService.getCurrentProfile();
          setProfile(userProfile);
          updateRoles(userProfile);
        } else {
          setProfile(null);
          updateRoles(null);
        }

        setLoading(false);
        setInitializing(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateRoles = (userProfile: UserProfile | null) => {
    if (!userProfile || userProfile.status !== 'active') {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsEditor(false);
      return;
    }

    const newIsSuperAdmin = userProfile.role === 'super_admin';
    const newIsAdmin = ['super_admin', 'admin'].includes(userProfile.role);
    const newIsEditor = ['super_admin', 'admin', 'editor'].includes(userProfile.role);

    setIsSuperAdmin(newIsSuperAdmin);
    setIsAdmin(newIsAdmin);
    setIsEditor(newIsEditor);

    // console.log('🎭 Rôles mis à jour:', {
    //   role: userProfile.role,
    //   isSuperAdmin: newIsSuperAdmin,
    //   isAdmin: newIsAdmin,
    //   isEditor: newIsEditor
    // });
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const result = await authService.signIn(email, password, rememberMe);
      
      if (result.user && !result.error) {
        const userProfile = authService.getCurrentProfile();
        setProfile(userProfile);
        updateRoles(userProfile);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erreur signIn useAuth:', err);
      return { user: null, session: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const result = await authService.signOut();
      
      if (!result.error) {
        setSession(null);
        setAuthUser(null);
        setProfile(null);
        updateRoles(null);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erreur signOut useAuth:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      return await authService.signUp(email, password, fullName);
    } catch (err) {
      console.error('❌ Erreur signUp useAuth:', err);
      return { user: null, error: err };
    }
  };

  const createUser = async (email: string, password: string, fullName: string, role: string = 'user') => {
    try {
      return await authService.createUser(email, password, fullName, role);
    } catch (err) {
      console.error('❌ Erreur createUser useAuth:', err);
      return { user: null, error: err };
    }
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const isActive = (): boolean => {
    return authService.isActive();
  };

  return {
    authUser,
    user: profile, // Pour la compatibilité
    profile,
    session,
    loading,
    initializing,
    isAdmin,
    isEditor,
    isSuperAdmin,
    signIn,
    signOut,
    signUp,
    createUser,
    hasRole,
    isActive,
  };
}