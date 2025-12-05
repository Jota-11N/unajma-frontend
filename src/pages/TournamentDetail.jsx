import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Trophy, Calendar, MapPin, Users, Gamepad2, 
  Edit, Settings, Award, BarChart3, Newspaper, 
  Shield, Filter, CheckCircle, AlertCircle, Clock, 
  ArrowLeft, Trash2, Home, Users as UsersIcon, 
  Download, Printer, FileText, UserPlus, 
  Plus, ChevronRight, Eye, Globe, Lock,
  Crown, Zap, Bell, MessageSquare, Share,
  Users2, Tag, Hash, Building, Phone, Mail,
  Star, Target, BarChart, Filter as FilterIcon,
  Save, X, MoreVertical, UserCheck, Clipboard,
  Award as AwardIcon, CalendarDays, Trophy as TrophyIcon,
  ExternalLink, Star as StarIcon,
  TrendingUp, Activity, Target as TargetIcon,
  AlertTriangle, Info, Shield as ShieldIcon,
  CreditCard, FileCheck, Users as UsersIcon2,
  Bell as BellIcon, Flag, Medal, Coins,
  RefreshCw, CheckSquare, XCircle,
  ChevronDown, ChevronUp, DownloadCloud,
  UploadCloud, Link as LinkIcon, Copy,
  EyeOff, Database, Cpu, Zap as ZapIcon,
  Layers, Grid, Package, Box,
  Archive, ShieldCheck, ShieldAlert,
  UserMinus, UserX, UserCheck as UserCheckIcon,
  MessageCircle, Heart, Share2,
  BarChart as BarChartIcon, PieChart,
  TrendingDown, DollarSign, CreditCard as CreditCardIcon,
  FileSpreadsheet, FileCode, FileJson,
  HardDrive, Server, Database as DatabaseIcon,
  Cpu as CpuIcon, Wifi, WifiOff,
  Cloud, CloudOff, CloudRain,
  Sun, Moon, Sunrise,
  Sunset, Wind, Droplets,
  Thermometer, ThermometerSun, ThermometerSnowflake,
  Umbrella, CloudLightning, CloudSnow,
  CloudFog, CloudDrizzle, CloudHail,
  CloudSleet, Tornado, Hurricane,
  Earthquake, Volcano, Flood,
  Fire, Snowflake, Haze,
  Mist, Dust, Smoke,
  AirVent, Fan, ThermometerIcon
} from "lucide-react";
import api from "../services/api";

// Importar componentes de gestión (debes crearlos)
import TournamentEquipos from "./TournamentEquipos";
import TournamentNoticias from "./TournamentNoticias";
import TournamentPartidos from './TournamentPartidos';
import TournamentPosiciones from './TournamentPosiciones';

