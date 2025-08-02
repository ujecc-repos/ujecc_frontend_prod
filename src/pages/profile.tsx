import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HomeIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useGetUserByIdQuery, useUpdateUserMutation, useGetUserByTokenQuery } from '../store/services/authApi';


export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  joinDate?: string | null;
  email: string;
  civilState?: string;
  firstname: string;
  lastname: string;
  password: string;
  profession?: string;
  sundayClass?: string;
  membreActif: boolean;
  age?: string;
  mobilePhone?: string;
  homePhone?: string;
  picture?: string;
  role?: string;
  city?: string;
  etatCivil?: string;
  spouseFullName?: string;
  personToContact?: string;
  country?: string;
  minister: string;
  birthCountry?: string;
  birthCity?: string;
  birthDate?: string;
  sex?: string;
  addressLine?: string;
  envelopeNumber?: string;
  baptismLocation?: string;
  baptismDate?: string;
  church: any;
  facebook?: string
  plainPassword?: string;
}

const UserProfile: React.FC = () => {
  const {data: userToken} = useGetUserByTokenQuery()
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Fetch user data
  const { data: user, isLoading, error, refetch } = useGetUserByIdQuery(`${userToken?.id}`, { skip: !userToken?.id });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({});

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        sex: user.sex,
        birthDate: user.birthDate,
        etatCivil: user.etatCivil,
        spouseFullName: user.spouseFullName,
        profession: user.profession,
        mobilePhone: user.mobilePhone,
        homePhone: user.homePhone,
        city: user.city,
        country: user.country,
        birthCity: user.birthCity,
        birthCountry: user.birthCountry,
        addressLine: user.addressLine,
        joinDate: user.joinDate,
        minister: user.minister,
        baptismDate: user.baptismDate,
        baptismLocation: user.baptismLocation,
        personToContact: user.personToContact,
        facebook: user.facebook
      });

      if (user.picture) {
        setImagePreview(`https://api.ujecc.org${user.picture}`);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!userToken?.id) return;

    try {
      const submitData = new FormData();
      // Add the ID to the form data
      submitData.append('id', userToken?.id);
      
      // Add all form fields to the form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitData.append(key, value.toString());
        }
      });
      
      // Add the image if one was selected
      if (selectedImage) {
        submitData.append('profileImage', selectedImage);
      }
      
      await updateUser(submitData).unwrap();
      setIsEditing(false);
      refetch(); // Refresh user data
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const cancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        // membreActif: user.membreActif,
        sex: user.sex,
        birthDate: user.birthDate,
        etatCivil: user.etatCivil,
        spouseFullName: user.spouseFullName,
        profession: user.profession,
        mobilePhone: user.mobilePhone,
        homePhone: user.homePhone,
        city: user.city,
        country: user.country,
        birthCity: user.birthCity,
        birthCountry: user.birthCountry,
        addressLine: user.addressLine,
        joinDate: user.joinDate,
        minister: user.minister,
        baptismDate: user.baptismDate,
        baptismLocation: user.baptismLocation,
        personToContact: user.personToContact,
        facebook: user.facebook
      });

      if (user.picture) {
        setImagePreview(`https://api.ujecc.org${user.picture}`);
      } else {
        setImagePreview(null);
      }
    }
    
    setSelectedImage(null);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | undefined): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Utilisateur introuvable</h2>
          <p className="text-gray-600 mb-4">Les informations de cet utilisateur ne sont pas disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header with edit button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profil Utilisateur</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" />
              Modifier
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={cancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                )}
                Enregistrer
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center relative">
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <label htmlFor="profile-image" className="cursor-pointer p-3 bg-white rounded-full">
                      <CameraIcon className="h-6 w-6 text-blue-600" />
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
                <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={`${user.firstname} ${user.lastname}`}
                      className="w-24 h-24 object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {user.firstname?.[0] || ''}{user.lastname?.[0] || ''}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {user.firstname} {user.lastname}
                </h2>
                <p className="text-blue-100">{user.role || 'Membre'}</p>
                {user.birthDate && (
                  <p className="text-blue-100 text-sm mt-2">
                    {calculateAge(user.birthDate)} ans
                  </p>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Statut</span>
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="membreActif"
                        className="sr-only peer"
                        checked={formData.membreActif}
                        onChange={handleInputChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.membreActif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.membreActif ? 'Actif' : 'Inactif'}
                    </span>
                  )}
                </div>
                
                {user.email && (
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      ) : (
                        <p className="text-gray-900">{user.email}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Téléphone mobile</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="mobilePhone"
                        value={formData.mobilePhone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.mobilePhone || 'Non renseigné'}</p>
                    )}
                  </div>
                </div>
                
                {(user.homePhone || isEditing) && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Téléphone fixe</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="homePhone"
                          value={formData.homePhone || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      ) : (
                        <p className="text-gray-900">{user.homePhone || 'Non renseigné'}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Informations personnelles
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.firstname}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastname"
                        value={formData.lastname || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.lastname}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Genre</label>
                    {isEditing ? (
                      <div className="flex space-x-4 mt-1">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="sex"
                            value="Homme"
                            checked={formData.sex === 'Homme'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Homme</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="sex"
                            value="Femme"
                            checked={formData.sex === 'Femme'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Femme</span>
                        </label>
                      </div>
                    ) : (
                      <p className="text-gray-900">{user.sex || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date de naissance</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.birthDate ? formatDate(user.birthDate) : 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">État civil</label>
                    {isEditing ? (
                      <select
                        name="etatCivil"
                        value={formData.etatCivil || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Sélectionner</option>
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Veuf/Veuve">Veuf/Veuve</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{user.etatCivil || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Profession</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="profession"
                        value={formData.profession || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.profession || 'Non renseigné'}</p>
                    )}
                  </div>
                  {(formData.etatCivil === 'Marié(e)' || user.spouseFullName) && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Conjoint(e)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="spouseFullName"
                          value={formData.spouseFullName || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      ) : (
                        <p className="text-gray-900">{user.spouseFullName || 'Non renseigné'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                  Informations de localisation
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ville actuelle</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.city || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pays actuel</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.country || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ville de naissance</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="birthCity"
                        value={formData.birthCity || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.birthCity || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pays de naissance</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="birthCountry"
                        value={formData.birthCountry || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.birthCountry || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Adresse</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="addressLine"
                        value={formData.addressLine || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.addressLine || 'Non renseigné'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Church Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <HomeIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Informations ecclésiastiques
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date d'adhésion</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="joinDate"
                        value={formData.joinDate ? new Date(formData.joinDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.joinDate ? formatDate(user.joinDate) : 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ministère</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="minister"
                        value={formData.minister || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.minister || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date de baptême</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="baptismDate"
                        value={formData.baptismDate ? new Date(formData.baptismDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.baptismDate ? formatDate(user.baptismDate) : 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Lieu de baptême</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="baptismLocation"
                        value={formData.baptismLocation || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.baptismLocation || 'Non renseigné'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Informations de contact supplémentaires
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Personne à contacter</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="personToContact"
                        value={formData.personToContact || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.personToContact || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Facebook</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="facebook"
                        value={formData.facebook || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{user.facebook || 'Non renseigné'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;