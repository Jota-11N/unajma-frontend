import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Users, Plus, Search, Shield, MapPin, 
  Calendar, Trophy, Star, Filter, 
  X, Eye, Trash2, AlertCircle,
  ChevronRight, ChevronDown, Download,
  Edit, Users as UsersIcon, Award,
  TrendingUp, Globe, Home, Check,
  UserPlus, Sparkles, Target, Zap,
  Lock, AlertTriangle, ArrowLeft,
  CheckCircle, Loader2
} from "lucide-react";
import api from "../services/api";

export default function TournamentEquipos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [categoryTeams, setCategoryTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ OBTENER USUARIO
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // ✅ CARGAR TORNEO CON SUS EQUIPOS
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setTournamentLoading(true);
        const response = await api.get(`/tournaments/${id}`);
        
        if (response.data?.success) {
          const tournamentData = response.data.data;
          setTournament(tournamentData);
          
          // ✅ Verificar permisos
          const userData = localStorage.getItem("user");
          if (userData) {
            const userObj = JSON.parse(userData);
            const isTournamentAdmin = userObj.role === 'ADMIN' || tournamentData.userId === userObj.id;
            setIsAdmin(isTournamentAdmin);
          }
          
          // ✅ Procesar equipos de las categorías
          if (tournamentData.categories?.length > 0) {
            const firstCategory = tournamentData.categories[0];
            setActiveCategory(firstCategory);
            
            // ✅ Obtener equipos de esta categoría
            const categoryTeams = firstCategory.teams?.map(tc => ({
              id: tc.id, // ID de teamCategory
              teamId: tc.team?.id,
              team: tc.team
            })) || [];
            
            setCategoryTeams(categoryTeams);
          }
        } else {
          setError(response.data?.error || "No se pudo cargar el torneo");
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
        setError(error.response?.data?.error || "Error al cargar el torneo");
      } finally {
        setTournamentLoading(false);
        setLoading(false);
      }
    };

    if (id) {
      fetchTournament();
    }
  }, [id]);

  // ✅ CARGAR EQUIPOS DISPONIBLES (no en la categoría)
  const fetchAvailableTeams = useCallback(async () => {
    if (!isAdmin) {
      setError("No tienes permisos para realizar esta acción");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // ✅ Obtener todos los equipos
      const response = await api.get("/teams");
      
      if (response.data?.success) {
        const allTeams = response.data.data || [];
        
        // ✅ Filtrar equipos que ya están en la categoría actual
        const teamsInCategory = categoryTeams.map(tc => tc.teamId);
        const filteredTeams = allTeams.filter(team => !teamsInCategory.includes(team.id));
        
        setAvailableTeams(filteredTeams);
      } else {
        throw new Error(response.data?.error || "No se pudieron cargar los equipos");
      }
    } catch (error) {
      console.error("Error fetching available teams:", error);
      setError(error.message || "No se pudieron cargar los equipos disponibles");
    } finally {
      setLoading(false);
    }
  }, [categoryTeams, isAdmin]);

  // ✅ AGREGAR EQUIPO A CATEGORÍA
  // En TournamentEquipos.jsx - MODIFICAR SOLO ESTAS FUNCIONES

// ✅ AGREGAR EQUIPO A CATEGORÍA (VERSIÓN CORREGIDA)
const handleAddTeamToCategory = useCallback(async (teamId) => {
  if (!isAdmin) {
    setError("No tienes permisos para realizar esta acción");
    return;
  }

  try {
    setError(null);
    setLoading(true);
    
    // ✅ USAR EL NUEVO ENDPOINT
    const response = await api.post(`/teams/${teamId}/categories/${activeCategory.id}`);
    
    if (response.data?.success) {
      const newTeamCategory = {
        id: response.data.data.id,
        teamId: teamId,
        team: response.data.data.team,
        joinedAt: response.data.data.joinedAt
      };
      
      // ✅ Actualizar estado local
      setCategoryTeams(prev => [...prev, newTeamCategory]);
      setAvailableTeams(prev => prev.filter(team => team.id !== teamId));
      setShowAddTeamModal(false);
      setSuccess("✅ Equipo agregado exitosamente a la categoría");
      
      setTimeout(() => setSuccess(null), 3000);
    } else {
      throw new Error(response.data?.error || "Error al agregar el equipo");
    }
  } catch (error) {
    console.error("Error adding team to category:", error);
    setError(error.response?.data?.error || "No se pudo agregar el equipo a la categoría");
  } finally {
    setLoading(false);
  }
}, [activeCategory, isAdmin]);

