import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, Edit, UserPlus, Shield, ShieldCheck, User, Crown } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  created_at: string;
  last_login_at?: string;
}

const TeamManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserProfile['role'],
    status: 'active' as UserProfile['status']
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status
          });

        if (profileError) throw profileError;

        // Log d'audit
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'create_user',
          resource_type: 'user',
          resource_id: authData.user.id,
          new_values: { email: formData.email, role: formData.role }
        });

        setShowCreateForm(false);
        setFormData({ email: '', password: '', full_name: '', role: 'user', status: 'active' });
        loadUsers();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Log d'audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'update_user',
        resource_type: 'user',
        resource_id: userId,
        new_values: updates
      });

      loadUsers();
      setEditingUser(null);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      // Supprimer le profil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Supprimer de Supabase Auth (nécessite des privilèges admin)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) console.warn('Impossible de supprimer de Auth:', authError);

      // Log d'audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'delete_user',
        resource_type: 'user',
        resource_id: userId
      });

      loadUsers();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4" />;
      case 'admin': return <ShieldCheck className="w-4 h-4" />;
      case 'editor': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion d'Équipe</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un Nouvel Utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Nom complet"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <Input
                placeholder="Mot de passe"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserProfile['role'] })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="user">Utilisateur</option>
                  <option value="editor">Éditeur</option>
                  <option value="admin">Admin</option>
                  {profile?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserProfile['status'] })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((userProfile) => (
          <Card key={userProfile.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{userProfile.full_name || userProfile.email}</h3>
                      <Badge className={getRoleColor(userProfile.role)}>
                        {getRoleIcon(userProfile.role)}
                        <span className="ml-1">{userProfile.role}</span>
                      </Badge>
                      <Badge className={getStatusColor(userProfile.status)}>
                        {userProfile.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{userProfile.email}</p>
                    <p className="text-xs text-gray-500">
                      Créé le {new Date(userProfile.created_at).toLocaleDateString()}
                      {userProfile.last_login_at && (
                        <> • Dernière connexion: {new Date(userProfile.last_login_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(userProfile)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {userProfile.id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(userProfile.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier l'Utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Nom complet"
                value={editingUser.full_name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserProfile['role'] })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="user">Utilisateur</option>
                  <option value="editor">Éditeur</option>
                  <option value="admin">Admin</option>
                  {profile?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserProfile['status'] })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="suspended">Suspendu</option>
                  <option value="banned">Banni</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleUpdateUser(editingUser.id, editingUser)}>
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamManager;