import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, 
  KeyRound, ArrowLeft, RefreshCw, Sparkles, Zap, 
  Clock, ShieldCheck, AlertTriangle, Info, Loader,
  Check, X, LockKeyhole, ArrowRight, TrendingUp, Key,
  BadgeCheck, RotateCw, MailCheck, Award
} from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: { valid: false, message: "Mínimo 8 caracteres" },
    uppercase: { valid: false, message: "Al menos una mayúscula" },
    lowercase: { valid: false, message: "Al menos una minúscula" },
    number: { valid: false, message: "Al menos un número" },
    special: { valid: false, message: "Carácter especial" },
    notCommon: { valid: false, message: "No usar comunes" },
    notSameAsOld: { valid: true, message: "No repetir anterior" },
  });
  const [passwordHistory, setPasswordHistory] = useState([]);
  const [tokenValid, setTokenValid] = useState(true);
  
  // Obtener token
  const tokenFromQuery = searchParams.get("token");
  let token = tokenFromQuery;
  
  if (!token && window.location.pathname.includes('/reset-password/')) {
    const pathParts = window.location.pathname.split('/reset-password/');
    if (pathParts.length > 1) {
      token = pathParts[1];
      if (token.includes('?')) token = token.split('?')[0];
    }
  }

  // Lista de contraseñas comunes a evitar
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 'unajma2024',
    'contraseña', 'abcdefgh', 'welcome123', 'letmein123', 'football'
  ];

  // Validar contraseña en tiempo real
  const validatePassword = useCallback((pass) => {
    const validations = {
      length: { 
        valid: pass.length >= 8 && pass.length <= 32,
        message: "Entre 8 y 32 caracteres" 
      },
      uppercase: { 
        valid: /[A-Z]/.test(pass),
        message: "Al menos una mayúscula (A-Z)" 
      },
      lowercase: { 
        valid: /[a-z]/.test(pass),
        message: "Al menos una minúscula (a-z)" 
      },
      number: { 
        valid: /[0-9]/.test(pass),
        message: "Al menos un número (0-9)" 
      },
      special: { 
        valid: /[@$!%*?&#]/.test(pass),
        message: "Carácter especial (@$!%*?&#)" 
      },
      notCommon: { 
        valid: !commonPasswords.some(common => 
          pass.toLowerCase().includes(common.toLowerCase())
        ),
        message: "No usar contraseñas comunes" 
      },
      notSameAsOld: { 
        valid: !passwordHistory.includes(pass),
        message: "No repetir contraseña anterior" 
      },
    };
    setPasswordValidations(validations);
  }, [passwordHistory]);

  // Efecto para validar contraseña
  useEffect(() => {
    if (password) {
      validatePassword(password);
    }
  }, [password, validatePassword]);

  // Verificar token
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("El enlace de recuperación no es válido o ha expirado");
    } else {
      console.log("✅ Token válido recibido:", token);
    }
  }, [token]);

  const isPasswordValid = () => {
    return Object.values(passwordValidations).every(v => v.valid);
  };

  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidations).filter(v => v.valid).length;
    const totalCount = Object.keys(passwordValidations).length;
    const percentage = (validCount / totalCount) * 100;
    
    if (percentage >= 90) return { 
      text: "Excelente", 
      color: "from-emerald-500 to-green-600", 
      bgColor: "bg-gradient-to-r from-emerald-50 to-green-100",
      borderColor: "border-emerald-200",
      icon: Sparkles,
      width: "100%" 
    };
    if (percentage >= 70) return { 
      text: "Fuerte", 
      color: "from-blue-500 to-cyan-600", 
      bgColor: "bg-gradient-to-r from-blue-50 to-cyan-100",
      borderColor: "border-blue-200",
      icon: ShieldCheck,
      width: "80%" 
    };
    if (percentage >= 50) return { 
      text: "Buena", 
      color: "from-amber-500 to-yellow-600", 
      bgColor: "bg-gradient-to-r from-amber-50 to-yellow-100",
      borderColor: "border-amber-200",
      icon: TrendingUp,
      width: "60%" 
    };
    if (percentage >= 30) return { 
      text: "Débil", 
      color: "from-orange-500 to-red-600", 
      bgColor: "bg-gradient-to-r from-orange-50 to-red-100",
      borderColor: "border-orange-200",
      icon: AlertTriangle,
      width: "40%" 
    };
    return { 
      text: "Muy débil", 
      color: "from-gray-400 to-gray-600", 
      bgColor: "bg-gradient-to-r from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
      icon: Info,
      width: "20%" 
    };
  };

  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '@$!%*?&#';
    
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    // Completar hasta 12 caracteres
    const allChars = uppercase + lowercase + numbers + specials;
    while (password.length < 12) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar los caracteres
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(password);
    setConfirmPassword(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password.trim()) {
      setError("Por favor ingresa una contraseña");
      return;
    }

    if (!isPasswordValid()) {
      setError("La contraseña no cumple con todos los requisitos de seguridad");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      setError("Token inválido");
      return;
    }

    setLoading(true);

    try {
      console.log("🔍 Enviando token:", token);
      
      const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { 
        password: password 
      });
      
      setSuccess(data.message || "¡Contraseña cambiada exitosamente!");
      setPassword("");
      setConfirmPassword("");

      // Agregar a historial (simulado)
      setPasswordHistory(prev => [...prev, password]);

      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.",
            success: true 
          } 
        });
      }, 3000);
    } catch (err) {
      console.error("❌ Error en reset password:", err);
      
      let errorMessage = "Error al cambiar la contraseña";
      
      if (err.response?.status === 400) {
        if (err.response.data?.message?.includes("antigua")) {
          errorMessage = "No puedes usar la misma contraseña anterior. Por favor crea una nueva.";
        } else {
          errorMessage = "Token inválido o expirado. Solicita un nuevo enlace.";
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Ruta no encontrada. Verifica la configuración del servidor.";
      } else if (!err.response) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();
  const StrengthIcon = strength.icon;
  const isFormValid = isPasswordValid() && password === confirmPassword && tokenValid;
  const validCount = Object.values(passwordValidations).filter(v => v.valid).length;
  const totalCount = Object.keys(passwordValidations).length;

  // Vista cuando el token no es válido
  if (!tokenValid) {
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
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Enlace Inválido
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
                <h2 className="text-2xl font-bold text-white mb-2">Enlace Expirado</h2>
                <p className="text-blue-100/90 text-sm font-medium">Este enlace de recuperación ha caducado</p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Este enlace ya no es válido</h3>
                <p className="text-gray-600 mb-8">
                  Los enlaces de recuperación tienen una validez de 24 horas por seguridad. 
                  Debes solicitar un nuevo enlace para restablecer tu contraseña.
                </p>

                <div className="space-y-4">
                  <Link 
                    to="/forgot-password" 
                    className="flex items-center justify-center w-full py-4 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white font-bold rounded-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-xl group"
                  >
                    <RotateCw className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-base">Solicitar Nuevo Enlace</span>
                  </Link>
                  
                  <Link 
                    to="/login" 
                    className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-300 group border border-gray-300"
                  >
                    <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al Inicio de Sesión</span>
                  </Link>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-8 p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Medidas de seguridad activas</h4>
                    <ul className="space-y-2 text-xs text-gray-700">
                      <li className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Enlaces válidos por <span className="font-semibold">24 horas</span></span>
                      </li>
                      <li className="flex items-center">
                        <Lock className="w-3.5 h-3.5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Uso <span className="font-semibold">único por enlace</span></span>
                      </li>
                      <li className="flex items-center">
                        <MailCheck className="w-3.5 h-3.5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Verificación de identidad obligatoria</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-4">
            <LockKeyhole className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
            Restablecer Contraseña
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
                <KeyRound className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Crear Nueva Contraseña</h2>
              <p className="text-blue-100/90 text-sm font-medium">Crea una contraseña segura para tu cuenta</p>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50/90 to-rose-50/90 backdrop-blur-sm border border-red-200 rounded-2xl shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-100 to-rose-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 text-lg mb-2">Error en la solicitud</h3>
                    <p className="text-red-800 text-sm mb-3">{error}</p>
                    {error.includes("antigua") && (
                      <button
                        onClick={generateSecurePassword}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generar contraseña segura
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50/90 to-green-50/90 backdrop-blur-sm border border-emerald-200 rounded-2xl shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-lg mb-2">¡Contraseña actualizada!</h3>
                    <p className="text-emerald-800 text-sm mb-3">{success}</p>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
                      <p className="text-sm text-emerald-700 font-medium">
                        Redirigiendo al inicio de sesión en 3 segundos...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two Columns Layout */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                        <Lock className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>Nueva Contraseña</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <input
                        id="password"
                        className="w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crea una contraseña segura"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={32}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>Confirmar Contraseña</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="confirmPassword"
                        className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium disabled:opacity-60 ${
                          confirmPassword
                            ? password === confirmPassword
                              ? "border-emerald-500 bg-emerald-50/30 focus:border-emerald-500"
                              : "border-red-400 bg-red-50/30 focus:border-red-500"
                            : "border-gray-300 bg-gray-50/50 focus:border-blue-500"
                        }`}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <div className={`mt-3 flex items-center text-sm font-medium ${
                        password === confirmPassword ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {password === confirmPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span>Las contraseñas coinciden</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>Las contraseñas no coinciden</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Generate Password Button */}
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center group border-2 border-gray-300 hover:border-gray-400 hover:shadow-md"
                    disabled={loading}
                  >
                    <RefreshCw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Generar Contraseña Segura</span>
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`w-full py-4 px-4 text-white font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 shadow-xl flex items-center justify-center group mt-2 ${
                      isFormValid && !loading
                        ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 hover:shadow-2xl active:scale-[0.98] focus:ring-blue-500/50"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-80"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="relative mr-3">
                          <Loader className="w-6 h-6 animate-spin" />
                          <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <span className="text-base">Cambiando contraseña...</span>
                      </div>
                    ) : (
                      <>
                        <Lock className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-base tracking-wide">Cambiar Contraseña</span>
                        <ArrowRight className="w-5 h-5 ml-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>

              {/* Right Column - Password Strength */}
              <div>
                {/* Strength Meter */}
                <div className={`p-6 rounded-2xl border shadow-sm mb-6 ${strength.bgColor} ${strength.borderColor}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${strength.color} flex items-center justify-center mr-4 shadow-lg`}>
                        <StrengthIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Nivel de Seguridad</h3>
                        <div className={`text-lg font-bold bg-gradient-to-r ${strength.color} bg-clip-text text-transparent`}>
                          {strength.text}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {validCount}/{totalCount}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Requisitos</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                      <span>Progreso de validación</span>
                      <span>{Math.round((validCount / totalCount) * 100)}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${strength.color} transition-all duration-700 ease-out`}
                        style={{ width: strength.width }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Validation List */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                    Validaciones de seguridad
                  </h4>
                  
                  <div className="space-y-3">
                    {Object.entries(passwordValidations).map(([key, validation]) => (
                      <div 
                        key={key} 
                        className={`flex items-start p-4 rounded-xl border transition-all duration-300 ${
                          validation.valid 
                            ? 'bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-emerald-200' 
                            : 'bg-gradient-to-r from-gray-50/50 to-white/50 border-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                          validation.valid 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100' 
                            : 'bg-gradient-to-r from-gray-100 to-gray-200'
                        }`}>
                          {validation.valid ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            validation.valid ? 'text-emerald-700' : 'text-gray-700'
                          }`}>
                            {validation.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Tips */}
                <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Recomendaciones de seguridad</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        <li className="flex items-start">
                          <Award className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Usa un <span className="font-semibold">gestor de contraseñas</span> profesional</span>
                        </li>
                        <li className="flex items-start">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span><span className="font-semibold">No reutilices</span> contraseñas en diferentes servicios</span>
                        </li>
                        <li className="flex items-start">
                          <Shield className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Activa la <span className="font-semibold">verificación en dos pasos</span> cuando esté disponible</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Use Warning */}
            <div className="mt-8 p-5 bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl shadow-sm">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 mb-2">⚠️ Enlace de uso único</h4>
                  <p className="text-sm text-amber-800 mb-2">
                    Este enlace es válido por 24 horas y solo puede utilizarse una vez.
                  </p>
                  <p className="text-xs text-amber-700">
                    Después de cambiar tu contraseña, este enlace dejará de funcionar por seguridad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="flex items-center text-gray-500">
              <LockKeyhole className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Protección de cuenta</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">24h de validez</span>
            </div>
            <div className="flex items-center text-gray-500">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Encriptación segura</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold mb-1">
            © {new Date().getFullYear()} Universidad Nacional José María Arguedas
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Sistema seguro • Enlace de un solo uso • Verificación requerida
          </p>
        </div>
      </div>
    </div>
  );
}