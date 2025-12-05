import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';

const CompleteFacebookEmail = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialEmail = ''
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    if (!email.trim()) return "El email es requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresa un email válido";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setError('');
    onSubmit(email.trim().toLowerCase());
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Completa tu registro
        </h3>
        <p className="text-gray-600">
          Facebook no proporcionó tu email. Ingresa uno para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="tucorreo@ejemplo.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Tu email será verificado. Recibirás un enlace de confirmación.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Continuar
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteFacebookEmail;