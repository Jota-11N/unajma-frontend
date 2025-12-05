// src/components/CreateNewsModal.jsx
import React, { useState, useEffect } from "react";
import { 
  Newspaper, X, Image as ImageIcon, Globe, Lock, 
  AlertCircle, Save, Eye, EyeOff, Loader2, Trophy,
  ChevronDown
} from "lucide-react";
import api from "../services/api";

export default function CreateNewsModal({ 
  tournaments = [], // Lista de torneos para seleccionar
  editingNews = null, // Si estamos editando una noticia existente
  onClose, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    isPublic: true,
    tournamentId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);

  // Si estamos editando, cargar los datos
  useEffect(() => {
    if (editingNews) {
      setFormData({
        title: editingNews.title || "",
        content: editingNews.content || "",
        image: editingNews.image || "",
        isPublic: editingNews.isPublic ?? true,
        tournamentId: editingNews.tournamentId || editingNews.tournament?.id || ""
      });
      if (editingNews.image) {
        setPreviewImage(editingNews.image);
      }
    } else if (tournaments.length === 1) {
      // Si solo hay un torneo, seleccionarlo por defecto
      setFormData(prev => ({
        ...prev,
        tournamentId: tournaments[0].id.toString()
      }));
    }
  }, [editingNews, tournaments]);

  const getSportIcon = (sport) => {
    switch(sport) {
      case "FOOTBALL": return "⚽";
      case "BASKETBALL": return "🏀";
      case "VOLLEYBALL": return "🏐";
      default: return "🏆";
    }
  };

  const getSelectedTournament = () => {
    return tournaments.find(t => t.id.toString() === formData.tournamentId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.title.trim()) {
      setError("El título es requerido");
      return;
    }
    
    if (!formData.content.trim()) {
      setError("El contenido es requerido");
      return;
    }

    if (!formData.tournamentId) {
      setError("Debes seleccionar un torneo");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      let response;
      if (editingNews) {
        // Actualizar noticia existente
        response = await api.patch(`/news/${editingNews.id}`, formData);
      } else {
        // Crear nueva noticia desde Back Office
        response = await api.post("/news", formData);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
      
    } catch (error) {
      console.error("Error saving news:", error);
      setError(error.response?.data?.error || "Error al guardar la noticia");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError("");

    if (name === "image" && value) {
      setPreviewImage(value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPEG, PNG, GIF)');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      
      // Para desarrollo: usar base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setPreviewImage(base64String);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error al subir la imagen");
      setUploadingImage(false);
    }
  };

  const handleSelectTournament = (tournamentId) => {
    setFormData(prev => ({ ...prev, tournamentId: tournamentId.toString() }));
    setShowTournamentDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6" />
              {editingNews ? 'Editar Noticia' : 'Crear Nueva Noticia'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingNews ? 'Modifica los detalles de la noticia' : 'Comparte novedades importantes'}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Selección de Torneo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Torneo *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTournamentDropdown(!showTournamentDropdown)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    formData.tournamentId ? 'border-gray-300' : 'border-red-300'
                  } rounded-xl text-left flex items-center justify-between hover:bg-gray-100 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    {formData.tournamentId ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getSelectedTournament()?.name || 'Torneo seleccionado'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getSportIcon(getSelectedTournament()?.sportType)} • {getSelectedTournament()?.status || ''}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">Selecciona un torneo...</div>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    showTournamentDropdown ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {showTournamentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {tournaments.length > 0 ? (
                      tournaments.map(tournament => (
                        <button
                          key={tournament.id}
                          type="button"
                          onClick={() => handleSelectTournament(tournament.id)}
                          className={`w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                            formData.tournamentId === tournament.id.toString() ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center">
                            <span className="text-sm">{getSportIcon(tournament.sportType)}</span>
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium text-gray-900">{tournament.name}</div>
                            <div className="text-xs text-gray-500">{tournament.status}</div>
                          </div>
                          {formData.tournamentId === tournament.id.toString() && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No hay torneos disponibles
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona el torneo al que pertenece esta noticia
              </p>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ingresa un título llamativo..."
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este será el encabezado principal de tu noticia
              </p>
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Escribe aquí el contenido completo de la noticia..."
                rows={8}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Detalla toda la información importante</span>
                <span>{formData.content.length} caracteres</span>
              </div>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen (opcional)
              </label>
              
              {/* Opción 1: Subir archivo */}
              <div className="mb-4">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploadingImage ? 'border-purple-300 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}>
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                      <p className="text-sm text-gray-600">Subiendo imagen...</p>
                    </div>
                  ) : previewImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={previewImage} 
                        alt="Vista previa" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: '' }));
                          setPreviewImage('');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-purple-600">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG o GIF (max. 5MB)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading || uploadingImage}
                  />
                </label>
              </div>

              {/* Opción 2: URL de imagen */}
              <div>
                <p className="text-sm text-gray-600 mb-2 text-center">O ingresa una URL:</p>
                <div className="relative">
                  <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    disabled={loading || uploadingImage || previewImage}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">Visibilidad</div>
                  <div className="text-sm text-gray-600">
                    Controla quién puede ver esta noticia
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                {formData.isPublic ? (
                  <>
                    <Globe className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Pública - Todos los usuarios pueden verla
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">
                      Borrador - Solo visible para administradores
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingNews ? 'Actualizando...' : 'Publicando...'}
                </>
              ) : (
                <>
                  {editingNews ? (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  ) : (
                    <>
                      <Newspaper className="w-4 h-4" />
                      {formData.isPublic ? 'Publicar Noticia' : 'Guardar Borrador'}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}