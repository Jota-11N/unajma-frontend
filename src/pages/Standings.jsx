import { useEffect, useState } from "react";
import api from "../services/api";
import { 
  Trophy, TrendingUp, Award, Target, Filter,
  Search, ChevronDown, Download, BarChart3,
  Users, Shield, Star, Zap, TrendingDown,
  ChevronUp, ChevronRight, Home, Calendar,
  MapPin, Activity, Percent, Target as TargetIcon
} from "lucide-react";

export default function Standings() {
  const [standings, setStandings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [viewMode, setViewMode] = useState('table'); // table, cards

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tournamentsRes, categoriesRes] = await Promise.all([
        api.get("/tournaments"),
        api.get("/categories"),
      ]);
      
      setTournaments(tournamentsRes.data);
      setCategories(categoriesRes.data);
      
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async (categoryId) => {
    try {
      setLoading(true);
      const response = await api.get(`/standings/category/${categoryId}`);
      setStandings(response.data);
    } catch (err) {
      console.error("Error loading standings:", err);
      setError("Error al cargar la tabla de posiciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadStandings(selectedCategory);
    } else {
      setStandings([]);
    }
  }, [selectedCategory]);

  const handleTournamentChange = (tournamentId) => {
    setSelectedTournament(tournamentId);
    setSelectedCategory("");
    setSearchTerm("");
  };

  const filteredStandings = standings.filter(standing =>
    standing.team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    standing.team?.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPositionColor = (position) => {
    if (position <= 3) return 'bg-green-100 text-green-800'; // Clasificación
    if (position === 4) return 'bg-yellow-100 text-yellow-800'; // Playoffs
    if (position >= filteredStandings.length - 2) return 'bg-red-100 text-red-800'; // Descenso
    return 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (position, previousPosition) => {
    if (!previousPosition) return null;
    if (position < previousPosition) return <ChevronUp className="w-4 h-4 text-green-600" />;
    if (position > previousPosition) return <ChevronDown className="w-4 h-4 text-red-600" />;
    return <ChevronRight className="w-4 h-4 text-gray-400" />;
  };

  const calculateGoalDifference = (goalsFor, goalsAgainst) => {
    const diff = goalsFor - goalsAgainst;
    return {
      value: diff,
      color: diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600',
      icon: diff > 0 ? '↗️' : diff < 0 ? '↘️' : '➡️'
    };
  };

  const calculatePointsPerGame = (points, played) => {
    if (played === 0) return 0;
    return (points / played).toFixed(2);
  };

  const exportToCSV = () => {
    if (filteredStandings.length === 0) return;
    
    const headers = ['Posición', 'Equipo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'Pts', 'PPP'];
    const rows = filteredStandings.map(s => [
      s.position,
      s.team?.name || '',
      s.played,
      s.wins,
      s.draws,
      s.losses,
      s.goalsFor,
      s.goalsAgainst,
      s.goalsFor - s.goalsAgainst,
      s.points,
      calculatePointsPerGame(s.points, s.played)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabla-posiciones-${selectedCategory}.csv`;
    a.click();
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
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                Tabla de Posiciones
              </h1>
              <p className="text-gray-600 mt-2">
                Estadísticas y clasificación de equipos por categoría
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                disabled={filteredStandings.length === 0}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </button>
              
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tarjetas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selectores de Torneo y Categoría */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleccionar Torneo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Seleccionar Torneo
                </div>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => handleTournamentChange(tournament.id)}
                    className={`p-4 rounded-xl transition-all flex flex-col items-center justify-center ${
                      selectedTournament === tournament.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Trophy className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium text-center">{tournament.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seleccionar Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Seleccionar Categoría
                </div>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!selectedTournament}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(cat => cat.tournamentId === parseInt(selectedTournament))
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} - {category.sportType}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {selectedCategory && (
          <div className="space-y-8">
            {/* Búsqueda y Estadísticas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                {/* Búsqueda */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Buscar equipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">{filteredStandings.length}</div>
                    <div className="text-sm text-gray-600">Equipos</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredStandings.reduce((sum, s) => sum + s.played, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Partidos</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredStandings.reduce((sum, s) => sum + s.goalsFor, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Goles</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredStandings.reduce((sum, s) => sum + s.points, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Puntos</div>
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Clasificación directa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Playoffs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Zona de descenso</span>
                </div>
              </div>
            </div>

            {/* Tabla de Posiciones */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Cargando tabla de posiciones...</p>
              </div>
            ) : filteredStandings.length > 0 ? (
              viewMode === 'table' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Pos
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Equipo
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            PJ
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            G
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            E
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            P
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            GF
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            GC
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            DG
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Pts
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            PPP
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Últimos 5
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredStandings.map((standing, index) => {
                          const goalDiff = calculateGoalDifference(standing.goalsFor, standing.goalsAgainst);
                          return (
                            <tr 
                              key={standing.id} 
                              className={`hover:bg-gray-50 transition-colors ${
                                standing.position <= 3 ? 'bg-green-50/30' : 
                                standing.position === 4 ? 'bg-yellow-50/30' :
                                standing.position >= filteredStandings.length - 2 ? 'bg-red-50/30' : ''
                              }`}
                            >
                              {/* Posición */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getPositionColor(standing.position)}`}>
                                    {standing.position}
                                  </span>
                                  {getTrendIcon(standing.position, standing.previousPosition)}
                                </div>
                              </td>
                              
                              {/* Equipo */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {standing.team?.logo ? (
                                    <img
                                      src={standing.team.logo}
                                      alt={standing.team.name}
                                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-700 flex items-center justify-center text-white text-sm font-bold ${standing.team?.logo ? 'hidden' : 'flex'}`}>
                                    {standing.team?.name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">{standing.team?.name || 'Equipo desconocido'}</div>
                                    {standing.team?.shortName && (
                                      <div className="text-xs text-gray-500">{standing.team.shortName}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Estadísticas */}
                              <td className="px-6 py-4 text-center font-bold text-gray-900">{standing.played}</td>
                              <td className="px-6 py-4 text-center text-green-600 font-semibold">{standing.wins}</td>
                              <td className="px-6 py-4 text-center text-yellow-600 font-semibold">{standing.draws}</td>
                              <td className="px-6 py-4 text-center text-red-600 font-semibold">{standing.losses}</td>
                              <td className="px-6 py-4 text-center font-bold text-gray-900">{standing.goalsFor}</td>
                              <td className="px-6 py-4 text-center font-bold text-gray-900">{standing.goalsAgainst}</td>
                              
                              {/* Diferencia de goles */}
                              <td className="px-6 py-4 text-center">
                                <span className={`font-bold ${goalDiff.color}`}>
                                  {goalDiff.value > 0 ? `+${goalDiff.value}` : goalDiff.value}
                                </span>
                              </td>
                              
                              {/* Puntos */}
                              <td className="px-6 py-4">
                                <div className="text-center">
                                  <div className="font-bold text-xl text-gray-900">{standing.points}</div>
                                  <div className="text-xs text-gray-500">
                                    {((standing.points / (standing.played * 3)) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </td>
                              
                              {/* Puntos por partido */}
                              <td className="px-6 py-4 text-center">
                                <div className="font-bold text-gray-900">
                                  {calculatePointsPerGame(standing.points, standing.played)}
                                </div>
                              </td>
                              
                              {/* Últimos 5 partidos (simulado) */}
                              <td className="px-6 py-4">
                                <div className="flex gap-1">
                                  {['W', 'W', 'D', 'L', 'W'].map((result, i) => (
                                    <div 
                                      key={i}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                        result === 'W' ? 'bg-green-100 text-green-800' :
                                        result === 'D' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {result}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Vista en tarjetas
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStandings.map((standing) => {
                    const goalDiff = calculateGoalDifference(standing.goalsFor, standing.goalsAgainst);
                    return (
                      <div 
                        key={standing.id} 
                        className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Header de la tarjeta */}
                        <div className={`p-4 ${
                          standing.position <= 3 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                          standing.position === 4 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                          standing.position >= filteredStandings.length - 2 ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                          'bg-gradient-to-r from-blue-500 to-cyan-600'
                        } text-white`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl font-bold">#{standing.position}</div>
                              {standing.team?.logo && (
                                <img 
                                  src={standing.team.logo} 
                                  alt={standing.team.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                                />
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold">{standing.points}</div>
                              <div className="text-sm opacity-90">Puntos</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contenido */}
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{standing.team?.name}</h3>
                          {standing.team?.shortName && (
                            <p className="text-gray-600 text-sm mb-4">{standing.team.shortName}</p>
                          )}
                          
                          {/* Estadísticas principales */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{standing.played}</div>
                              <div className="text-xs text-gray-500">PJ</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{standing.wins}</div>
                              <div className="text-xs text-gray-500">G</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${goalDiff.color}`}>
                                {goalDiff.value > 0 ? `+${goalDiff.value}` : goalDiff.value}
                              </div>
                              <div className="text-xs text-gray-500">DG</div>
                            </div>
                          </div>
                          
                          {/* Estadísticas detalladas */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Empates:</span>
                              <span className="font-medium">{standing.draws}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Derrotas:</span>
                              <span className="font-medium">{standing.losses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Goles a favor:</span>
                              <span className="font-medium">{standing.goalsFor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Goles en contra:</span>
                              <span className="font-medium">{standing.goalsAgainst}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Puntos por partido:</span>
                              <span className="font-medium">
                                {calculatePointsPerGame(standing.points, standing.played)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="bg-gray-50 rounded-2xl p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No hay datos de posiciones</h3>
                <p className="text-gray-600 mb-6">
                  Selecciona un torneo y una categoría para ver la tabla de posiciones.
                </p>
              </div>
            )}
          </div>
        )(<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Selecciona un torneo</h3>
            <p className="text-gray-600 mb-6">
              Para ver la tabla de posiciones, primero selecciona un torneo del menú superior.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}