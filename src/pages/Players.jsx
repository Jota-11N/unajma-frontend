import { useEffect, useState } from "react";
import api from "../services/api";
import { 
  Users, Plus, Search, Filter, User, 
  Target, Hash, Award, Calendar, X,
  ChevronDown, Eye, Edit, Trash2,
  TrendingUp, Shield
} from "lucide-react";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    number: "",
    position: "",
    birthDate: "",
    height: "",
    weight: "",
    teamId: "",
  });

  const positions = [
    "Portero", "Defensa", "Medio", "Delantero", 
    "Capitán", "Lateral", "Central", "Volante",
    "Extremo", "Delantero Centro"
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [playersRes, teamsRes] = await Promise.all([
        api.get("/players"),
        api.get("/teams"),
      ]);
      
      const playersWithTeam = playersRes.data.map(player => ({
        ...player,
        team: teamsRes.data.find(team => team.id === player.teamId) || null
      }));
      
      setPlayers(playersWithTeam);
      setFilteredPlayers(playersWithTeam);
      setTeams(teamsRes.data);
      
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

  // Filtrar y ordenar jugadores
  useEffect(() => {
    let result = [...players];
    
    // Filtro por búsqueda
    if (searchTerm) {
      result = result.filter(player =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.number?.toString().includes(searchTerm)
      );
    }
    
    // Filtro por equipo
    if (selectedTeam !== "all") {
      const teamId = parseInt(selectedTeam);
      result = result.filter(player => player.teamId === teamId);
    }
    
    // Filtro por posición
    if (selectedPosition !== "all") {
      result = result.filter(player => player.position === selectedPosition);
    }
    
    // Ordenar
    result.sort((a, b) => {
      switch(sortBy) {
        case "name": 
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "number": 
          return (a.number || 0) - (b.number || 0);
        case "team": 
          return (a.team?.name || "").localeCompare(b.team?.name || "");
        case "position": 
          return (a.position || "").localeCompare(b.position || "");
        default: return 0;
      }
    });
    
    setFilteredPlayers(result);
  }, [players, searchTerm, selectedTeam, selectedPosition, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.teamId) {
        alert("Por favor completa los campos obligatorios (*)");
        return;
      }
      
      const payload = {
        ...form,
        teamId: parseInt(form.teamId),
        number: form.number ? parseInt(form.number) : null,
        height: form.height ? parseInt(form.height) : null,
        weight: form.weight ? parseInt(form.weight) : null,
      };
      
      if (editing) {
        await api.put(`/players/${editing.id}`, payload);
      } else {
        await api.post("/players", payload);
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ 
        firstName: "", lastName: "", number: "", position: "",
        birthDate: "", height: "", weight: "", teamId: "" 
      });
      await loadData();
      
    } catch (err) {
      console.error("Error saving player:", err);
      alert("❌ Error al guardar el jugador. Verifica los datos.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este jugador? Esta acción no se puede deshacer.")) {
      try {
        await api.delete(`/players/${id}`);
        await loadData();
      } catch (error) {
        console.error("Error deleting player:", error);
        alert("❌ Error al eliminar el jugador");
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedTeam("all");
    setSelectedPosition("all");
    setSortBy("name");
  };

  const getPositionColor = (position) => {
    const colors = {
      'Portero': 'bg-blue-100 text-blue-800',
      'Defensa': 'bg-green-100 text-green-800',
      'Medio': 'bg-yellow-100 text-yellow-800',
      'Delantero': 'bg-red-100 text-red-800',
      'Capitán': 'bg-purple-100 text-purple-800',
      'Lateral': 'bg-indigo-100 text-indigo-800',
      'Central': 'bg-pink-100 text-pink-800',
      'Volante': 'bg-teal-100 text-teal-800',
      'Extremo': 'bg-orange-100 text-orange-800',
      'Delantero Centro': 'bg-rose-100 text-rose-800'
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
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
                  <User className="w-6 h-6 text-white" />
                </div>
                Gestión de Jugadores
              </h1>
              <p className="text-gray-600 mt-2">
                Administra todos los jugadores registrados en el sistema
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditing(null);
                setForm({ 
                  firstName: "", lastName: "", number: "", position: "",
                  birthDate: "", height: "", weight: "", teamId: "" 
                });
                setShowModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Jugador
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Buscador */}
            <div className="lg:col-span-2 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar jugadores por nombre, apellido, posición o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtro por equipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los equipos</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro por posición */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las posiciones</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Ordenar y reset */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                {['name', 'number', 'team', 'position'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === option 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option === 'name' && 'Nombre'}
                    {option === 'number' && 'Número'}
                    {option === 'team' && 'Equipo'}
                    {option === 'position' && 'Posición'}
                  </button>
                ))}
              </div>
            </div>
            
            {(searchTerm || selectedTeam !== "all" || selectedPosition !== "all" || sortBy !== "name") && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredPlayers.length}</div>
                <div className="text-sm text-gray-600">Jugadores totales</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {teams.length}
                </div>
                <div className="text-sm text-gray-600">Equipos</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {[...new Set(filteredPlayers.map(p => p.position))].length}
                </div>
                <div className="text-sm text-gray-600">Posiciones distintas</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredPlayers.filter(p => p.position === 'Capitán').length}
                </div>
                <div className="text-sm text-gray-600">Capitanes</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Jugadores */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Cargando jugadores...</p>
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
                      Jugador
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Número & Posición
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Características
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nombre del Jugador */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                              {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {player.firstName} {player.lastName}
                            </div>
                            {player.birthDate && (
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(player.birthDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Equipo */}
                      <td className="px-6 py-4">
                        {player.team ? (
                          <div className="flex items-center gap-3">
                            {player.team.logo ? (
                              <img
                                src={player.team.logo}
                                alt={player.team.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-700 flex items-center justify-center text-white text-sm font-bold ${player.team.logo ? 'hidden' : 'flex'}`}>
                              {player.team.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{player.team.name}</div>
                              {player.team.shortName && (
                                <div className="text-xs text-gray-500">{player.team.shortName}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin equipo</span>
                        )}
                      </td>
                      
                      {/* Número y Posición */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {player.number ? (
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                                  <Hash className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-bold text-lg text-gray-900">{player.number}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin número</span>
                            )}
                          </div>
                          {player.position && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPositionColor(player.position)}`}>
                              {player.position}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Características */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {player.height && (
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Altura: {player.height} cm
                            </div>
                          )}
                          {player.weight && (
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Peso: {player.weight} kg
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Registrado: {new Date(player.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/jugadores/${player.id}`, '_blank')}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditing(player);
                              setForm({
                                firstName: player.firstName,
                                lastName: player.lastName,
                                number: player.number || "",
                                position: player.position || "",
                                birthDate: player.birthDate || "",
                                height: player.height || "",
                                weight: player.weight || "",
                                teamId: player.teamId || "",
                              });
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
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
              
              {filteredPlayers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron jugadores</h3>
                  <p className="text-gray-600 mb-6">Intenta con otros términos de búsqueda o crea un nuevo jugador.</p>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setForm({ 
                        firstName: "", lastName: "", number: "", position: "",
                        birthDate: "", height: "", weight: "", teamId: "" 
                      });
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nuevo Jugador
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear/editar jugador */}
      {showModal && (
        <CreateEditPlayerModal
          form={form}
          setForm={setForm}
          editing={editing}
          teams={teams}
          positions={positions}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
            setForm({ 
              firstName: "", lastName: "", number: "", position: "",
              birthDate: "", height: "", weight: "", teamId: "" 
            });
          }}
        />
      )}
    </div>
  );
}

// Componente Modal separado
function CreateEditPlayerModal({ form, setForm, editing, teams, positions, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? "✏️ Editar Jugador" : "🆕 Crear Nuevo Jugador"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editing ? "Modifica los datos del jugador" : "Completa la información para registrar un nuevo jugador"}
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
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Lionel"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Messi"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Número y Posición */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de camiseta
                </label>
                <input
                  type="number"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  placeholder="Ej: 10"
                  min="1"
                  max="99"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posición
                </label>
                <select
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Seleccionar posición</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Altura y Peso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="Ej: 175"
                  min="100"
                  max="250"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="Ej: 70"
                  min="30"
                  max="150"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Equipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipo *
              </label>
              <select
                name="teamId"
                value={form.teamId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Seleccionar equipo</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} {team.shortName && `(${team.shortName})`}
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
              <User className="w-5 h-5" />
              {editing ? "Actualizar Jugador" : "Crear Jugador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}