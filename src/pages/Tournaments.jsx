import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Trophy, Plus, X, ChevronRight, ChevronLeft,
  Calendar, MapPin, Globe, Users, Gamepad2,
  Filter, Search, Eye, Edit, Trash2,
  Award, CheckCircle, AlertCircle, MoreVertical,
  Shield, Star, Clock, Zap, Download, Copy,
  BarChart3, MessageSquare, Settings, RefreshCw,
  User
} from "lucide-react";
import api from "../services/api";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [showTournamentMenu, setShowTournamentMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    isPublic: true,
    type: "SINGLE_CATEGORY",
    sportType: "FOOTBALL",
    phaseType: "LEAGUE",
    maxSports: 2,
    categories: [
      { name: "", sportType: "FOOTBALL" },
      { name: "", sportType: "BASKETBALL" }
    ]
  });

  useEffect(() => {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    fetchTournaments();
  }, []);

  // Mostrar notificación
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching tournaments...");
      const response = await api.get("/tournaments");
      console.log("📊 Respuesta completa:", response);
      
      if (response.data && response.data.success) {
        // ✅ CORRECCIÓN: La respuesta real está en response.data.data
        const tournamentsData = response.data.data || [];
        
        console.log("📦 Datos de torneos recibidos:", tournamentsData);
        
        const formattedTournaments = Array.isArray(tournamentsData) ? tournamentsData.map(tournament => ({
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          type: tournament.type,
          sportType: tournament.sportType,
          phaseType: tournament.phaseType,
          status: tournament.status || 'PLANNING',
          location: tournament.location,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          isPublic: tournament.isPublic,
          maxSports: tournament.maxSports,
          createdAt: tournament.createdAt || new Date().toISOString(),
          // ✅ CORRECCIÓN: Usar la propiedad correcta para contar equipos
          teams: tournament._count?.matches || 0, // Cambiado de _count.teams
          matches: tournament._count?.matches || 0,
          categories: tournament.categories || [],
          // ✅ CORRECCIÓN: Agregar información de usuario
          userId: tournament.userId,
          user: tournament.user,
          canEdit: user ? (user.role === 'ADMIN' || tournament.userId === user.id) : false
        })) : [];
        
        console.log("🏆 Torneos formateados:", formattedTournaments);
        setTournaments(formattedTournaments);
      } else {
        console.warn("⚠️ Respuesta inesperada:", response.data);
        showNotification("Formato de respuesta inesperado", "error");
      }
    } catch (error) {
      console.error("❌ Error fetching tournaments:", error);
      showNotification("Error al cargar torneos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar torneos
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || tournament.status === filterStatus;
    const matchesType = filterType === "ALL" || tournament.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTournaments = filteredTournaments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);

  const sportOptions = [
    { value: "FOOTBALL", label: "Fútbol", emoji: "⚽", color: "text-green-600 bg-green-100" },
    { value: "BASKETBALL", label: "Baloncesto", emoji: "🏀", color: "text-orange-600 bg-orange-100" },
    { value: "VOLLEYBALL", label: "Voleibol", emoji: "🏐", color: "text-blue-600 bg-blue-100" },
    { value: "TENNIS", label: "Tenis", emoji: "🎾", color: "text-purple-600 bg-purple-100" },
    { value: "HANDBALL", label: "Handball", emoji: "🤾", color: "text-red-600 bg-red-100" },
    { value: "ATHLETICS", label: "Atletismo", emoji: "🏃", color: "text-yellow-600 bg-yellow-100" },
    { value: "SWIMMING", label: "Natación", emoji: "🏊", color: "text-cyan-600 bg-cyan-100" }
  ];

  const phaseOptions = [
    { value: "LEAGUE", label: "Liga - Todos contra todos", icon: Trophy, description: "Todos los equipos juegan entre sí" },
    { value: "KNOCKOUT", label: "Eliminatoria directa", icon: Award, description: "Eliminación directa (playoffs)" },
    { value: "MIXED", label: "Mixto - Grupos + Playoffs", icon: Filter, description: "Grupos + eliminatoria final" }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const addCategory = () => {
    if (formData.categories.length < 3) {
      setFormData(prev => ({
        ...prev,
        categories: [
          ...prev.categories,
          { name: "", sportType: "FOOTBALL" }
        ]
      }));
    }
  };

  const removeCategory = (index) => {
    if (formData.categories.length > 2) {
      const updatedCategories = formData.categories.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        categories: updatedCategories
      }));
    }
  };

  const nextStep = () => {
    // Validaciones por paso
    if (currentStep === 1 && !formData.name.trim()) {
      showNotification("Por favor, ingresa un nombre para el torneo", "error");
      return;
    }
    
    if (currentStep === 3 && formData.type === "MULTI_CATEGORY") {
      // Validar que todas las categorías tengan nombre
      const hasEmptyNames = formData.categories.some(cat => !cat.name.trim());
      if (hasEmptyNames) {
        showNotification("Por favor, ingresa un nombre para todas las categorías", "error");
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    
    // ✅ CORRECCIÓN: Verificar que el usuario esté autenticado y sea ADMIN
    if (!user) {
      showNotification("❌ Debes iniciar sesión para crear un torneo", "error");
      return;
    }
    
    if (user.role !== 'ADMIN') {
      showNotification("❌ Solo los administradores pueden crear torneos", "error");
      return;
    }
    
    setActionLoading(true);
    
    try {
      // Preparar datos según schema Prisma
      const tournamentData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        isPublic: formData.isPublic,
        type: formData.type,
        sportType: formData.type === 'SINGLE_CATEGORY' ? formData.sportType : null,
        phaseType: formData.type === 'SINGLE_CATEGORY' ? formData.phaseType : null,
        maxSports: formData.type === 'MULTI_CATEGORY' ? formData.categories.length : null,
        status: 'PLANNING',
        categories: formData.type === 'MULTI_CATEGORY' ? formData.categories.map(cat => ({
          name: cat.name.trim(),
          sportType: cat.sportType,
          description: `${cat.name.trim()} - ${formData.description.trim()}`,
          phases: {
            create: [{
              name: "Fase Principal",
              phaseType: "LEAGUE",
              order: 1
            }]
          }
        })) : undefined
      };

      console.log("🚀 Enviando al backend:", tournamentData);
      const response = await api.post("/tournaments", tournamentData);
      console.log("✅ Respuesta del backend:", response.data);
      
      if (response.data && response.data.success) {
        const tournament = response.data.data;
        
        // ✅ Actualizar lista localmente
        const newTournament = {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          type: tournament.type,
          sportType: tournament.sportType,
          phaseType: tournament.phaseType,
          status: tournament.status,
          location: tournament.location,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          isPublic: tournament.isPublic,
          maxSports: tournament.maxSports,
          createdAt: tournament.createdAt || new Date().toISOString(),
          teams: tournament._count?.matches || 0,
          matches: tournament._count?.matches || 0,
          categories: tournament.categories || [],
          userId: tournament.userId,
          user: tournament.user,
          canEdit: true // Como lo acaba de crear, puede editarlo
        };
        
        // ✅ Agregar a la lista
        setTournaments(prev => [newTournament, ...prev]);
        
        // ✅ Cerrar modal y resetear
        resetForm();
        
        // ✅ Mostrar notificación del sistema
        showNotification("🎉 ¡Torneo creado exitosamente!", "success");
        
        // ✅ Recargar lista para asegurar datos actualizados
        setTimeout(() => fetchTournaments(), 1000);
      } else {
        showNotification("❌ Error: " + (response.data?.error || "Respuesta inesperada del servidor"), "error");
      }
    } catch (error) {
      console.error("❌ Error creating tournament:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || "Error desconocido";
      showNotification("❌ Error al crear torneo: " + errorMessage, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setCurrentStep(1);
    setFormData({
      name: "", description: "", location: "", startDate: "", endDate: "",
      isPublic: true, type: "SINGLE_CATEGORY", sportType: "FOOTBALL", 
      phaseType: "LEAGUE", maxSports: 2, categories: [
        { name: "", sportType: "FOOTBALL" },
        { name: "", sportType: "BASKETBALL" }
      ]
    });
  };

  const handleDeleteTournament = async (tournamentId, tournamentName) => {
    // ✅ CORRECCIÓN: Verificar permisos antes de eliminar
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    if (!tournament.canEdit) {
      showNotification("❌ No tienes permisos para eliminar este torneo", "error");
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de eliminar el torneo "${tournamentName}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await api.delete(`/tournaments/${tournamentId}`);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      showNotification("✅ Torneo eliminado exitosamente", "success");
      setShowTournamentMenu(null);
    } catch (error) {
      console.error("Error deleting tournament:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message;
      showNotification("❌ Error al eliminar torneo: " + errorMessage, "error");
    }
  };

  const duplicateTournament = async (tournament) => {
    // ✅ CORRECCIÓN: Verificar permisos antes de duplicar
    if (!tournament.canEdit) {
      showNotification("❌ No tienes permisos para duplicar este torneo", "error");
      return;
    }
    
    try {
      const duplicateData = {
        name: `${tournament.name} (Copia)`,
        description: tournament.description,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        isPublic: tournament.isPublic,
        type: tournament.type,
        sportType: tournament.sportType,
        phaseType: tournament.phaseType,
        maxSports: tournament.maxSports,
        status: 'PLANNING',
        categories: tournament.type === 'MULTI_CATEGORY' ? tournament.categories?.map(cat => ({
          name: `${cat.name} (Copia)`,
          sportType: cat.sportType,
          description: cat.description
        })) : undefined
      };
      
      const response = await api.post("/tournaments", duplicateData);
      if (response.data && response.data.success) {
        const newTournament = response.data.data;
        setTournaments(prev => [{
          id: newTournament.id,
          name: newTournament.name,
          description: newTournament.description,
          type: newTournament.type,
          sportType: newTournament.sportType,
          phaseType: newTournament.phaseType,
          status: newTournament.status,
          location: newTournament.location,
          startDate: newTournament.startDate,
          endDate: newTournament.endDate,
          isPublic: newTournament.isPublic,
          maxSports: newTournament.maxSports,
          createdAt: newTournament.createdAt,
          teams: newTournament._count?.matches || 0,
          matches: newTournament._count?.matches || 0,
          categories: newTournament.categories || [],
          userId: newTournament.userId,
          user: newTournament.user,
          canEdit: true
        }, ...prev]);
        showNotification("📋 Torneo duplicado exitosamente", "success");
        setShowTournamentMenu(null);
      }
    } catch (error) {
      console.error("Error duplicating tournament:", error);
      showNotification("❌ Error al duplicar torneo", "error");
    }
  };

  const exportTournamentData = (tournament) => {
    const dataToExport = {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      sportType: tournament.sportType,
      phaseType: tournament.phaseType,
      status: tournament.status,
      location: tournament.location,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      isPublic: tournament.isPublic,
      maxSports: tournament.maxSports,
      createdAt: tournament.createdAt,
      categories: tournament.categories || []
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `torneo-${tournament.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification("📥 Torneo exportado exitosamente", "success");
  };

  const getSportEmoji = (sportType) => {
    const sport = sportOptions.find(s => s.value === sportType);
    return sport?.emoji || "🏆";
  };

  const getSportColor = (sportType) => {
    const sport = sportOptions.find(s => s.value === sportType);
    return sport?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "ONGOING": return "bg-green-100 text-green-800 border border-green-200";
      case "PLANNING": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "COMPLETED": return "bg-gray-100 text-gray-800 border border-gray-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "ONGOING": return <CheckCircle className="w-4 h-4" />;
      case "PLANNING": return <Clock className="w-4 h-4" />;
      case "COMPLETED": return <Award className="w-4 h-4" />;
      case "CANCELLED": return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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

  // Componente de Paginación
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className={`px-3 py-2 rounded-lg ${currentPage === 1 ? 'bg-unjma-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}
        
        {pageNumbers.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === pageNum 
                ? 'bg-unjma-primary text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`px-3 py-2 rounded-lg ${currentPage === totalPages ? 'bg-unjma-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    );
  };

  // ✅ NUEVO: Botón de crear torneo condicional
  const renderCreateButton = () => {
    if (!user) return null;
    
    if (user.role !== 'ADMIN') {
      return (
        <button 
          disabled
          className="inline-flex items-center px-5 py-2.5 bg-gray-200 text-gray-500 font-semibold rounded-xl cursor-not-allowed opacity-50"
          title="Solo administradores pueden crear torneos"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Torneo
        </button>
      );
    }
    
    return (
      <button 
        onClick={() => setShowCreateForm(true)}
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-unjma-primary to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Crear Torneo
      </button>
    );
  };

  // ✅ NUEVO: Información del usuario
  const renderUserInfo = () => {
    if (!user) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <span className="font-medium">{user.name}</span>
        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-unjma-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando torneos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Notificación del sistema */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg animate-slideIn ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-unjma-primary mr-3" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Gestión de Torneos
                  </h1>
                  <div className="mt-2">
                    {renderUserInfo()}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-2">
                Crea, administra y configura todos tus torneos deportivos
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={fetchTournaments}
                className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
              {renderCreateButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar torneos por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-48 pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent appearance-none"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="PLANNING">Planificación</option>
                  <option value="ONGOING">En curso</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="CANCELLED">Cancelados</option>
                </select>
              </div>
              
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-48 pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent appearance-none"
                >
                  <option value="ALL">Todos los tipos</option>
                  <option value="SINGLE_CATEGORY">Una categoría</option>
                  <option value="MULTI_CATEGORY">Múltiples categorías</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Torneos</p>
                <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-unjma-primary" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En curso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.filter(t => t.status === 'ONGOING').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Planificación</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.filter(t => t.status === 'PLANNING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
              <Award className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Header de torneos */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Torneos Registrados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {currentTournaments.length} de {filteredTournaments.length} torneos
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="text-sm text-gray-500">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-unjma-primary"
            >
              <option value={6}>6 por página</option>
              <option value={9}>9 por página</option>
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
            </select>
          </div>
        </div>

        {/* Grid de Torneos */}
        {currentTournaments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron torneos</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== "ALL" || filterType !== "ALL" 
                ? "Intenta cambiar los filtros de búsqueda" 
                : "Comienza creando tu primer torneo deportivo"}
            </p>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => {
                  setShowCreateForm(true);
                  setSearchTerm("");
                  setFilterStatus("ALL");
                  setFilterType("ALL");
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-unjma-primary to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Torneo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTournaments.map((tournament) => (
                <div 
                  key={tournament.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
                >
                  {/* Menú flotante - SOLO si el usuario puede editar */}
                  {tournament.canEdit && (
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={() => setShowTournamentMenu(showTournamentMenu === tournament.id ? null : tournament.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {showTournamentMenu === tournament.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-20">
                          <Link
                            to={`/torneos/${tournament.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowTournamentMenu(null)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </Link>
                          <button
                            onClick={() => duplicateTournament(tournament)}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </button>
                          <button
                            onClick={() => exportTournamentData(tournament)}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Badge de deporte */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tournament.type === "SINGLE_CATEGORY" ? getSportColor(tournament.sportType) : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}`}>
                      <span className="text-xl">
                        {tournament.type === "SINGLE_CATEGORY" 
                          ? getSportEmoji(tournament.sportType) 
                          : "🏆"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-unjma-primary transition-colors line-clamp-1 pr-8">
                          {tournament.name}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                          {getStatusIcon(tournament.status)}
                          {getStatusText(tournament.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tournament.type === "SINGLE_CATEGORY" 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {tournament.type === "SINGLE_CATEGORY" ? "Una Categoría" : `${tournament.maxSports || 2} Categorías`}
                        </span>
                        {tournament.user && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <User className="w-3 h-3 inline mr-1" />
                            {tournament.user.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {tournament.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{tournament.location || 'Sin ubicación'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {formatDateRange(tournament.startDate, tournament.endDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{tournament.isPublic ? "Público" : "Privado"}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{tournament.teams || 0} equipos</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Gamepad2 className="w-4 h-4 mr-1" />
                        <span>{tournament.matches || 0} partidos</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(tournament.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 flex gap-2">
                      <Link 
                        to={`/torneos/${tournament.id}`}
                        className="flex-grow inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-unjma-primary/10 to-blue-600/10 text-unjma-primary font-medium rounded-xl hover:from-unjma-primary/20 hover:to-blue-600/20 transition-all group-hover:shadow-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Gestionar
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link 
                        to={`/torneos/${tournament.id}/equipos`}
                        className="inline-flex items-center px-3 py-2.5 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors"
                        title="Equipos"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      <Link 
                        to={`/torneos/${tournament.id}/partidos`}
                        className="inline-flex items-center px-3 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                        title="Partidos"
                      >
                        <Gamepad2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginación */}
            <Pagination />
          </>
        )}
      </main>

      {/* Modal de Creación */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-unjma-primary/5 to-blue-600/5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentStep === 1 && "📝 Información Básica"}
                  {currentStep === 2 && "🎯 Tipo de Torneo"}
                  {currentStep === 3 && formData.type === "SINGLE_CATEGORY" && "⚽ Configurar Deporte"}
                  {currentStep === 3 && formData.type === "MULTI_CATEGORY" && "🏆 Configurar Categorías"}
                  {currentStep === 4 && "✅ Resumen"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Paso {currentStep} de 4
                </p>
              </div>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-unjma-primary to-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCreateTournament} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Paso 1: Información Básica */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Torneo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all"
                      placeholder="Ej: Copa Universitaria 2024"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all resize-none"
                      placeholder="Describe tu torneo..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent transition-all"
                      placeholder="Ej: Estadio Universitario"
                    />
                  </div>

                  <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-unjma-primary bg-white border-gray-300 rounded focus:ring-unjma-primary focus:ring-2"
                    />
                    <label htmlFor="isPublic" className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">Torneo Público</span>
                      <p className="text-xs text-gray-500 mt-1">Visible para todos los usuarios de la plataforma</p>
                    </label>
                  </div>
                </div>
              )}

              {/* Paso 2: Tipo de Torneo */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Selecciona el tipo de torneo</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="SINGLE_CATEGORY"
                        checked={formData.type === "SINGLE_CATEGORY"}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-5 border-2 rounded-xl transition-all ${formData.type === "SINGLE_CATEGORY" ? 'border-unjma-primary bg-blue-50 shadow-sm' : 'border-gray-300 hover:border-gray-400'}`}>
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3">
                            <span className="text-white text-lg">⚽</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Una Categoría</h4>
                            <p className="text-xs text-gray-500">Un solo deporte</p>
                          </div>
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li className="flex items-center">• Perfecto para torneos específicos</li>
                          <li className="flex items-center">• Sistema único de competencia</li>
                          <li className="flex items-center">• Fácil de gestionar</li>
                        </ul>
                      </div>
                    </label>

                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="MULTI_CATEGORY"
                        checked={formData.type === "MULTI_CATEGORY"}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-5 border-2 rounded-xl transition-all ${formData.type === "MULTI_CATEGORY" ? 'border-unjma-primary bg-blue-50 shadow-sm' : 'border-gray-300 hover:border-gray-400'}`}>
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mr-3">
                            <span className="text-white text-lg">🏆</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Múltiples Categorías</h4>
                            <p className="text-xs text-gray-500">2-3 deportes diferentes</p>
                          </div>
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li className="flex items-center">• Ideal para eventos multideporte</li>
                          <li className="flex items-center">• Gestión unificada</li>
                          <li className="flex items-center">• Hasta 3 deportes diferentes</li>
                        </ul>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Paso 3: Configuración - Una Categoría */}
              {currentStep === 3 && formData.type === "SINGLE_CATEGORY" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona el Deporte</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {sportOptions.map(sport => (
                        <label key={sport.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="sportType"
                            value={sport.value}
                            checked={formData.sportType === sport.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-xl text-center transition-all ${formData.sportType === sport.value ? `${sport.color.replace('text-', 'border-').replace(' bg-', ' ')} border-2 shadow-sm` : 'border-gray-300 hover:border-gray-400'}`}>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${formData.sportType === sport.value ? sport.color : 'bg-gray-100'}`}>
                              <span className="text-2xl">{sport.emoji}</span>
                            </div>
                            <span className={`font-medium ${formData.sportType === sport.value ? sport.color.split(' ')[0] : 'text-gray-700'}`}>
                              {sport.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistema de Competencia</h3>
                    <div className="space-y-3">
                      {phaseOptions.map(phase => {
                        const Icon = phase.icon;
                        return (
                          <label key={phase.value} className="cursor-pointer block">
                            <input
                              type="radio"
                              name="phaseType"
                              value={phase.value}
                              checked={formData.phaseType === phase.value}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className={`p-4 border-2 rounded-xl transition-all ${formData.phaseType === phase.value ? 'border-unjma-primary bg-blue-50 shadow-sm' : 'border-gray-300 hover:border-gray-400'}`}>
                              <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${formData.phaseType === phase.value ? 'bg-unjma-primary' : 'bg-gray-100'}`}>
                                  <Icon className={`w-5 h-5 ${formData.phaseType === phase.value ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <div className="flex-grow">
                                  <h4 className="font-medium text-gray-900">{phase.label}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{phase.description}</p>
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Múltiples Categorías */}
              {currentStep === 3 && formData.type === "MULTI_CATEGORY" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Configura las Categorías</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Puedes tener entre 2 y 3 categorías deportivas
                    </p>
                    
                    {formData.categories.map((category, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${getSportColor(category.sportType)}`}>
                              <span className="text-lg">{getSportEmoji(category.sportType)}</span>
                            </div>
                            <h4 className="font-medium text-gray-900">Categoría {index + 1}</h4>
                          </div>
                          {formData.categories.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeCategory(index)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nombre de la Categoría *
                            </label>
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                              required
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent"
                              placeholder="Ej: Fútbol Masculino"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Deporte
                            </label>
                            <select
                              value={category.sportType}
                              onChange={(e) => handleCategoryChange(index, 'sportType', e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unjma-primary focus:border-transparent"
                            >
                              {sportOptions.map(sport => (
                                <option key={sport.value} value={sport.value}>
                                  {sport.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formData.categories.length < 3 && (
                      <button
                        type="button"
                        onClick={addCategory}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Otra Categoría
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 4: Resumen */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-sm font-medium text-green-800">¡Todo listo para crear el torneo!</p>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Revisa la información antes de confirmar</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Información General</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ubicación:</span>
                        <span className="font-medium">{formData.location || 'No especificada'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Público:</span>
                        <span className={`font-medium ${formData.isPublic ? 'text-green-600' : 'text-red-600'}`}>
                          {formData.isPublic ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fechas:</span>
                        <span className="font-medium">
                          {formData.startDate ? formatDate(formData.startDate) : 'Sin fecha'} 
                          {formData.endDate && ` - ${formatDate(formData.endDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Configuración</h4>
                    {formData.type === "SINGLE_CATEGORY" ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">Una Categoría</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deporte:</span>
                          <span className="font-medium flex items-center">
                            <span className={`w-6 h-6 rounded mr-2 flex items-center justify-center ${getSportColor(formData.sportType)}`}>
                              {getSportEmoji(formData.sportType)}
                            </span>
                            {sportOptions.find(s => s.value === formData.sportType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sistema:</span>
                          <span className="font-medium">{phaseOptions.find(p => p.value === formData.phaseType)?.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">Múltiples Categorías</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-2">Categorías:</span>
                          {formData.categories.map((cat, index) => (
                            <div key={index} className="flex items-center text-sm mb-2 bg-white p-2 rounded-lg">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${getSportColor(cat.sportType)}`}>
                                <span className="text-lg">{getSportEmoji(cat.sportType)}</span>
                              </div>
                              <div>
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-gray-500 ml-2 text-xs">
                                  ({sportOptions.find(s => s.value === cat.sportType)?.label})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navegación */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-5 py-2.5 bg-unjma-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5 mr-2" />
                        Crear Torneo
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menú desplegable overlay */}
      {showTournamentMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowTournamentMenu(null)}
        ></div>
      )}
    </div>
  );
}