// 🔥 AQUÍ AÑADÍ LA FUNCIÓN getSportEmoji - MUEVE ESTO ARRIBA
const getSportEmoji = (sportType) => {
  switch(sportType) {
    case "FOOTBALL": return "⚽";
    case "BASKETBALL": return "🏀";
    case "VOLLEYBALL": return "🏐";
    case "TENNIS": return "🎾";
    case "HANDBALL": return "🤾";
    case "ATHLETICS": return "🏃";
    case "SWIMMING": return "🏊";
    default: return "🏆";
  }
};

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("gestion");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    totalNews: 0,
    totalPlayers: 0
  });

  useEffect(() => {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Verificar si es ADMIN
        if (parsedUser.role !== 'ADMIN') {
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
        return;
      }
    } else {
      navigate("/login");
      return;
    }
    
    fetchTournament();
    
    // Verificar query params para tab activo
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["gestion", "posiciones", "partidos", "equipos", "noticias", "config"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [id, location.search, navigate]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log(`🔍 Obteniendo torneo ${id}...`);
      const response = await api.get(`/tournaments/${id}`);
      console.log("📊 Respuesta del torneo:", response.data);
      
      if (response.data && response.data.success) {
        // ✅ CORRECCIÓN: Tu backend devuelve {success: true, data: {...}}
        const tournamentData = response.data.data;
        
        if (!tournamentData) {
          setError("Torneo no encontrado");
          return;
        }
        
        setTournament(tournamentData);
        
        // Calcular estadísticas
        const totalTeams = tournamentData.categories?.reduce((sum, cat) => 
          sum + (cat.teams?.length || 0), 0) || 0;
        
        const totalMatches = tournamentData._count?.matches || 0;
        const totalNews = tournamentData._count?.news || 0;
        
        setStats({
          totalTeams,
          totalMatches,
          totalNews,
          totalPlayers: 0 // Podrías calcular esto si tienes la data
        });
        
      } else {
        setError("Error al cargar el torneo");
      }
    } catch (error) {
      console.error("❌ Error fetching tournament:", error);
      setError("No se pudo cargar el torneo. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/tournaments/${id}`);
      
      if (response.data && response.data.success) {
        navigate('/torneos');
      } else {
        alert("Error al eliminar el torneo: " + (response.data?.error || ""));
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      alert("Error al eliminar el torneo");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await api.patch(`/tournaments/${id}`, {
        status: newStatus
      });
      
      if (response.data && response.data.success) {
        setTournament(prev => ({ ...prev, status: newStatus }));
        setSuccessMessage(`✅ Estado actualizado a: ${getStatusText(newStatus)}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar estado");
    }
  };

  const statusConfig = {
    PLANNING: { 
      text: 'Planificación', 
      color: 'bg-blue-500/20 text-blue-600 border border-blue-200',
      icon: <Calendar className="w-4 h-4" />,
      actions: ["ONGOING", "CANCELLED"],
      description: "El torneo está en fase de preparación"
    },
    ONGOING: { 
      text: 'En Curso', 
      color: 'bg-green-500/20 text-green-600 border border-green-200',
      icon: <Zap className="w-4 h-4" />,
      actions: ["COMPLETED", "CANCELLED"],
      description: "El torneo está activo y en desarrollo"
    },
    COMPLETED: { 
      text: 'Finalizado', 
      color: 'bg-gray-500/20 text-gray-600 border border-gray-200',
      icon: <CheckCircle className="w-4 h-4" />,
      actions: ["PLANNING"],
      description: "El torneo ha concluido exitosamente"
    },
    CANCELLED: { 
      text: 'Cancelado', 
      color: 'bg-red-500/20 text-red-600 border border-red-200',
      icon: <AlertCircle className="w-4 h-4" />,
      actions: ["PLANNING"],
      description: "El torneo ha sido cancelado"
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

  // REMOVÍ LA getSportEmoji DE AQUÍ (la moví arriba fuera del componente principal)

  // Funciones de gestión rápida para admin
  const adminQuickActions = [
    { 
      id: "gestion-equipos", 
      label: "Gestionar Equipos", 
      icon: <Users2 className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-600",
      action: () => setActiveTab("equipos"),
      description: "Agregar, editar y eliminar equipos"
    },
    { 
      id: "gestion-partidos", 
      label: "Gestionar Partidos", 
      icon: <Gamepad2 className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600",
      action: () => setActiveTab("partidos"),
      description: "Programar partidos y reportar resultados"
    },
    { 
      id: "publicar-noticia", 
      label: "Publicar Comunicado", 
      icon: <Newspaper className="w-6 h-6" />,
      color: "from-amber-500 to-yellow-600",
      action: () => navigate(`/torneos/${id}/noticias/nueva`),
      description: "Crear anuncios y noticias del torneo"
    },
    { 
      id: "ver-posiciones", 
      label: "Ver Posiciones", 
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-purple-500 to-violet-600",
      action: () => setActiveTab("posiciones"),
      description: "Tablas de posiciones y estadísticas"
    }
  ];

  const gestionTabs = [
    { id: "gestion", label: "📋 Gestión", icon: <Clipboard className="w-5 h-5" /> },
    { id: "posiciones", label: "📊 Posiciones", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "partidos", label: "⚽ Partidos", icon: <Gamepad2 className="w-5 h-5" /> },
    { id: "equipos", label: "👥 Equipos", icon: <Users2 className="w-5 h-5" /> },
    { id: "noticias", label: "📢 Comunicados", icon: <Newspaper className="w-5 h-5" /> },
    { id: "config", label: "⚙️ Configuración", icon: <Settings className="w-5 h-5" /> }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return 'Sin fechas definidas';
    if (!endDate) return `Desde ${formatDate(startDate)}`;
    if (!startDate) return `Hasta ${formatDate(endDate)}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-unjma-primary/20 border-t-unjma-primary rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-900 text-xl font-medium">Cargando torneo...</p>
          <p className="text-gray-600 text-sm mt-2">Preparando panel de gestión</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md text-center shadow-lg">
          <div className="text-8xl mb-6 text-gray-300">🏆</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Torneo no encontrado</h2>
          <p className="text-gray-600 mb-6">{error || "El torneo que buscas no existe o no tienes acceso."}</p>
          <div className="flex flex-col gap-3">
            <Link 
              to="/torneos" 
              className="inline-flex items-center justify-center px-8 py-4 bg-unjma-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md"
            >
              <ArrowLeft className="w-6 h-6 mr-3" />
              Volver a Torneos
            </Link>
            <button 
              onClick={fetchTournament}
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-6 h-6 mr-3" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[tournament.status] || statusConfig.PLANNING;
  const isAdmin = user?.role === 'ADMIN' || user?.id === tournament.userId;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md text-center shadow-lg">
          <div className="text-8xl mb-6 text-red-300">🚫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Acceso denegado</h2>
          <p className="text-gray-600 mb-8">No tienes permisos para gestionar este torneo.</p>
          <Link 
            to="/torneos" 
            className="inline-flex items-center px-8 py-4 bg-unjma-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md"
          >
            <ArrowLeft className="w-6 h-6 mr-3" />
            Volver a Torneos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">¿Eliminar torneo?</h3>
            <p className="text-gray-600 mb-6 text-center">
              Esta acción eliminará permanentemente <strong>"{tournament.name}"</strong> y todos sus datos asociados.
              <br />
              <span className="text-red-500 font-semibold mt-2 block">¡Esta acción no se puede deshacer!</span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Notificación de éxito */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-100 text-green-800 border border-green-200 rounded-xl shadow-lg animate-slideIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header - Panel de Gestión */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb y Navegación */}
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Link 
                    to="/torneos" 
                    className="flex items-center text-gray-600 hover:text-unjma-primary transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-medium">Volver a Torneos</span>
                  </Link>
                  <ChevronRight className="w-4 h-4 mx-3 text-gray-400" />
                  <span className="text-gray-900 font-semibold truncate max-w-xs md:max-w-md">
                    {tournament.name}
                  </span>
                </div>

                {/* Acciones del Admin */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={fetchTournament}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Actualizar datos"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Actualizar</span>
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowConfigMenu(!showConfigMenu)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="hidden md:inline">Configurar</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showConfigMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                        <div className="py-2">
                          <button 
                            onClick={() => navigate(`/torneos/${id}/editar`)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Edit className="w-4 h-4" />
                            Editar Información
                          </button>
                          <button 
                            onClick={() => setActiveTab("config")}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Settings className="w-4 h-4" />
                            Configuración Avanzada
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Torneo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full ${
                    isAdmin && tournament.userId === user?.id
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdmin && tournament.userId === user?.id ? (
                      <>
                        <Crown className="w-4 h-4" />
                        <span>Organizador</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Administrador</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Header Principal del Torneo */}
            <div className="pb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                      {tournament.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </span>
                      
                      {tournament.type === "MULTI_CATEGORY" && (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          <Layers className="w-4 h-4" />
                          {tournament.maxSports || 2} Categorías
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        tournament.isPublic 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {tournament.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {tournament.isPublic ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>
                  
                  {tournament.description && (
                    <p className="text-gray-600 text-lg mb-6 max-w-3xl">
                      {tournament.description}
                    </p>
                  )}

                  {/* Información clave */}
                  <div className="flex flex-wrap gap-3">
                    {tournament.location && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{tournament.location}</span>
                      </div>
                    )}
                    
                    {(tournament.startDate || tournament.endDate) && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatDateRange(tournament.startDate, tournament.endDate)}
                        </span>
                      </div>
                    )}
                    
                    {tournament.sportType && tournament.type === "SINGLE_CATEGORY" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <span className="text-xl">{getSportEmoji(tournament.sportType)}</span>
                        <span className="text-gray-700 capitalize">
                          {tournament.sportType.toLowerCase()}
                        </span>
                      </div>
                    )}
                    
                    {tournament.phaseType && tournament.type === "SINGLE_CATEGORY" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <TrophyIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 capitalize">
                          {tournament.phaseType === "LEAGUE" ? "Liga" : 
                           tournament.phaseType === "KNOCKOUT" ? "Eliminatoria" : "Mixto"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="flex gap-6 flex-shrink-0">
                  {[
                    { 
                      label: "Equipos", 
                      value: stats.totalTeams,
                      icon: <Shield className="w-5 h-5" />,
                      color: "text-blue-600"
                    },
                    { 
                      label: "Partidos", 
                      value: stats.totalMatches,
                      icon: <Gamepad2 className="w-5 h-5" />,
                      color: "text-green-600"
                    },
                    { 
                      label: "Comunicados", 
                      value: stats.totalNews,
                      icon: <Newspaper className="w-5 h-5" />,
                      color: "text-amber-600"
                    },
                    { 
                      label: "Categorías", 
                      value: tournament.categories?.length || 0,
                      icon: <Tag className="w-5 h-5" />,
                      color: "text-purple-600"
                    }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cambio rápido de estado (solo admin) */}
          {status.actions && status.actions.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Cambiar estado del torneo</h3>
                    <p className="text-sm text-gray-600">{status.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {status.actions.map(actionStatus => (
                    <button
                      key={actionStatus}
                      onClick={() => handleUpdateStatus(actionStatus)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        actionStatus === "ONGOING" 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : actionStatus === "COMPLETED"
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : actionStatus === "CANCELLED"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {getStatusText(actionStatus)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navegación por Pestañas - Modo Gestión */}
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                {gestionTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-unjma-primary to-blue-600 text-white shadow-sm' 
                        : 'text-gray-700 hover:text-unjma-primary hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Actualizar URL sin recargar
                      const newUrl = new URL(window.location);
                      newUrl.searchParams.set('tab', tab.id);
                      window.history.pushState({}, '', newUrl);
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones Rápidas para Admin */}
          {activeTab === "gestion" && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones de Gestión</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {adminQuickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-unjma-primary hover:shadow-md transition-all duration-300 group text-left"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-unjma-primary transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contenido de la Pestaña Activa */}
          <div className="mb-12">
            {activeTab === "gestion" && <TournamentGestionComponent tournament={tournament} isAdmin={isAdmin} stats={stats} />}
            {activeTab === "posiciones" && <TournamentPosiciones tournament={tournament} />}
            {activeTab === "partidos" && <TournamentPartidos tournament={tournament} />}
            {activeTab === "equipos" && <TournamentEquipos tournament={tournament} />}
            {activeTab === "noticias" && <TournamentNoticias tournament={tournament} />}
            {activeTab === "config" && isAdmin && <TournamentConfig tournament={tournament} />}
          </div>
        </div>
      </div>
    </>
  );
}

// Componente de Gestión Principal - RENOMBRADO a TournamentGestionComponent
function TournamentGestionComponent({ tournament, isAdmin, stats }) {
  const navigate = useNavigate();
  
  // Próximos partidos (datos de ejemplo)
  const upcomingMatches = [
    {
      id: 1,
      homeTeam: { name: "Ingeniería FC", shortName: "ING" },
      awayTeam: { name: "Medicina United", shortName: "MED" },
      date: new Date(Date.now() + 86400000).toISOString(),
      venue: "Estadio Universitario",
      phase: { name: "Fase de Grupos" },
      group: { name: "Grupo A" }
    },
    {
      id: 2,
      homeTeam: { name: "Arquitectura SC", shortName: "ARQ" },
      awayTeam: { name: "Derecho FC", shortName: "DER" },
      date: new Date(Date.now() + 172800000).toISOString(),
      venue: "Coliseo Principal",
      phase: { name: "Fase de Grupos" },
      group: { name: "Grupo B" }
    }
  ];

  // Tareas pendientes (datos de ejemplo)
  const pendingTasks = [
    { id: 1, title: 'Registrar resultados de partidos', completed: false, priority: 'high' },
    { id: 2, title: 'Actualizar posiciones de grupos', completed: true, priority: 'medium' },
    { id: 3, title: 'Enviar comunicado a equipos clasificados', completed: false, priority: 'medium' },
    { id: 4, title: 'Verificar documentación de equipos', completed: false, priority: 'low' },
  ];

  // Estadísticas detalladas
  const detailedStats = [
    { 
      label: 'Equipos registrados', 
      value: stats.totalTeams, 
      change: '+2 esta semana', 
      color: 'blue',
      icon: <Users2 className="w-5 h-5" />
    },
    { 
      label: 'Partidos jugados', 
      value: stats.totalMatches, 
      change: 'Por jugar: 12', 
      color: 'green',
      icon: <Gamepad2 className="w-5 h-5" />
    },
    { 
      label: 'Comunicados', 
      value: stats.totalNews, 
      change: 'Último: hace 2 días', 
      color: 'amber',
      icon: <Newspaper className="w-5 h-5" />
    },
    { 
      label: 'Categorías activas', 
      value: tournament.categories?.length || 0, 
      change: tournament.type === "SINGLE_CATEGORY" ? "1 deporte" : `${tournament.maxSports} deportes`, 
      color: 'purple',
      icon: <Layers className="w-5 h-5" />
    },
    { 
      label: 'Seguidores', 
      value: tournament._count?.followers || 0, 
      change: '+5 esta semana', 
      color: 'pink',
      icon: <Star className="w-5 h-5" />
    },
    { 
      label: 'Likes', 
      value: tournament._count?.likes || 0, 
      change: '+12 esta semana', 
      color: 'red',
      icon: <Heart className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Grid de Estadísticas Detalladas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Estadísticas del Torneo</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {detailedStats.map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  stat.color === 'red' ? 'bg-red-100 text-red-600' :
                  stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'
                }`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className={`text-xs font-medium ${
                stat.color === 'green' ? 'text-green-600' :
                stat.color === 'red' ? 'text-red-600' :
                stat.color === 'amber' ? 'text-amber-600' :
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'purple' ? 'text-purple-600' : 'text-pink-600'
              }`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel Izquierdo - Próximos Eventos y Tareas */}
        <div className="space-y-8">
          {/* Próximos Partidos */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Próximos Partidos</h2>
              <button 
                onClick={() => navigate(`/torneos/${tournament.id}/partidos`)}
                className="text-sm text-unjma-primary hover:text-blue-600 font-medium flex items-center"
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div 
                  key={match.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/torneos/${tournament.id}/partidos`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500">
                      {match.phase.name} • {match.group.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(match.date).toLocaleDateString('es-ES', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-blue-700">{match.homeTeam.shortName}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{match.homeTeam.name}</div>
                        <div className="text-xs text-gray-500">Local</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">VS</div>
                      <div className="text-xs text-gray-500 mt-1">{match.venue}</div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 text-right">{match.awayTeam.name}</div>
                        <div className="text-xs text-gray-500 text-right">Visitante</div>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-red-700">{match.awayTeam.shortName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {upcomingMatches.length === 0 && (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay partidos programados</p>
                  <button 
                    onClick={() => navigate(`/torneos/${tournament.id}/partidos/nuevo`)}
                    className="mt-3 text-unjma-primary hover:text-blue-600 font-medium"
                  >
                    Programar primer partido
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tareas Pendientes</h2>
              <span className="text-sm text-gray-500">{pendingTasks.filter(t => !t.completed).length} pendientes</span>
            </div>
            
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <button
                    onClick={() => {
                      // Marcar como completado/incompletado
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 hover:bg-green-600' 
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                  </button>
                  
                  <div className="flex-grow">
                    <span className={`${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {task.title}
                    </span>
                    <div className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full ml-2 ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </div>
                  </div>
                  
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {/* Agregar nueva tarea */}}
              className="w-full mt-4 py-2.5 text-center text-unjma-primary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Añadir nueva tarea
            </button>
          </div>
        </div>

        {/* Panel Derecho - Información y Acciones */}
        <div className="space-y-8">
          {/* Información del Torneo */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Información General</h2>
              {isAdmin && (
                <button 
                  onClick={() => navigate(`/torneos/${tournament.id}/editar`)}
                  className="flex items-center gap-2 px-3 py-1.5 text-unjma-primary hover:text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Organizador */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-unjma-primary to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  {tournament.user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-gray-900">{tournament.user?.name || 'Administrador'}</div>
                  <div className="text-sm text-gray-500">Organizador principal</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Administrador
                    </span>
                    <span className="text-xs text-gray-500">
                      Creado el {new Date(tournament.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorías */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Categorías Activas</h3>
                <div className="space-y-3">
                  {tournament.categories?.slice(0, 3).map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center">
                          <span className="text-xl">{getSportEmoji(category.sportType)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">
                            {category.teams?.length || 0} equipos • {category._count?.matches || 0} partidos
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/torneos/${tournament.id}/categorias/${category.id}`)}
                        className="text-sm text-unjma-primary hover:text-blue-600 font-medium"
                      >
                        Gestionar
                      </button>
                    </div>
                  ))}
                  
                  {(!tournament.categories || tournament.categories.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No hay categorías configuradas</p>
                    </div>
                  )}
                  
                  {tournament.categories && tournament.categories.length > 3 && (
                    <div className="text-center pt-2">
                      <button 
                        onClick={() => navigate(`/torneos/${tournament.id}/categorias`)}
                        className="text-sm text-unjma-primary hover:text-blue-600 font-medium"
                      >
                        + Ver {tournament.categories.length - 3} categorías más
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones de Exportación */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Exportar Datos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {/* Exportar PDF */}}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Reporte PDF</span>
                  </button>
                  <button 
                    onClick={() => {/* Exportar CSV */}}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Datos CSV</span>
                  </button>
                  <button 
                    onClick={() => {/* Imprimir */}}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </button>
                  <button 
                    onClick={() => {/* Compartir */}}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Comunicados */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Últimos Comunicados</h2>
              <button 
                onClick={() => navigate(`/torneos/${tournament.id}/noticias`)}
                className="text-sm text-unjma-primary hover:text-blue-600 font-medium flex items-center"
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-4">
              {tournament.news?.slice(0, 2).map((news) => (
                <div 
                  key={news.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-200 hover:bg-amber-50/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/torneos/${tournament.id}/noticias/${news.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{news.title}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{news.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(news.createdAt).toLocaleDateString('es-ES')}</span>
                        <span>{news.user?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!tournament.news || tournament.news.length === 0) && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay comunicados publicados</p>
                  <button 
                    onClick={() => navigate(`/torneos/${tournament.id}/noticias/nueva`)}
                    className="mt-3 text-unjma-primary hover:text-blue-600 font-medium"
                  >
                    Publicar primer comunicado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Configuración
function TournamentConfig({ tournament }) {
  const [formData, setFormData] = useState({
    name: tournament.name,
    description: tournament.description || '',
    location: tournament.location || '',
    startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
    endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
    isPublic: tournament.isPublic,
    status: tournament.status,
    maxSports: tournament.maxSports || 1
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const response = await api.patch(`/tournaments/${tournament.id}`, formData);
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Recargar después de guardar
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setError(response.data?.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "ONGOING": return "En curso";
      case "PLANNING": return "Planificación";
      case "COMPLETED": return "Completado";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Torneo</h2>
          <p className="text-gray-600 mt-1">Configura los parámetros principales del torneo</p>
        </div>
        
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg animate-fadeIn">
            <CheckCircle className="w-4 h-4" />
            Cambios guardados
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg animate-fadeIn">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Torneo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación Principal
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
                placeholder="Estadio o Coliseo"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors resize-none"
              placeholder="Descripción del torneo para participantes y espectadores..."
            />
          </div>
        </div>

        {/* Calendario */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Calendario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Finalización
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Configuraciones Avanzadas */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Configuraciones Avanzadas</h3>
          
          <div className="space-y-6">
            {/* Visibilidad */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <div className="font-medium text-gray-900">Torneo Público</div>
                <div className="text-sm text-gray-500">Visible para todos los usuarios</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unjma-primary"></div>
              </label>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Torneo
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
              >
                <option value="PLANNING">Planificación</option>
                <option value="ONGOING">En Curso</option>
                <option value="COMPLETED">Finalizado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Actual: <span className="font-medium">{getStatusText(tournament.status)}</span>
              </p>
            </div>

            {/* Tipo de Torneo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Torneo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, maxSports: 1 }))}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    formData.maxSports <= 1 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-transparent shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.maxSports <= 1 ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <div className="font-medium">Categoría Única</div>
                      <div className="text-xs opacity-90 mt-1">1 deporte</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, maxSports: 3 }))}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    formData.maxSports > 1 
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-transparent shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.maxSports > 1 ? 'bg-white/20' : 'bg-purple-100'
                    }`}>
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <div className="font-medium">Múltiples Categorías</div>
                      <div className="text-xs opacity-90 mt-1">2-3 deportes</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {formData.maxSports > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número Máximo de Deportes
                </label>
                <select
                  name="maxSports"
                  value={formData.maxSports}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary transition-colors"
                >
                  <option value="2">2 Deportes</option>
                  <option value="3">3 Deportes</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-unjma-primary to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Estilos CSS para animaciones
const styles = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}