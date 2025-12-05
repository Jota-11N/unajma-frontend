import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Trophy, Users, User, Calendar, 
  PlusCircle, Bell, Clock, 
  TrendingUp, Eye, Edit, 
  FileText, MessageSquare, AlertCircle,
  Award, MapPin, Users2, Gamepad2,
  Filter, ChevronRight, Zap, BarChart3,
  Shield, Activity, Target, Star,
  Home, RefreshCw, ChevronDown, Database,
  CheckCircle, XCircle
} from "lucide-react";
import api, { matchService } from "../services/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalTeams: 0,
    totalPlayers: 0,
    upcomingMatches: 0
  });
  const [myTournaments, setMyTournaments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentActivity, setRecentActivity] = useState([
    { type: 'info', title: 'Bienvenido al Sistema', description: 'Panel de control cargado correctamente', time: 'Ahora' }
  ]);
  const [apiStatus, setApiStatus] = useState({
    tournaments: 'checking',
    news: 'checking',
    matches: 'checking',
    users: 'checking'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        fetchDashboardData();
      } catch (error) {
        console.error("Error parsing user data:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Verificar estado de las APIs primero
      await checkApiStatus();
      
      // 1. Obtener todos los torneos (el endpoint correcto es /tournaments)
      await fetchAllTournaments();
      
      // 2. Obtener noticias recientes
      await fetchRecentAnnouncements();
      
      // 3. Obtener próximos partidos
      await fetchUpcomingMatches();

    } catch (error) {
      console.error("Error cargando dashboard:", error);
      // Datos de ejemplo para mostrar estructura
      setExampleData();
    } finally {
      setLoading(false);
    }
  };

  const checkApiStatus = async () => {
    const status = {
      tournaments: 'checking',
      news: 'checking',
      matches: 'checking',
      users: 'checking'
    };

    try {
      // Verificar endpoint de torneos
      const tournamentsRes = await api.get("/tournaments").catch(() => null);
      status.tournaments = tournamentsRes ? 'active' : 'error';
      
      // Verificar endpoint de noticias
      const newsRes = await api.get("/news").catch(() => null);
      status.news = newsRes ? 'active' : 'error';
      
      // Verificar endpoint de partidos
      const matchesRes = await api.get("/matches").catch(() => null);
      status.matches = matchesRes ? 'active' : 'error';
      
      // Verificar endpoint de usuarios (perfil)
      const profileRes = await api.get("/users/profile").catch(() => null);
      status.users = profileRes ? 'active' : 'error';

    } catch (error) {
      console.log("Error checking API status:", error);
    }
    
    setApiStatus(status);
  };

  const fetchAllTournaments = async () => {
    try {
      // ✅ CORRECCIÓN: Usar /tournaments en lugar de /tournaments/my-tournaments
      const response = await api.get("/tournaments");
      
      if (response.data && response.data.success) {
        const tournaments = response.data.data || [];
        
        // Si el usuario es ADMIN, ver todos los torneos
        // Si es USER, el backend ya filtra sus torneos + públicos
        setMyTournaments(tournaments.slice(0, 4));
        
        // Calcular estadísticas
        const statsData = {
          totalTournaments: tournaments.length,
          activeTournaments: tournaments.filter(t => t.status === 'ONGOING').length,
          completedTournaments: tournaments.filter(t => t.status === 'COMPLETED').length,
          totalTeams: 0, // Esto necesitaría endpoint específico
          totalPlayers: 0, // Esto necesitaría endpoint específico
          upcomingMatches: upcomingMatches.length
        };
        setStats(statsData);
      } else {
        console.log("Formato de respuesta inesperado:", response.data);
        setMyTournaments([]);
      }
    } catch (error) {
      console.log("Error fetching tournaments:", error);
      // Intentar obtener del localStorage si hay datos guardados
      const savedData = localStorage.getItem('dashboard_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.tournaments) {
            setMyTournaments(data.tournaments.slice(0, 4));
          }
        } catch (e) {
          console.log("Error parsing saved data:", e);
        }
      }
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      const response = await api.get("/news");
      
      if (response.data) {
        // Manejar diferentes formatos de respuesta
        let news = [];
        if (Array.isArray(response.data)) {
          news = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          news = response.data.data;
        } else if (response.data.success && response.data.data) {
          news = response.data.data;
        }
        
        // Tomar las últimas 3 noticias
        const sortedNews = news
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentAnnouncements(sortedNews);
      }
    } catch (error) {
      console.log("Error fetching news:", error.response?.data || error.message);
      // Intentar del localStorage
      const savedData = localStorage.getItem('dashboard_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.news) {
            setRecentAnnouncements(data.news.slice(0, 3));
          }
        } catch (e) {
          console.log("Error parsing saved news:", e);
        }
      }
    }
  };

  const fetchUpcomingMatches = async () => {
    try {
      const response = await api.get("/matches");
      
      if (response.data) {
        let matches = [];
        if (Array.isArray(response.data)) {
          matches = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          matches = response.data.data;
        } else if (response.data.success && response.data.data) {
          matches = response.data.data;
        }
        
        // Filtrar partidos programados y ordenar por fecha
        const today = new Date();
        const upcoming = matches
          .filter(m => m.status === 'SCHEDULED' && new Date(m.date) > today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);
        
        setUpcomingMatches(upcoming);
        setStats(prev => ({ ...prev, upcomingMatches: upcoming.length }));
      }
    } catch (error) {
      console.log("Error fetching matches:", error.response?.data || error.message);
      // Intentar del localStorage
      const savedData = localStorage.getItem('dashboard_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.matches) {
            setUpcomingMatches(data.matches.slice(0, 5));
          }
        } catch (e) {
          console.log("Error parsing saved matches:", e);
        }
      }
    }
  };

  const setExampleData = () => {
    const exampleTournaments = [
      { 
        id: 1, 
        name: "Torneo Interfacultades 2024", 
        teams: 12, 
        matches: 36, 
        status: "ONGOING", 
        sportType: "FOOTBALL",
        startDate: "2024-03-01T00:00:00.000Z",
        location: "Campus UNAJMA",
        user: { name: user?.name || "Administrador" }
      },
      { 
        id: 2, 
        name: "Copa UNAJMA Fútbol", 
        teams: 8, 
        matches: 28, 
        status: "PLANNING", 
        sportType: "FOOTBALL",
        startDate: "2024-04-15T00:00:00.000Z",
        location: "Estadio Principal",
        user: { name: user?.name || "Administrador" }
      },
      { 
        id: 3, 
        name: "Vóley Intercarreras", 
        teams: 6, 
        matches: 15, 
        status: "ONGOING", 
        sportType: "VOLLEYBALL",
        startDate: "2024-03-10T00:00:00.000Z",
        location: "Coliseo UNAJMA",
        user: { name: user?.name || "Administrador" }
      }
    ];
    
    const exampleAnnouncements = [
      {
        id: 1,
        title: "Bienvenida al nuevo sistema deportivo UNAJMA",
        content: "Iniciamos la plataforma de gestión deportiva universitaria. Todos los administradores pueden crear y gestionar torneos.",
        tournament: { name: "General" },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Guía de uso del sistema",
        content: "Revisa las instrucciones para administrar torneos, equipos y partidos en el sistema.",
        tournament: { name: "Sistema" },
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    const exampleMatches = [
      { 
        id: 1, 
        homeTeam: { name: "Ingeniería FC" }, 
        awayTeam: { name: "Medicina FC" }, 
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Estadio UNAJMA",
        status: "SCHEDULED",
        tournament: { name: "Interfacultades 2024" }
      },
      { 
        id: 2, 
        homeTeam: { name: "Derecho United" }, 
        awayTeam: { name: "Arquitectura SC" }, 
        date: new Date(Date.now() + 172800000).toISOString(),
        venue: "Cancha Básquet",
        status: "SCHEDULED",
        tournament: { name: "Interfacultades 2024" }
      }
    ];
    
    setMyTournaments(exampleTournaments);
    setRecentAnnouncements(exampleAnnouncements);
    setUpcomingMatches(exampleMatches);
    
    setStats({
      totalTournaments: exampleTournaments.length,
      activeTournaments: exampleTournaments.filter(t => t.status === 'ONGOING').length,
      completedTournaments: exampleTournaments.filter(t => t.status === 'COMPLETED').length,
      totalTeams: 26, // Ejemplo
      totalPlayers: 320, // Ejemplo
      upcomingMatches: exampleMatches.length
    });
    
    // Guardar datos de ejemplo en localStorage para referencia
    localStorage.setItem('dashboard_data', JSON.stringify({
      tournaments: exampleTournaments,
      news: exampleAnnouncements,
      matches: exampleMatches
    }));
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getSportIcon = (sport) => {
    switch(sport) {
      case "FOOTBALL": return "⚽";
      case "BASKETBALL": return "🏀";
      case "VOLLEYBALL": return "🏐";
      case "TENNIS": return "🎾";
      case "HANDBALL": return "🤾";
      default: return "🏆";
    }
  };

  const getSportName = (sport) => {
    switch(sport) {
      case "FOOTBALL": return "Fútbol";
      case "BASKETBALL": return "Básquet";
      case "VOLLEYBALL": return "Vóley";
      case "TENNIS": return "Tenis";
      case "HANDBALL": return "Handball";
      default: return "Deporte";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "ONGOING": return "bg-emerald-500/10 text-emerald-700 border border-emerald-200";
      case "PLANNING": return "bg-blue-500/10 text-blue-700 border border-blue-200";
      case "COMPLETED": return "bg-gray-500/10 text-gray-700 border border-gray-200";
      case "CANCELLED": return "bg-red-500/10 text-red-700 border border-red-200";
      default: return "bg-amber-500/10 text-amber-700 border border-amber-200";
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "ONGOING": return "En curso";
      case "PLANNING": return "Planificación";
      case "COMPLETED": return "Completado";
      case "CANCELLED": return "Cancelado";
      default: return "Pendiente";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha por definir';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getApiStatusIcon = (status) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Database className="w-4 h-4 text-amber-500" />;
    }
  };

  const getApiStatusText = (status) => {
    switch(status) {
      case 'active': return 'Activo';
      case 'error': return 'Error';
      default: return 'Verificando';
    }
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'create_tournament':
        navigate('/torneos?create=true');
        break;
      case 'create_announcement':
        navigate('/noticias?create=true');
        break;
      case 'schedule_match':
        navigate('/partidos?create=true');
        break;
      case 'manage_teams':
        navigate('/equipos');
        break;
      case 'manage_players':
        navigate('/jugadores');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-unjma-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Cargando Gestión Deportiva</h3>
            <p className="text-sm text-slate-500">Conectando con el servidor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-unjma-primary to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Panel de Control</h1>
                <p className="text-xs text-slate-500">Gestión Deportiva UNAJMA</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-unjma-primary"
                title="Actualizar datos"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user?.name || 'Administrador'}</p>
                  <p className="text-xs text-slate-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Gestor'}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-unjma-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-unjma-primary via-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold">¡Bienvenido al Sistema!</h2>
                      <p className="text-blue-100 mt-1 text-sm md:text-base max-w-2xl">
                        Gestiona todos los eventos deportivos de la universidad desde un solo lugar.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button 
                      onClick={() => handleQuickAction('create_tournament')}
                      className="inline-flex items-center px-5 py-2.5 bg-white text-unjma-primary font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Nuevo Torneo
                    </button>
                    <button 
                      onClick={() => handleQuickAction('create_announcement')}
                      className="inline-flex items-center px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-200 text-sm border border-white/30"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Crear Anuncio
                    </button>
                    <button 
                      onClick={() => handleQuickAction('schedule_match')}
                      className="inline-flex items-center px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-200 text-sm border border-white/30"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Programar Partido
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[200px]">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm opacity-90 mb-1">Actividad del día</p>
                    <div className="text-2xl font-bold">{stats.totalTournaments} torneos</div>
                    <div className="text-xs opacity-80 mt-2">
                      {stats.activeTournaments} en curso • {stats.upcomingMatches} partidos próximos
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-900">Estado de Conexión</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                apiStatus.tournaments === 'active' && apiStatus.news === 'active' && apiStatus.matches === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {apiStatus.tournaments === 'active' && apiStatus.news === 'active' && apiStatus.matches === 'active'
                  ? 'Todas las APIs activas'
                  : 'Algunas APIs con problemas'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                {getApiStatusIcon(apiStatus.tournaments)}
                <div>
                  <p className="text-xs font-medium text-slate-700">Torneos</p>
                  <p className="text-xs text-slate-500">{getApiStatusText(apiStatus.tournaments)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getApiStatusIcon(apiStatus.news)}
                <div>
                  <p className="text-xs font-medium text-slate-700">Noticias</p>
                  <p className="text-xs text-slate-500">{getApiStatusText(apiStatus.news)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getApiStatusIcon(apiStatus.matches)}
                <div>
                  <p className="text-xs font-medium text-slate-700">Partidos</p>
                  <p className="text-xs text-slate-500">{getApiStatusText(apiStatus.matches)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getApiStatusIcon(apiStatus.users)}
                <div>
                  <p className="text-xs font-medium text-slate-700">Usuarios</p>
                  <p className="text-xs text-slate-500">{getApiStatusText(apiStatus.users)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Torneos */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Torneos Totales</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-slate-900">{stats.totalTournaments}</p>
                  {stats.activeTournaments > 0 && (
                    <div className="flex items-center text-xs">
                      <div className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                        {stats.activeTournaments} activos
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.completedTournaments} finalizados • {stats.totalTournaments - stats.activeTournaments - stats.completedTournaments} planificados
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-unjma-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-unjma-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/torneos" 
                className="text-sm text-unjma-primary hover:text-blue-600 font-medium inline-flex items-center"
              >
                Ver todos los torneos <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Partidos */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Partidos Próximos</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-slate-900">{stats.upcomingMatches}</p>
                  {stats.upcomingMatches > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      programados
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Para los próximos días
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/partidos" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                Ver calendario <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Noticias */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Noticias Recientes</p>
                <p className="text-3xl font-bold text-slate-900">{recentAnnouncements.length}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Anuncios publicados
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/noticias" 
                className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
              >
                Ver noticias <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Estado</p>
                <p className="text-3xl font-bold text-slate-900">
                  {myTournaments.length > 0 ? 'Activo' : 'Listo'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Sistema operativo
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={handleRefresh}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium inline-flex items-center"
              >
                Actualizar datos <RefreshCw className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Torneos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-unjma-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-unjma-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {user?.role === 'ADMIN' ? 'Todos los Torneos' : 'Mis Torneos'}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {user?.role === 'ADMIN' 
                          ? 'Torneos disponibles en el sistema' 
                          : 'Torneos que estás gestionando'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      to="/torneos?create=true" 
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-unjma-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Nuevo
                    </Link>
                    <Link 
                      to="/torneos" 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-unjma-primary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {myTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {myTournaments.slice(0, 3).map((tournament) => (
                      <Link 
                        key={tournament.id} 
                        to={`/torneos/${tournament.id}`}
                        className="block group"
                      >
                        <div className="p-4 rounded-xl border border-slate-200 hover:border-unjma-primary/30 hover:bg-blue-50/50 transition-all duration-200">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-unjma-primary/10 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <span className="text-2xl">{getSportIcon(tournament.sportType)}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900 group-hover:text-unjma-primary transition-colors truncate">
                                    {tournament.name}
                                  </h3>
                                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                    {tournament.user && (
                                      <>
                                        <span className="inline-flex items-center text-xs text-slate-600">
                                          <User className="w-3 h-3 mr-1" />
                                          {tournament.user.name}
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                      </>
                                    )}
                                    {tournament.location && (
                                      <>
                                        <span className="text-xs text-slate-600 truncate max-w-[100px]">
                                          {tournament.location}
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                      </>
                                    )}
                                    <span className="text-xs text-slate-600">
                                      {formatDate(tournament.startDate)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {tournament.status && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                                      {getStatusText(tournament.status)}
                                    </span>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-unjma-primary transition-colors flex-shrink-0" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {apiStatus.tournaments === 'error' 
                        ? 'Error al cargar torneos' 
                        : 'No hay torneos disponibles'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                      {apiStatus.tournaments === 'error'
                        ? 'No se pudo conectar con el servidor de torneos. Verifica tu conexión.'
                        : 'Crea tu primer torneo para comenzar a gestionar competencias deportivas.'}
                    </p>
                    {apiStatus.tournaments !== 'error' && (
                      <button 
                        onClick={() => handleQuickAction('create_tournament')}
                        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-unjma-primary to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Crear Primer Torneo
                      </button>
                    )}
                  </div>
                )}
                
                {myTournaments.length > 3 && (
                  <div className="mt-6 text-center">
                    <Link 
                      to="/torneos" 
                      className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-unjma-primary"
                    >
                      Ver {myTournaments.length - 3} torneos más
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Anuncios Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Anuncios Recientes</h2>
                      <p className="text-sm text-slate-500">Comunicados del sistema</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {recentAnnouncements.length > 0 ? (
                  <div className="space-y-4">
                    {recentAnnouncements.map((announcement, index) => (
                      <div 
                        key={announcement.id || index} 
                        className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center">
                              <Bell className="w-5 h-5 text-amber-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1 line-clamp-1">
                              {announcement.title || 'Sin título'}
                            </h4>
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                              {announcement.content || 'Sin contenido'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{announcement.tournament?.name || 'General'}</span>
                              <span>{formatDate(announcement.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-sm text-slate-600">
                      {apiStatus.news === 'error' 
                        ? 'Error al cargar noticias' 
                        : 'No hay anuncios recientes'}
                    </p>
                    {apiStatus.news === 'error' && (
                      <p className="text-xs text-slate-500 mt-1">Verifica la conexión con el servidor</p>
                    )}
                  </div>
                )}
                
                <div className="mt-4">
                  <Link 
                    to="/noticias" 
                    className="block w-full py-2.5 text-center text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                  >
                    Ver todos los anuncios
                  </Link>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Acciones Rápidas</h2>
                  <p className="text-sm text-slate-300">Acciones frecuentes</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => handleQuickAction('create_tournament')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-unjma-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Crear Torneo</span>
                  </div>
                  <PlusCircle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
                
                <button 
                  onClick={() => handleQuickAction('manage_teams')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Gestionar Equipos</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
                
                <button 
                  onClick={() => handleQuickAction('schedule_match')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Programar Partido</span>
                  </div>
                  <PlusCircle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
                
                <button 
                  onClick={() => handleQuickAction('manage_players')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Gestionar Jugadores</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Matches Section */}
        {stats.upcomingMatches > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Próximos Partidos</h2>
                      <p className="text-sm text-slate-500">Partidos programados próximamente</p>
                    </div>
                  </div>
                  <Link 
                    to="/partidos" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Ver calendario completo
                  </Link>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingMatches.map((match, index) => (
                    <Link 
                      key={match.id || index} 
                      to={`/partidos?match=${match.id}`}
                      className="block"
                    >
                      <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                        <div className="text-center mb-3">
                          <div className="text-sm font-medium text-slate-900 mb-1 truncate">
                            {match.homeTeam?.name || 'Equipo Local'}
                          </div>
                          <div className="text-xs text-slate-500 mb-2">VS</div>
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {match.awayTeam?.name || 'Equipo Visitante'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{formatDateTime(match.date)}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-600 truncate max-w-[120px]">
                              {match.venue || 'Sin ubicación'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-unjma-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">Gestión Deportiva UNAJMA</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Sistema de gestión de eventos deportivos universitarios
              </p>
            </div>
            <div className="text-sm text-slate-600">
              <p>© {new Date().getFullYear()} - Versión 2.1.0</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}