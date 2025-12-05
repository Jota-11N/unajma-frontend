import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Calendar, Plus, Search, Filter, Clock, MapPin, 
  Users, Trophy, ChevronDown, ChevronUp, Edit, 
  Trash2, Eye, AlertCircle, Check, X, Download,
  RefreshCw, BarChart3, Share2, MoreVertical,
  Home, Award, TrendingUp, Zap, Shield, Globe,List
} from "lucide-react";
import api from "../services/api";

export default function TournamentPartidos() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [matchToScore, setMatchToScore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPhase, setFilterPhase] = useState("ALL");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
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
      fetchMatches();
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

  const fetchMatches = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // ✅ CORRECCIÓN: Endpoint correcto según tu backend
      const response = await api.get(`/matches?tournamentId=${id}`);
      
      if (response.data && response.data.success) {
        const matchesData = response.data.data || [];
        setMatches(matchesData);
        
        // Extraer equipos únicos para el formulario de creación
        const teamsSet = new Set();
        const phasesMap = new Map();
        const groupsMap = new Map();
        
        matchesData.forEach(match => {
          if (match.homeTeam) {
            teamsSet.add(match.homeTeam);
          }
          if (match.awayTeam) {
            teamsSet.add(match.awayTeam);
          }
          if (match.phase) {
            phasesMap.set(match.phase.id, match.phase);
          }
          if (match.group) {
            groupsMap.set(match.group.id, match.group);
          }
        });
        
        setAllTeams(Array.from(teamsSet));
        setPhases(Array.from(phasesMap.values()));
        setGroups(Array.from(groupsMap.values()));
        
      } else {
        setMatches([]);
        setAllTeams([]);
        setPhases([]);
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      setError("Error al cargar los partidos");
      
      // Si hay error 404, el torneo no tiene partidos aún
      if (error.response?.status === 404) {
        setMatches([]);
        setAllTeams([]);
        setPhases([]);
        setGroups([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateMatch = async (matchData) => {
    try {
      setActionLoading(true);
      
      const formattedData = {
        tournamentId: parseInt(id),
        phaseId: parseInt(matchData.phaseId),
        groupId: matchData.groupId ? parseInt(matchData.groupId) : null,
        date: new Date(matchData.date).toISOString(),
        venue: matchData.venue || 'Por definir',
        homeTeamId: parseInt(matchData.homeTeamId),
        awayTeamId: parseInt(matchData.awayTeamId),
        round: matchData.round ? parseInt(matchData.round) : null,
        status: "SCHEDULED"
      };

      console.log("📤 Enviando datos del partido:", formattedData);

      const response = await api.post("/matches", formattedData);
      
      if (response.data && response.data.success) {
        const newMatch = response.data.data;
        setMatches(prev => [newMatch, ...prev]);
        
        // Agregar equipos a la lista si no existen
        const newTeams = [...allTeams];
        if (newMatch.homeTeam && !allTeams.find(t => t.id === newMatch.homeTeam.id)) {
          newTeams.push(newMatch.homeTeam);
        }
        if (newMatch.awayTeam && !allTeams.find(t => t.id === newMatch.awayTeam.id)) {
          newTeams.push(newMatch.awayTeam);
        }
        setAllTeams(newTeams);
        
        showNotification("✅ Partido creado exitosamente", "success");
        setShowCreateModal(false);
      } else {
        throw new Error(response.data?.error || "Error al crear partido");
      }
    } catch (error) {
      console.error("❌ Error creating match:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      showNotification(`❌ Error: ${errorMessage}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportScore = async (matchId, homeScore, awayScore) => {
    try {
      setActionLoading(true);
      
      // ✅ CORRECCIÓN: Usar PUT en lugar de POST
      const response = await api.put(`/matches/${matchId}`, {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: "PLAYED"  // Importante: cambiar estado a PLAYED
      });
      
      if (response.data && response.data.success) {
        setMatches(prev => prev.map(match => 
          match.id === matchId ? response.data.data : match
        ));
        
        showNotification("✅ Marcador reportado exitosamente", "success");
        setShowScoreModal(false);
        setMatchToScore(null);
      }
    } catch (error) {
      console.error("❌ Error reporting score:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      showNotification(`❌ Error: ${errorMessage}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    
    try {
      await api.delete(`/matches/${matchToDelete.id}`);
      setMatches(prev => prev.filter(m => m.id !== matchToDelete.id));
      showNotification("✅ Partido eliminado exitosamente", "success");
    } catch (error) {
      console.error("❌ Error deleting match:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      showNotification(`❌ Error: ${errorMessage}`, "error");
    } finally {
      setShowDeleteConfirm(false);
      setMatchToDelete(null);
    }
  };

  const handleUpdateMatch = async (matchId, updateData) => {
    try {
      const response = await api.put(`/matches/${matchId}`, updateData);
      
      if (response.data && response.data.success) {
        setMatches(prev => prev.map(match => 
          match.id === matchId ? response.data.data : match
        ));
        showNotification("✅ Partido actualizado exitosamente", "success");
      }
    } catch (error) {
      console.error("❌ Error updating match:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      showNotification(`❌ Error: ${errorMessage}`, "error");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMatches();
    fetchTournament();
  };

  // Filtrar partidos
  const filteredMatches = matches.filter(match => {
    // Filtrar por estado
    if (filterStatus !== "ALL" && match.status !== filterStatus) return false;
    
    // Filtrar por fase
    if (filterPhase !== "ALL" && match.phaseId !== parseInt(filterPhase)) return false;
    
    // Filtrar por grupo
    if (filterGroup !== "ALL" && match.groupId !== parseInt(filterGroup)) return false;
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const homeTeamName = match.homeTeam?.name?.toLowerCase() || '';
      const awayTeamName = match.awayTeam?.name?.toLowerCase() || '';
      const venue = match.venue?.toLowerCase() || '';
      
      return (
        homeTeamName.includes(searchLower) ||
        awayTeamName.includes(searchLower) ||
        venue.includes(searchLower)
      );
    }
    
    return true;
  });

  // Ordenar partidos por fecha
  const sortedMatches = [...filteredMatches].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Agrupar partidos por fecha
  const matchesByDate = sortedMatches.reduce((acc, match) => {
    const dateKey = new Date(match.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch(status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "PLAYED": return "bg-green-100 text-green-800 border border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border border-red-200";
      case "POSTPONED": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "SCHEDULED": return <Clock className="w-4 h-4" />;
      case "PLAYED": return <Check className="w-4 h-4" />;
      case "CANCELLED": return <X className="w-4 h-4" />;
      case "POSTPONED": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "SCHEDULED": return "Programado";
      case "PLAYED": return "Jugado";
      case "CANCELLED": return "Cancelado";
      case "POSTPONED": return "Aplazado";
      default: return "Desconocido";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const showNotification = (message, type = "success") => {
    // Implementar sistema de notificaciones aquí
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        ${type === 'success' ? '✅' : '❌'} 
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  if (loading && !matches.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando partidos...</p>
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
          <button 
            onClick={() => navigate('/tournaments')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Torneos
          </button>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/tournament/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-gray-600 rotate-90" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  Partidos del Torneo
                </h1>
                <p className="text-gray-600 mt-2">
                  {tournament.name} • {matches.length} partido{matches.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className={`inline-flex items-center px-4 py-2.5 font-medium rounded-xl transition-colors ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              
              {isAdmin && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Programar Partido
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
              {filteredMatches.length} de {matches.length} partido{matches.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar partidos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por equipos o lugar..."
                  className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">Todos los estados</option>
                <option value="SCHEDULED">Programados</option>
                <option value="PLAYED">Jugados</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="POSTPONED">Aplazados</option>
              </select>
            </div>

            {/* Filtro por Fase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fase
              </label>
              <select
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                disabled={phases.length === 0}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="ALL">Todas las fases</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                disabled={groups.length === 0}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="ALL">Todos los grupos</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Partidos</p>
                  <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Programados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'SCHEDULED').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Jugados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'PLAYED').length}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Próximos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'SCHEDULED' && new Date(m.date) > new Date()).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de Partidos */}
        <div className="space-y-8">
          {Object.keys(matchesByDate).length > 0 ? (
            Object.entries(matchesByDate).map(([date, dateMatches]) => (
              <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header de la fecha */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <h3 className="text-xl font-bold text-gray-900">{date}</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      {dateMatches.length} partido{dateMatches.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Lista de partidos del día */}
                <div className="divide-y divide-gray-100">
                  {dateMatches.map(match => (
                    <MatchCard 
                      key={match.id}
                      match={match}
                      isAdmin={isAdmin}
                      onReportScore={() => {
                        setMatchToScore(match);
                        setShowScoreModal(true);
                      }}
                      onEditMatch={() => {
                        showNotification("Edición de partido próximamente", "info");
                      }}
                      onDeleteMatch={() => {
                        setMatchToDelete(match);
                        setShowDeleteConfirm(true);
                      }}
                      expanded={expandedMatch === match.id}
                      onToggleExpand={() => setExpandedMatch(
                        expandedMatch === match.id ? null : match.id
                      )}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || filterStatus !== "ALL" || filterPhase !== "ALL" || filterGroup !== "ALL"
                  ? "No se encontraron partidos"
                  : "No hay partidos programados"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "ALL" || filterPhase !== "ALL" || filterGroup !== "ALL"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Comienza programando el primer encuentro del torneo"}
              </p>
              {isAdmin ? (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Programar Primer Partido
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Los partidos serán programados por los administradores del torneo.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear partido */}
      {showCreateModal && (
        <CreateMatchModal
          tournament={tournament}
          teams={allTeams}
          phases={phases}
          groups={groups}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateMatch}
          loading={actionLoading}
          formatTime={formatTime}
        />
      )}

      {/* Modal para reportar marcador */}
      {showScoreModal && matchToScore && (
        <ScoreModal
          match={matchToScore}
          onClose={() => {
            setShowScoreModal(false);
            setMatchToScore(null);
          }}
          onSubmit={handleReportScore}
          loading={actionLoading}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && matchToDelete && (
        <DeleteConfirmModal
          match={matchToDelete}
          onClose={() => {
            setShowDeleteConfirm(false);
            setMatchToDelete(null);
          }}
          onConfirm={handleDeleteMatch}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// Componente Tarjeta de Partido
function MatchCard({ 
  match, 
  isAdmin, 
  onReportScore, 
  onEditMatch, 
  onDeleteMatch, 
  expanded, 
  onToggleExpand,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusIcon,
  getStatusText
}) {
  const [showActions, setShowActions] = useState(false);

  const getScoreColor = (homeScore, awayScore) => {
    if (homeScore === null || awayScore === null) return "text-gray-800";
    if (homeScore > awayScore) return "text-green-600 font-bold";
    if (homeScore < awayScore) return "text-red-600 font-bold";
    return "text-yellow-600 font-bold";
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${expanded ? 'bg-gray-50' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Equipos y Resultado */}
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Equipo Local */}
            <div className="flex items-center gap-3 flex-grow">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                {match.homeTeam?.logo ? (
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  match.homeTeam?.name?.charAt(0) || 'L'
                )}
              </div>
              <div className="flex-grow">
                <div className="font-bold text-gray-900 truncate">{match.homeTeam?.name || 'Equipo Local'}</div>
                {match.homeTeam?.shortName && (
                  <div className="text-sm text-gray-600 truncate">{match.homeTeam.shortName}</div>
                )}
              </div>
            </div>

            {/* Marcador */}
            <div className="flex flex-col items-center gap-2 min-w-[120px]">
              <div className={`text-3xl font-bold ${getScoreColor(match.homeScore, match.awayScore)}`}>
                {match.status === 'PLAYED' && match.homeScore !== null && match.awayScore !== null ? (
                  <>
                    <span className="min-w-[30px] inline-block text-right">{match.homeScore}</span>
                    <span className="mx-2">-</span>
                    <span className="min-w-[30px] inline-block text-left">{match.awayScore}</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-2xl">VS</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)}
                  {getStatusText(match.status)}
                </span>
                {match.round && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    Jornada {match.round}
                  </span>
                )}
              </div>
            </div>

            {/* Equipo Visitante */}
            <div className="flex items-center gap-3 flex-grow">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white font-bold">
                {match.awayTeam?.logo ? (
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  match.awayTeam?.name?.charAt(0) || 'V'
                )}
              </div>
              <div className="flex-grow text-right">
                <div className="font-bold text-gray-900 truncate">{match.awayTeam?.name || 'Equipo Visitante'}</div>
                {match.awayTeam?.shortName && (
                  <div className="text-sm text-gray-600 truncate">{match.awayTeam.shortName}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información y Acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Información básica */}
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{formatTime(match.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="max-w-[150px] truncate">{match.venue || 'Por definir'}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                      {match.status === 'SCHEDULED' && (
                        <button
                          onClick={() => {
                            onReportScore();
                            setShowActions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 rounded-t-xl"
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                          <span>Reportar Resultado</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onEditMatch();
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Editar Información</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          onDeleteMatch();
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 rounded-b-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Partido</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalles expandidos */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Partido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha y hora:</span>
                  <span className="font-medium">{formatDate(match.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lugar:</span>
                  <span className="font-medium">{match.venue || 'Por definir'}</span>
                </div>
                {match.phase && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fase:</span>
                    <span className="font-medium">{match.phase.name}</span>
                  </div>
                )}
                {match.group && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grupo:</span>
                    <span className="font-medium">{match.group.name}</span>
                  </div>
                )}
                {match.round && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jornada:</span>
                    <span className="font-medium">{match.round}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${getStatusColor(match.status)} px-2 py-1 rounded-full text-xs`}>
                    {getStatusText(match.status)}
                  </span>
                </div>
                {match.status === 'PLAYED' && match.homeScore !== null && match.awayScore !== null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resultado:</span>
                      <span className="font-medium">
                        {match.homeScore > match.awayScore 
                          ? `Victoria de ${match.homeTeam?.name || 'Local'}`
                          : match.homeScore < match.awayScore
                          ? `Victoria de ${match.awayTeam?.name || 'Visitante'}`
                          : 'Empate'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diferencia de goles:</span>
                      <span className="font-medium">{Math.abs(match.homeScore - match.awayScore)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización:</span>
                  <span className="font-medium">{formatDate(match.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones adicionales */}
          {isAdmin && match.status === 'SCHEDULED' && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onReportScore}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Reportar Resultado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modal para crear partido
function CreateMatchModal({ tournament, teams, phases, groups, onClose, onSubmit, loading, formatTime }) {
  const [formData, setFormData] = useState({
    phaseId: "",
    groupId: "",
    date: "",
    venue: "",
    homeTeamId: "",
    awayTeamId: "",
    round: ""
  });
  const [error, setError] = useState("");
  const [filteredGroups, setFilteredGroups] = useState([]);

  // Filtrar grupos por fase seleccionada
  useEffect(() => {
    if (formData.phaseId) {
      const filtered = groups.filter(group => group.phaseId === parseInt(formData.phaseId));
      setFilteredGroups(filtered);
      if (formData.groupId && !filtered.find(g => g.id === parseInt(formData.groupId))) {
        setFormData(prev => ({ ...prev, groupId: "" }));
      }
    } else {
      setFilteredGroups([]);
    }
  }, [formData.phaseId, groups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.phaseId) {
      setError("Selecciona una fase");
      return;
    }
    
    if (!formData.homeTeamId || !formData.awayTeamId) {
      setError("Selecciona ambos equipos");
      return;
    }
    
    if (formData.homeTeamId === formData.awayTeamId) {
      setError("Los equipos no pueden ser iguales");
      return;
    }
    
    if (!formData.date) {
      setError("Selecciona una fecha y hora");
      return;
    }
    
    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(formData.date);
    if (selectedDate < new Date()) {
      setError("La fecha no puede ser en el pasado");
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📅 Programar Nuevo Partido</h2>
            <p className="text-sm text-gray-500 mt-1">{tournament.name}</p>
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
            {/* Fase y Grupo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fase *
                </label>
                <select
                  name="phaseId"
                  value={formData.phaseId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona una fase</option>
                  {phases.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo (opcional)
                </label>
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  disabled={loading || !formData.phaseId}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">Sin grupo</option>
                  {filteredGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipo Local *
                </label>
                <select
                  name="homeTeamId"
                  value={formData.homeTeamId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona equipo local</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.shortName ? `(${team.shortName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipo Visitante *
                </label>
                <select
                  name="awayTeamId"
                  value={formData.awayTeamId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona equipo visitante</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.shortName ? `(${team.shortName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha y Lugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  min={today}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Ej: Estadio Nacional"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Ronda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ronda/Jornada (opcional)
              </label>
              <input
                type="number"
                name="round"
                value={formData.round}
                onChange={handleChange}
                placeholder="Ej: 1, 2, 3..."
                min="1"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
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
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Programando...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Programar Partido
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para reportar marcador
function ScoreModal({ match, onClose, onSubmit, loading, formatDate, formatTime }) {
  const [homeScore, setHomeScore] = useState(match.homeScore || "");
  const [awayScore, setAwayScore] = useState(match.awayScore || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (homeScore === "" || awayScore === "") {
      alert("Ingresa ambos marcadores");
      return;
    }
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
      alert("Los marcadores deben ser números");
      return;
    }
    
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);
    
    if (home < 0 || away < 0) {
      alert("Los marcadores no pueden ser negativos");
      return;
    }
    
    onSubmit(match.id, home, away);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">⚽ Reportar Marcador</h2>
            <p className="text-sm text-gray-500 mt-1">{formatDate(match.date)}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Equipos */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto">
                {match.homeTeam?.logo ? (
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  match.homeTeam?.name?.charAt(0) || 'L'
                )}
              </div>
              <div className="font-bold text-gray-900 truncate max-w-[120px]">{match.homeTeam?.name || 'Local'}</div>
            </div>
            
            <div className="text-4xl font-bold text-gray-400">VS</div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto">
                {match.awayTeam?.logo ? (
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  match.awayTeam?.name?.charAt(0) || 'V'
                )}
              </div>
              <div className="font-bold text-gray-900 truncate max-w-[120px]">{match.awayTeam?.name || 'Visitante'}</div>
            </div>
          </div>

          {/* Marcadores */}
          <div className="flex items-center justify-between gap-6 mb-8">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Marcador Local
              </label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                min="0"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl"
              />
            </div>
            
            <div className="text-3xl font-bold text-gray-400">-</div>
            
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Marcador Visitante
              </label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                min="0"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-center text-2xl"
              />
            </div>
          </div>

          {/* Detalles del partido */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Lugar:</span>
                <span className="font-medium truncate max-w-[150px]">{match.venue || 'Por definir'}</span>
              </div>
              <div className="flex justify-between">
                <span>Hora:</span>
                <span className="font-medium">{formatTime(match.date)}</span>
              </div>
              {match.round && (
                <div className="flex justify-between">
                  <span>Jornada:</span>
                  <span className="font-medium">{match.round}</span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
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
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reportando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Reportar Resultado
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
function DeleteConfirmModal({ match, onClose, onConfirm, formatDate }) {
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
              ¿Eliminar partido permanentemente?
            </h3>
            
            {match && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <span className="font-bold text-gray-900 truncate max-w-[100px]">{match.homeTeam?.name || 'Local'}</span>
                  <span className="text-gray-400">vs</span>
                  <span className="font-bold text-gray-900 truncate max-w-[100px]">{match.awayTeam?.name || 'Visitante'}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(match.date)} • {match.venue || 'Lugar no definido'}
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-2">
              Esta acción <span className="font-semibold text-red-600">no se puede deshacer</span>.
            </p>
            <p className="text-sm text-gray-500">
              Se eliminarán todos los datos asociados a este partido.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={onClose}
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