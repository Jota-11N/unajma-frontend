import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  CheckCircle, XCircle, Loader, MailCheck, ArrowLeft, 
  Lock, Eye, EyeOff, AlertCircle, Key, Shield 
} from "lucide-react";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState({
    loading: true,
    verified: false,
    error: false,
    message: "",
    user: null,
    needsPassword: false
  });
  
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false
  });
  
  const [passwordErrors, setPasswordErrors] = useState({
    password: "",
    confirmPassword: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validaciones de contraseña
  const validatePassword = (password) => {
    if (!password.trim()) return "La contraseña es requerida";
    if (password.length < 6) return "Mínimo 6 caracteres";
    if (!/[A-Z]/.test(password)) return "Al menos una mayúscula";
    if (!/[a-z]/.test(password)) return "Al menos una minúscula";
    if (!/[0-9]/.test(password)) return "Al menos un número";
    if (password.length > 50) return "Máximo 50 caracteres";
    return "";
  };

  const validateConfirmPassword = (confirm, password) => {
    if (!confirm.trim()) return "Confirma tu contraseña";
    if (confirm !== password) return "Las contraseñas no coinciden";
    return "";
  };

  // Verificar token
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus({
          loading: false,
          verified: false,
          error: true,
          message: "Token de verificación no encontrado",
          user: null,
          needsPassword: false
        });
        return;
      }

      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        
        if (data.success) {
          const needsPassword = data.user?.provider && !data.user?.password;
          
          setStatus({
            loading: false,
            verified: true,
            error: false,
            message: data.message || "¡Email verificado exitosamente!",
            user: data.user,
            needsPassword: needsPassword
          });
          
          // Si NO necesita contraseña, hacer login y redirigir
          if (!needsPassword && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
          
        } else {
          setStatus({
            loading: false,
            verified: false,
            error: true,
            message: data.message || "Error al verificar el email",
            user: null,
            needsPassword: false
          });
        }
      } catch (error) {
        console.error("Error verificando email:", error);
        
        setStatus({
          loading: false,
          verified: false,
          error: true,
          message: error.response?.data?.message || 
                   "Error al verificar el email. El token puede haber expirado.",
          user: null,
          needsPassword: false
        });
      }
    };

    verifyEmail();
  }, [token, navigate]);

  // Manejar cambio de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (name === "password") {
      setPasswordErrors({
        password: validatePassword(value),
        confirmPassword: validateConfirmPassword(passwordData.confirmPassword, value)
      });
    } else if (name === "confirmPassword") {
      setPasswordErrors({
        password: passwordErrors.password,
        confirmPassword: validateConfirmPassword(value, passwordData.password)
      });
    }
  };

  // Establecer contraseña
  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    const passwordError = validatePassword(passwordData.password);
    const confirmError = validateConfirmPassword(passwordData.confirmPassword, passwordData.password);
    
    if (passwordError || confirmError) {
      setPasswordErrors({
        password: passwordError,
        confirmPassword: confirmError
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post(`/auth/set-password/${token}`, {
        password: passwordData.password
      });
      
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          message: "✅ Contraseña establecida exitosamente. Redirigiendo...",
          needsPassword: false
        }));
        
        if (response.data.token && response.data.user) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else {
        setStatus(prev => ({
          ...prev,
          error: true,
          message: response.data.message || "Error al establecer contraseña"
        }));
      }
    } catch (error) {
      console.error("Error estableciendo contraseña:", error);
      
      setStatus(prev => ({
        ...prev,
        error: true,
        message: error.response?.data?.message || "Error al establecer contraseña"
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (status.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Verificando tu email...
          </h1>
          <p className="text-gray-600">Por favor espera un momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/70 p-8">
          <div className="text-center">
            
            {/* Header con icono */}
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              status.error 
                ? "bg-gradient-to-br from-red-100 to-orange-100"
                : status.needsPassword
                ? "bg-gradient-to-br from-amber-100 to-yellow-100"
                : "bg-gradient-to-br from-emerald-100 to-green-100"
            }`}>
              {status.error ? (
                <XCircle className="w-12 h-12 text-red-600" />
              ) : status.needsPassword ? (
                <Lock className="w-12 h-12 text-amber-600" />
              ) : (
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {status.error 
                ? "Error de Verificación" 
                : status.needsPassword
                ? "Completa tu Registro"
                : "¡Email Verificado!"}
            </h1>

            {/* Mensaje principal */}
            <div className={`p-4 rounded-xl border mb-6 ${
              status.error 
                ? "bg-red-50 border-red-200"
                : status.needsPassword
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}>
              <p className={`font-medium ${
                status.error ? "text-red-800" :
                status.needsPassword ? "text-amber-800" :
                "text-emerald-800"
              }`}>
                {status.message}
              </p>
              
              {status.user && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="flex items-center justify-center text-sm">
                    <MailCheck className="w-4 h-4 mr-2" />
                    <span className="font-medium">{status.user.email}</span>
                    {status.user.provider && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {status.user.provider}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formulario para establecer contraseña */}
            {status.needsPassword && !status.error && (
              <form onSubmit={handleSetPassword} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <input
                      type={passwordData.showPassword ? "text" : "password"}
                      name="password"
                      value={passwordData.password}
                      onChange={handlePasswordChange}
                      className={`w-full pl-10 pr-11 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                        passwordErrors.password 
                          ? "border-red-300 bg-red-50 focus:ring-red-500" 
                          : "border-gray-300 bg-gray-50 focus:ring-blue-500"
                      }`}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setPasswordData(prev => ({ 
                        ...prev, 
                        showPassword: !prev.showPassword 
                      }))}
                    >
                      {passwordData.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {passwordErrors.password}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <input
                      type={passwordData.showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pl-10 pr-11 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                        passwordErrors.confirmPassword 
                          ? "border-red-300 bg-red-50 focus:ring-red-500" 
                          : "border-gray-300 bg-gray-50 focus:ring-blue-500"
                      }`}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setPasswordData(prev => ({ 
                        ...prev, 
                        showConfirmPassword: !prev.showConfirmPassword 
                      }))}
                    >
                      {passwordData.showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !!passwordErrors.password || !!passwordErrors.confirmPassword}
                  className={`w-full py-3.5 px-4 text-white font-bold rounded-xl transition-all ${
                    !submitting && !passwordErrors.password && !passwordErrors.confirmPassword && 
                    passwordData.password && passwordData.confirmPassword
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg active:scale-95"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 opacity-70 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <Loader className="w-5 h-5 animate-spin mr-3" />
                      <span>Estableciendo...</span>
                    </div>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-3" />
                      <span>Establecer Contraseña</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Barra de progreso para redirección automática */}
            {!status.needsPassword && !status.error && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Serás redirigido automáticamente...
                </p>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-progress"></div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 mr-3" />
                Volver al Login
              </Link>
              
              {status.error && (
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
                >
                  <MailCheck className="w-5 h-5 mr-3" />
                  Solicitar nuevo enlace
                </Link>
              )}
            </div>

            {/* Info de seguridad */}
            {(status.needsPassword || !status.error) && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Seguridad de tu cuenta
                    </p>
                    <p className="text-xs text-gray-600">
                      {status.needsPassword 
                        ? "Tu contraseña se encripta antes de guardarse. Recomendamos usar un gestor de contraseñas."
                        : "Tu cuenta ahora está verificada y segura. Mantén tus credenciales en privado."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-blue-600/90 font-medium">
            © {new Date().getFullYear()} Universidad Nacional José María Arguedas
          </p>
          <p className="text-xs text-blue-600/70 mt-1">
            Sistema de verificación de identidad
          </p>
        </div>
      </div>

      {/* Estilos CSS para la barra de progreso */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}