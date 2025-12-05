import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 🔥 NUEVOS MÉTODOS ESPECÍFICOS
export const tournamentService = {
  // Solo obtiene torneos del usuario actual
  getMyTournaments: () => api.get("/tournaments/my-tournaments"),
  createTournament: (data) => api.post("/tournaments", data),
  getTournament: (id) => api.get(`/tournaments/${id}`),
  updateTournament: (id, data) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id) => api.delete(`/tournaments/${id}`),
};

export const teamService = {
  getMyTeams: () => api.get("/teams/my-teams"),
  createTeam: (data) => api.post("/teams", data),
  // ... otros métodos
};

export const playerService = {
  getMyPlayers: () => api.get("/players/my-players"),
  createPlayer: (data) => api.post("/players", data),
  // ... otros métodos
};

export const userService = {
  getMyStats: () => api.get("/users/my-stats"),
  getProfile: () => api.get("/users/profile"),
};
// ... después de los otros servicios

// services/api.js
export const matchService = {
  // ✅ CORREGIDO: /matches/tournament/{id} (SINGULAR)
  getTournamentMatches: (tournamentId) => 
    api.get(`/matches/tournament/${tournamentId}`),
  
  // ✅ CORREGIDO: /matches/tournament/{id}/phases-groups (SINGULAR)
  getTournamentPhasesGroups: (tournamentId) => 
    api.get(`/matches/tournament/${tournamentId}/phases-groups`),
  
  // ✅ CORREGIDO: /matches/{id} (no /matches/matches/{id})
  updateMatch: (matchId, data) => 
    api.put(`/matches/${matchId}`, data),
  
  // ✅ CORREGIDO: Ya estaba bien
  createMatch: (data) => 
    api.post("/matches", data),
  
  // ✅ CORREGIDO: Ya estaba bien
  reportScore: (matchId, data) => 
    api.post(`/matches/${matchId}/score`, data),
  
  // ✅ CORREGIDO: Ya estaba bien
  getMatch: (matchId) => 
    api.get(`/matches/${matchId}`),

  // ✅ AGREGAR: Eliminar partido
  deleteMatch: (matchId) => 
    api.delete(`/matches/${matchId}`)
};

export default api;