import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar1 } from './components/ui/navbar-1';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';
import HeroEditor from './components/admin/HeroEditor';
import AboutEditor from './components/admin/AboutEditor';
import ProjectsManager from './components/admin/ProjectsManager';
import MessagesManager from './components/admin/MessagesManager';
import MediaManager from './components/admin/MediaManager';
import TeamManager from './components/admin/TeamManager';
import SettingsManager from './components/admin/SettingsManager';
import SystemSettings from './components/admin/SystemSettings';
import AuditLogs from './components/admin/AuditLogs';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { authService } from './lib/auth';


// Composant pour protéger les routes admin
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isEditor, isSuperAdmin, loading } = useAuth();
  
  console.log('ProtectedRoute - isAdmin:', isAdmin, 'isEditor:', isEditor, 'isSuperAdmin:', isSuperAdmin, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin && !isEditor) {
    console.log('Utilisateur non admin, redirection vers login');
    return <Navigate to="/admin/login" replace />;
  }
  
  console.log('Utilisateur autorisé, accès accordé');
  return <>{children}</>;
};

// Composant pour protéger les routes admin uniquement
const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// Composant pour protéger les routes super admin uniquement
const SuperAdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};
// Page principale du portfolio
const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar1 />
      <Hero />
      <About />
      <Projects />
      <Contact />
      <Footer />
    </div>
  );
};

function App() {
  // Initialiser le service d'authentification
  React.useEffect(() => {
    authService.initialize();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Route principale du portfolio */}
        <Route path="/" element={<PortfolioPage />} />
        
        {/* Routes d'administration */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="hero" element={<HeroEditor />} />
          <Route path="about" element={<AboutEditor />} />
          <Route path="projects" element={<ProjectsManager />} />
          <Route path="messages" element={<MessagesManager />} />
          <Route path="media" element={<MediaManager />} />
          <Route path="team" element={
            <AdminOnlyRoute>
              <TeamManager />
            </AdminOnlyRoute>
          } />
          <Route path="audit" element={
            <AdminOnlyRoute>
              <AuditLogs />
            </AdminOnlyRoute>
          } />
          <Route path="settings" element={<SettingsManager />} />
          <Route path="system" element={
            <SuperAdminOnlyRoute>
              <SystemSettings />
            </SuperAdminOnlyRoute>
          } />
        </Route>
        
        {/* Redirection pour les routes non trouvées */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;