// ✅ REMOVER EQUIPO DE CATEGORÍA (VERSIÓN CORREGIDA)
const handleRemoveTeamFromCategory = useCallback(async (teamCategoryId, teamId) => {
  if (!isAdmin) {
    setError("No tienes permisos para realizar esta acción");
    return;
  }

  if (!window.confirm("¿Estás seguro de remover este equipo de la categoría?\n\nEl equipo no se eliminará del sistema, solo se removerá de esta categoría.")) {
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    // ✅ USAR EL NUEVO ENDPOINT
    await api.delete(`/teams/${teamId}/categories/${activeCategory.id}`);
    
    // ✅ Actualizar estado local
    const removedTeam = categoryTeams.find(tc => tc.id === teamCategoryId)?.team;
    
    setCategoryTeams(prev => prev.filter(tc => tc.id !== teamCategoryId));
    
    if (removedTeam) {
      setAvailableTeams(prev => [...prev, removedTeam]);
    }
    
    setSuccess("✅ Equipo removido exitosamente de la categoría");
    setTimeout(() => setSuccess(null), 3000);
  } catch (error) {
    console.error("Error removing team from category:", error);
    setError(error.response?.data?.error || "No se pudo remover el equipo de la categoría");
  } finally {
    setLoading(false);
  }
}, [categoryTeams, activeCategory, isAdmin]);

// ✅ CREAR Y AGREGAR EQUIPO (TODO EN UNO)
const handleCreateAndAddTeam = useCallback(async (teamData) => {
  if (!isAdmin) {
    setError("Solo los administradores pueden crear equipos");
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    // 1. ✅ Crear el equipo
    const teamResponse = await api.post("/teams", {
      name: teamData.name,
      shortName: teamData.shortName,
      city: teamData.city,
      foundedYear: teamData.foundedYear,
      description: teamData.description,
      logo: teamData.logo
    });
    
    if (!teamResponse.data?.success) {
      throw new Error(teamResponse.data?.error || "Error al crear el equipo");
    }

    const newTeam = teamResponse.data.data;
    
    // 2. ✅ Agregar el equipo a la categoría
    const categoryResponse = await api.post(`/teams/${newTeam.id}/categories/${activeCategory.id}`);
    
    if (!categoryResponse.data?.success) {
      // Si falla la asociación, mantener el equipo creado pero mostrar error
      setError("Equipo creado, pero no se pudo agregar a la categoría");
      throw new Error("Error al asociar el equipo a la categoría");
    }

    const newTeamCategory = {
      id: categoryResponse.data.data.id,
      teamId: newTeam.id,
      team: newTeam,
      joinedAt: categoryResponse.data.data.joinedAt
    };
    
    // ✅ Actualizar estado local
    setCategoryTeams(prev => [...prev, newTeamCategory]);
    setShowCreateTeamModal(false);
    setSuccess("✅ Equipo creado y agregado exitosamente");
    
    setTimeout(() => setSuccess(null), 3000);
    
    return newTeam;
    
  } catch (error) {
    console.error("Error creating and adding team:", error);
    setError(error.response?.data?.error || error.message || "Error al crear el equipo");
    throw error;
  } finally {
    setLoading(false);
  }
}, [activeCategory, isAdmin]);

// ✅ CARGAR EQUIPOS DE CATEGORÍA (VERSIÓN MEJORADA)
const fetchCategoryTeams = async (categoryId) => {
  try {
    setLoading(true);
    
    // ✅ USAR EL NUEVO ENDPOINT ESPECÍFICO
    const response = await api.get(`/teams/by-category/${categoryId}`);
    
    if (response.data?.success) {
      setCategoryTeams(response.data.data || []);
    } else {
      throw new Error(response.data?.error || "Error al cargar equipos");
    }
  } catch (error) {
    console.error("Error fetching category teams:", error);
    // Si el endpoint no existe aún, usar el método antiguo
    await fetchTournamentTeamsFallback(categoryId);
  } finally {
    setLoading(false);
  }
};

