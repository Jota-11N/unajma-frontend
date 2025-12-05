import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLoginButton from "../components/FacebookLoginButton";
import { useAuth } from '../AuthContext';
import { 
  Eye, EyeOff, Mail, Key, Shield, LogIn, AlertCircle, 
  CheckCircle, Loader, UserPlus, XCircle, Info, ExternalLink,
  MailCheck, Sparkles, Lock, Award, Users, Calendar, Trophy
} from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: ""
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [status, setStatus] = useState({
    type: "",
    message: "",
    showRegisterSuggestion: false,
    requiresVerification: false,
    unverifiedEmail: false,
    googleNewUser: false,
    googleEmail: ""
  });
  const [submitted, setSubmitted] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailInputRef = useRef(null);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // Timer para limpiar mensajes
  const messageTimerRef = useRef(null);

  useEffect(() => {
    emailInputRef.current?.focus();
    
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const validateEmail = (email) => {
    if (!email.trim()) return "El correo electrónico es requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresa un correo válido";
    return "";
  };

  const validatePassword = (password) => {
    if (!password.trim()) return "La contraseña es requerida";
    if (password.length < 6) return "Mínimo 6 caracteres";
    return "";
  };

  // Validación en tiempo real
  useEffect(() => {
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(formData.email) }));
    }
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(formData.password) }));
    }
  }, [formData.email, formData.password, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar mensajes cuando el usuario empieza a escribir
    if (status.message) {
      setStatus({
        type: "",
        message: "",
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
    }
    
    // Si el campo fue tocado, validar en tiempo real
    if (touched[name]) {
      setErrors(prev => ({ 
        ...prev, 
        [name]: name === "email" ? validateEmail(value) : validatePassword(value),
        general: "" 
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ 
      ...prev, 
      [name]: name === "email" ? validateEmail(formData[name]) : validatePassword(formData[name]) 
    }));
  };

  const clearMessagesAfterDelay = (delay = 5000) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    
    messageTimerRef.current = setTimeout(() => {
      setStatus({
        type: "",
        message: "",
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      setErrors(prev => ({ ...prev, general: "" }));
    }, delay);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Marcar ambos campos como tocados para mostrar errores
    setTouched({ email: true, password: true });
    
    // Validar ambos campos
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    // Si hay errores de validación, mostrarlos
    if (emailError || passwordError) {
      setErrors({ 
        email: emailError, 
        password: passwordError, 
        general: "" 
      });
      
      // Limpiar después de 5 segundos
      clearMessagesAfterDelay(5000);
      
      // Enfocar el primer campo con error
      if (emailError) {
        emailInputRef.current?.focus();
      }
      return;
    }

    // Si las validaciones pasan, proceder con el login
    setLoading(true);
    setErrors({ email: "", password: "", general: "" });
    setStatus({ 
      type: "", 
      message: "", 
      showRegisterSuggestion: false, 
      requiresVerification: false, 
      unverifiedEmail: false,
      googleNewUser: false,
      googleEmail: ""
    });

    try {
      const { data } = await api.post("/auth/login", { 
        email: formData.email.trim().toLowerCase(), 
        password: formData.password 
      });

      if (data.requiresVerification) {
        setStatus({
          type: "warning",
          message: "¡Cuenta creada exitosamente! Por favor verifica tu email para activar tu cuenta.",
          showRegisterSuggestion: false,
          requiresVerification: true,
          unverifiedEmail: true,
          googleNewUser: false,
          googleEmail: ""
        });

        if (data.token && data.user) {
          localStorage.setItem('temp_token', data.token);
          localStorage.setItem('temp_user', JSON.stringify(data.user));
        }
        
        clearMessagesAfterDelay(8000);
        return;
      }

      if (!data.user?.isEmailVerified) {
        setStatus({
          type: "warning",
          message: "Tu cuenta requiere verificación. Por favor verifica tu email para continuar.",
          showRegisterSuggestion: false,
          requiresVerification: true,
          unverifiedEmail: true,
          googleNewUser: false,
          googleEmail: ""
        });
        
        localStorage.setItem('temp_token', data.token);
        localStorage.setItem('temp_user', JSON.stringify(data.user));
        
        clearMessagesAfterDelay(8000);
        return;
      }

      login(data.token, data.user);
      
      setStatus({
        type: "success",
        message: "¡Inicio de sesión exitoso! Redirigiendo...",
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      
      // NO limpiar mensaje de éxito
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

    } catch (error) {
      console.error("Login error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorType = "error";
      let errorMessage = "Error al iniciar sesión";
      let showSuggestion = false;

      if (error.response?.data) {
        const { message, provider, requiresVerification, userNotFound, wrongPassword, socialLoginRequired } = error.response.data;
        
        // 🚨 CORRECCIÓN: Diferencia clara entre casos
        if (requiresVerification) {
          errorType = "warning";
          errorMessage = message || "Por favor verifica tu email para continuar";
        } 
        else if (provider || socialLoginRequired) {
          errorType = "warning";
          errorMessage = message || `Inicia sesión con ${provider}.`;
        } 
        else if (error.response.status === 404 || userNotFound) {
          // Usuario no registrado
          errorMessage = "No encontramos una cuenta con este email.";
          showSuggestion = true;
          errorType = "error";
        }
        else if (error.response.status === 401) {
          if (wrongPassword) {
            // Contraseña incorrecta
            errorMessage = "Contraseña incorrecta. Por favor verifica tu contraseña.";
            errorType = "error";
          } else {
            // Error genérico de credenciales
            errorMessage = message || "Credenciales inválidas. Verifica tu email y contraseña.";
            errorType = "error";
            
            // Verificar si el usuario existe para sugerir registro
            try {
              const checkResponse = await api.post("/auth/check-email", { 
                email: formData.email.trim().toLowerCase() 
              });
              
              if (!checkResponse.data.exists) {
                errorMessage = "No encontramos una cuenta con este email.";
                showSuggestion = true;
              }
            } catch (checkError) {
              console.warn("No se pudo verificar existencia del email:", checkError);
            }
          }
        }
        else {
          errorMessage = message || errorMessage;
        }
      } 
      else if (!error.response) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      }

      setStatus({
        type: errorType,
        message: errorMessage,
        showRegisterSuggestion: showSuggestion,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });

      // Mantener mensaje por 6 segundos
      clearMessagesAfterDelay(6000);
      
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (response) => {
    setGoogleLoading(true);
    setErrors({ email: "", password: "", general: "" });
    setStatus({ 
      type: "", 
      message: "", 
      showRegisterSuggestion: false, 
      requiresVerification: false, 
      unverifiedEmail: false,
      googleNewUser: false,
      googleEmail: ""
    });

    try {
      const googleToken = response.credential;
      
      if (!googleToken) {
        throw new Error("No se recibió token de Google");
      }

      const res = await api.post("/auth/google", {
        token: googleToken,
      });

      if (res.data.requiresVerification) {
        const isNewUser = res.data.isNewUser || true;
        
        setStatus({
          type: "google_success",
          message: isNewUser 
            ? `¡Bienvenido ${res.data.user?.name}! Hemos enviado un enlace de verificación a ${res.data.user?.email}.`
            : "Tu cuenta requiere verificación. Por favor verifica tu email para continuar.",
          showRegisterSuggestion: false,
          requiresVerification: true,
          unverifiedEmail: true,
          googleNewUser: isNewUser,
          googleEmail: res.data.user?.email || ""
        });

        if (res.data.token && res.data.user) {
          localStorage.setItem('temp_token', res.data.token);
          localStorage.setItem('temp_user', JSON.stringify(res.data.user));
          if (isNewUser) {
            localStorage.setItem('google_new_user', 'true');
          }
        }
        
        clearMessagesAfterDelay(8000);
        return;
      }

      if (!res.data.user?.isEmailVerified) {
        setStatus({
          type: "warning",
          message: "Tu cuenta de Google requiere verificación. Por favor verifica tu email para continuar.",
          showRegisterSuggestion: false,
          requiresVerification: true,
          unverifiedEmail: true,
          googleNewUser: false,
          googleEmail: res.data.user?.email || ""
        });

        localStorage.setItem('temp_token', res.data.token);
        localStorage.setItem('temp_user', JSON.stringify(res.data.user));
        
        clearMessagesAfterDelay(8000);
        return;
      }

      if (!res.data.token || !res.data.user) {
        throw new Error("Respuesta inválida del servidor");
      }

      login(res.data.token, res.data.user);
      
      setStatus({
        type: "success",
        message: "¡Inicio de sesión con Google exitoso! Redirigiendo...",
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("Google login error:", error);
      
      let errorMessage = "Error al iniciar sesión con Google";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Token de Google inválido o expirado";
      } else if (error.response?.status === 400) {
        errorMessage = "Error en la autenticación con Google";
      } else if (!error.response) {
        errorMessage = "No se pudo conectar con el servidor";
      }

      setStatus({
        type: "error",
        message: errorMessage,
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      
      clearMessagesAfterDelay(6000);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSuccess = (data) => {
    console.log('Facebook login response:', data);
    
    if (data.needsEmailLater) {
      login(data.token, data.user);
      
      setStatus({
        type: "success",
        message: `¡Bienvenido ${data.user.name}! Inicio de sesión con Facebook exitoso.`,
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
      return;
    }
    
    if (data.requiresVerification) {
      setStatus({
        type: "warning",
        message: data.isNewUser 
          ? `¡Bienvenido ${data.user?.name}! Hemos enviado un enlace de verificación a ${data.user?.email}.`
          : "Tu cuenta requiere verificación. Por favor verifica tu email para continuar.",
        showRegisterSuggestion: false,
        requiresVerification: true,
        unverifiedEmail: true,
        facebookNewUser: data.isNewUser,
        facebookEmail: data.user?.email || ""
      });

      if (data.token && data.user) {
        localStorage.setItem('temp_token', data.token);
        localStorage.setItem('temp_user', JSON.stringify(data.user));
        if (data.isNewUser) {
          localStorage.setItem('facebook_new_user', 'true');
        }
      }
      
      clearMessagesAfterDelay(8000);
      return;
    }
    
    if (data.token && data.user) {
      if (!data.user.isEmailVerified && data.isEmailVerified !== true) {
        setStatus({
          type: "warning",
          message: "Tu cuenta requiere verificación. Por favor verifica tu email para continuar.",
          showRegisterSuggestion: false,
          requiresVerification: true,
          unverifiedEmail: true,
          facebookEmail: data.user?.email || ""
        });
        
        localStorage.setItem('temp_token', data.token);
        localStorage.setItem('temp_user', JSON.stringify(data.user));
        
        clearMessagesAfterDelay(8000);
        return;
      }
      
      login(data.token, data.user);
      
      setStatus({
        type: "success",
        message: `¡Bienvenido ${data.user.name}! Inicio de sesión con Facebook exitoso.`,
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false
      });
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } else {
      setStatus({
        type: "error",
        message: "Error: Datos incompletos de Facebook",
        showRegisterSuggestion: false,
        requiresVerification: false,
        unverifiedEmail: false,
        googleNewUser: false,
        googleEmail: ""
      });
      
      clearMessagesAfterDelay(6000);
    }
    setFacebookLoading(false);
  };

  const handleFacebookError = (error) => {
    console.error('Facebook error in Login:', error);
    
    let errorMessage = "Error al iniciar sesión con Facebook";
    
    if (error.includes('cancelado')) {
      errorMessage = "Inicio de sesión cancelado";
    } else if (error.includes('SDK')) {
      errorMessage = "Error de conexión con Facebook. Intenta recargar la página.";
    }
    
    setStatus({
      type: "error",
      message: errorMessage,
      showRegisterSuggestion: false,
      requiresVerification: false,
      unverifiedEmail: false,
      googleNewUser: false,
      googleEmail: ""
    });
    
    clearMessagesAfterDelay(6000);
    setFacebookLoading(false);
  };

  const handleFacebookClick = () => {
    setFacebookLoading(true);
    const button = document.querySelector('.facebook-login-button button');
    if (button) {
      button.click();
    } else {
      setTimeout(() => {
        const retryButton = document.querySelector('.facebook-login-button button');
        if (retryButton) {
          retryButton.click();
        } else {
          setFacebookLoading(false);
          setStatus({
            type: "error",
            message: "Error al cargar Facebook. Intenta recargar la página.",
            showRegisterSuggestion: false,
            requiresVerification: false,
            unverifiedEmail: false,
            googleNewUser: false,
            googleEmail: ""
          });
          
          clearMessagesAfterDelay(6000);
        }
      }, 100);
    }
  };

  const goToRegister = () => {
    navigate("/register", { 
      state: { prefillEmail: formData.email } 
    });
  };

  const goToVerification = () => {
    navigate("/verify-email", { 
      state: { email: status.googleEmail || formData.email } 
    });
  };

  const resendVerification = async () => {
    try {
      const email = status.googleEmail || formData.email;
      if (!email) {
        setStatus(prev => ({
          ...prev,
          type: "error",
          message: "No hay email para reenviar verificación"
        }));
        
        clearMessagesAfterDelay(6000);
        return;
      }

      const response = await api.post("/auth/resend-verification", { email });
      
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          type: "success",
          message: "Nuevo enlace de verificación enviado a tu email"
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          type: "error",
          message: response.data.message || "Error al reenviar verificación"
        }));
      }
      
      clearMessagesAfterDelay(8000);
    } catch (error) {
      console.error("Error reenviando verificación:", error);
      setStatus(prev => ({
        ...prev,
        type: "error",
        message: error.response?.data?.message || "Error al reenviar verificación"
      }));
      
      clearMessagesAfterDelay(6000);
    }
  };

  const isFormValid = formData.email.trim() && 
                     formData.password.trim() && 
                     !errors.email && 
                     !errors.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
            Sistema Deportivo UNAJMA
          </h1>
          <p className="text-gray-600 font-medium">Gestión de Torneos y Competencias</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl backdrop-blur-sm mb-5 border border-white/20">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Acceso al Sistema</h2>
              <p className="text-blue-100/90 text-sm font-medium">Ingresa tus credenciales para continuar</p>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Google Success Message */}
            {status.type === "google_success" && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50/90 to-green-50/90 backdrop-blur-sm border border-emerald-200 rounded-2xl shadow-sm">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-lg mb-1">¡Cuenta Creada Exitosamente!</h3>
                    <p className="text-emerald-800 text-sm">{status.message}</p>
                  </div>
                </div>
                
                <div className="pl-16">
                  <div className="flex items-center text-sm text-emerald-700 mb-2">
                    <MailCheck className="w-4 h-4 mr-2" />
                    <span>Revisa tu bandeja de entrada y carpeta de spam</span>
                  </div>
                  <div className="flex items-center text-sm text-emerald-700 mb-4">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>La verificación es obligatoria para acceder al sistema</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resendVerification}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-md transition-all hover:from-emerald-600 hover:to-green-600 active:scale-95"
                    >
                      Reenviar enlace
                    </button>
                    <button
                      onClick={goToVerification}
                      className="flex-1 py-3 px-4 bg-white text-emerald-600 border border-emerald-300 font-semibold rounded-xl hover:bg-emerald-50 transition-colors active:scale-95"
                    >
                      Ya verifiqué
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {status.message && status.type !== "google_success" && (
              <div className={`mb-6 p-5 rounded-2xl border flex items-start backdrop-blur-sm shadow-sm animate-fadeIn ${
                status.type === "success" 
                  ? "bg-gradient-to-r from-green-50/90 to-emerald-50/90 border-green-200"
                  : status.type === "warning"
                  ? "bg-gradient-to-r from-amber-50/90 to-yellow-50/90 border-amber-200"
                  : "bg-gradient-to-r from-red-50/90 to-rose-50/90 border-red-200"
              }`}>
                {status.type === "success" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : status.type === "warning" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-rose-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    status.type === "success" ? "text-green-900" :
                    status.type === "warning" ? "text-amber-900" :
                    "text-red-900"
                  }`}>
                    {status.message}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status.showRegisterSuggestion && (
                      <button
                        onClick={goToRegister}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all hover:shadow-sm active:scale-95"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Crear cuenta con este email
                      </button>
                    )}
                    
                    {status.requiresVerification && status.unverifiedEmail && !status.googleNewUser && (
                      <>
                        <button
                          onClick={resendVerification}
                          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all hover:shadow-sm active:scale-95"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Reenviar verificación
                        </button>
                        <button
                          onClick={goToVerification}
                          className="inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-all hover:shadow-sm active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ingresar código
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                    errors.email ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium ${
                      errors.email 
                        ? "border-red-400 bg-red-50/50 focus:border-red-500" 
                        : "border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400"
                    } ${loading || googleLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    type="email"
                    placeholder="ejemplo@unajma.edu.pe"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading || googleLoading}
                    autoComplete="email"
                  />
                </div>
                {(touched.email || submitted) && errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center font-medium animate-fadeIn">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-800">
                    Contraseña
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                    errors.password ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"
                  }`}>
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium ${
                      errors.password 
                        ? "border-red-400 bg-red-50/50 focus:border-red-500" 
                        : "border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400"
                    } ${loading || googleLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading || googleLoading}
                    autoComplete="current-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      errors.password ? "text-red-400 hover:text-red-600 hover:bg-red-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    } ${loading || googleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || googleLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {(touched.password || submitted) && errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center font-medium animate-fadeIn">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.password}
                  </p>
                )}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 flex items-center font-medium">
                    <Info className="w-3.5 h-3.5 mr-2" />
                    Mínimo 6 caracteres
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || loading || googleLoading || facebookLoading}
                className={`w-full py-4 px-4 text-white font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 shadow-xl flex items-center justify-center group mt-2 ${
                  isFormValid && !loading && !googleLoading && !facebookLoading
                    ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 hover:shadow-2xl active:scale-[0.98] focus:ring-blue-500/50"
                    : "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-80"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-6 h-6 animate-spin mr-3" />
                    <span className="text-base">Verificando credenciales...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                    <span className="text-base tracking-wide">Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500 font-bold text-sm uppercase tracking-wider">
                  O accede con
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="space-y-4">
              {/* Google Button */}
              <div className="w-full">
                <div className={`relative overflow-hidden rounded-xl transition-all hover:shadow-md active:scale-[0.98] ${
                  googleLoading || loading || facebookLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}>
                  <GoogleLogin
                    onSuccess={handleGoogle}
                    onError={() => {
                      setStatus({
                        type: "error",
                        message: "Error al conectar con Google",
                        showRegisterSuggestion: false,
                        requiresVerification: false,
                        unverifiedEmail: false,
                        googleNewUser: false,
                        googleEmail: ""
                      });
                      clearMessagesAfterDelay(6000);
                    }}
                    useOneTap={false}
                    shape="rectangular"
                    size="large"
                    theme="outline"
                    width="100%"
                    locale="es"
                    text="signin_with"
                    disabled={googleLoading || loading || facebookLoading}
                    containerProps={{
                      style: {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }
                    }}
                  />
                </div>
                {googleLoading && (
                  <div className="mt-3 text-center">
                    <Loader className="w-5 h-5 animate-spin inline mr-2" />
                    <span className="text-sm text-gray-600 font-medium">Procesando con Google...</span>
                  </div>
                )}
              </div>

              {/* Facebook Button */}
              <button
                onClick={handleFacebookClick}
                disabled={loading || googleLoading || facebookLoading}
                className={`w-full py-3.5 px-4 bg-white text-gray-800 font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center group border-2 border-gray-300 hover:border-gray-400 hover:shadow-md ${
                  loading || googleLoading || facebookLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {facebookLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-3" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span className="font-semibold">Continuar con Facebook</span>
                  </>
                )}
              </button>
              
              {/* Componente Facebook real (oculto) */}
              <div className="facebook-login-button absolute opacity-0 w-0 h-0 overflow-hidden">
                <FacebookLoginButton
                  onSuccess={handleFacebookSuccess}
                  onError={handleFacebookError}
                  disabled={loading || googleLoading || facebookLoading}
                />
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-8 pt-7 border-t border-gray-200/50 text-center">
              <p className="text-gray-700 font-medium mb-4 text-sm">
                ¿Eres nuevo en el sistema deportivo UNAJMA?
              </p>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-xl active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 shadow-lg hover:shadow-emerald-500/30"
                state={{ prefillEmail: formData.email }}
              >
                <UserPlus className="w-6 h-6 mr-3" />
                Crear una cuenta nueva
              </Link>
            </div>

            {/* Security Info */}
            <div className="mt-7 p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Protección de Cuenta</h4>
                  <ul className="text-xs text-gray-700 space-y-1.5">
                    <li className="flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                      Verificación de email obligatoria
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                      Acceso solo después de verificación
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                      Enlaces expiran en 24 horas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="flex items-center text-gray-500">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Gestión Deportiva</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Torneos Activos</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Award className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Competencias</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold mb-1">
            © {new Date().getFullYear()} Universidad Nacional José María Arguedas
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Sistema seguro - Protección de datos garantizada
          </p>
        </div>
      </div>
    </div>
  );
}