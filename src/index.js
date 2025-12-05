// === TODOS LOS IMPORTS PRIMERO ===
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';
import App from './App';
import './index.css';

// === LUEGO EL RESTO DEL CÓDIGO ===

// 🔥 AGREGAR: Inicialización del SDK de Facebook
const initFacebookSDK = () => {
  // Evitar cargar múltiples veces
  if (window.FB) {
    console.log('✅ Facebook SDK ya está cargado');
    return;
  }

  window.fbAsyncInit = function() {
    window.FB.init({
      appId: process.env.REACT_APP_FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false, // Cambia a false si no usas plugins XFBML
      version: 'v18.0',
      autoLogAppEvents: true
    });
    
    console.log('✅ Facebook SDK inicializado');
  };

  // Cargar SDK de Facebook
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); 
    js.id = id;
    js.src = "https://connect.facebook.net/es_LA/sdk.js";
    js.async = true;
    js.defer = true;
    js.crossOrigin = "anonymous";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
};

// 🔥 INICIALIZAR Facebook SDK
initFacebookSDK();

const AppWithProviders = () => {
  // Mover el console.log aquí si lo necesitas
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Variables de entorno:');
    console.log('- FACEBOOK_APP_ID:', process.env.REACT_APP_FACEBOOK_APP_ID);
    console.log('- GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('- API_URL:', process.env.REACT_APP_API_URL);
  }
  
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  if (!googleClientId || googleClientId === 'tu_google_client_id_aqui') {
    console.warn('⚠️ Google Client ID no configurado. El login con Google no funcionará.');
    return (
      <GoogleOAuthProvider clientId="dummy-client-id-for-development">
        <App />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWithProviders />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);