import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lock, Mail, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupEnabled, setSignupEnabled] = useState(true);
  
  const { signIn, isAdmin, isEditor, isSuperAdmin, loading: authLoading, initializing, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Vérifier si les inscriptions sont activées
  useEffect(() => {
    const checkSignupStatus = async () => {
      try {
        const enabled = await authService.isSignupEnabled();
        setSignupEnabled(enabled);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'inscription:', error);
      }
    };

    checkSignupStatus();
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && !initializing && profile && (isAdmin || isEditor || isSuperAdmin)) {
      // console.log('✅ Utilisateur admin connecté, redirection...');
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isEditor, isSuperAdmin, authLoading, initializing, navigate, profile]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }

    if (!email.includes('@')) {
      setError('Format d\'email invalide');
      return false;
    }

    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // console.log('🔑 Tentative de connexion admin pour:', email);
      const { user, error: signInError } = await signIn(email, password, rememberMe);
      
      if (signInError) {
        // console.error('❌ Erreur de connexion:', signInError);
        
        // Messages d'erreur personnalisés
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else if (signInError.message.includes('Too many requests')) {
          setError('Trop de tentatives. Veuillez patienter avant de réessayer');
        } else if (signInError.message.includes('Compte temporairement verrouillé')) {
          setError('Compte temporairement verrouillé suite à trop de tentatives échouées');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError(signInError.message || 'Erreur de connexion');
        }
        
        toast({
          title: "Erreur de connexion",
          description: "Vérifiez vos identifiants et réessayez.",
          variant: "destructive",
        });
      } else if (user) {
        // console.log('✅ Connexion réussie pour:', user.email);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue dans l'administration !",
        });
        
        // La redirection sera gérée par l'useEffect
      }
    } catch (err) {
      console.error('❌ Erreur lors de la connexion:', err);
      setError('Une erreur inattendue s\'est produite');
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Affichage minimal pendant l'initialisation
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Si déjà connecté en tant qu'admin, redirection silencieuse
  if (!initializing && profile && (isAdmin || isEditor || isSuperAdmin)) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-800 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Administration Sécurisée
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connectez-vous pour accéder au panneau d'administration
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {!signupEnabled && (
            <Alert className="mb-6 bg-orange-500/10 border-orange-500/20">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-400">
                Les nouvelles inscriptions sont actuellement désactivées.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nyzox.tech"
                required
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-gray-400 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={loading}
              />
              <Label htmlFor="remember" className="text-gray-300 text-sm">
                Se souvenir de moi
              </Label>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-400">
              Accès réservé aux administrateurs et éditeurs autorisés
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>🔒 Connexion sécurisée avec chiffrement</p>
              <p>🛡️ Protection contre les attaques par force brute</p>
              <p>📊 Audit trail complet des actions</p>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-gray-500">
                Premier admin : <code className="text-purple-400">admin@nyzox.tech</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;