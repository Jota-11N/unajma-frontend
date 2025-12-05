import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLoginButton from "../components/FacebookLoginButton";
import { 
  Eye, EyeOff, Check, X, Trophy, Shield, User, 
  Mail, Key, Lock, AlertCircle, Users, Award, Calendar, Target, Zap, Star,
  UserPlus, CheckCircle, Sparkles, Globe, Heart, TrendingUp, Medal,
  ArrowRight, BadgeCheck, Loader, Info, ExternalLink, LockKeyhole
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const navigate = useNavigate();

  // Validar contraseña en tiempo real
  useEffect(() => {
    const validatePassword = (password) => {
      const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&]/.test(password),
      };
      setPasswordValidations(validations);
    };
    
    validatePassword(formData.password);
  }, [formData.password]);

  const isPasswordValid = () => Object.values(passwordValidations).every(v => v === true);

  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidations).filter(v => v).length;
    if (validCount === 5) return { text: "Excelente", color: "from-emerald-500 to-green-600", width: "100%", bg: "bg-emerald-500" };
    if (validCount >= 3) return { text: "Buena", color: "from-amber-500 to-yellow-600", width: "70%", bg: "bg-amber-500" };
    if (validCount >= 1) return { text: "Débil", color: "from-orange-500 to-red-600", width: "40%", bg: "bg-orange-500" };
    return { text: "Muy débil", color: "from-gray-400 to-gray-500", width: "10%", bg: "bg-gray-400" };
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    // Validaciones mejoradas
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setErr("Por favor ingresa tu nombre completo (nombre y apellido)");
      return;
    }

    if (!formData.email.trim()) {
      setErr("Por favor ingresa tu correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErr("Por favor ingresa un email válido");
      return;
    }

    const tempEmailDomains = ['tempmail.com', 'throwaway.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'mailinator.com'];
    const domain = formData.email.split('@')[1]?.toLowerCase();
    if (tempEmailDomains.some(temp => domain?.includes(temp))) {
      setErr("No se permiten correos temporales. Usa tu correo institucional o personal válido.");
      return;
    }

    if (!formData.password.trim()) {
      setErr("Por favor crea una contraseña");
      return;
    }

    if (!isPasswordValid()) {
      setErr("La contraseña no cumple con todos los requisitos de seguridad");
      return;
    }

    if (!formData.confirmPassword.trim()) {
      setErr("Por favor confirma tu contraseña");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("Respuesta del backend:", data);

      // CASO 1: Registro exitoso con token (inicio de sesión automático)
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        setSuccess("¡Cuenta creada exitosamente! Iniciando sesión...");
        
        // Redirigir al dashboard inmediatamente
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
        
      } 
      // CASO 2: Registro exitoso pero requiere verificación
      else if (data.requiresVerification || data.message?.toLowerCase().includes("verificar")) {
        setSuccess("¡Registro exitoso! Por favor verifica tu correo electrónico.");
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        
        // Redirigir a página de "verificación enviada"
        setTimeout(() => {
          navigate("/verify-email-sent"); // Ahora esta página existe
        }, 2000);
      }
      // CASO 3: Otro éxito
      else {
        setSuccess(data.message || "¡Registro exitoso!");
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
      
    } catch (error) {
      let message = error.response?.data?.message || "Error al registrarse";
      // Manejo específico de errores
      if (error.response?.data?.provider === 'google') {
        message = "Este correo ya está registrado con Google. Por favor inicia sesión con Google.";
        
        // Opcional: Sugerir ir a login
        setTimeout(() => {
          navigate("/login");
        }, 4000);
      }
      setErr(message);
      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (response) => {
    setErr("");
    setGoogleLoading(true);

    try {
      console.log('🔍 Google register response:', response);
      
      const googleToken = response.credential;
      
      if (!googleToken) {
        setErr("Error: No se recibió token de Google");
        console.error('❌ No hay credential en la respuesta:', response);
        return;
      }

      console.log('📤 Enviando token de Google al backend...');
      
      const res = await api.post("/auth/google", {
        credential: googleToken,
      });

      console.log('✅ Respuesta del backend:', res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        setSuccess("🎉 Ya tienes una cuenta creada. Redirigiendo...");
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error completo en Google register:', error);
      
      let message = "Error al registrarse con Google";
      
      if (error.response?.data?.message?.includes("ya está registrado")) {
        message = "Este correo ya está registrado. Por favor inicia sesión en lugar de registrarte.";
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      setErr(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSuccess = (data) => {
    console.log('Facebook register response:', data);
    
    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('🎉 ¡Registro con Facebook exitoso! Redirigiendo...');
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    }
    setFacebookLoading(false);
  };

  const handleFacebookError = (error) => {
    console.error('❌ Error en Facebook register:', error);
    
    let message = 'Error al registrarse con Facebook';
    
    if (error.includes('ya está registrado')) {
      message = 'Este correo ya está registrado. Por favor inicia sesión.';
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    
    setErr(message);
    setFacebookLoading(false);
  };

  const handleFacebookClick = () => {
    setFacebookLoading(true);
    const button = document.querySelector('.facebook-register-button button');
    if (button) {
      button.click();
    } else {
      setTimeout(() => {
        const retryButton = document.querySelector('.facebook-register-button button');
        if (retryButton) {
          retryButton.click();
        } else {
          setFacebookLoading(false);
          setErr("Error al cargar Facebook. Intenta recargar la página.");
        }
      }, 100);
    }
  };

  const strength = getPasswordStrength();
  const isFormValid = formData.name && formData.email && isPasswordValid() && 
                     formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
            Sistema Deportivo UNAJMA
          </h1>
          <p className="text-gray-600 font-medium">Únete a la comunidad deportiva más grande</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl backdrop-blur-sm mb-5 border border-white/20">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Crear Cuenta Nueva</h2>
              <p className="text-blue-100/90 text-sm font-medium">Completa el formulario para comenzar tu experiencia deportiva</p>
            </div>
          </div>

          {/* Card Content - Two Columns */}
          <div className="md:flex">
            {/* Left Column - Benefits */}
            <div className="md:w-2/5 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 p-8 md:p-10">
              <div className="sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  Beneficios Exclusivos
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-white/80 to-blue-50/50 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Comunidad Activa</h3>
                      <p className="text-sm text-gray-600">+2,000 deportistas y 500 equipos registrados</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-white/80 to-emerald-50/50 border border-emerald-200/50 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Torneos en Vivo</h3>
                      <p className="text-sm text-gray-600">Resultados y estadísticas en tiempo real</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-white/80 to-purple-50/50 border border-purple-200/50 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Logros y Reconocimientos</h3>
                      <p className="text-sm text-gray-600">Medallas y reconocimientos oficiales</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-white/80 to-amber-50/50 border border-amber-200/50 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Estadísticas Avanzadas</h3>
                      <p className="text-sm text-gray-600">Análisis detallado de rendimiento</p>
                    </div>
                  </div>
                </div>

                {/* Community Stats */}
                <div className="mt-10 p-6 bg-gradient-to-r from-white/90 to-blue-50/50 rounded-2xl border border-blue-200/50 shadow-inner">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-3" />
                    Números de la Comunidad
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-xl border border-blue-200/30">
                      <p className="text-2xl font-bold text-blue-700 mb-1">50+</p>
                      <p className="text-sm text-gray-700 font-medium">Torneos Activos</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-100/50 to-green-100/50 rounded-xl border border-emerald-200/30">
                      <p className="text-2xl font-bold text-emerald-700 mb-1">2,000+</p>
                      <p className="text-sm text-gray-700 font-medium">Deportistas</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-xl border border-purple-200/30">
                      <p className="text-2xl font-bold text-purple-700 mb-1">500+</p>
                      <p className="text-sm text-gray-700 font-medium">Equipos</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-xl border border-amber-200/30">
                      <p className="text-2xl font-bold text-amber-700 mb-1">24/7</p>
                      <p className="text-sm text-gray-700 font-medium">Soporte</p>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 p-5 bg-gradient-to-r from-emerald-50/90 to-green-50/90 rounded-2xl border border-emerald-200/50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mr-4">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Verificación Obligatoria</p>
                      <p className="text-xs text-emerald-700">Todos los usuarios verifican su email</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Registration Form */}
            <div className="md:w-3/5 p-8 md:p-10">
              <div className="max-w-lg mx-auto">
                {/* Status Messages */}
                {err && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-red-50/90 to-rose-50/90 backdrop-blur-sm border border-red-200 rounded-2xl shadow-sm">
                    <div className="flex items-start">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-100 to-rose-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 text-lg mb-1">Error en el registro</h3>
                        <p className="text-red-800 text-sm">{err}</p>
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
                        <h3 className="font-bold text-emerald-900 text-lg mb-1">¡Registro exitoso!</h3>
                        <p className="text-emerald-800 text-sm mb-3">{success}</p>
                        {success.includes("iniciando") && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
                            <p className="text-sm text-emerald-700 font-medium">
                              Redirigiendo al sistema...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Name and Email */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Nombre Completo</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          className="w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60"
                          type="text"
                          placeholder="Juan Quispe Pérez"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading || googleLoading || facebookLoading}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <p className="mt-2 text-xs text-blue-600 font-medium flex items-center">
                        <Info className="w-3.5 h-3.5 mr-2" />
                        Ingresa nombre y apellido
                      </p>
                    </div>

                    <div>
                      <label htmlFor="email" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Correo Electrónico</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          className="w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60"
                          type="email"
                          placeholder="usuario@unajma.edu.pe"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading || googleLoading || facebookLoading}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <p className="mt-2 text-xs text-blue-600 font-medium flex items-center">
                        <Info className="w-3.5 h-3.5 mr-2" />
                        Usa tu correo institucional
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Password and Confirm */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="password" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                          <LockKeyhole className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Contraseña</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          className="w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium border-gray-300 bg-gray-50/50 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading || googleLoading || facebookLoading}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading || googleLoading || facebookLoading}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="flex items-center text-sm font-bold text-gray-800 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                          <LockKeyhole className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Confirmar Contraseña</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all text-gray-900 font-medium disabled:opacity-60 ${
                            formData.confirmPassword
                              ? formData.password === formData.confirmPassword
                                ? "border-emerald-500 bg-emerald-50/30 focus:border-emerald-500"
                                : "border-red-400 bg-red-50/30 focus:border-red-500"
                              : "border-gray-300 bg-gray-50/50 focus:border-blue-500"
                          }`}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading || googleLoading || facebookLoading}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading || googleLoading || facebookLoading}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm">
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-gray-900">Nivel de seguridad:</span>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${strength.color}`}>
                            {strength.text}
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 bg-gradient-to-r ${strength.color}`}
                            style={{ width: strength.width }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-blue-600" />
                          Requisitos de seguridad
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(passwordValidations).map(([key, isValid]) => (
                            <div key={key} className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-white/80 to-blue-50/50 border border-blue-200/30">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isValid ? 'bg-gradient-to-r from-emerald-100 to-green-100' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                                {isValid ? (
                                  <Check size={16} className="text-emerald-600" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                )}
                              </div>
                              <span className={`text-xs font-medium text-center ${isValid ? 'text-emerald-700' : 'text-blue-700'}`}>
                                {key === "length" && "8+ chars"}
                                {key === "uppercase" && "Mayúscula"}
                                {key === "lowercase" && "Minúscula"}
                                {key === "number" && "Número"}
                                {key === "special" && "Especial"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Match Confirmation */}
                  {formData.confirmPassword && (
                    <div className={`p-5 rounded-2xl border ${formData.password === formData.confirmPassword ? 'bg-gradient-to-r from-emerald-50/90 to-green-50/90 border-emerald-200' : 'bg-gradient-to-r from-red-50/90 to-rose-50/90 border-red-200'}`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${formData.password === formData.confirmPassword ? 'bg-gradient-to-r from-emerald-100 to-green-100' : 'bg-gradient-to-r from-red-100 to-rose-100'}`}>
                          {formData.password === formData.confirmPassword ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-bold ${formData.password === formData.confirmPassword ? 'text-emerald-900' : 'text-red-900'}`}>
                            {formData.password === formData.confirmPassword ? "¡Contraseñas coinciden!" : "Contraseñas no coinciden"}
                          </h4>
                          <p className={`text-sm ${formData.password === formData.confirmPassword ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formData.password === formData.confirmPassword 
                              ? "Puedes continuar con el registro de forma segura."
                              : "Verifica que ambas contraseñas sean exactamente iguales."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
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
                        <div className="relative mr-3">
                          <Loader className="w-6 h-6 animate-spin" />
                          <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <span className="text-base">Creando cuenta...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-base tracking-wide">Crear Mi Cuenta</span>
                        <ArrowRight className="w-5 h-5 ml-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300/50"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-gray-500 font-bold text-sm uppercase tracking-wider">
                      O regístrate con
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
                          setErr("Error al conectar con Google");
                        }}
                        useOneTap={false}
                        shape="rectangular"
                        size="large"
                        theme="outline"
                        width="100%"
                        locale="es"
                        text="signup_with"
                        disabled={googleLoading || loading || facebookLoading}
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
                        <div className="relative mr-3">
                          <Loader className="w-5 h-5 animate-spin" />
                          <div className="absolute inset-0 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        </div>
                        <span>Conectando con Facebook...</span>
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
                  
                  {/* Hidden Facebook Component */}
                  <div className="facebook-register-button absolute opacity-0 w-0 h-0 overflow-hidden">
                    <FacebookLoginButton
                      onSuccess={handleFacebookSuccess}
                      onError={handleFacebookError}
                      disabled={loading || googleLoading || facebookLoading}
                    />
                  </div>
                </div>

                {/* Already have account */}
                <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
                  <p className="text-gray-600 mb-3 font-medium">
                    ¿Ya tienes una cuenta?
                  </p>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center w-full max-w-xs mx-auto py-3 px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  >
                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                    Iniciar Sesión
                  </Link>
                </div>

                {/* Terms and Conditions */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 shadow-sm">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Condiciones del servicio</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Al registrarte aceptas nuestros <span className="font-semibold text-blue-600">Términos de Servicio</span></span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Aceptas la <span className="font-semibold text-blue-600">Política de Privacidad</span> y protección de datos</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Debes verificar tu email para acceder al sistema</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Te comprometes a seguir los <span className="font-semibold text-blue-600">Lineamientos de la Comunidad</span></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="flex items-center text-gray-500">
              <Globe className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Comunidad UNAJMA</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Heart className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Deporte Universitario</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Medal className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Competencias</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold mb-1">
            © {new Date().getFullYear()} Universidad Nacional José María Arguedas
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Sistema seguro - Verificación requerida - Soporte técnico permanente
          </p>
        </div>
      </div>
    </div>
  );
}