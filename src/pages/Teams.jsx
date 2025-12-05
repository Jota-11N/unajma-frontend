import { useEffect, useState } from "react";
import api from "../services/api";
import { 
  Trophy, Plus, Edit, Trash2, Search, 
  Users, Shield, Calendar, MapPin, Filter,
  X, Eye, TrendingUp, Star, ChevronDown
} from "lucide-react";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    logo: "",
    description: "",
    city: "",
    foundedYear: new Date().getFullYear(),
    tournamentId: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [teamsRes, tournamentsRes] = await Promise.all([
        api.get("/teams"),
        api.get("/tournaments"),
      ]);
      
      setTeams(teamsRes.data);
      setFilteredTeams(teamsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar y ordenar equipos
  useEffect(() => {
    let result = [...teams];
    
    // Filtro por búsqueda
    if (searchTerm) {
      result = result.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por torneo
    if (selectedTournament !== "all") {
      const tournamentId = parseInt(selectedTournament);
      result = result.filter(team => 
        team.categories?.some(cat => cat.category?.tournamentId === tournamentId) ||
        team.tournaments?.some(t => t.tournamentId === tournamentId)
      );
    }
    
    // Ordenar
    result.sort((a, b) => {
      switch(sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "players": return (b._count?.players || 0) - (a._count?.players || 0);
        case "matches": return (b._count?.matches || 0) - (a._count?.matches || 0);
        default: return 0;
      }
    });
    
    setFilteredTeams(result);
  }, [teams, searchTerm, selectedTournament, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        tournamentId: form.tournamentId ? Number(form.tournamentId) : null,
      };
      
      if (editing) {
        await api.put(`/teams/${editing.id}`, payload);
      } else {
        await api.post("/teams", payload);
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ 
        name: "", shortName: "", logo: "", description: "",
        city: "", foundedYear: new Date().getFullYear(), tournamentId: "" 
      });
      await loadData();
      
    } catch (err) {
      console.error("Error saving team:", err);
      alert("❌ Error al guardar el equipo. Verifica los datos.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.")) {
      try {
        await api.delete(`/teams/${id}`);
        await loadData();
      } catch (error) {
        console.error("Error deleting team:", error);
        alert("❌ Error al eliminar el equipo");
      }
    }
  };

  const handleViewTeam = (teamId) => {
    window.open(`/equipos/${teamId}`, '_blank');
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedTournament("all");
    setSortBy("name");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                Gestión de Equipos
              </h1>
              <p className="text-gray-600 mt-2">
                Administra todos los equipos registrados en el sistema
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditing(null);
                setForm({ 
                  name: "", shortName: "", logo: "", description: "",
                  city: "", foundedYear: new Date().getFullYear(), tournamentId: "" 
                });
                setShowModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Equipo
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Buscador */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar equipos por nombre, ciudad o abreviatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtro por torneo */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por torneo
              </label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los torneos</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Ordenar */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Nombre (A-Z)</option>
                <option value="players">Más jugadores</option>
                <option value="matches">Más partidos</option>
              </select>
            </div>
          </div>
          
          {/* Botón reset */}
          {(searchTerm || selectedTournament !== "all" || sortBy !== "name") && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredTeams.length}</div>
                <div className="text-sm text-gray-600">Equipos totales</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredTeams.reduce((sum, team) => sum + (team._count?.players || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Jugadores totales</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredTeams.reduce((sum, team) => sum + (team._count?.matches || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Partidos totales</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredTeams.filter(t => t.tournaments?.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">En torneos activos</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Equipos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Cargando equipos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-medium mb-2">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Información
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Estadísticas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Torneos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      {/* Logo y Nombre */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold ${team.logo ? 'hidden' : 'flex'}`}>
                              {team.name.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{team.name}</div>
                            {team.shortName && (
                              <div className="text-sm text-gray-600">{team.shortName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Información */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {team.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {team.city}
                            </div>
                          )}
                          {team.foundedYear && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Fundado en {team.foundedYear}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Estadísticas */}
                      <td className="px-6 py-4">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="font-bold text-gray-900">{team._count?.players || 0}</div>
                            <div className="text-xs text-gray-500">Jugadores</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900">{team._count?.matches || 0}</div>
                            <div className="text-xs text-gray-500">Partidos</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900">{team._count?.followers || 0}</div>
                            <div className="text-xs text-gray-500">Seguidores</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Torneos */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(team.categories || team.tournaments || []).slice(0, 2).map((item, idx) => (
                            <div key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">
                              {item.category?.tournament?.name || item.tournament?.name || "Sin torneo"}
                            </div>
                          ))}
                          {((team.categories || team.tournaments || []).length > 2) && (
                            <span className="text-xs text-gray-500">
                              +{(team.categories || team.tournaments || []).length - 2} más
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewTeam(team.id)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditing(team);
                              setForm({
                                name: team.name,
                                shortName: team.shortName || "",
                                logo: team.logo || "",
                                description: team.description || "",
                                city: team.city || "",
                                foundedYear: team.foundedYear || new Date().getFullYear(),
                                tournamentId: team.tournaments?.[0]?.tournamentId || "",
                              });
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTeams.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron equipos</h3>
                  <p className="text-gray-600 mb-6">Intenta con otros términos de búsqueda o crea un nuevo equipo.</p>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setForm({ 
                        name: "", shortName: "", logo: "", description: "",
                        city: "", foundedYear: new Date().getFullYear(), tournamentId: "" 
                      });
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nuevo Equipo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear/editar equipo */}
      {showModal && (
        <CreateEditTeamModal
          form={form}
          setForm={setForm}
          editing={editing}
          tournaments={tournaments}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
            setForm({ 
              name: "", shortName: "", logo: "", description: "",
              city: "", foundedYear: new Date().getFullYear(), tournamentId: "" 
            });
          }}
        />
      )}
    </div>
  );
}

// Componente Modal separado
function CreateEditTeamModal({ form, setForm, editing, tournaments, onSubmit, onClose }) {
  const [previewLogo, setPreviewLogo] = useState(form.logo || "");
  const [logoError, setLogoError] = useState(false);

  const handleLogoChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, logo: value }));
    setPreviewLogo(value);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? "✏️ Editar Equipo" : "🆕 Crear Nuevo Equipo"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editing ? "Modifica los datos del equipo" : "Completa la información para registrar un nuevo equipo"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Nombre del Equipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Ej: Los Leones FC"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Nombre Corto y Ciudad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Corto
                </label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm(prev => ({ ...prev, shortName: e.target.value }))}
                  placeholder="Ej: LEONES"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ej: Lima"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Logo (opcional)
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="url"
                    value={form.logo}
                    onChange={handleLogoChange}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {previewLogo && (
                  <div className="relative group">
                    <div className="text-sm text-gray-600 mb-2">Vista previa del logo:</div>
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
                      {!logoError ? (
                        <img 
                          src={previewLogo} 
                          alt="Vista previa" 
                          className="w-full h-full object-cover"
                          onError={handleLogoError}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                          <div className="text-center">
                            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Logo no disponible</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, logo: '' }));
                        setPreviewLogo('');
                        setLogoError(false);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Año de Fundación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año de Fundación
              </label>
              <input
                type="number"
                value={form.foundedYear}
                onChange={(e) => setForm(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                min="1800"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descripción del equipo, historia, logros, etc..."
                rows="4"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Torneo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Torneo (opcional)
              </label>
              <select
                value={form.tournamentId}
                onChange={(e) => setForm(prev => ({ ...prev, tournamentId: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">— Sin torneo —</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-medium flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {editing ? "Actualizar Equipo" : "Crear Equipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}