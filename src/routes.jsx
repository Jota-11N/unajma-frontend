import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from './AuthContext';
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import TournamentEquipos from "./pages/TournamentEquipos";
import TournamentPartidos from "./pages/TournamentPartidos";
import TournamentPosiciones from "./pages/TournamentPosiciones";
import TournamentNoticias from "./pages/TournamentNoticias";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Players from "./pages/Players";
import Matches from "./pages/Matches";
import Standings from "./pages/Standings";
import VerifyEmailSent from "./pages/VerifyEmailSent";
import AllNews from "./pages/AllNews";

// Componente de carga
const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-unjma-dark via-unjma-primary to-blue-900">
    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

// Componente de ruta protegida
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar si se requiere rol de admin
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-unjma-light">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

// Componente de ruta pública (sin navbar)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Si ya está autenticado, redirige al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default function RoutesApp() {
  return (
    <Routes>
      {/* ========== RUTAS PÚBLICAS (sin autenticación) ========== */}
      
      {/* Login */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Registro */}
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      
      {/* Recuperar contraseña */}
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } 
      />
      
      {/* Resetear contraseña */}
      <Route 
        path="/reset-password" 
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } 
      />
      
      {/* Verificar email */}
      <Route 
        path="/verify-email/:token" 
        element={
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        } 
      />

      {/* Verificación de email enviada */}
      <Route 
        path="/verify-email-sent" 
        element={
          <PublicRoute>
            <VerifyEmailSent />
          </PublicRoute>
        } 
      />

      {/* ========== RUTAS PROTEGIDAS (con autenticación) ========== */}
      
      {/* Dashboard principal */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard (alias) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* ========== MÓDULO DE NOTICIAS/COMUNICADOS ========== */}
      
      {/* Todas las noticias (Back Office) */}
      <Route 
        path="/noticias" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AllNews />
          </ProtectedRoute>
        }
      />
      
      {/* ========== MÓDULO DE TORNEOS ========== */}
      
      {/* Torneos - Lista */}
      <Route 
        path="/torneos" 
        element={
          <ProtectedRoute>
            <Tournaments />
          </ProtectedRoute>
        } 
      />
      
      {/* Detalle de Torneo */}
      <Route 
        path="/torneos/:id"
        element={
          <ProtectedRoute>
            <TournamentDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* Equipos de un Torneo */}
      <Route 
        path="/torneos/:id/equipos"
        element={
          <ProtectedRoute>
            <TournamentEquipos />
          </ProtectedRoute>
        } 
      />
      
      {/* Partidos de un Torneo */}
      <Route 
        path="/torneos/:id/partidos"
        element={
          <ProtectedRoute>
            <TournamentPartidos />
          </ProtectedRoute>
        } 
      />
      
      {/* Posiciones de un Torneo */}
      <Route 
        path="/torneos/:id/posiciones"
        element={
          <ProtectedRoute>
            <TournamentPosiciones />
          </ProtectedRoute>
        } 
      />
      
      {/* Noticias de un Torneo (específicas) */}
      <Route 
        path="/torneos/:id/noticias"
        element={
          <ProtectedRoute>
            <TournamentNoticias />
          </ProtectedRoute>
        } 
      />
      
      {/* ========== MÓDULOS DE GESTIÓN (Back Office) ========== */}
      
      {/* Equipos - Lista general */}
      <Route 
        path="/equipos" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Teams />
          </ProtectedRoute>
        } 
      />
      
      {/* Detalle de Equipo */}
      <Route 
        path="/equipos/:id" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <TeamDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* Jugadores */}
      <Route 
        path="/jugadores" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Players />
          </ProtectedRoute>
        } 
      />
      
      {/* Partidos - Vista general */}
      <Route 
        path="/partidos" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Matches />
          </ProtectedRoute>
        } 
      />
      
      {/* Tabla de posiciones - Vista general */}
      <Route 
        path="/tabla-posiciones" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Standings />
          </ProtectedRoute>
        } 
      />
      
      {/* ========== RUTAS DE PERFIL Y CONFIGURACIÓN ========== */}
      
      {/* Perfil del usuario */}
      <Route 
        path="/admin/perfil" 
        element={
          <ProtectedRoute>
            <div className="max-w-7xl mx-auto py-8 px-4">
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              {/* Aquí puedes crear un componente Profile.jsx */}
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Configuración del sistema */}
      <Route 
        path="/admin/configuracion" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <div className="max-w-7xl mx-auto py-8 px-4">
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
              {/* Aquí puedes crear un componente Settings.jsx */}
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* ========== RUTA CATCH-ALL ========== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}