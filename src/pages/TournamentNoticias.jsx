import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  Newspaper, Plus, Edit, Trash2, Eye, EyeOff,
  Calendar, User, ChevronDown, ChevronUp,
  AlertCircle, Check, X, Image as ImageIcon,
  Globe, Lock, Share2, Heart, MessageCircle,
  Bookmark, ExternalLink, MoreVertical,
  TrendingUp, Filter, Search, Download,
  RefreshCw, Users, BarChart3
} from "lucide-react";
import api from "../services/api";

export default function TournamentNoticias() {
  const { id } = useParams(); // Obtener ID del torneo desde la URL
  const [tournament, setTournament] = useState(null);
  const [news, setNews] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, published, drafts
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === 'ADMIN');
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    if (id) {
      fetchTournament();
      fetchNews();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      if (response.data && response.data.success) {
        setTournament(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tournament:", error);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      console.log("📰 Fetching news for tournament:", id);
      
      // ✅ CORRECCIÓN: Usar la ruta correcta del backend
      const response = await api.get(`/tournaments/${id}/news`);
      console.log("📦 News response:", response.data);
      
      if (Array.isArray(response.data)) {
        setNews(response.data);
      } else {
        console.warn("⚠️ Respuesta inesperada:", response.data);
        setNews([]);
      }
    } catch (error) {
      console.error("❌ Error fetching news:", error);
      setError("Error al cargar las noticias");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (noticia) => {
    setNewsToDelete(noticia);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!newsToDelete) return;

    try {
      await api.delete(`/news/${newsToDelete.id}`);
      
      // Eliminar de la lista localmente
      setNews(prev => prev.filter(n => n.id !== newsToDelete.id));
      
      // Mostrar notificación
      showNotification("✅ Noticia eliminada exitosamente", "success");
    } catch (error) {
      console.error("❌ Error deleting news:", error);
      showNotification("❌ Error al eliminar la noticia", "error");
    } finally {
      setShowConfirmModal(false);
      setNewsToDelete(null);
    }
  };

  const togglePublishStatus = async (noticia) => {
    try {
      const newStatus = !noticia.isPublic;
      
      const response = await api.patch(`/news/${noticia.id}`, {
        isPublic: newStatus
      });
      
      if (response.data) {
        // Actualizar en la lista localmente
        setNews(prev => prev.map(n => 
          n.id === noticia.id ? { ...n, isPublic: newStatus } : n
        ));
        
        showNotification(
          newStatus 
            ? "✅ Noticia publicada exitosamente" 
            : "📁 Noticia archivada como borrador",
          "success"
        );
      }
    } catch (error) {
      console.error("❌ Error updating news status:", error);
      showNotification("❌ Error al actualizar la noticia", "error");
    }
  };

  const filteredNews = news.filter(item => {
    // Filtrar por estado
    if (filter === "published" && !item.isPublic) return false;
    if (filter === "drafts" && item.isPublic) return false;
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.user?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // ✅ CORRECCIÓN: Usar lógica de permisos del backend
  const canManageNews = isAdmin || (user && tournament && tournament.userId === user.id);

  const showNotification = (message, type = "success") => {
    // Implementa tu sistema de notificaciones aquí
    alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
  };

  if (loading && !news.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando noticias...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Torneo no encontrado</h3>
          <p className="text-gray-600">El torneo que buscas no existe o no tienes acceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                Noticias del Torneo
              </h1>
              <p className="text-gray-600 mt-2">
                {tournament.name} • Mantente informado sobre las últimas novedades
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={fetchNews}
                className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
              
              {canManageNews && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Publicar Noticia
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="text-sm text-gray-500">
              {filteredNews.length} de {news.length} noticias
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === "all" 
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter("published")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === "published" 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Publicadas
                  </div>
                </button>
                {canManageNews && (
                  <button
                    onClick={() => setFilter("drafts")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filter === "drafts" 
                        ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Borradores
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Grid de Noticias */}
        <div className="mb-8">
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(noticia => (
                <NewsCard 
                  key={noticia.id} 
                  noticia={noticia} 
                  onDeleteClick={openDeleteConfirm}
                  onTogglePublish={togglePublishStatus}
                  canManage={canManageNews}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Newspaper className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || filter !== "all" 
                  ? "No se encontraron noticias" 
                  : "No hay noticias publicadas"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filter !== "all"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Sé el primero en compartir novedades del torneo"}
              </p>
              {canManageNews && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primera Noticia
                </button>
              )}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {news.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estadísticas de Noticias
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{news.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {news.filter(n => n.isPublic).length}
                </div>
                <div className="text-sm text-gray-600">Publicadas</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {news.filter(n => !n.isPublic).length}
                </div>
                <div className="text-sm text-gray-600">Borradores</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {news.reduce((acc, n) => acc + (n._count?.comments || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Comentarios</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear noticia */}
      {showCreateModal && (
        <CreateNewsModal
          tournamentId={id}
          onClose={() => setShowCreateModal(false)}
          onNewsCreated={() => {
            fetchNews();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {showConfirmModal && (
        <ConfirmDeleteModal
          noticia={newsToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setNewsToDelete(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Tarjeta de Noticia
function NewsCard({ noticia, onDeleteClick, onTogglePublish, canManage }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md overflow-hidden ${
      noticia.isPublic ? 'border-green-200' : 'border-yellow-200'
    }`}>
      {/* Imagen de la noticia */}
      {noticia.image && (
        <div className="h-48 overflow-hidden relative">
          <img 
            src={noticia.image} 
            alt={noticia.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.className = 'h-32 bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center';
              e.target.parentElement.innerHTML = '<Newspaper className="w-12 h-12 text-purple-400" />';
            }}
          />
        </div>
      )}

      <div className="p-6">
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              {noticia.isPublic ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Globe className="w-3 h-3" />
                  Público
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Lock className="w-3 h-3" />
                  Borrador
                </span>
              )}
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(noticia.createdAt)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
              {noticia.title}
            </h3>
          </div>
          
          {canManage && (
            <div className="relative flex-shrink-0 ml-2">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
              
              {showActions && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowActions(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => {
                        onTogglePublish(noticia);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 rounded-t-xl"
                    >
                      {noticia.isPublic ? (
                        <>
                          <EyeOff className="w-4 h-4 text-yellow-600" />
                          <span>Archivar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-green-600" />
                          <span>Publicar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteClick(noticia);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 rounded-b-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="mb-4">
          <p className={`text-gray-600 ${isExpanded ? '' : 'line-clamp-3'}`}>
            {noticia.content}
          </p>
          
          {noticia.content && noticia.content.length > 200 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Leer menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Leer más
                </>
              )}
            </button>
          )}
        </div>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold">
            {noticia.user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {noticia.user?.name || 'Anónimo'}
            </div>
            <div className="text-xs text-gray-500">Autor</div>
          </div>
        </div>

        {/* Interacciones */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-gray-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{noticia._count?.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{noticia._count?.comments || 0}</span>
            </div>
          </div>
          
          <span className="text-xs text-gray-500">
            {formatDate(noticia.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Modal para crear noticias
function CreateNewsModal({ tournamentId, onClose, onNewsCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("El título es requerido");
      return;
    }

    if (!formData.content.trim()) {
      setError("El contenido es requerido");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // ✅ CORRECCIÓN: Usar el endpoint correcto según tu backend
      const response = await api.post(`/tournaments/${tournamentId}/news`, formData);
      
      console.log("✅ News created:", response.data);
      
      if (response.data) {
        onNewsCreated();
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
      
    } catch (error) {
      console.error("❌ Error creating news:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || "Error al crear la noticia";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError("");

    if (name === "image" && value) {
      setPreviewImage(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6" />
              Publicar Nueva Noticia
            </h2>
            <p className="text-sm text-gray-500 mt-1">Comparte las últimas novedades del torneo</p>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Título llamativo para la noticia..."
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Escribe aquí el contenido completo de la noticia..."
                rows={8}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Imagen (opcional)
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {previewImage && (
                  <div className="relative group">
                    <div className="text-sm text-gray-600 mb-2">Vista previa:</div>
                    <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                      <img 
                        src={previewImage} 
                        alt="Vista previa" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '';
                          e.target.parentElement.className = 'h-64 bg-gradient-to-r from-purple-100 to-violet-100 rounded-xl border border-gray-200 flex items-center justify-center';
                          e.target.parentElement.innerHTML = '<div class="text-center"><ImageIcon className="w-12 h-12 text-purple-400 mx-auto mb-2" /><p class="text-sm text-gray-500">Imagen no disponible</p></div>';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, image: '' }));
                        setPreviewImage('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Configuración */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Visibilidad</div>
                  <div className="text-sm text-gray-600">Controla quién puede ver esta noticia</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {formData.isPublic ? (
                  <span className="text-green-600">✓ La noticia será visible para todos</span>
                ) : (
                  <span className="text-yellow-600">⚠ Solo tú podrás ver esta noticia</span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all font-medium flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Newspaper className="w-5 h-5" />
                  Publicar Noticia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de confirmación para eliminar
function ConfirmDeleteModal({ noticia, onConfirm, onCancel }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Confirmar Eliminación
          </h2>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Eliminar noticia permanentemente?
            </h3>
            
            {noticia && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-900 font-medium mb-1 line-clamp-2">"{noticia.title}"</p>
                <p className="text-sm text-gray-600">
                  Publicada el {formatDate(noticia.createdAt)}
                </p>
                {noticia.user && (
                  <p className="text-sm text-gray-500 mt-1">Por: {noticia.user.name}</p>
                )}
              </div>
            )}
            
            <p className="text-gray-600 mb-2">
              Esta acción <span className="font-semibold text-red-600">no se puede deshacer</span>.
            </p>
            <p className="text-sm text-gray-500">
              Se eliminarán todos los comentarios y reacciones asociados.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all font-medium flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Sí, Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}