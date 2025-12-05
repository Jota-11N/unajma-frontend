import React, { useEffect, useState, useCallback } from 'react';
import { Facebook, Loader, AlertCircle, Shield, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../services/api';

console.log('Facebook App ID configurado:', process.env.REACT_APP_FACEBOOK_APP_ID);
console.log('URL actual:', window.location.href);

const FacebookLoginButton = ({ onSuccess, onError, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [sdkState, setSdkState] = useState({
    loaded: false,
    error: null,
    initializing: false
  });

  // Verificar HTTPS
  useEffect(() => {
    const isHttps = window.location.protocol === 'https:';
    if (!isHttps && window.location.hostname === 'localhost') {
      console.warn('⚠️ Facebook requiere HTTPS.');
    }
  }, []);

  const loadFacebookSDK = useCallback(() => {
    if (window.FB || sdkState.initializing) return;

    setSdkState(prev => ({ ...prev, initializing: true }));

    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    
    if (!appId || appId === 'tu_app_id_aquí') {
      setSdkState({
        loaded: false,
        error: 'Facebook App ID no configurado. Contacta al administrador.',
        initializing: false
      });
      return;
    }

    const isHttps = window.location.protocol === 'https:';
    if (!isHttps) {
      setSdkState({
        loaded: false,
        error: 'Se requiere conexión segura (HTTPS) para Facebook Login.',
        initializing: false
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://connect.facebook.net/es_ES/sdk.js`;
    script.async = true;
    script.defer = true;
    script.crossorigin = "anonymous";
    script.id = 'facebook-jssdk';

    const existingScript = document.getElementById('facebook-jssdk');
    if (existingScript) {
      existingScript.remove();
    }

    window.fbAsyncInit = function() {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: false,
          version: 'v19.0',
          status: false,
          autoLogAppEvents: true
        });

        console.log('✅ Facebook SDK inicializado exitosamente');
        setSdkState({
          loaded: true,
          error: null,
          initializing: false
        });

      } catch (error) {
        console.error('❌ Error inicializando Facebook SDK:', error);
        setSdkState({
          loaded: false,
          error: 'Error técnico al inicializar Facebook.',
          initializing: false
        });
      }
    };

    script.onerror = () => {
      console.error('❌ Error cargando Facebook SDK');
      setSdkState({
        loaded: false,
        error: 'No se pudo conectar con Facebook. Verifica tu conexión.',
        initializing: false
      });
    };

    document.body.appendChild(script);

    setTimeout(() => {
      if (!window.FB && sdkState.initializing) {
        console.warn('⚠️ Timeout cargando Facebook SDK');
        setSdkState({
          loaded: false,
          error: 'Timeout de conexión con Facebook.',
          initializing: false
        });
      }
    }, 10000);

  }, [sdkState.initializing]);

  useEffect(() => {
    const isHttps = window.location.protocol === 'https:';
    if (!isHttps) {
      setSdkState({
        loaded: false,
        error: 'Accede usando: https://localhost:3000',
        initializing: false
      });
      return;
    }

    if (window.FB) {
      setSdkState({ loaded: true, error: null, initializing: false });
      return;
    }

    loadFacebookSDK();
  }, [loadFacebookSDK]);

  const handleFacebookLogin = () => {
    const isHttps = window.location.protocol === 'https:';
    if (!isHttps) {
      onError?.('Facebook requiere HTTPS. Accede a https://localhost:3000');
      return;
    }

    if (!window.FB || typeof window.FB.login !== 'function') {
      onError?.('Facebook SDK no disponible. Intenta recargar la página.');
      return;
    }

    setLoading(true);

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          console.log('✅ Autenticación Facebook exitosa');
          
          window.FB.api('/me', { fields: 'id,name,picture' }, (profileResponse) => {
            if (profileResponse.error) {
              onError?.('Error obteniendo información del perfil');
              setLoading(false);
              return;
            }

            const payload = {
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
              name: profileResponse.name || '',
              picture: profileResponse.picture?.data?.url || ''
            };

            api.post('/auth/facebook', payload)
              .then(backendResponse => {
                const data = backendResponse.data;
                console.log('📦 Respuesta del backend:', data);

                if (data.needsEmailUpdate) {
                  onSuccess?.({
                    token: data.token,
                    user: data.user,
                    provider: 'facebook',
                    needsEmailLater: true,
                    isEmailVerified: true
                  });
                  setLoading(false);
                } else if (data.requiresVerification) {
                  onSuccess?.({
                    token: data.token,
                    user: data.user,
                    provider: 'facebook',
                    requiresVerification: true,
                    isNewUser: data.isNewUser
                  });
                  setLoading(false);
                } else {
                  onSuccess?.({
                    token: data.token,
                    user: data.user,
                    provider: 'facebook',
                    isEmailVerified: data.isEmailVerified
                  });
                  setLoading(false);
                }
              })
              .catch(error => {
                console.error('❌ Error del backend:', error);
                const errorMsg = error.response?.data?.message || 
                               error.message || 
                               'Error en la conexión con el servidor';
                onError?.(errorMsg);
                setLoading(false);
              });
          });
        } else {
          console.log('❌ Login Facebook cancelado o fallido:', response.status);
          const errorMsg = response.status === 'not_authorized' 
            ? 'No autorizado por Facebook' 
            : 'Inicio de sesión cancelado por el usuario';
          onError?.(errorMsg);
          setLoading(false);
        }
      },
      { 
        scope: 'public_profile',
        return_scopes: true,
        auth_type: 'rerequest'
      }
    );
  };

  const handleRetry = () => {
    setSdkState({ loaded: false, error: null, initializing: false });
    loadFacebookSDK();
  };

  // ========== RENDERIZADO ==========

  if (window.location.protocol !== 'https:') {
    return (
      <div className="w-full p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 text-lg mb-1">Conexión Segura Requerida</h3>
            <p className="text-amber-700 mb-4 text-sm">
              Para tu seguridad, Facebook requiere conexión HTTPS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="https://localhost:3000" 
                className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:shadow-md transition-all duration-300 hover:from-amber-600 hover:to-amber-700 active:scale-95"
              >
                <Shield className="w-4 h-4 mr-2" />
                Ir a https://localhost:3000
              </a>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-amber-600 border border-amber-300 font-medium rounded-lg hover:bg-amber-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sdkState.error) {
    return (
      <div className="w-full">
        <div className="mb-4 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 text-sm mb-1">Error de Conexión</h4>
              <p className="text-red-700 text-sm">{sdkState.error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={sdkState.initializing}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-md transition-all duration-300 hover:from-gray-200 hover:to-gray-300 active:scale-95 disabled:opacity-60 flex items-center justify-center group"
        >
          {sdkState.initializing ? (
            <>
              <Loader className="w-5 h-5 mr-3 animate-spin" />
              <span>Reconectando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reintentar conexión</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (!sdkState.loaded || sdkState.initializing) {
    return (
      <button
        disabled
        className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-150 text-gray-500 rounded-xl cursor-not-allowed flex items-center justify-center shadow-inner"
      >
        <div className="relative">
          <Loader className="w-5 h-5 mr-3 animate-spin text-gray-400" />
          <div className="absolute inset-0 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
        </div>
        <span className="font-medium">Inicializando Facebook...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={disabled || loading}
      className={`w-full py-3.5 px-4 bg-gradient-to-r from-[#1877F2] to-[#0D63D3] text-white font-bold rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center group shadow-lg hover:shadow-xl ${
        disabled || loading 
          ? 'opacity-80 cursor-not-allowed from-[#1877F2]/70 to-[#0D63D3]/70' 
          : 'hover:from-[#166FE5] hover:to-[#0D5BC9] hover:shadow-[#1877F2]/40'
      }`}
    >
      {loading ? (
        <>
          <div className="relative mr-3">
            <Loader className="w-5 h-5 animate-spin text-white" />
            <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <span className="font-semibold">Conectando con Facebook...</span>
        </>
      ) : (
        <>
          <div className="mr-3 bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
            <Facebook className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-wide">Continuar con Facebook</span>
        </>
      )}
      {!loading && !disabled && (
        <span className="ml-auto text-xs font-normal bg-white/20 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Seguro
        </span>
      )}
    </button>
  );
};

FacebookLoginButton.defaultProps = {
  disabled: false,
  onSuccess: () => console.log('✅ Facebook login exitoso'),
  onError: (error) => console.error('❌ Facebook login error:', error)
};

export default FacebookLoginButton;