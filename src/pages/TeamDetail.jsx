import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Shield, MapPin, Users, Calendar, Trophy, 
  TrendingUp, Home, User, Award, Star,
  ArrowLeft, Edit, Share2, Bell, Plus,
  Download, Filter, Search, ChevronDown,
  X, Trash2, Eye, Target, Zap, Award as AwardIcon
} from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    firstName: "",
    lastName: "",
    number: "",
    position: "",
    birthDate: "",
    height: "",
    weight: ""
  });
  
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchTerm, setSearchTerm] = useState("");

  const loadTeam = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data } = await api.get(`/teams/${id}/players`);
      console.log("✅ Equipo cargado:", data);
      
      setTeam(data);
      setPlayers(data.players || []);
      
    } catch (error) {
      console.error("❌ Error cargando equipo:", error);
      setError("Error al cargar los datos del equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [id]);

  const addPlayer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...playerForm,
        teamId: id,
        number: playerForm.number ? parseInt(playerForm.number) : null,
        height: playerForm.height ? parseInt(playerForm.height) : null,
        weight: playerForm.weight ? parseInt(playerForm.weight) : null,
      };
      
      await api.post("/players", payload);
      setPlayerForm({ 
        firstName: "", lastName: "", number: "", position: "",
        birthDate: "", height: "", weight: "" 
      });
      setShowPlayerModal(false);
      loadTeam();
      
    } catch (error) {
      console.error("❌ Error agregando jugador:", error);
      alert("Error al agregar jugador. Verifica los datos.");
    }
  };

  const removePlayer = async (playerId) => {
    if (window.confirm("¿Estás seguro de eliminar este jugador?")) {
      try {
        await api.delete(`/players/${playerId}`);
        loadTeam();
      } catch (error) {
        console.error("❌ Error eliminando jugador:", error);
      }
    }
  };

  const filteredPlayers = players.filter(player =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.number?.toString().includes(searchTerm)
  );

  const getPositionColor = (position) => {
    const colors = {
      'Portero': 'bg-blue-100 text-blue-800',
      'Defensa': 'bg-green-100 text-green-800',
      'Medio': 'bg-yellow-100 text-yellow-800',
      'Delantero': 'bg-red-100 text-red-800',
      'Capitán': 'bg-purple-100 text-purple-800'
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Equipo no encontrado</h3>
          <p className="text-gray-600 mb-6">{error || "El equipo que buscas no existe."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del equipo */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Logo */}
              <div className="w-48 h-48 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                {team.logo ? (
                  <img 
                    src={team.logo} 
                    alt={team.name} 
                    className="w-40 h-40 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-40 h-40 flex items-center justify-center ${team.logo ? 'hidden' : 'flex'}`}>
                  <Shield className="w-32 h-32 text-white opacity-80" />
                </div>
              </div>
              
              {/* Información */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
                {team.shortName && (
                  <div className="text-xl opacity-90 mb-4">"{team.shortName}"</div>
                )}
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {team.city && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <MapPin className="w-5 h-5" />
                      <span>{team.city}</span>
                    </div>
                  )}
                  {team.foundedYear && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Calendar className="w-5 h-5" />
                      <span>Fundado en {team.foundedYear}</span>
                    </div>
                  )}
                  {team.description && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <AwardIcon className="w-5 h-5" />
                      <span>Equipo registrado</span>
                    </div>
                  )}
                </div>
                
                {team.description && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <h3 className="font-semibold mb-3 text-lg">Sobre el equipo</h3>
                    <p className="opacity-90">{team.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Estadísticas */}
          <div className="p-6 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                <div className="text-3xl font-bold text-gray-900">{players.length}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mt-2">
                  <User className="w-4 h-4" />
                  Jugadores
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <div className="text-3xl font-bold text-gray-900">{team._count?.matches || 0}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mt-2">
                  <Trophy className="w-4 h-4" />
                  Partidos
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl">
                <div className="text-3xl font-bold text-gray-900">{team._count?.followers || 0}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mt-2">
                  <Users className="w-4 h-4" />
                  Seguidores
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                <div className="text-3xl font-bold text-gray-900">
                  {team.categories?.length || team.tournaments?.length || 0}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4" />
                  Torneos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Jugadores */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                Plantilla de Jugadores
              </h2>
              <p className="text-gray-600 mt-2">Gestiona los jugadores del equipo</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Modo de vista */}
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
              
              <button
                onClick={() => setShowPlayerModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nuevo Jugador
              </button>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-8">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar jugadores por nombre, apellido, posición o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lista de Jugadores */}
          {filteredPlayers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-5xl font-bold text-gray-900">
                          {player.number || "—"}
                        </div>
                        {player.position && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                            {player.position}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {player.firstName} {player.lastName}
                      </h3>
                      
                      <div className="space-y-2 mb-6">
                        {player.birthDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(player.birthDate).toLocaleDateString()}
                          </div>
                        )}
                        {(player.height || player.weight) && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {player.height && <span>{player.height} cm</span>}
                            {player.weight && <span>{player.weight} kg</span>}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all">
                          <Eye className="w-4 h-4 inline mr-2" />
                          Ver
                        </button>
                        <button 
                          onClick={() => removePlayer(player.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase">Jugador</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase">Posición</th>
                      <th className="px6 py-4 text-left text-xs font-semibold text-gray-900 uppercase">Características</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-xl font-bold text-gray-900">{player.number || "—"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{player.firstName} {player.lastName}</div>
                          {player.birthDate && (
                            <div className="text-sm text-gray-600">
                              {new Date(player.birthDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {player.position && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                              {player.position}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4 text-sm text-gray-600">
                            {player.height && <span>📏 {player.height} cm</span>}
                            {player.weight && <span>⚖️ {player.weight} kg</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removePlayer(player.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No hay jugadores registrados</h4>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "No se encontraron jugadores con ese criterio." : "Agrega jugadores para comenzar."}
              </p>
              <button
                onClick={() => setShowPlayerModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Primer Jugador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar jugador */}
      {showPlayerModal && (
        <AddPlayerModal
          form={playerForm}
          setForm={setPlayerForm}
          onSubmit={addPlayer}
          onClose={() => setShowPlayerModal(false)}
        />
      )}
    </div>
  );
}

// Modal para agregar jugador
function AddPlayerModal({ form, setForm, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">➕ Agregar Nuevo Jugador</h2>
            <p className="text-sm text-gray-500 mt-1">Completa los datos del jugador</p>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar posición</option>
                  <option value="Portero">Portero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Medio">Medio</option>
                  <option value="Delantero">Delantero</option>
                  <option value="Capitán">Capitán</option>
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar Jugador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}