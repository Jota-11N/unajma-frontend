import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Mail, ArrowLeft, Shield, Send, CheckCircle, AlertCircle, 
  Lock, Info, Clock, AlertTriangle, Check, Key, RefreshCw,
  ShieldCheck, MailCheck, LockKeyhole, Sparkles, UserCheck
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Función para formatear el tiempo de cooldown
  const formatCooldownTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Verificar cooldown cuando cambia el email
  useEffect(() => {
    if (email.trim()) {
      const userEmail = email.trim().toLowerCase();
      const savedAttemptsData = localStorage.getItem('forgotPasswordAttempts');
      
      if (savedAttemptsData) {
        const attemptsData = JSON.parse(savedAttemptsData);
        const emailAttempts = attemptsData[userEmail];
        
        if (emailAttempts && emailAttempts.lastAttempt) {
          const lastTime = new Date(emailAttempts.lastAttempt);
          const now = new Date();
          const diffInHours = (now - lastTime) / (1000 * 60 * 60);
          
          // Si han pasado más de 24 horas, limpiar datos de este email
          if (diffInHours > 24) {
            delete attemptsData[userEmail];
            localStorage.setItem('forgotPasswordAttempts', JSON.stringify(attemptsData));
            setAttempts(0);
            setRemainingAttempts(3);
            setCooldown(false);
          } else if (emailAttempts.count >= 3) {
            const remainingHours = 24 - diffInHours;
            const remainingMinutes = Math.ceil(remainingHours * 60);
            setCooldown(true);
            setCooldownTime(remainingMinutes);
            setAttempts(emailAttempts.count);
            setRemainingAttempts(0);
          } else if (emailAttempts.count > 0) {
            setAttempts(emailAttempts.count);
            setRemainingAttempts(3 - emailAttempts.count);
            setCooldown(false);
          }
        }
      }
    } else {
      // Resetear cuando el email está vacío
      setAttempts(0);
      setRemainingAttempts(3);
      setCooldown(false);
    }
  }, [email]);

  // Actualizar cooldown cada minuto
  useEffect(() => {
    if (cooldown) {
      const interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setCooldown(false);
            setAttempts(0);
            setRemainingAttempts(3);
            
            // Limpiar cooldown específico para este email
            if (email.trim()) {
              const userEmail = email.trim().toLowerCase();
              const savedAttemptsData = localStorage.getItem('forgotPasswordAttempts');
              if (savedAttemptsData) {
                const attemptsData = JSON.parse(savedAttemptsData);
                if (attemptsData[userEmail]) {
                  delete attemptsData[userEmail];
                  localStorage.setItem('forgotPasswordAttempts', JSON.stringify(attemptsData));
                }
              }
            }
            
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Actualizar cada minuto
      
      return () => clearInterval(interval);
    }
  }, [cooldown, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSuccess(false);

    const userEmail = email.trim().toLowerCase();

    // Validaciones básicas
    if (!userEmail) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError("Por favor ingresa un email válido (ejemplo: usuario@dominio.com)");
      return;
    }

    // Validar que no sea un email temporal o sospechoso
    const tempEmailDomains = [
      'tempmail.com', 'throwaway.com', '10minutemail.com', 
      'guerrillamail.com', 'yopmail.com', 'mailinator.com',
      'temp-mail.org', 'trashmail.com', 'disposablemail.com'
    ];
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (domain && tempEmailDomains.some(temp => domain.includes(temp))) {
      setError("No se permiten correos temporales. Por favor usa tu correo institucional o personal.");
      return;
    }

    // Cargar intentos específicos para este email
    const savedAttemptsData = localStorage.getItem('forgotPasswordAttempts');
    let attemptsData = savedAttemptsData ? JSON.parse(savedAttemptsData) : {};
    
    // Obtener intentos específicos para este email
    const emailAttempts = attemptsData[userEmail] || { count: 0, lastAttempt: null };
    
    // Verificar cooldown específico para este email
    if (emailAttempts.lastAttempt) {
      const lastTime = new Date(emailAttempts.lastAttempt);
      const now = new Date();
      const diffInHours = (now - lastTime) / (1000 * 60 * 60);
      
      // Verificar si está en cooldown (24 horas después de 3 intentos)
      if (emailAttempts.count >= 3 && diffInHours < 24) {
        const remainingHours = 24 - diffInHours;
        const remainingMinutes = Math.ceil(remainingHours * 60);
        setCooldown(true);
        setCooldownTime(remainingMinutes);
        setError(`Has alcanzado el límite máximo de 3 intentos. Por seguridad, debes esperar ${formatCooldownTime(remainingMinutes)} antes de solicitar otro enlace.`);
        return;
      }
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { 
        email: userEmail
      });
      
      // Actualizar intentos específicos para este email
      const newAttempts = emailAttempts.count + 1;
      const updatedRemaining = 3 - newAttempts;
      const updatedAttemptsData = {
        ...attemptsData,
        [userEmail]: {
          count: newAttempts,
          lastAttempt: new Date().toISOString()
        }
      };
      
      localStorage.setItem('forgotPasswordAttempts', JSON.stringify(updatedAttemptsData));
      setAttempts(newAttempts);
      setRemainingAttempts(updatedRemaining);
      
      // Verificar si superó el límite
      if (newAttempts >= 3) {
        setCooldown(true);
        setCooldownTime(1440); // 24 horas en minutos
        setRemainingAttempts(0);
      }
      
      // Mostrar mensaje de éxito específico
      let successMessage;
      if (data.message) {
        successMessage = data.message;
      } else if (updatedRemaining > 0) {
        successMessage = `✅ Enlace de recuperación enviado a ${userEmail}. Te quedan ${updatedRemaining} ${updatedRemaining === 1 ? 'intento' : 'intentos'} disponible${updatedRemaining === 1 ? '' : 's'} para hoy.`;
      } else {
        successMessage = `✅ Enlace de recuperación enviado a ${userEmail}. Has alcanzado el límite máximo de intentos por hoy.`;
      }
      
      setMessage(successMessage);
      setSuccess(true);
      setEmail("");
      
      // Redirigir después de 5 segundos
      setTimeout(() => {
        navigate("/login");
      }, 5000);
      
    } catch (err) {
      console.error("Error en recuperación de contraseña:", err);
      
      let errorMessage;
      
      if (err.response?.status === 401 || err.response?.status === 404) {
        // Usuario no encontrado o credenciales inválidas
        errorMessage = "No encontramos una cuenta registrada con este correo. Verifica el email o regístrate si eres nuevo.";
      } else if (err.response?.status === 400) {
        // Error de validación del backend
        if (err.response.data?.provider) {
          const provider = err.response.data.provider === 'google' ? 'Google' : 'Facebook';
          errorMessage = `Esta cuenta está registrada con ${provider}. Por favor, inicia sesión con ${provider} o contacta al administrador.`;
        } else {
          errorMessage = err.response.data?.message || "Error en la solicitud. Por favor verifica los datos.";
        }
      } else if (err.response?.status === 429) {
        // Rate limiting
        errorMessage = "Demasiadas solicitudes. Por favor espera unos minutos antes de intentar nuevamente.";
      } else if (err.response?.status === 500) {
        errorMessage = "Error en el servidor. Por favor intenta más tarde o contacta al soporte técnico.";
      } else if (!err.response) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.";
      } else {
        errorMessage = err.response?.data?.message || "Error al procesar tu solicitud. Por favor intenta nuevamente.";
      }
      
      setError(errorMessage);
      
      // No incrementar intentos en caso de error específico del backend
      if (err.response?.status !== 401 && err.response?.status !== 404) {
        const userEmail = email.trim().toLowerCase();
        const savedAttemptsData = localStorage.getItem('forgotPasswordAttempts');
        let attemptsData = savedAttemptsData ? JSON.parse(savedAttemptsData) : {};
        const emailAttempts = attemptsData[userEmail] || { count: 0, lastAttempt: null };
        
        const newAttempts = emailAttempts.count + 1;
        const updatedRemaining = 3 - newAttempts;
        const updatedAttemptsData = {
          ...attemptsData,
          [userEmail]: {
            count: newAttempts,
            lastAttempt: new Date().toISOString()
          }
        };
        
        localStorage.setItem('forgotPasswordAttempts', JSON.stringify(updatedAttemptsData));
        setAttempts(newAttempts);
        setRemainingAttempts(updatedRemaining);
        
        if (newAttempts >= 3) {
          setCooldown(true);
          setCooldownTime(1440);
          setRemainingAttempts(0);
        }
      }
    } finally {
      setLoading(false);
    }
  };

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
            <LockKeyhole className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
            Recuperación Segura
          </h1>
          <p className="text-gray-600 font-medium">Sistema Deportivo UNAJMA</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl backdrop-blur-sm mb-5 border border-white/20">
                <Key className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
              <p className="text-blue-100/90 text-sm font-medium">Recupera el acceso a tu cuenta de forma segura</p>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Estado de intentos */}
            {attempts > 0 && !cooldown && remainingAttempts > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 text-lg mb-1">Control de Seguridad</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-amber-800">
                        Intentos realizados: <span className="font-bold">{attempts} de 3</span>
                      </p>
                      <div className="w-full bg-amber-100 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(attempts / 3) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-amber-700">
                        Te quedan <span className="font-bold">{remainingAttempts}</span> {remainingAttempts === 1 ? 'intento' : 'intentos'} disponible{remainingAttempts === 1 ? '' : 's'} para hoy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Último intento disponible */}
            {remainingAttempts === 1 && attempts < 3 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-orange-50/90 to-red-50/90 backdrop-blur-sm border border-orange-200 rounded-2xl shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 text-lg mb-2">¡Atención importante!</h3>
                    <p className="text-sm text-orange-800 mb-2">
                      Este es tu <span className="font-bold">último intento disponible</span> para hoy.
                    </p>
                    <p className="text-xs text-orange-700">
                      Si fallas este intento, deberás esperar <span className="font-semibold">24 horas</span> antes de poder solicitar otro enlace.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cooldown activo */}
            {cooldown && (
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50/90 to-orange-50/90 backdrop-blur-sm border border-red-200 rounded-2xl shadow-sm animate-fade-in">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 text-lg mb-2">Límite de seguridad alcanzado</h3>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex-1">
                        <p className="text-sm text-red-800 mb-1">Has utilizado tus 3 intentos diarios.</p>
                        <p className="text-xs text-red-700">Por seguridad del sistema, debes esperar:</p>
                      </div>
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-2 px-4 rounded-xl text-center min-w-32">
                        <div className="text-xl">{formatCooldownTime(cooldownTime)}</div>
                        <div className="text-xs font-normal opacity-90">Restantes</div>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 flex items-center">
                      <Info className="w-3 h-3 mr-2" />
                      Este tiempo asegura la protección de tu cuenta contra intentos no autorizados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            {error && (
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50/90 to-rose-50/90 backdrop-blur-sm border border-red-200 rounded-2xl shadow-sm animate-fade-in">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-100 to-rose-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 text-lg mb-2">Error en la solicitud</h3>
                    <p className="text-red-800 text-sm mb-3">{error}</p>
                    {error.includes("no encontramos") && (
                      <Link 
                        to="/register" 
                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        ¿No tienes cuenta? Regístrate aquí
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50/90 to-green-50/90 backdrop-blur-sm border border-emerald-200 rounded-2xl shadow-sm animate-fade-in">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                    {success ? (
                      <Sparkles className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-lg mb-2">¡Solicitud procesada!</h3>
                    <p className="text-emerald-800 text-sm mb-3">{message}</p>
                    {success && (
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
                          <p className="text-sm text-emerald-700">
                            Redirigiendo al inicio de sesión en <span className="font-bold">5 segundos</span>...
                          </p>
                        </div>
                        {remainingAttempts > 0 && (
                          <div className="p-3 bg-gradient-to-r from-emerald-100/50 to-green-100/50 rounded-lg border border-emerald-200">
                            <p className="text-xs text-emerald-800 font-medium">
                              ⚠️ Recuerda: Te quedan <span className="font-bold">{remainingAttempts}</span> {remainingAttempts === 1 ? 'intento' : 'intentos'} disponible{remainingAttempts === 1 ? '' : 's'} para hoy.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instrucciones principales */}
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-4 font-medium">
                Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu contraseña
              </p>
              <div className="inline-flex items-center space-x-2 text-sm text-blue-600 bg-blue-50/50 px-4 py-2 rounded-lg border border-blue-200">
                <MailCheck className="w-4 h-4" />
                <span className="font-medium">Enlace válido por 24 horas</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Correo Electrónico Registrado</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium ${
                      error 
                        ? "border-red-400 bg-red-50/50 focus:border-red-500" 
                        : "border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400"
                    } ${loading || cooldown || success ? "opacity-70 cursor-not-allowed" : ""}`}
                    type="email"
                    placeholder="usuario@unajma.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || cooldown || success}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="mt-2 flex items-center text-xs text-blue-600 font-medium">
                  <Info className="w-3.5 h-3.5 mr-2" />
                  Usa el correo con el que te registraste en el sistema deportivo
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading || !email.trim() || cooldown || success}
                className={`w-full py-4 px-4 text-white font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 shadow-xl flex items-center justify-center group mt-2 ${
                  !loading && email.trim() && !cooldown && !success
                    ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 hover:shadow-2xl active:scale-[0.98] focus:ring-blue-500/50"
                    : "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-80"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative mr-3">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <span className="text-base">Enviando enlace seguro...</span>
                  </div>
                ) : cooldown ? (
                  <>
                    <Clock className="w-6 h-6 mr-3" />
                    <span className="text-base">Espera {formatCooldownTime(cooldownTime)}</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="w-6 h-6 mr-3" />
                    <span className="text-base">¡Enlace enviado exitosamente!</span>
                  </>
                ) : remainingAttempts === 1 ? (
                  <>
                    <AlertCircle className="w-6 h-6 mr-3" />
                    <span className="text-base">Último intento - Enviar enlace</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                    <span className="text-base tracking-wide">Enviar enlace de recuperación</span>
                  </>
                )}
              </button>

              {/* Enlace de regreso */}
              <div className="text-center pt-4 border-t border-gray-200/50">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
            
            {/* Proceso de recuperación */}
            <div className="mt-8 pt-7 border-t border-gray-200/50">
              <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                Proceso de recuperación en 3 pasos
              </h3>
              <div className="space-y-4">
                <div className="flex items-start bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-4 rounded-xl border border-blue-200/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Ingresa tu correo registrado</p>
                    <p className="text-xs text-gray-600">Máximo 3 intentos permitidos cada 24 horas por seguridad</p>
                  </div>
                </div>
                <div className="flex items-start bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-4 rounded-xl border border-blue-200/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Revisa tu bandeja de entrada</p>
                    <p className="text-xs text-gray-600">Incluye la carpeta de spam o correo no deseado</p>
                  </div>
                </div>
                <div className="flex items-start bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-4 rounded-xl border border-blue-200/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Sigue el enlace seguro</p>
                    <p className="text-xs text-gray-600">Válido por 24 horas para crear una nueva contraseña</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de seguridad */}
            <div className="mt-7 p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Medidas de seguridad implementadas</h4>
                  <ul className="space-y-2.5">
                    <li className="text-xs text-gray-700 flex items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Lock className="w-3 h-3 text-blue-600" />
                      </div>
                      <span><span className="font-semibold">Límite de 3 intentos</span> por correo cada 24 horas</span>
                    </li>
                    <li className="text-xs text-gray-700 flex items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Clock className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>Enlace de recuperación <span className="font-semibold">válido por 24 horas</span></span>
                    </li>
                    <li className="text-xs text-gray-700 flex items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <AlertCircle className="w-3 h-3 text-blue-600" />
                      </div>
                      <span><span className="font-semibold">No se permiten correos temporales</span> o desechables</span>
                    </li>
                    <li className="text-xs text-gray-700 flex items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Info className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>Soporte técnico: <span className="font-semibold text-blue-700">soporte@unajma.edu.pe</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 mb-4 text-gray-500">
            <div className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Protección de cuenta</span>
            </div>
            <div className="flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Encriptación segura</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">24h de validez</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold mb-1">
            © {new Date().getFullYear()} Universidad Nacional José María Arguedas
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Sistema seguro • Política de 3 intentos por día • Enlace temporal
          </p>
        </div>
      </div>
    </div>
  );
}