// ✅ FALLBACK: Obtener equipos del torneo
const fetchTournamentTeamsFallback = async (categoryId) => {
  try {
    const response = await api.get(`/tournaments/${id}`);
    
    if (response.data?.success) {
      const tournamentData = response.data.data;
      const selectedCategory = tournamentData.categories?.find(c => c.id === categoryId);
      
      if (selectedCategory) {
        const categoryTeams = selectedCategory.teams?.map(tc => ({
          id: tc.id,
          teamId: tc.team?.id,
          team: tc.team
        })) || [];
        
        setCategoryTeams(categoryTeams);
      }
    }
  } catch (error) {
    console.error("Error fetching tournament fallback:", error);
    setError("No se pudieron cargar los equipos");
  }
};

  // ✅ CAMBIAR CATEGORÍA ACTIVA
  const handleCategoryChange = useCallback(async (category) => {
    setActiveCategory(category);
    setError(null);
    setSuccess(null);
    setSearchTerm('');
    await fetchCategoryTeams(category.id);
  }, [fetchCategoryTeams]);

  // ✅ ABRIR MODAL DE AGREGAR EQUIPO
  const handleOpenAddModal = useCallback(async () => {
    if (!isAdmin) {
      setError("Solo los administradores pueden agregar equipos");
      return;
    }
    
    try {
      await fetchAvailableTeams();
      setShowAddTeamModal(true);
    } catch (error) {
      setError("No se pudieron cargar los equipos disponibles");
    }
  }, [fetchAvailableTeams, isAdmin]);

  // ✅ CREAR NUEVO EQUIPO
  const handleCreateTeam = useCallback(async (teamData) => {
    if (!isAdmin) {
      setError("Solo los administradores pueden crear equipos");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // ✅ Crear el equipo usando el endpoint existente
      const response = await api.post("/teams", {
        name: teamData.name,
        shortName: teamData.shortName,
        city: teamData.city,
        foundedYear: teamData.foundedYear,
        description: teamData.description,
        logo: teamData.logo
      });
      
      if (response.data?.success) {
        const newTeam = response.data.data;
        
        setSuccess("✅ Equipo creado exitosamente");
        setTimeout(() => setSuccess(null), 3000);
        
        // ✅ Agregar el nuevo equipo a la categoría actual (temporalmente en frontend)
        const newTeamCategory = {
          id: Date.now(), // ID temporal
          teamId: newTeam.id,
          team: newTeam
        };
        
        setCategoryTeams(prev => [...prev, newTeamCategory]);
        setShowCreateTeamModal(false);
        
        return newTeam;
      } else {
        throw new Error(response.data?.error || "Error al crear el equipo");
      }
    } catch (error) {
      console.error("Error creating team:", error);
      setError(error.response?.data?.error || "No se pudo crear el equipo");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // ✅ FILTRAR EQUIPOS
  const filteredTeams = categoryTeams.filter(teamCat =>
    teamCat.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamCat.team?.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamCat.team?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ CONFIGURACIÓN DE DEPORTES
  const getSportConfig = (sportType) => {
    const configs = {
      FOOTBALL: { 
        icon: '⚽', 
        color: 'from-green-500 to-emerald-600', 
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        name: 'Fútbol' 
      },
      BASKETBALL: { 
        icon: '🏀', 
        color: 'from-orange-500 to-red-600', 
        bgColor: 'bg-gradient-to-r from-orange-500 to-red-600',
        name: 'Baloncesto' 
      },
      VOLLEYBALL: { 
        icon: '🏐', 
        color: 'from-blue-500 to-cyan-600', 
        bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        name: 'Voleibol' 
      },
      TENNIS: { 
        icon: '🎾', 
        color: 'from-purple-500 to-violet-600', 
        bgColor: 'bg-gradient-to-r from-purple-500 to-violet-600',
        name: 'Tenis' 
      },
      HANDBALL: { 
        icon: '🤾', 
        color: 'from-red-500 to-pink-600', 
        bgColor: 'bg-gradient-to-r from-red-500 to-pink-600',
        name: 'Handball' 
      },
      ATHLETICS: { 
        icon: '🏃', 
        color: 'from-yellow-500 to-amber-600', 
        bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
        name: 'Atletismo' 
      },
      SWIMMING: { 
        icon: '🏊', 
        color: 'from-cyan-500 to-blue-600', 
        bgColor: 'bg-gradient-to-r from-cyan-500 to-blue-600',
        name: 'Natación' 
      }
    };
    return configs[sportType] || configs.FOOTBALL;
  };

  // ✅ LOADING
  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  // ✅ ACCESO DENEGADO
  if (!isAdmin && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Solo los administradores de este torneo pueden gestionar los equipos.
          </p>
          <button
            onClick={() => navigate(`/torneos/${id}`)}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Torneo
          </button>
        </div>
      </div>
    );
  }

  // ✅ TORNEO NO ENCONTRADO
  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Torneo no encontrado</h2>
          <button
            onClick={() => navigate('/torneos')}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Torneos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ✅ MENSAJES */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg animate-fadeIn ${
          success ? 'bg-green-100 text-green-800 border border-green-200' : 
                  'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {success ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{success || error}</span>
          </div>
        </div>
      )}

      {/* ✅ HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(`/torneos/${id}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    Gestión de Equipos
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {tournament.name}
                  </p>
                </div>
                {isAdmin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Administrador
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ✅ PANEL DE CATEGORÍAS */}
        {tournament.categories?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Categorías del Torneo</h3>
              <p className="text-sm text-gray-500">Selecciona una categoría</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {tournament.categories.map(category => {
                const sportConfig = getSportConfig(category.sportType);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      activeCategory?.id === category.id 
                        ? `${sportConfig.bgColor} text-white shadow-lg` 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl">
                      {sportConfig.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm opacity-80">{sportConfig.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeCategory && (
          <>
            {/* ✅ HEADER CATEGORÍA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className={`p-6 ${getSportConfig(activeCategory.sportType).bgColor} text-white`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getSportConfig(activeCategory.sportType).icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold">{activeCategory.name}</h2>
                      <p className="text-white/80">
                        {categoryTeams.length} equipos • {getSportConfig(activeCategory.sportType).name}
                      </p>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-3">
                      <button 
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Agregar Equipo
                      </button>
                      <button 
                        onClick={() => setShowCreateTeamModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Crear Equipo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ BÚSQUEDA */}
            <div className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipos..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* ✅ EQUIPOS */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Cargando equipos...</p>
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredTeams.map(teamCat => (
                  <TeamCard 
                    key={teamCat.id}
                    team={teamCat.team}
                    teamCategoryId={teamCat.id}
                    onRemove={handleRemoveTeamFromCategory}
                    viewMode={viewMode}
                    isAdmin={isAdmin}
                    tournamentId={id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No hay equipos</h4>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? "No se encontraron equipos" : "Esta categoría no tiene equipos aún"}
                </p>
                {isAdmin && (
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Agregar Equipo
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ MODALES */}
      {showAddTeamModal && (
        <AddTeamModal
          availableTeams={availableTeams}
          loading={loading}
          onClose={() => setShowAddTeamModal(false)}
          onAddTeam={handleAddTeamToCategory}
        />
      )}

      {showCreateTeamModal && (
        <CreateTeamModal
          category={activeCategory}
          tournament={tournament}
          onClose={() => setShowCreateTeamModal(false)}
          onCreateTeam={handleCreateTeam}
        />
      )}
    </div>
  );
}

// ✅ COMPONENTE TEAM CARD
const TeamCard = React.memo(({ team, teamCategoryId, onRemove, viewMode, isAdmin, tournamentId }) => {
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const handleViewTeam = () => {
    if (team.id) {
      navigate(`/equipos/${team.id}`);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.logo && !logoError ? (
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-16 h-16 rounded-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl">
                {team.name?.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-gray-900">{team.name}</h4>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                {team.shortName && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md">{team.shortName}</span>
                )}
                {team.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {team.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleViewTeam}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver
            </button>
            {isAdmin && (
              <button 
                onClick={() => onRemove(teamCategoryId, team.id)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista grid (default)
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
      <div className="text-center mb-4">
        {team.logo && !logoError ? (
          <img 
            src={team.logo} 
            alt={team.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-3xl mx-auto mb-4">
            {team.name?.charAt(0)}
          </div>
        )}
        <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
        {team.shortName && (
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mt-2">
            {team.shortName}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-6">
        {team.city && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{team.city}</span>
          </div>
        )}
        
        {team.foundedYear && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Fundado: {team.foundedYear}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleViewTeam}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>
        {isAdmin && (
          <button 
            onClick={() => onRemove(teamCategoryId, team.id)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

// ✅ MODAL AGREGAR EQUIPO
const AddTeamModal = ({ availableTeams, loading, onClose, onAddTeam }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = availableTeams.filter(team =>
    team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Agregar Equipo Existente</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipos..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTeams.map(team => (
              <div
                key={team.id}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedTeam?.id === team.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    {team.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    <p className="text-sm text-gray-600">{team.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl">
            Cancelar
          </button>
          <button
            onClick={() => onAddTeam(selectedTeam.id)}
            disabled={!selectedTeam || loading}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl disabled:opacity-50"
          >
            Agregar Equipo
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ MODAL CREAR EQUIPO
const CreateTeamModal = ({ category, tournament, onClose, onCreateTeam }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    city: '',
    foundedYear: new Date().getFullYear(),
    description: '',
    logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    if (!formData.city.trim()) {
      setError('La ciudad es obligatoria');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateTeam(formData);
      onClose();
    } catch (error) {
      setError(error.message || 'Error al crear equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Equipo</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Abreviatura</label>
                <input
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad *</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-2.5 bg-green-500 text-white rounded-xl disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};