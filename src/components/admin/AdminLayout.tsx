import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Settings, 
  FolderOpen, 
  MessageSquare, 
  Image, 
  History, 
  LogOut,
  Menu,
  X,
  User,
  Home,
  Info,
  Users,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const { profile, signOut, isAdmin, isEditor, isSuperAdmin, loading, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Afficher un loader minimal pendant l'initialisation
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Rediriger silencieusement si pas les bonnes permissions
  if (!loading && !initializing && (!profile || (!isAdmin && !isEditor))) {
    navigate('/admin/login');
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Hero Section', href: '/admin/hero', icon: Home },
    { name: 'À propos', href: '/admin/about', icon: Info },
    { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Médias', href: '/admin/media', icon: Image },
    ...(isAdmin ? [
      { name: 'Équipe', href: '/admin/team', icon: Users },
      { name: 'Logs d\'Audit', href: '/admin/audit', icon: History }
    ] : []),
    { name: 'Paramètres', href: '/admin/settings', icon: Settings },
    ...(isSuperAdmin ? [{ name: 'Système', href: '/admin/system', icon: Shield }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                      : "text-gray-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || profile?.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="w-full border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white">
              Administration Portfolio
            </h1>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.open('/', '_blank')}
                variant="outline"
                size="sm"
                className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-800"
              >
                Voir le site
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;