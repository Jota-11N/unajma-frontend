import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Newspaper, Plus, Filter, Search, Eye, EyeOff, 
  Calendar, User, Globe, Lock,
  Share2, Heart, MessageCircle, MoreVertical,
  TrendingUp, Trophy, AlertCircle, X,
  Download, ExternalLink, Clock, BarChart3,
  Trash2, Edit3, CheckCircle
} from "lucide-react";
import api from "../services/api";

export default function AllNews() {
  const [allNews, setAllNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    today: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Verificar si es ADMIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        
        // Si no es admin, redirigir
        if (user.role !== 'ADMIN') {
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      // Si no hay usuario, redirigir al login
      navigate("/login");
      return;
    }
    
    fetchAllData();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [allNews, filter, searchTerm, selectedTournament]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Obtener noticias desde el endpoint correcto
      // En tu backend, las noticias se obtienen por torneo, necesitamos obtener todas
      // Primero obtenemos los torneos
      console.log("🔍 Obteniendo datos completos...");
      
      // 1. Obtener torneos (como ADMIN)
      const tournamentsResponse = await api.get("/tournaments");
      console.log("📊 Respuesta torneos:", tournamentsResponse.data);
      
      let tournamentsData = [];
      if (tournamentsResponse.data && tournamentsResponse.data.success && tournamentsResponse.data.data) {
        tournamentsData = tournamentsResponse.data.data;
      } else if (tournamentsResponse.data && Array.isArray(tournamentsResponse.data)) {
        tournamentsData = tournamentsResponse.data;
      }
      
      setTournaments(tournamentsData);
      console.log("🏆 Torneos cargados:", tournamentsData.length);
      
      // 2. Obtener noticias de CADA torneo (solo torneos que puede ver el admin)
      const allNewsArray = [];
      
      for (const tournament of tournamentsData) {
        try {
          console.log(`📰 Obteniendo noticias del torneo ${tournament.id}: ${tournament.name}`);
          const newsResponse = await api.get(`/tournaments/${tournament.id}/news`);
          
          let tournamentNews = [];
          if (newsResponse.data && Array.isArray(newsResponse.data)) {
            tournamentNews = newsResponse.data;
          }
          
          // Agregar información del torneo a cada noticia
          const enrichedNews = tournamentNews.map(news => ({
            ...news,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              sportType: tournament.sportType,
              status: tournament.status
            }
          }));
          
          allNewsArray.push(...enrichedNews);
          console.log(`✅ ${enrichedNews.length} noticias del torneo ${tournament.name}`);
          
        } catch (tournamentError) {
          console.warn(`⚠️ No se pudieron obtener noticias del torneo ${tournament.id}:`, tournamentError);
        }
      }
      
      console.log("📊 Total de noticias obtenidas:", allNewsArray.length);
      
      if (allNewsArray.length === 0) {
        console.warn("⚠️ No hay noticias, usando datos de ejemplo");
        setExampleData();
      } else {
        // Ordenar por fecha descendente
        allNewsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllNews(allNewsArray);
        calculateStats(allNewsArray);
      }
      
    } catch (error) {
      console.error("❌ Error en fetchAllData:", error);
      setError("Error al cargar las noticias. Verifica tu conexión.");
      setExampleData();
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (newsArray) => {
    const today = new Date().toISOString().split('T')[0];
    const todayNews = newsArray.filter(news => 
      news.createdAt && new Date(news.createdAt).toISOString().split('T')[0] === today
    );
    
    setStats({
      total: newsArray.length,
      published: newsArray.filter(n => n.isPublic).length,
      drafts: newsArray.filter(n => !n.isPublic).length,
      today: todayNews.length
    });
  };

  const setExampleData = () => {
    const exampleNews = [
      {
        id: 1,
        title: "Inicio del Torneo Interfacultades 2024",
        content: "El torneo dará inicio el próximo lunes con la participación de 12 equipos...",
        image: "",
        isPublic: true,
        createdAt: new Date().toISOString(),
        userId: 1,
        tournamentId: 1,
        user: { id: 1, name: "Administrador", email: "admin@unjma.edu.pe" },
        tournament: { id: 1, name: "Torneo Interfacultades 2024", sportType: "FOOTBALL" },
        _count: { likes: 5, comments: 3 }
      },
      {
        id: 2,
        title: "Cambio de horario - Semifinales",
        content: "Los partidos de semifinales se han reprogramado para el sábado...",
        image: "",
        isPublic: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        userId: 2,
        tournamentId: 1,
        user: { id: 2, name: "Coordinador Deportivo", email: "deportes@unjma.edu.pe" },
        tournament: { id: 1, name: "Torneo Interfacultades 2024", sportType: "FOOTBALL" },
        _count: { likes: 8, comments: 2 }
      }
    ];
    
    const exampleTournaments = [
      { id: 1, name: "Torneo Interfacultades 2024", sportType: "FOOTBALL", status: "ONGOING" },
      { id: 2, name: "Copa UNAJMA Fútbol", sportType: "FOOTBALL", status: "PLANNING" }
    ];
    
    setAllNews(exampleNews);
    setTournaments(exampleTournaments);
    calculateStats(exampleNews);
  };

  const applyFilters = () => {
    let filtered = [...allNews];
    
    // Filtrar por estado
    if (filter === "published") {
      filtered = filtered.filter(n => n.isPublic);
    } else if (filter === "drafts") {
      filtered = filtered.filter(n => !n.isPublic);
    }
    
    // Filtrar por torneo
    if (selectedTournament !== "all") {
      filtered = filtered.filter(n => n.tournament?.id == selectedTournament);
    }
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchLower) ||
        n.content?.toLowerCase().includes(searchLower) ||
        n.user?.name?.toLowerCase().includes(searchLower) ||
        n.tournament?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredNews(filtered);
  };

  const handleCreateNews = () => {
    if (tournaments.length === 0) {
      alert("Primero debes crear un torneo");
      navigate("/torneos?create=true");
      return;
    }
    
    if (tournaments.length === 1) {
      // Si solo hay un torneo, ir directamente
      navigate(`/torneos/${tournaments[0].id}?create_news=true`);
    } else {
      // Si hay múltiples torneos, mostrar modal
      setShowCreateModal(true);
    }
  };

  const handleSelectTournamentForNews = (tournamentId) => {
    setShowCreateModal(false);
    navigate(`/torneos/${tournamentId}?create_news=true`);
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log(`🗑️ Eliminando noticia ${newsId}...`);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSuccessMessage("✅ Noticia eliminada correctamente");
        // Eliminar de la lista local
        setAllNews(prev => prev.filter(news => news.id !== newsId));
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar");
      }
    } catch (error) {
      console.error("❌ Error eliminando noticia:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleNewsVisibility = async (newsId, currentVisibility) => {
    try {
      console.log(`🔄 Cambiando visibilidad de noticia ${newsId}...`);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/news/${newsId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !currentVisibility
        })
      });
      
      if (response.ok) {
        setSuccessMessage(`✅ Noticia ${!currentVisibility ? 'publicada' : 'ocultada'} correctamente`);
        
        // Actualizar en la lista local
        setAllNews(prev => prev.map(news => 
          news.id === newsId 
            ? { ...news, isPublic: !currentVisibility }
            : news
        ));
        
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("❌ Error actualizando noticia:", error);
      alert("Error al actualizar la noticia");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
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

  const getStatusColor = (status) => {
    switch(status) {
      case "ONGOING": return "bg-green-100 text-green-800";
      case "PLANNING": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando comunicados...</p>
          <p className="text-sm text-gray-500 mt-2">Obteniendo todas las noticias de los torneos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                  <Newspaper className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Comunicados y Noticias</h1>
                  <p className="text-gray-600 mt-1">Todas las noticias de todos los torneos</p>
                </div>
              </div>
              
              {/* Estadísticas rápidas */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{stats.total}</span> noticias totales
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{stats.published}</span> publicadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{stats.drafts}</span> borradores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{stats.today}</span> hoy
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleCreateNews}
                disabled={tournaments.length === 0}
                className={`px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                  tournaments.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-violet-700'
                }`}
              >
                <Plus className="w-5 h-5" />
                Nueva Noticia
              </button>
              <button 
                onClick={fetchAllData}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes de estado */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {successMessage}
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Panel de Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtro por torneo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Trophy className="w-4 h-4 inline mr-2" />
                Filtrar por torneo
              </label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos los torneos</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({getSportIcon(t.sportType)} {t.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Estado de noticia
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    filter === "all" 
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter("published")}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    filter === "published" 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span className="hidden sm:inline">Publicadas</span>
                  </div>
                </button>
                <button
                  onClick={() => setFilter("drafts")}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    filter === "drafts" 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <EyeOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Borradores</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar noticias
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, contenido o autor..."
                  className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Resultados del filtro */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{filteredNews.length}</span> de <span className="font-semibold text-gray-900">{allNews.length}</span> noticias
              </div>
              <div className="text-sm text-gray-500">
                {selectedTournament !== "all" && (
                  <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    Torneo: {tournaments.find(t => t.id == selectedTournament)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Noticias */}
        <div className="mb-8">
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(noticia => (
                <div 
                  key={noticia.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md overflow-hidden group ${
                    noticia.isPublic ? 'border-green-100 hover:border-green-300' : 'border-yellow-100 hover:border-yellow-300'
                  }`}
                >
                  {/* Encabezado con torneo y estado */}
                  <div className={`px-4 py-2 flex justify-between items-center ${
                    noticia.isPublic ? 'bg-green-50' : 'bg-yellow-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        noticia.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {noticia.isPublic ? (
                          <><Eye className="w-3 h-3 inline mr-1" /> Pública</>
                        ) : (
                          <><EyeOff className="w-3 h-3 inline mr-1" /> Borrador</>
                        )}
                      </span>
                      <span className="text-xs text-gray-600">
                        {noticia.tournament && getSportIcon(noticia.tournament.sportType)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(noticia.createdAt)}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {noticia.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {noticia.content}
                    </p>

                    {/* Información del torneo */}
                    {noticia.tournament && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center">
                              <Trophy className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                {noticia.tournament.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(noticia.tournament.status)}`}>
                                  {noticia.tournament.status === "ONGOING" ? "En curso" : 
                                   noticia.tournament.status === "PLANNING" ? "Planificación" : "Finalizado"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getSportIcon(noticia.tournament.sportType)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link 
                            to={`/torneos/${noticia.tournament.id}/noticias`}
                            className="text-xs text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                          >
                            Ver
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Autor e interacciones */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold">
                          {noticia.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {noticia.user?.name || 'Administrador'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {noticia.user?.email || 'autor@example.com'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1 text-gray-500" title="Me gusta">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{noticia._count?.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500" title="Comentarios">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{noticia._count?.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <Link 
                        to={`/torneos/${noticia.tournament?.id || ''}`}
                        className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver torneo
                      </Link>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleNewsVisibility(noticia.id, noticia.isPublic)}
                          className={`text-xs px-3 py-1 rounded-lg font-medium ${
                            noticia.isPublic
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                          title={noticia.isPublic ? "Hacer borrador" : "Publicar"}
                        >
                          {noticia.isPublic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        
                        <button 
                          onClick={() => navigate(`/torneos/${noticia.tournament?.id}?edit_news=${noticia.id}`)}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 flex items-center gap-1"
                          title="Editar"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteNews(noticia.id)}
                          disabled={isDeleting}
                          className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
                          title="Eliminar"
                        >
                          {isDeleting ? (
                            <div className="w-3 h-3 border-2 border-red-800 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Newspaper className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || selectedTournament !== "all" || filter !== "all" 
                  ? "No hay resultados" 
                  : "No hay noticias aún"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No se encontraron noticias para "${searchTerm}"`
                  : selectedTournament !== "all"
                  ? `El torneo seleccionado no tiene noticias ${filter !== "all" ? "con ese estado" : ""}`
                  : "Crea la primera noticia para tus torneos"
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleCreateNews}
                  disabled={tournaments.length === 0}
                  className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg ${
                    tournaments.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-violet-700'
                  }`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primera Noticia
                </button>
                {(searchTerm || selectedTournament !== "all" || filter !== "all") && (
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTournament("all");
                      setFilter("all");
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel de análisis */}
        {allNews.length > 0 && (
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumen de Comunicados
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-300">Total noticias</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="text-2xl font-bold">
                  {tournaments.filter(t => allNews.some(n => n.tournament?.id === t.id)).length}
                </div>
                <div className="text-sm text-gray-300">Torneos con noticias</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="text-2xl font-bold">
                  {allNews.length > 0 
                    ? Math.round((stats.published / stats.total) * 100) + '%'
                    : '0%'
                  }
                </div>
                <div className="text-sm text-gray-300">Tasa de publicación</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                <div className="text-2xl font-bold">
                  {allNews.length > 0
                    ? new Date(Math.max(...allNews.map(n => new Date(n.createdAt).getTime())))
                      .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : '-'
                  }
                </div>
                <div className="text-sm text-gray-300">Última publicación</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para seleccionar torneo para nueva noticia */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nueva Noticia
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona el torneo donde quieres publicar
              </p>
            </div>
            
            <div className="p-6">
              {tournaments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tournaments.map(tournament => (
                    <button
                      key={tournament.id}
                      onClick={() => handleSelectTournamentForNews(tournament.id)}
                      className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900 truncate">
                          {tournament.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full ${getStatusColor(tournament.status)}`}>
                            {tournament.status === "ONGOING" ? "En curso" : 
                             tournament.status === "PLANNING" ? "Planificación" : "Finalizado"}
                          </span>
                          <span>{getSportIcon(tournament.sportType)}</span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No tienes torneos creados</p>
                  <p className="text-xs text-gray-400 mb-6">Primero debes crear un torneo para poder publicar noticias</p>
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      navigate("/torneos?create=true");
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-violet-700 transition-colors"
                  >
                    Crear Torneo
                  </button>
                </div>
              )}
              
              {tournaments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}