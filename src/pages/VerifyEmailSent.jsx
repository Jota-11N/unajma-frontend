import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, CheckCircle, AlertCircle, Send, ArrowLeft } from "lucide-react";
import api from "../services/api";

export default function VerifyEmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email = "", provider = "email", canResend = true } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleResendVerification = async () => {
    if (!email) {
      setError("No hay email para reenviar");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/resend-verification", { email });
      
      if (response.data.success) {
        setSuccess("✅ Nuevo enlace de verificación enviado");
      } else {
        setError(response.data.message || "Error al reenviar");
      }
    } catch (error) {
      console.error("Error reenviando verificación:", error);
      setError(error.response?.data?.message || "Error al reenviar verificación");
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = () => {
    navigate("/verify-email", { state: { email } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-300/50">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Verifica tu Email</h1>
                <p className="text-gray-300 text-sm mt-1">
                  {provider === "google" ? "Registro con Google" : "Registro con Email"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                ¡Registro exitoso!
              </h2>
              <p className="text-gray-600 mb-4">
                Hemos enviado un enlace de verificación a:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-800">{email}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  Revisa tu bandeja de entrada (y la carpeta de spam)
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  Haz clic en el enlace de verificación en el email
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  Serás redirigido automáticamente al sistema
                </p>
              </div>
            </div>

            {/* Mensajes de estado */}
            {error && (
              <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium text-green-800">{success}</span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              {canResend && (
                <button
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-blue-500/30 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3" />
                      <span>Reenviar enlace de verificación</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleManualVerification}
                className="w-full py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl hover:shadow-lg active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-md hover:shadow-gray-500/30 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-3" />
                <span>Ya verifiqué mi email</span>
              </button>

              <Link
                to="/login"
                className="block w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors hover:underline py-2"
              >
                Volver al login
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                ¿No recibiste el email? Revisa tu carpeta de spam o 
                <button 
                  onClick={handleResendVerification}
                  className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                >
                  solicita un nuevo enlace
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}