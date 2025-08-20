import React, { useEffect, useState } from 'react';
import { useGetUserByTokenQuery } from '../store/services/authApi';
import { useGetChurchByIdQuery, useUpdateChurchMutation } from '../store/services/churchApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaChurch, FaMapMarkerAlt, FaPhone, FaEnvelope, FaMusic, FaFacebook, FaInstagram, FaWhatsapp, FaSave, FaEdit, FaTimes } from 'react-icons/fa';

type FormDataType = {
  name: string;
  address: string;
  phone: string;
  email: string;
  anthem: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  mainPasteur: string;
  [key: string]: string;
};

interface Church {
  id?: string | number;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  picture?: string;
  anthem?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  [key: string]: any;
}

export default function ParametreScreen() {
  const { data: userData, isLoading: isUserLoading } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  const { data: churchData, isLoading: isChurchLoading } = useGetChurchByIdQuery(churchId ? churchId.toString() : '', {
    skip: !churchId,
  }) as { data: Church | undefined, isLoading: boolean };

  const [updateChurch, { isLoading: isUpdating }] = useUpdateChurchMutation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    address: '',
    phone: '',
    email: '',
    anthem: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    mainPasteur: ''
  });

  const baseUrl = 'https://ujecc-backend.onrender.com';

  useEffect(() => {
    if (churchData) {
      setFormData({
        name: churchData.name || '',
        address: churchData.address || '',
        phone: churchData.phone || '',
        email: churchData.email || '',
        anthem: churchData.anthem || '',
        facebook: churchData.facebook || '',
        instagram: churchData.instagram || '',
        whatsapp: churchData.whatsapp || '',
        mainPasteur: churchData.mainPasteur || ''
      });

      if (churchData.picture) {
        setSelectedImage(`${baseUrl}${churchData.picture}`);
      }
    }
  }, [churchData]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
  };

  const handleSave = async () => {
    if (!churchId || typeof churchId !== 'string' && typeof churchId !== 'number') return;

    try {
      if (selectedImage && (!churchData?.picture || !selectedImage.includes(baseUrl))) {
        const formDataObj = new FormData();
        
        // Get the file from the input element
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          formDataObj.append('churchImage', fileInput.files[0]);
        }

        Object.keys(formData).forEach(key => {
          formDataObj.append(key, formData[key]);
        });

        formDataObj.append('id', churchId.toString());

        await updateChurch(formDataObj).unwrap();
        toast.success('Informations de l\'église mises à jour avec succès!');
      } else {
        await updateChurch({ id: churchId.toString(), ...formData }).unwrap();
        toast.success('Informations de l\'église mises à jour avec succès!');
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Erreur de mise à jour :', error);
      toast.error('Erreur lors de la mise à jour des informations');
    }
  };

  if (isUserLoading || isChurchLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ToastContainer position="top-right" autoClose={3000} />
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Mise à jour...</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          <span className="text-teal-600 mr-2"><FaChurch className="inline-block mb-1" /></span>
          Paramètres de l'Église
        </h1>
        {isEditing ? (
          <button 
            onClick={handleSave} 
            className="px-5 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <FaSave className="h-5 w-5 mr-2" />
            Enregistrer
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(true)} 
            className="px-5 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center shadow-md  hover:shadow-md transform hover:scale-105"
          >
            <FaEdit className="h-5 w-5 mr-2" />
            Modifier
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl overflow-hidden">
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-10 mb-10">
            <div className="flex-shrink-0">
              <div className="relative group">
                <div 
                  className={`w-56 h-56 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100 ${isEditing ? 'border-3 border-dashed border-teal-500' : ''} transition-all duration-300`}
                >
                  {selectedImage ? (
                    <img src={selectedImage} alt="Church" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FaChurch className="h-24 w-24 text-gray-400 mx-auto" />
                      {isEditing && <p className="text-sm text-gray-500 mt-2">Ajouter une photo</p>}
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white p-3 rounded-full transform transition-transform group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImagePick} 
                      className="hidden" 
                      id="church-image" 
                    />
                    <label 
                      htmlFor="church-image" 
                      className="absolute inset-0 cursor-pointer rounded-xl"
                    ></label>
                    <div className="mt-3 text-center">
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Cliquez pour changer l'image</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 border-gray-200">
                {churchData?.name || 'Nom de l\'église'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start transform transition-transform hover:translate-x-1">
                  <div className="bg-teal-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaMapMarkerAlt className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-teal-600">Adresse</p>
                    <p className="text-gray-700 mt-1">{churchData?.address || 'Non spécifiée'}</p>
                  </div>
                </div>
                
                <div className="flex items-start transform transition-transform hover:translate-x-1">
                  <div className="bg-blue-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaPhone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Téléphone</p>
                    <p className="text-gray-700 mt-1">{churchData?.phone || 'Non spécifié'}</p>
                  </div>
                </div>
                
                <div className="flex items-start transform transition-transform hover:translate-x-1">
                  <div className="bg-purple-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaEnvelope className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Email</p>
                    <p className="text-gray-700 mt-1">{churchData?.email || 'Non spécifié'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations Générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'Église *</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-teal-300 focus:ring-2 focus:ring-teal-200'} rounded-lg transition-all`}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom de l'Église"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-teal-300 focus:ring-2 focus:ring-teal-200'} rounded-lg transition-all`}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email de l'Église"
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-teal-300 focus:ring-2 focus:ring-teal-200'} rounded-lg transition-all`}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Numéro de téléphone"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pasteur Principale</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-teal-300 focus:ring-2 focus:ring-teal-200'} rounded-lg transition-all`}
                    value={formData.mainPasteur}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainPasteur: e.target.value }))}
                    placeholder="Pasteur Principale"
                    disabled={!isEditing}
                  />
                </div>
                
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <textarea
                    className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-teal-300 focus:ring-2 focus:ring-teal-200'} rounded-lg transition-all`}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète de l'Église"
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl  mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2 border-blue-200">
                <FaMusic className="h-5 w-5 mr-3 text-blue-600" />
                Hymne de l'Église
              </h3>
              
              <div>
                <textarea
                  className={`w-full px-5 py-4 border ${!isEditing ? 'bg-white bg-opacity-70 border-gray-200' : 'bg-white border-blue-300 focus:ring-3 focus:ring-blue-200 shadow-inner'} rounded-xl transition-all duration-300`}
                  value={formData.anthem}
                  onChange={(e) => setFormData(prev => ({ ...prev, anthem: e.target.value }))}
                  placeholder="Paroles de l'hymne de l'Église"
                  disabled={!isEditing}
                  rows={6}
                  style={{ resize: isEditing ? 'vertical' : 'none' }}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center border-b pb-2 border-purple-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Réseaux Sociaux
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="bg-blue-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaFacebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-blue-600 mb-1">Facebook</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-200'} rounded-lg transition-all duration-300`}
                      value={formData.facebook}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="URL Facebook"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="flex items-center bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="bg-pink-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaInstagram className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-pink-600 mb-1">Instagram</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-pink-300 focus:ring-2 focus:ring-pink-200'} rounded-lg transition-all duration-300`}
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@username"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="flex items-center bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="bg-green-100 p-3 rounded-full mr-4 shadow-sm">
                    <FaWhatsapp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-green-600 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-3 border ${!isEditing ? 'bg-gray-50 border-gray-200' : 'bg-white border-green-300 focus:ring-2 focus:ring-green-200'} rounded-lg transition-all duration-300`}
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="+XXX XXXXXXXXX"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-10 flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center shadow-sm font-medium"
                >
                  <FaTimes className="mr-2 h-4 w-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 flex items-center shadow-md font-medium"
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </button>
              </div>
            )}
            
            <div className="mt-16 border-t pt-6 text-center text-gray-500 text-sm">
              <p>© {new Date().getFullYear()} Administration de l'Église. Tous droits réservés.</p>
            </div>
          </div>
      </div>
    </div>
    </div>
  );
}