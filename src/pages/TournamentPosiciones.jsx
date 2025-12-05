import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, Award, TrendingUp, TrendingDown, 
  Users, Filter, ChevronDown, ChevronRight,
  RefreshCw, BarChart3, Target, Shield,
  Crown, Star, Medal, Zap, TrendingUp as TrendingUpIcon,
  Eye, EyeOff, Download, Printer, Share2,
  AlertCircle, CheckCircle, MinusCircle,
  ArrowLeft, Home, Users as UsersIcon, Gamepad2,
  Settings, MessageSquare, Calendar
} from 'lucide-react';

export default function TournamentPosiciones({ tournament: propTournament }) {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(propTournament);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // table, compact, stats
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!propTournament) {
      fetchTournament();
    } else {
      fetchStandings();
    }
  }, [tournamentId, propTournament]);

  const fetchTournament = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/tournaments/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTournament(data);
        fetchStandings();
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Error al cargar el torneo');
      setLoading(false);
    }
  };

  // En tu TournamentPosiciones - MODIFICAR la función fetchStandings:
  const fetchStandings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/standings/tournaments/${tournamentId || tournament?.id}/standings`, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Respuesta completa:', result);
        
        if (result.success) {
          // Adaptar la estructura de datos
          const formattedStandings = result.data.map(categoryData => {
            // Extraer información de la categoría
            const category = categoryData.category;
            
            // Extraer equipos de todas las fases y grupos
            let allTeams = [];
            
            categoryData.phases.forEach(phase => {
              if (phase.groupStandings) {
                // Si tiene grupos
                phase.groupStandings.forEach(group => {
                  if (group.standings) {
                    allTeams = [...allTeams, ...group.standings.map(standing => ({
                      ...standing,
                      categoryName: category.name
                    }))];
                  }
                });
              } else if (phase.standings) {
                // Si no tiene grupos
                allTeams = [...allTeams, ...phase.standings.map(standing => ({
                  ...standing,
                  categoryName: category.name
                }))];
              }
            });
            
            return {
              categoryId: category.id,
              category: category,
              teams: allTeams
            };
          });
          
          console.log('📊 Standings formateados:', formattedStandings);
          setStandings(formattedStandings);
          
          // Extraer categorías únicas
          if (formattedStandings.length > 0) {
            const uniqueCategories = formattedStandings.map(item => item.category);
            setCategories(uniqueCategories);
          }
        } else {
          setError(result.error || 'Error al cargar las posiciones');
        }
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
      setError('Error al cargar las posiciones. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getSportConfig = (sportType) => {
    const configs = {
      FOOTBALL: { icon: '⚽', color: 'from-green-500 to-emerald-600', name: 'Fútbol' },
      BASKETBALL: { icon: '🏀', color: 'from-orange-500 to-red-600', name: 'Baloncesto' },
      VOLLEYBALL: { icon: '🏐', color: 'from-blue-500 to-cyan-600', name: 'Voleibol' },
      TENNIS: { icon: '🎾', color: 'from-purple-500 to-violet-600', name: 'Tenis' },
      HANDBALL: { icon: '🤾', color: 'from-red-500 to-pink-600', name: 'Handball' },
      ATHLETICS: { icon: '🏃', color: 'from-yellow-500 to-orange-600', name: 'Atletismo' },
      SWIMMING: { icon: '🏊', color: 'from-cyan-500 to-blue-600', name: 'Natación' }
    };
    return configs[sportType] || configs.FOOTBALL;
  };

  // Calcular estadísticas
  const calculateStatistics = () => {
    if (!standings || standings.length === 0) {
      return { totalTeams: 0, completedMatches: 0, totalPhases: 0 };
    }

    const totalTeams = standings.reduce((sum, standing) => sum + (standing.teams?.length || 0), 0);
    
    const completedMatches = standings.reduce((sum, standing) => {
      if (standing.teams) {
        return sum + standing.teams.reduce((teamSum, team) => teamSum + (team.played || 0), 0);
      }
      return sum;
    }, 0) / 2;

    const totalPhases = standings.reduce((sum, standing) => sum + (standing.phases?.length || 0), 0);

    return { totalTeams, completedMatches: Math.round(completedMatches), totalPhases };
  };

  const stats = calculateStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-unjma-primary/20 border-t-unjma-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Calculando posiciones...</p>
          <p className="text-gray-500 text-sm mt-2">Cargando datos del torneo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate(`/torneos/${tournamentId}`)}
              className="flex items-center gap-2 hover:text-unjma-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al torneo
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Tabla de Posiciones</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                {tournament?.name || 'Tabla de Posiciones'}
              </h1>
              <p className="text-gray-600 mt-2">Clasificación oficial del torneo</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filtros */}
              {categories.length > 1 && (
                <div className="flex gap-2">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:ring-2 focus:ring-unjma-primary focus:border-unjma-primary"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(catId => (
                      <option key={catId} value={catId}>Categoría {catId}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Modos de vista */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'compact' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Compacto</span>
                </button>
              </div>
              
              {/* Botón Actualizar */}
              <button 
                onClick={fetchStandings}
                className="px-4 py-2.5 bg-unjma-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de Estadísticas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Clasificación</h3>
            </div>
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString('es-ES')}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">
                {standings.length || 0}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Categorías
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalTeams}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                Equipos totales
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.completedMatches}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Partidos jugados
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalPhases}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Fases activas
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

        {/* Contenido de Posiciones */}
        <div className="space-y-8">
          {standings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay datos de posiciones</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {error ? error : 'Los datos se generarán automáticamente cuando se jueguen partidos y se registren resultados.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={fetchStandings}
                  className="px-6 py-3 bg-unjma-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Reintentar carga
                </button>
                <button 
                  onClick={() => navigate(`/torneos/${tournamentId}/partidos`)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Ver partidos
                </button>
              </div>
            </div>
          ) : (
            standings.map((standingData, index) => (
              <CategoryStandings 
                key={standingData.categoryId || index}
                standingData={standingData}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                viewMode={viewMode}
                getSportConfig={getSportConfig}
              />
            ))
          )}
        </div>

        {/* Leyenda y Acciones */}
        {standings.length > 0 && (
          <div className="mt-8 space-y-6">
            {/* Leyenda */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Leyenda de Posiciones</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Campeón</div>
                    <div className="text-xs text-gray-500">Primer lugar</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                    <Medal className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Subcampeón</div>
                    <div className="text-xs text-gray-500">Segundo lugar</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Clasifica</div>
                    <div className="text-xs text-gray-500">A siguiente fase</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Eliminado</div>
                    <div className="text-xs text-gray-500">Fuera de competencia</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones de Exportación */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Exportar Datos</h3>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Descargar CSV</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors">
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Tabla</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-unjma-primary hover:bg-blue-50 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Reportar error</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// COMPONENTE PARA CATEGORÍA (Simplificado)
function CategoryStandings({ standingData, expandedGroups, onToggleGroup, viewMode, getSportConfig }) {
  const { category, teams = [] } = standingData;
  const sportConfig = getSportConfig(category?.sportType || 'FOOTBALL');

  // Ordenar equipos por puntos (descendente)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header de Categoría */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{sportConfig.icon}</div>
            <div>
              <h2 className="text-2xl font-bold">{category?.name || 'Categoría General'}</h2>
              <p className="text-gray-300">{sportConfig.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">{teams.length} equipos</div>
            <div className="text-sm text-gray-300">
              {Math.floor(teams.reduce((sum, team) => sum + (team.played || 0), 0) / 2)} partidos jugados
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Posiciones */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">#</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Equipo</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">PJ</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">G</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">E</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">P</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">GF</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">GC</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">DG</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Pts</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Forma</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => (
                <tr 
                  key={team.teamId || index} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-blue-50 to-cyan-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {index + 1}
                      {index < 3 && (
                        <div className="ml-1">
                          {index === 0 ? <Crown className="w-3 h-3" /> :
                           index === 1 ? <Medal className="w-3 h-3" /> :
                           <Medal className="w-3 h-3" />}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {team.team?.logo ? (
                        <img 
                          src={team.team.logo} 
                          alt={team.team.name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                          {team.team?.name?.charAt(0) || 'T'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{team.team?.name || `Equipo ${index + 1}`}</div>
                        {team.team?.shortName && (
                          <div className="text-xs text-gray-500">{team.team.shortName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4 font-medium text-gray-900">{team.played || 0}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{team.wins || 0}</td>
                  <td className="py-3 px-4 text-yellow-600 font-medium">{team.draws || 0}</td>
                  <td className="py-3 px-4 text-red-600 font-medium">{team.losses || 0}</td>
                  <td className="py-3 px-4 font-medium">{team.goalsFor || 0}</td>
                  <td className="py-3 px-4 font-medium">{team.goalsAgainst || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${
                      (team.goalDifference || 0) > 0 ? 'text-green-600' :
                      (team.goalDifference || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {(team.goalDifference || 0) > 0 ? '+' : ''}{team.goalDifference || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg text-center min-w-[50px]">
                      {team.points || 0}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => {
                        const forms = ['W', 'D', 'L'];
                        const form = forms[Math.floor(Math.random() * forms.length)];
                        
                        return (
                          <div 
                            key={i}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              form === 'W' ? 'bg-green-100 text-green-800 border border-green-200' :
                              form === 'D' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {form}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}