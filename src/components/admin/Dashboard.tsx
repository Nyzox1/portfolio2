import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  MessageSquare, 
  Image, 
  TrendingUp, 
  Users, 
  Eye,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  unreadMessages: number;
  totalMessages: number;
  mediaFiles: number;
  recentActivity: Array<{
    id: string;
    action: string;
    content_type: string;
    created_at: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    publishedProjects: 0,
    unreadMessages: 0,
    totalMessages: 0,
    mediaFiles: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les statistiques des projets
      const { data: projects } = await supabase
        .from('projects')
        .select('id, is_published');

      // Charger les messages
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id, status');

      // Charger les médias
      const { data: media } = await supabase
        .from('media_files')
        .select('id');

      // Charger l'activité récente
      const { data: activity, error: activityError } = await supabase
        .from('content_history')
        .select('id, action, content_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Si la table n'existe pas encore, on ignore l'erreur
      if (activityError && !activityError.message.includes('does not exist')) {
        console.error('Erreur lors du chargement de l\'activité:', activityError);
      }

      setStats({
        totalProjects: projects?.length || 0,
        publishedProjects: projects?.filter(p => p.is_published).length || 0,
        unreadMessages: messages?.filter(m => m.status === 'unread').length || 0,
        totalMessages: messages?.length || 0,
        mediaFiles: media?.length || 0,
        recentActivity: activity || []
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Nouveau Projet',
      description: 'Ajouter un nouveau projet au portfolio',
      icon: FolderOpen,
      action: () => navigate('/admin/projects'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Modifier Hero',
      description: 'Éditer la section principale',
      icon: Eye,
      action: () => navigate('/admin/hero'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Messages',
      description: 'Consulter les nouveaux messages',
      icon: MessageSquare,
      action: () => navigate('/admin/messages'),
      color: 'from-green-500 to-emerald-500',
      badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined
    },
    {
      title: 'Médias',
      description: 'Gérer les images et fichiers',
      icon: Image,
      action: () => navigate('/admin/media'),
      color: 'from-orange-500 to-red-500'
    }
  ];

  const statsCards = [
    {
      title: 'Projets Totaux',
      value: stats.totalProjects,
      description: `${stats.publishedProjects} publiés`,
      icon: FolderOpen,
      color: 'text-blue-400'
    },
    {
      title: 'Messages',
      value: stats.totalMessages,
      description: `${stats.unreadMessages} non lus`,
      icon: MessageSquare,
      color: 'text-green-400'
    },
    {
      title: 'Fichiers Médias',
      value: stats.mediaFiles,
      description: 'Images et documents',
      icon: Image,
      color: 'text-purple-400'
    },
    {
      title: 'Activité',
      value: stats.recentActivity.length,
      description: 'Actions récentes',
      icon: Activity,
      color: 'text-orange-400'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Vue d'ensemble de votre portfolio et activité récente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-all cursor-pointer group"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{action.title}</h3>
                      {action.badge && (
                        <Badge variant="destructive" className="ml-2">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Dernières modifications apportées au contenu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        {activity.action === 'create' && 'Création'}
                        {activity.action === 'update' && 'Modification'}
                        {activity.action === 'delete' && 'Suppression'}
                        {activity.action === 'publish' && 'Publication'}
                        {' '}d'un élément {activity.content_type}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {stats.recentActivity.length === 0 ? 'Aucune activité récente' : 'Chargement de l\'activité...'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Aperçu Rapide
            </CardTitle>
            <CardDescription>
              État actuel de votre portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <span className="text-gray-300">Projets publiés</span>
                <Badge variant="secondary">
                  {stats.publishedProjects}/{stats.totalProjects}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <span className="text-gray-300">Messages non lus</span>
                <Badge variant={stats.unreadMessages > 0 ? "destructive" : "secondary"}>
                  {stats.unreadMessages}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <span className="text-gray-300">Fichiers médias</span>
                <Badge variant="secondary">
                  {stats.mediaFiles}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;