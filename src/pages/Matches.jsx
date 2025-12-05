import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Calendar, MapPin, Trophy, Users,
  Clock, ChevronRight, Filter,
  PlusCircle, Search, RefreshCw,
  Home as HomeIcon,
  Flag,
  AlertCircle,
  CheckCircle, XCircle, PauseCircle,
  ExternalLink,
  X
} from "lucide-react";

// Componente Toast para notificaciones
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor = type === "success" ? "bg-green-50 border-green-200" : 
                  type === "error" ? "bg-red-50 border-red-200" : 
                  "bg-blue-50 border-blue-200";
  
  const textColor = type === "success" ? "text-green-800" : 
                    type === "error" ? "text-red-800" : 
                    "text-blue-800";
  
  const icon = type === "success" ? 
    <CheckCircle className="w-5 h-5 text-green-500" /> :
    type === "error" ? 
    <XCircle className="w-5 h-5 text-red-500" /> :
    <AlertCircle className="w-5 h-5 text-blue-500" />;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in ${bgColor} border rounded-lg shadow-lg p-4 flex items-start`}>
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${textColor}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Estados para notificaciones y formulario
  const [toast, setToast] = useState(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    tournamentId: "",
    phaseId: "",
    date: "",
    venue: "",
    homeTeamId: "",
    awayTeamId: "",
    time: ""
  });

  // Mostrar toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Cargar datos iniciales
  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, teamRes, mRes] = await Promise.all([
        api.get("/tournaments"),
        api.get("/teams"),
        api.get("/matches"),
      ]);
      setTournaments(tRes.data || []);
      setTeams(teamRes.data || []);
      setMatches(mRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("Error al cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar fases cuando se selecciona un torneo
  useEffect(() => {
    const loadPhasesForTournament = async () => {
      if (form.tournamentId) {
        try {
          const response = await api.get(`/matches/tournament/${form.tournamentId}/phases-groups`);
          setPhases(response.data.phases || []);
          
          // Si hay fases, seleccionar la primera automáticamente
          if (response.data.phases && response.data.phases.length > 0 && !form.phaseId) {
            setForm(prev => ({ ...prev, phaseId: response.data.phases[0].id.toString() }));
          }
        } catch (error) {
          console.error("Error cargando fases:", error);
          setPhases([]);
        }
      } else {
        setPhases([]);
        setForm(prev => ({ ...prev, phaseId: "" }));
      }
    };
    
    loadPhasesForTournament();
  }, [form.tournamentId]);

  // Validar formulario
  // Validar formulario - VERSIÓN CORREGIDA
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.tournamentId) newErrors.tournamentId = "Selecciona un torneo";
    if (!form.phaseId) newErrors.phaseId = "Selecciona una fase";
    if (!form.date) newErrors.date = "Ingresa una fecha";
    if (!form.homeTeamId) newErrors.homeTeamId = "Selecciona equipo local";
    if (!form.awayTeamId) newErrors.awayTeamId = "Selecciona equipo visitante";
    
    if (form.homeTeamId && form.awayTeamId && form.homeTeamId === form.awayTeamId) {
      newErrors.awayTeamId = "No puede ser el mismo equipo"; // ✅ CORRECTO
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear partido
  const createMatch = async (e) => {
    e.preventDefault();
    
    // Validar
    if (!validateForm()) {
      showToast("Por favor completa todos los campos obligatorios", "error");
      return;
    }
    
    setCreatingMatch(true);
    
    try {
      // Preparar datos para enviar
      const matchData = {
        tournamentId: form.tournamentId,
        phaseId: form.phaseId || (phases.length > 0 ? phases[0].id : ""),
        date: form.date + (form.time ? `T${form.time}:00` : 'T12:00:00'),
        venue: form.venue || "",
        homeTeamId: form.homeTeamId,
        awayTeamId: form.awayTeamId
      };
      
      const response = await api.post("/matches", matchData);
      
      // Resetear formulario y errores
      setForm({ 
        tournamentId: "", 
        phaseId: "", 
        date: "", 
        venue: "", 
        homeTeamId: "", 
        awayTeamId: "",
        time: "" 
      });
      setErrors({});
      
      // Recargar datos
      loadData();
      
      showToast("✅ Partido creado exitosamente!");
      
    } catch (error) {
      console.error("Error al crear partido:", error);
      
      let errorMessage = "Error al crear el partido";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = "Datos incompletos o inválidos";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para crear partidos en este torneo";
      }
      
      showToast(`❌ ${errorMessage}`, "error");
      
    } finally {
      setCreatingMatch(false);
    }
  };

  // Actualizar marcador
  const updateMatchScore = async (matchId, homeScore, awayScore) => {
    if (homeScore === null || awayScore === null) return;
    
    try {
      await api.put(`/matches/${matchId}`, { 
        homeScore: parseInt(homeScore), 
        awayScore: parseInt(awayScore),
        status: 'PLAYED'
      });
      
      loadData();
      showToast("✅ Marcador actualizado correctamente!");
    } catch (error) {
      console.error("Error actualizando marcador:", error);
      showToast(`❌ ${error.response?.data?.error || "No se pudo actualizar el marcador"}`, "error");
    }
  };

  // Funciones de utilidad
  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'PLAYED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      case 'POSTPONED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'SCHEDULED': return <Clock className="w-3 h-3" />;
      case 'PLAYED': return <CheckCircle className="w-3 h-3" />;
      case 'CANCELED': return <XCircle className="w-3 h-3" />;
      case 'POSTPONED': return <PauseCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusText = (status) => {
    switch(status?.toUpperCase()) {
      case 'SCHEDULED': return 'Programado';
      case 'PLAYED': return 'Jugado';
      case 'CANCELED': return 'Cancelado';
      case 'POSTPONED': return 'Aplazado';
      default: return 'Desconocido';
    }
  };

  const formatDateTime = (dateString, timeString = "") => {
    if (!dateString) return 'Sin fecha';
    
    const date = new Date(dateString);
    const timePart = timeString ? ` • ${timeString}` : '';
    
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }) + timePart;
  };

  // Filtrar partidos
  const filteredMatches = matches.filter(match => {
    const searchMatch = searchTerm === "" || 
      match.homeTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.tournament?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const tournamentMatch = selectedTournament === "all" || 
      match.tournamentId?.toString() === selectedTournament;
    
    const statusMatch = selectedStatus === "all" || 
      match.status?.toUpperCase() === selectedStatus.toUpperCase();
    
    return searchMatch && tournamentMatch && statusMatch;
  });

  // Cargar datos al inicio
  useEffect(() => { 
    loadData(); 
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-unjma-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Cargando partidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-4">
      {/* Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Partidos</h1>
              <p className="text-gray-600 mt-2">
                Gestiona todos los partidos de tus torneos deportivos
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por equipo o torneo..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro Torneo */}
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white"
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                >
                  <option value="all">Todos los torneos</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="SCHEDULED">Programado</option>
                  <option value="PLAYED">Jugado</option>
                  <option value="POSTPONED">Aplazado</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formulario para crear partido */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-unjma-primary" />
              Programar Nuevo Partido
            </h2>
            
            <form onSubmit={createMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Torneo */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Torneo *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white ${
                      errors.tournamentId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.tournamentId}
                    onChange={(e) => {
                      setForm({ ...form, tournamentId: e.target.value, phaseId: "" });
                      setErrors({ ...errors, tournamentId: "" });
                    }}
                  >
                    <option value="">Seleccionar torneo...</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.tournamentId && (
                    <p className="mt-1 text-sm text-red-600">{errors.tournamentId}</p>
                  )}
                </div>

                {/* Fase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fase *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white ${
                      errors.phaseId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.phaseId}
                    onChange={(e) => {
                      setForm({ ...form, phaseId: e.target.value });
                      setErrors({ ...errors, phaseId: "" });
                    }}
                    disabled={!form.tournamentId || phases.length === 0}
                  >
                    <option value="">
                      {!form.tournamentId ? "Selecciona un torneo" : 
                       phases.length === 0 ? "No hay fases" : 
                       "Seleccionar fase..."}
                    </option>
                    {phases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                  {errors.phaseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.phaseId}</p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.date}
                    onChange={(e) => {
                      setForm({ ...form, date: e.target.value });
                      setErrors({ ...errors, date: "" });
                    }}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>

                {/* Equipo Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Local *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white ${
                      errors.homeTeamId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.homeTeamId}
                    onChange={(e) => {
                      setForm({ ...form, homeTeamId: e.target.value });
                      setErrors({ ...errors, homeTeamId: "" });
                    }}
                  >
                    <option value="">Seleccionar local...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.homeTeamId && (
                    <p className="mt-1 text-sm text-red-600">{errors.homeTeamId}</p>
                  )}
                </div>

                {/* Equipo Visitante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visitante *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white ${
                      errors.awayTeamId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.awayTeamId}
                    onChange={(e) => {
                      setForm({ ...form, awayTeamId: e.target.value });
                      setErrors({ ...errors, awayTeamId: "" });
                    }}
                  >
                    <option value="">Seleccionar visitante...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.awayTeamId && (
                    <p className="mt-1 text-sm text-red-600">{errors.awayTeamId}</p>
                  )}
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar / Cancha
                </label>
                <div className="flex gap-4">
                  <input
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unjma-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="Ej: Estadio UNAJMA, Cancha Principal..."
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  />
                  <button
                    type="submit"
                    disabled={creatingMatch}
                    className={`px-6 py-2 font-medium rounded-lg transition-colors flex items-center ${
                      creatingMatch 
                        ? 'bg-unjma-primary/70 cursor-not-allowed' 
                        : 'bg-unjma-primary hover:bg-blue-600'
                    } text-white`}
                  >
                    {creatingMatch ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Programar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Lista de Partidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Partidos Programados
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} encontrado{filteredMatches.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Filtros activos</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <div key={match.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      {/* Información del partido */}
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(match.status)}`}>
                            {getStatusIcon(match.status)}
                            <span className="ml-1">{getStatusText(match.status)}</span>
                          </span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(match.date, match.time)}
                          </span>
                          {match.phase && (
                            <>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {match.phase.name}
                              </span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{match.homeTeam?.name}</div>
                              <div className="text-xs text-gray-500 flex items-center justify-center mt-1">
                                <HomeIcon className="w-3 h-3 mr-1" />
                                Local
                              </div>
                            </div>
                            
                            <div className="text-center mx-4">
                              {match.status === 'PLAYED' ? (
                                <div className="text-2xl font-bold text-gray-900">
                                  {match.homeScore || 0} - {match.awayScore || 0}
                                </div>
                              ) : (
                                <div className="text-lg text-gray-400">VS</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {match.time ? match.time.split('T')[1]?.substring(0, 5) : 'Por definir'}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{match.awayTeam?.name}</div>
                              <div className="text-xs text-gray-500 flex items-center justify-center mt-1">
                                <Flag className="w-3 h-3 mr-1" />
                                Visitante
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          {match.tournament && (
                            <span className="flex items-center mr-4">
                              <Trophy className="w-3 h-3 mr-1" />
                              {match.tournament.name}
                            </span>
                          )}
                          {match.venue && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {match.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="mt-4 md:mt-0 flex items-center space-x-3">
                        {match.status === 'SCHEDULED' && (
                          <button
                            onClick={() => {
                              const homeScore = prompt(`Marcador para ${match.homeTeam?.name}:`, "0");
                              const awayScore = prompt(`Marcador para ${match.awayTeam?.name}:`, "0");
                              if (homeScore !== null && awayScore !== null) {
                                updateMatchScore(match.id, homeScore, awayScore);
                              }
                            }}
                            className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Registrar resultado
                          </button>
                        )}
                        
                        <Link
                          to={`/partidos/${match.id}`}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Detalles
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No hay partidos</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || selectedTournament !== "all" || selectedStatus !== "all" 
                      ? "No se encontraron partidos con los filtros aplicados" 
                      : "Comienza programando tu primer partido"}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTournament("all");
                      setSelectedStatus("all");
                    }}
                    className="text-sm text-unjma-primary hover:text-blue-600 font-medium"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Estadísticas rápidas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Total Partidos</div>
            <div className="text-2xl font-bold text-gray-900">{matches.length}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Programados</div>
            <div className="text-2xl font-bold text-blue-600">
              {matches.filter(m => m.status === 'SCHEDULED').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Jugados</div>
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.status === 'PLAYED').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Próximos 7 días</div>
            <div className="text-2xl font-bold text-orange-600">
              {matches.filter(m => {
                const matchDate = new Date(m.date);
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                return matchDate >= today && matchDate <= nextWeek && m.status === 'SCHEDULED';
              }).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}