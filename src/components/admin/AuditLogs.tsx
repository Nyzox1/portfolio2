import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  user_profile?: {
    full_name?: string;
    email: string;
  };
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7'); // derniers 7 jours
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      loadAuditLogs();
    }
  }, [isAdmin, isSuperAdmin, actionFilter, userFilter, dateFilter, page]);

  const loadAuditLogs = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setLogs([]);
      }

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:user_profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Filtres
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }

      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        query = query.gte('created_at', dateFrom.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setLogs(data || []);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs d'audit.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('signup')) return User;
    if (action.includes('admin') || action.includes('system')) return Shield;
    if (action.includes('error') || action.includes('failed')) return AlertTriangle;
    if (action.includes('success') || action.includes('created')) return CheckCircle;
    return Info;
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'text-red-400';
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('create') || action.includes('signup')) return 'text-green-400';
    if (action.includes('update') || action.includes('login')) return 'text-blue-400';
    if (action.includes('admin') || action.includes('system')) return 'text-purple-400';
    return 'text-gray-400';
  };

  const getActionBadge = (action: string, success: boolean) => {
    if (!success) return <Badge variant="destructive">Échec</Badge>;
    
    const actionMap: Record<string, { label: string; variant: any }> = {
      'user_login': { label: 'Connexion', variant: 'default' },
      'user_logout': { label: 'Déconnexion', variant: 'secondary' },
      'user_signup': { label: 'Inscription', variant: 'default' },
      'user_created': { label: 'Utilisateur créé', variant: 'default' },
      'user_updated': { label: 'Utilisateur modifié', variant: 'secondary' },
      'user_deleted': { label: 'Utilisateur supprimé', variant: 'destructive' },
      'system_settings_updated': { label: 'Paramètres système', variant: 'default' },
      'content_updated': { label: 'Contenu modifié', variant: 'secondary' },
      'content_created': { label: 'Contenu créé', variant: 'default' },
    };

    const config = actionMap[action] || { label: action, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportLogs = async () => {
    try {
      // Récupérer tous les logs selon les filtres actuels
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:user_profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }

      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        query = query.gte('created_at', dateFrom.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Créer le CSV
      const csvContent = [
        ['Date', 'Utilisateur', 'Action', 'Ressource', 'Succès', 'IP', 'Détails'].join(','),
        ...(data || []).map(log => [
          new Date(log.created_at).toLocaleString('fr-FR'),
          log.user_profile?.email || 'Système',
          log.action,
          log.resource_type || '',
          log.success ? 'Oui' : 'Non',
          log.ip_address || '',
          log.error_message || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Succès",
        description: "Logs exportés avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les logs.",
        variant: "destructive",
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.user_profile?.email.toLowerCase().includes(searchLower) ||
      log.user_profile?.full_name?.toLowerCase().includes(searchLower) ||
      log.resource_type?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower)
    );
  });

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Accès réservé aux administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Logs d'Audit</h1>
          <p className="text-gray-400">
            Historique complet des actions système
          </p>
        </div>
        <Button
          onClick={exportLogs}
          variant="outline"
          className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="user_login">Connexions</SelectItem>
                <SelectItem value="user_signup">Inscriptions</SelectItem>
                <SelectItem value="user_created">Utilisateurs créés</SelectItem>
                <SelectItem value="system_settings_updated">Paramètres système</SelectItem>
                <SelectItem value="content_updated">Contenu modifié</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="1">Dernières 24h</SelectItem>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="all">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => loadAuditLogs(true)}
              variant="outline"
              className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <Filter className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Historique des Actions ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Trace complète de toutes les actions effectuées sur le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const actionColor = getActionColor(log.action, log.success);

                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center ${actionColor}`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getActionBadge(log.action, log.success)}
                          <span className="text-white font-medium">
                            {log.user_profile?.full_name || log.user_profile?.email || 'Système'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>

                      <div className="text-gray-300 mb-2">
                        {log.resource_type && (
                          <span className="text-purple-400">{log.resource_type}</span>
                        )}
                        {log.resource_id && (
                          <span className="text-gray-500 ml-2">#{log.resource_id.slice(0, 8)}</span>
                        )}
                      </div>

                      {log.error_message && (
                        <div className="text-red-400 text-sm mb-2">
                          Erreur: {log.error_message}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        {log.user_agent && (
                          <span className="truncate max-w-xs">
                            {log.user_agent.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {(log.old_values || log.new_values) && (
                        <details className="mt-2">
                          <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">
                            Voir les détails
                          </summary>
                          <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                            {log.old_values && (
                              <div className="mb-2">
                                <span className="text-red-400">Avant:</span>
                                <pre className="text-gray-300 mt-1">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <span className="text-green-400">Après:</span>
                                <pre className="text-gray-300 mt-1">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun log trouvé pour les critères sélectionnés</p>
                </div>
              )}

              {hasMore && filteredLogs.length > 0 && (
                <div className="text-center pt-4">
                  <Button
                    onClick={() => {
                      setPage(prev => prev + 1);
                      loadAuditLogs();
                    }}
                    variant="outline"
                    disabled={loading}
                    className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Charger plus'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;