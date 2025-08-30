import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Calendar from 'react-calendar';
import Select from 'react-select';
import { useGetUserByTokenQuery } from '../store/services/authApi';
import { useGetMinistriesByChurchQuery } from '../store/services/ministryApi';
import type { Ministry } from '../store/services/ministryApi';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  picture?: string;
  role?: string;
  sex?: string;
  birthDate?: string;
  etatCivil?: string;
  profession?: string;
  city?: string;
  country?: string;
  addressLine?: string;
  age?: string;
  spouseFullName?: string;
  minister?: string;
  birthCountry?: string;
  birthCity?: string;
  baptismDate?: string;
  baptismLocation?: string;
  joinDate?: string;
  personToContact?: string;
  facebook?: string;
  membreActif?: boolean;
  nif?: string;
  groupeSanguin?: string;
}

interface EditMemberFormData {
  firstname: string;
  lastname: string;
  email: string;
  mobilePhone: string;
  homePhone: string;
  role: string;
  gender: string;
  birthDate: string;
  joinDate: string;
  baptismDate: string;
  baptismLocation: string;
  civilState: string;
  spouseFullName: string;
  minister: string;
  country: string;
  birthCountry: string;
  city: string;
  birthCity: string;
  addressLine: string;
  profession: string;
  age: string;
  personToContact: string;
  facebook: string;
  profileImage: File | null;
  isActiveMember: boolean;
  nif?: string;
  groupeSanguin?: string;
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSubmit: (formData: EditMemberFormData) => void;
  isLoading: boolean;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<EditMemberFormData>({
    firstname: '',
    lastname: '',
    email: '',
    mobilePhone: '',
    homePhone: '',
    role: '',
    gender: '',
    birthDate: '',
    joinDate: '',
    baptismDate: '',
    baptismLocation: '',
    civilState: '',
    spouseFullName: '',
    minister: '',
    country: '',
    birthCountry: '',
    city: '',
    birthCity: '',
    addressLine: '',
    profession: '',
    age: '',
    personToContact: '',
    facebook: '',
    profileImage: null,
    isActiveMember: true,
    nif: '',
    groupeSanguin: ''
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showJoinCalendar, setShowJoinCalendar] = useState(false);
  const [showBaptismCalendar, setShowBaptismCalendar] = useState(false);
  const [showBirthCalendar, setShowBirthCalendar] = useState(false);

  // Get user data and church ID for fetching ministries
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;
  
  // Fetch ministries for the church
  const { data: ministriesData } = useGetMinistriesByChurchQuery(churchId || '', { skip: !churchId });
  
  // Transform ministries data for react-select
  const ministryOptions = useMemo(() => {
    if (!ministriesData) return [];
    return ministriesData.map((ministry: Ministry) => ({
      value: ministry.name,
      label: ministry.name
    }));
  }, [ministriesData]);

  // Pre-fill form data when member changes
  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        firstname: member.firstname || '',
        lastname: member.lastname || '',
        email: member.email || '',
        mobilePhone: member.mobilePhone || '',
        homePhone: member.homePhone || '',
        role: member.role || '',
        gender: member.sex || '',
        birthDate: member.birthDate || '',
        joinDate: member.joinDate || '',
        baptismDate: member.baptismDate || '',
        baptismLocation: member.baptismLocation || '',
        civilState: member.etatCivil || '',
        spouseFullName: member.spouseFullName || '',
        minister: member.minister || '',
        country: member.country || '',
        birthCountry: member.birthCountry || '',
        city: member.city || '',
        birthCity: member.birthCity || '',
        addressLine: member.addressLine || '',
        profession: member.profession || '',
        age: member.age || '',
        personToContact: member.personToContact || '',
        facebook: member.facebook || '',
        profileImage: null,
        isActiveMember: member.membreActif ?? true,
        nif: member.nif || '',
        groupeSanguin: member.groupeSanguin || ''
      });
      
      // Set image preview if member has a picture
      if (member.picture) {
        setImagePreview(`https://ujecc-backend.onrender.com${member.picture}`);
      } else {
        setImagePreview(null);
      }
    }
  }, [member, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstname.trim()) newErrors.firstname = 'Le nom est obligatoire';
    if (!formData.lastname.trim()) newErrors.lastname = 'Le prénom est obligatoire';
    // if (!formData.email.trim()) newErrors.email = "L'adresse électronique est obligatoire";
    if (!formData.role.trim()) newErrors.role = 'Le rôle est obligatoire';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      mobilePhone: '',
      homePhone: '',
      role: '',
      gender: '',
      birthDate: '',
      joinDate: '',
      baptismDate: '',
      baptismLocation: '',
      civilState: '',
      spouseFullName: '',
      minister: '',
      country: '',
      birthCountry: '',
      city: '',
      birthCity: '',
      addressLine: '',
      profession: '',
      age: '',
      personToContact: '',
      facebook: '',
      profileImage: null,
      isActiveMember: true,
      nif: '',
      groupeSanguin: ''
    });
    setImagePreview(null);
    setErrors({});
    setActiveTab('personal');
    setShowJoinCalendar(false);
    setShowBaptismCalendar(false);
    setShowBirthCalendar(false);
  };

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.react-calendar') && !target.closest('[data-calendar-trigger]')) {
        setShowJoinCalendar(false);
        setShowBaptismCalendar(false);
        setShowBirthCalendar(false);
      }
    };

    if (showJoinCalendar || showBaptismCalendar || showBirthCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showJoinCalendar, showBaptismCalendar, showBirthCalendar]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Modifier le Membre</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {[
            { key: 'personal', label: 'Informations Personnelles' },
            { key: 'contact', label: 'Contact & Localisation' },
            { key: 'church', label: 'Informations Église' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Form Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-1 cursor-pointer hover:bg-teal-700">
                      <PhotoIcon className="h-4 w-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Active Member Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Membre Actif</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActiveMember}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActiveMember: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.firstname ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nom"
                    />
                    {errors.firstname && <p className="mt-1 text-sm text-red-500">{errors.firstname}</p>}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.lastname ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Prénom"
                    />
                    {errors.lastname && <p className="mt-1 text-sm text-red-500">{errors.lastname}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse Électronique <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@exemple.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Sélectionner un rôle</option>
                      <option value="Membre">Membre</option>
                      <option value="Admin">Admin</option>
                      <option value="Director">Director</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="homme"
                          checked={formData.gender === 'homme'}
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Homme</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="femme"
                          checked={formData.gender === 'femme'}
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Femme</span>
                      </label>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de Naissance</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.birthDate ? formData.birthDate.split('-').reverse().join('/') : ''}
                        onClick={() => setShowBirthCalendar(!showBirthCalendar)}
                        readOnly
                        data-calendar-trigger
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        placeholder="Sélectionner une date"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      {showBirthCalendar && (
                        <div className="absolute top-full left-0 mt-1 z-50">
                          <Calendar
                             onChange={(date) => {
                               if (date) {
                                 const selectedDate = Array.isArray(date) ? date[0] : date;
                                 if (selectedDate) {
                                   // Format date as YYYY-MM-DD without timezone issues
                                   const year = selectedDate.getFullYear();
                                   const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                   const day = String(selectedDate.getDate()).padStart(2, '0');
                                   const dateString = `${year}-${month}-${day}`;
                                   setFormData(prev => ({ ...prev, birthDate: dateString }));
                                   setShowBirthCalendar(false);
                                 }
                               }
                             }}
                            value={formData.birthDate ? new Date(formData.birthDate + 'T00:00:00') : null}
                            className="react-calendar"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Age */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Âge</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Âge"
                    />
                  </div> */}

                  {/* Civil State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">État Civil</label>
                    <select
                      value={formData.civilState}
                      onChange={(e) => setFormData(prev => ({ ...prev, civilState: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Sélectionner état civil</option>
                      <option value="célibataire">Célibataire</option>
                      <option value="marié(e)">Marié(e)</option>
                      <option value="divorcé(e)">Divorcé(e)</option>
                      <option value="veuf/veuve">Veuf/Veuve</option>
                    </select>
                  </div>

                  {/* Spouse Name (conditional) */}
                  {formData.civilState === 'marié(e)' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du conjoint(e)</label>
                      <input
                        type="text"
                        value={formData.spouseFullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, spouseFullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nom et prénom du conjoint(e)"
                      />
                    </div>
                  )}

                  {/* Profession */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Profession"
                    />
                  </div>

                  {/* NIF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIF (Numéro d'Identification Fiscale)</label>
                    <input
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData(prev => ({ ...prev, nif: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="NIF"
                    />
                  </div>

                  {/* Groupe Sanguin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Groupe Sanguin</label>
                    <select
                      value={formData.groupeSanguin}
                      onChange={(e) => setFormData(prev => ({ ...prev, groupeSanguin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Sélectionner groupe sanguin</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contact & Location Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobilePhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Téléphone mobile"
                    />
                  </div>

                  {/* Home Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone Fixe</label>
                    <input
                      type="tel"
                      value={formData.homePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, homePhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Téléphone fixe"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={formData.addressLine}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Adresse complète"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ville"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Pays"
                    />
                  </div>

                  {/* Birth City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville de Naissance</label>
                    <input
                      type="text"
                      value={formData.birthCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthCity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ville de naissance"
                    />
                  </div>

                  {/* Birth Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays de Naissance</label>
                    <input
                      type="text"
                      value={formData.birthCountry}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthCountry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Pays de naissance"
                    />
                  </div>

                  {/* Person to Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Personne à Contacter</label>
                    <input
                      type="text"
                      value={formData.personToContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, personToContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Personne à contacter en cas d'urgence"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Profil Facebook"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Church Information Tab */}
            {activeTab === 'church' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Join Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date d'Adhésion</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.joinDate ? formData.joinDate.split('-').reverse().join('/') : ''}
                        onClick={() => setShowJoinCalendar(!showJoinCalendar)}
                        readOnly
                        data-calendar-trigger
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        placeholder="Sélectionner une date"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      {showJoinCalendar && (
                        <div className="absolute top-full left-0 mt-1 z-50">
                          <Calendar
                            onChange={(date) => {
                              if (date) {
                                const selectedDate = Array.isArray(date) ? date[0] : date;
                                if (selectedDate) {
                                  // Format date as YYYY-MM-DD without timezone issues
                                  const year = selectedDate.getFullYear();
                                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                  const day = String(selectedDate.getDate()).padStart(2, '0');
                                  const dateString = `${year}-${month}-${day}`;
                                  setFormData(prev => ({ ...prev, joinDate: dateString }));
                                  setShowJoinCalendar(false);
                                }
                              }
                            }}
                            value={formData.joinDate ? new Date(formData.joinDate + 'T00:00:00') : null}
                            className="react-calendar"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baptism Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de Baptême</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.baptismDate ? formData.baptismDate.split('-').reverse().join('/') : ''}
                        onClick={() => setShowBaptismCalendar(!showBaptismCalendar)}
                        readOnly
                        data-calendar-trigger
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        placeholder="Sélectionner une date"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      {showBaptismCalendar && (
                        <div className="absolute top-full left-0 mt-1 z-50">
                          <Calendar
                            onChange={(date) => {
                              if (date) {
                                const selectedDate = Array.isArray(date) ? date[0] : date;
                                if (selectedDate) {
                                  // Format date as YYYY-MM-DD without timezone issues
                                  const year = selectedDate.getFullYear();
                                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                  const day = String(selectedDate.getDate()).padStart(2, '0');
                                  const dateString = `${year}-${month}-${day}`;
                                  setFormData(prev => ({ ...prev, baptismDate: dateString }));
                                  setShowBaptismCalendar(false);
                                }
                              }
                            }}
                            value={formData.baptismDate ? new Date(formData.baptismDate + 'T00:00:00') : null}
                            className="react-calendar"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baptism Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de Baptême</label>
                    <input
                      type="text"
                      value={formData.baptismLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, baptismLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Lieu de baptême"
                    />
                  </div>

                  {/* Ministry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ministère au sein de l'église</label>
                    <Select
                      value={ministryOptions.find((option: any) => option.value === formData.minister) || null}
                      onChange={(selectedOption: any) => setFormData(prev => ({ ...prev, minister: selectedOption?.value || '' }))}
                      options={ministryOptions}
                      placeholder="Sélectionner un ministère"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Modification...
                </>
              ) : (
                'Modifier le Membre'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;