import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../AuthContext';
import { Trophy, Home, Newspaper, LogOut, Bell, User, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  // SOLO para Back Office (admin)
  const adminNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/torneos", label: "Torneos", icon: Trophy },
    { path: "/noticias", label: "Comunicados", icon: Newspaper },
  ];

  // Verificar si estamos en TournamentDetail para ocultar el Navbar
  // El patrón es: /torneos/:id (donde :id es un número)
  const isTournamentDetail = () => {
    const tournamentDetailPattern = /^\/torneos\/\d+$/;
    return tournamentDetailPattern.test(location.pathname);
  };

  // Si estamos en TournamentDetail, no mostrar el Navbar
  if (isTournamentDetail()) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Sección izquierda: Logo + Navegación */}
          <div className="flex items-center space-x-6">
            {/* Logo y nombre */}
            <div className="flex items-center">
              <div 
                className="w-8 h-8 bg-gradient-to-br from-unjma-primary to-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate("/dashboard")}
              >
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="ml-2">
                <span className="text-sm font-bold text-gray-900 hidden md:inline-block">
                  GESTIÓN DEPORTIVA UNAJMA
                </span>
                <span className="text-sm font-bold text-gray-900 md:hidden">
                  ADMIN
                </span>
                <div className="text-xs text-gray-500 hidden md:block">
                  Back Office - Solo administradores
                </div>
              </div>
            </div>

            {/* Navigation - SOLO para admin */}
            {isAdmin && (
              <nav className="hidden md:flex items-center space-x-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center ${
                        isActive 
                          ? 'bg-unjma-primary text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } active:scale-95`}
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Sección derecha: Acciones de usuario */}
          <div className="flex items-center space-x-3">
            {/* Indicador de rol */}
            {isAdmin && (
              <div className="hidden sm:flex items-center px-3 py-1 bg-gradient-to-r from-unjma-primary to-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                <Trophy className="w-3 h-3 mr-1" />
                Administrador
              </div>
            )}
            
            {/* Notificaciones */}
            <button 
              className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 relative"
              onClick={() => navigate("/noticias")}
              title="Comunicados"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </button>
            
            {/* Perfil de usuario */}
            <div className="relative group">
              <button className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 bg-gradient-to-br from-unjma-primary to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:scale-105 transition-transform">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'Administrador'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@unjma.edu.pe'}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-unjma-primary/10 text-unjma-primary">
                      {user?.role === 'ADMIN' ? 'Administrador Principal' : 'Gestor'}
                    </span>
                  </div>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => navigate('/admin/perfil')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </button>
                  <button
                    onClick={() => navigate('/admin/configuracion')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}