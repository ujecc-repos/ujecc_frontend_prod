import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HomeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useGetUserByIdQuery, useMakeTimotheeMutation, useRemoveTimotheeMutation } from '../store/services/authApi';
import { useGetUserByTokenQuery } from '../store/services/authApi';

const PersonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUpdatingTimothee, setIsUpdatingTimothee] = useState(false);
  
  // Fetch member data by ID
  const { data: member, isLoading, error, refetch } = useGetUserByIdQuery(id as string, { skip: !id });
  
  // Timothee mutations
  const [makeTimothee] = useMakeTimotheeMutation();
  const [removeTimothee] = useRemoveTimotheeMutation();
  const {data: userToken} = useGetUserByTokenQuery()
  console.log("user token : ", userToken)

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

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleTimotheeToggle = async () => {
    if (!id || isUpdatingTimothee) return;
    
    setIsUpdatingTimothee(true);
    
    try {
      if (member?.istimothee) {
        // Remove Timothee status
        await removeTimothee(id).unwrap();
      } else {
        // Make Timothee
        await makeTimothee(id).unwrap();
      }
      
      // Refetch member data to update UI
      await refetch();
    } catch (error) {
      console.error('Error updating Timothee status:', error);
      // You could add a toast notification here
      alert('Erreur lors de la mise à jour du statut Timothée');
    } finally {
      setIsUpdatingTimothee(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Membre introuvable</h2>
          <p className="text-gray-600 mb-4">Les informations de ce membre ne sont pas disponibles.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour à la liste
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Profil de {member.firstname} {member.lastname}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                 member.membreActif 
                   ? 'bg-green-100 text-green-800' 
                   : 'bg-gray-100 text-gray-800'
               }`}>
                 {member.membreActif ? 'Membre actif' : 'Membre inactif'}
               </span>
               
               {/* Timothee Button */}
               {userToken?.church?.ttiId && (
               <button
                 onClick={handleTimotheeToggle}
                 disabled={isUpdatingTimothee}
                 className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                   member.timothee
                     ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                     : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                 } ${isUpdatingTimothee ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
               >
                 <StarIcon className="h-4 w-4" />
                 <span>
                   {isUpdatingTimothee 
                     ? 'Mise à jour...' 
                     : member.istimothee
                       ? 'Retirer Timothée'
                       : 'Devenir Timothée'
                   }
                 </span>
               </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  {member.picture ? (
                    <img
                      src={`https://ujecc-backend.onrender.com${member.picture}`}
                      alt={`${member.firstname} ${member.lastname}`}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {member.firstname?.[0] || ''}{member.lastname?.[0] || ''}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {member.firstname} {member.lastname}
                </h2>
                <p className="text-blue-100">{member.role || 'Membre'}</p>
                {member.birthDate && (
                  <p className="text-blue-100 text-sm mt-2">
                    {calculateAge(member.birthDate)} ans
                  </p>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                {member.email && (
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{member.email}</p>
                    </div>
                  </div>
                )}
                
                {member.mobilePhone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone mobile</p>
                      <p className="text-gray-900">{member.mobilePhone}</p>
                    </div>
                  </div>
                )}
                
                {member.homePhone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone fixe</p>
                      <p className="text-gray-900">{member.homePhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identification Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <IdentificationIcon className="h-5 w-5 mr-2 text-orange-600" />
                  Informations d'identification
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">NIF/NINU</label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-md">{member.nif || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Groupe sanguin</label>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        member.groupeSanguin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.groupeSanguin || 'Non renseigné'}
                      </span>
                    </p>
                  </div>
                  {member.age && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Âge déclaré</label>
                      <p className="text-gray-900">{member.age} ans</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    <label className="block text-sm font-medium text-gray-500 mb-1">Genre</label>
                    <p className="text-gray-900">{member.sex || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date de naissance</label>
                    <p className="text-gray-900">{member.birthDate ? formatDate(member.birthDate) : 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">État civil</label>
                    <p className="text-gray-900">{member.etatCivil || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Profession</label>
                    <p className="text-gray-900">{member.profession || 'Non renseigné'}</p>
                  </div>
                  {member.spouseFullName && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Conjoint(e)</label>
                      <p className="text-gray-900">{member.spouseFullName}</p>
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
                    <p className="text-gray-900">{member.city || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pays actuel</label>
                    <p className="text-gray-900">{member.country || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ville de naissance</label>
                    <p className="text-gray-900">{member.birthCity || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pays de naissance</label>
                    <p className="text-gray-900">{member.birthCountry || 'Non renseigné'}</p>
                  </div>
                  {member.addressLine && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Adresse</label>
                      <p className="text-gray-900">{member.addressLine}</p>
                    </div>
                  )}
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
                    <p className="text-gray-900">{member.joinDate ? formatDate(member.joinDate) : 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ministère</label>
                    <p className="text-gray-900">{member.minister || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date de baptême</label>
                    <p className="text-gray-900">{member.baptismDate ? formatDate(member.baptismDate) : 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Lieu de baptême</label>
                    <p className="text-gray-900">{member.baptismLocation || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">École du dimanche</label>
                    <p className="text-gray-900">{member.sundayClass || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Numéro d'enveloppe</label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-md">{member.envelopeNumber || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(member.personToContact || member.facebook || member.instagram) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Informations de contact supplémentaires
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {member.personToContact && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Personne à contacter</label>
                        <p className="text-gray-900">{member.personToContact}</p>
                      </div>
                    )}
                    {member.facebook && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Facebook</label>
                        <p className="text-gray-900">{member.facebook}</p>
                      </div>
                    )}
                    {member.instagram && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Instagram</label>
                        <p className="text-gray-900">{member.instagram}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;