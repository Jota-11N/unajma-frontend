import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        // Verificar token con backend usando /auth/me
        const response = await api.get('/auth/me');
        
        if (response.data.success && response.data.isAuthenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          
          // Actualizar token si es necesario
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            api.defaults.headers.Authorization = `Bearer ${response.data.token}`;
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        
        // Si es error 401, limpiar y hacer logout
        if (error.response?.status === 401) {
          logout();
        }
      }
    } else {
      // Limpiar cualquier token temporal
      localStorage.removeItem('temp_token');
      localStorage.removeItem('temp_user');
    }
    
    setLoading(false);
  };

  const login = (token, userData) => {
    // Limpiar tokens temporales
    localStorage.removeItem('temp_token');
    localStorage.removeItem('temp_user');
    
    // Guardar token principal
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Actualizar estado y headers
    setUser(userData);
    setIsAuthenticated(true);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  };

  const logout = () => {
    // Limpiar todo
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('temp_token');
    localStorage.removeItem('temp_user');
    localStorage.removeItem('remember_email');
    
    // Actualizar estado
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.Authorization;
    
    // Redirigir a login
    window.location.href = '/login';
  };

  // Verificar si el usuario es admin
  const isAdmin = user?.role === 'ADMIN';

  // Verificar si email está verificado
  const isEmailVerified = user?.isEmailVerified === true;

  // Obtener usuario temporal (para verificación pendiente)
  const getTempUser = () => {
    const tempUser = localStorage.getItem('temp_user');
    return tempUser ? JSON.parse(tempUser) : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isEmailVerified,
        login,
        logout,
        checkAuth,
        getTempUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;