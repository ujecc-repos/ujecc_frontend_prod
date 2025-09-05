import React, { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon,
  CalendarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import Calendar from 'react-calendar';
import Select from 'react-select';
import 'react-calendar/dist/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useGetDepartementCommunesQuery} from '../../store/services/churchApi';

// Import API hooks (adjust based on your actual API structure)
import { useGetUserByTokenQuery, useRegisterMutation } from '../../store/services/authApi';
import { useGetMinistriesByChurchQuery } from '../../store/services/ministryApi';


// type AgeCategory = 'enfant' | 'adolescent' | 'jeune' | 'adulte' | 'all';
// type GenderType = 'homme' | 'femme' | 'all';
// type CivilStateType = 'célibataire' | 'marié(e)' | 'divorcé(e)' | 'veuf/veuve' | 'all';
// type SearchType = 'name' | 'email' | 'phone';

interface AddMemberFormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
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

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AddMemberFormData) => void;
  isLoading: boolean;
}


const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AddMemberFormData>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    mobilePhone: '',
    homePhone: '',
    role: 'Membre',
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

  // const [showPassword, setShowPassword] = useState(false);
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
  
  // Fetch department communes data
  const {data: Ouest} = useGetDepartementCommunesQuery("Ouest")
  const {data: Nord} = useGetDepartementCommunesQuery(`Nord`)
  const {data: NordEst} = useGetDepartementCommunesQuery("Nord-Est")
  const {data: NordOuest} = useGetDepartementCommunesQuery("Nord-Ouest")
  const {data: Sude} = useGetDepartementCommunesQuery("Sude")
  const {data: SudEst} = useGetDepartementCommunesQuery("Sud-Est")
  const {data: Artibonite} = useGetDepartementCommunesQuery("Artibonite")
  const {data: Centre} = useGetDepartementCommunesQuery("Centre")
  const {data: GrandAnse} = useGetDepartementCommunesQuery("Grand'Anse")
  const {data: Nippes} = useGetDepartementCommunesQuery("Nippes")

  const villeAndVilleDenaissance = Object.keys(Ouest || {}).concat(Object.keys(Nord || {}), Object.keys(NordEst || {}), Object.keys(NordOuest || {}), Object.keys(Sude || {}), Object.keys(SudEst || {}), Object.keys(Artibonite || {}), Object.keys(Centre || {}), Object.keys(GrandAnse || {}), Object.keys(Nippes || {}))
  
  // Transform ministries data for react-select
  const ministryOptions = useMemo(() => {
    if (!ministriesData) return [];
    return ministriesData.map(ministry => ({
      value: ministry.name,
      label: ministry.name
    }));
  }, [ministriesData]);

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
    // if (!formData.password.trim()) newErrors.password = 'Le mot de passe est obligatoire';
    // if (!formData.role.trim()) newErrors.role = 'Le rôle est obligatoire';
    
    // Email validation
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (formData.email && !emailRegex.test(formData.email)) {
    //   newErrors.email = 'Format d\'email invalide';
    // }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setTimeout(() => {
        setFormData({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
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
      }, 2000);
      setFormData({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
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
    }
  };

  const resetForm = () => {
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
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

  if (!isOpen) return null;

  // console.log("ville de naissance : ",villeAndVilleDenaissance)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Ajouter un Membre</h3>
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
                  {/* <div>
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
                  </div> */}

                  {/* Password */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de Passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                  </div> */}

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
                            minDate={undefined}
                            maxDate={undefined}
                            tileDisabled={() => false}
                            selectRange={false}
                            allowPartialRange={false}
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
                      value={formData.nif || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nif: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="NIF (optionnel)"
                    />
                  </div>

                  {/* Groupe Sanguin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Groupe Sanguin</label>
                    <select
                      value={formData.groupeSanguin || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, groupeSanguin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Sélectionner groupe sanguin (optionnel)</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobilePhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="+509 1234 5678"
                    />
                  </div>

                  {/* Home Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Personne à contacter</label>
                    <input
                      type="tel"
                      value={formData.homePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, homePhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="+509 1234 5678"
                    />
                  </div>

                  {/* Person to Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la personne à contacter</label>
                    <input
                      type="text"
                      value={formData.personToContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, personToContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Nom de la personne à contacter"
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
                      placeholder="Profile Facebook"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de Maison</label>
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
                    <Select
                      value={villeAndVilleDenaissance.map(city => ({ value: city, label: city })).find(option => option.value === formData.city) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, city: selectedOption?.value || '' }))}
                      options={villeAndVilleDenaissance.map(city => ({ value: city, label: city }))}
                      placeholder="Sélectionner une ville"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Birth City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville de Naissance</label>
                    <Select
                      value={villeAndVilleDenaissance.map(city => ({ value: city, label: city })).find(option => option.value === formData.birthCity) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, birthCity: selectedOption?.value || '' }))}
                      options={villeAndVilleDenaissance.map(city => ({ value: city, label: city }))}
                      placeholder="Sélectionner une ville de naissance"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                    <Select
                      value={{ value: 'Haiti', label: 'Haiti' }}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, country: selectedOption?.value || 'Haiti' }))}
                      options={[{ value: 'Haiti', label: 'Haiti' }]}
                      isSearchable={false}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Birth Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays de Naissance</label>
                    <Select
                      value={{ value: 'Haiti', label: 'Haiti' }}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, birthCountry: selectedOption?.value || 'Haiti' }))}
                      options={[{ value: 'Haiti', label: 'Haiti' }]}
                      isSearchable={false}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)'
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Church Information Tab */}
            {activeTab === 'church' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option value="Directeur">Directeur</option>
                      <option value="Admin">Administrateur</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                  </div>

                  {/* Minister */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ministère au sein de l'église</label>
                    <Select
                      value={ministryOptions.find(option => option.value === formData.minister) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, minister: selectedOption?.value || '' }))}
                      options={ministryOptions}
                      placeholder="Sélectionner un ministère"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Join Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date d'adhésion</label>
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
                        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          <Calendar
                            onChange={(date) => {
                              if (date instanceof Date) {
                                // Format date as YYYY-MM-DD without timezone issues
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateString = `${year}-${month}-${day}`;
                                setFormData(prev => ({ ...prev, joinDate: dateString }));
                                setShowJoinCalendar(false);
                              }
                            }}
                            value={formData.joinDate ? new Date(formData.joinDate + 'T00:00:00') : null}
                            minDate={undefined}
                            maxDate={undefined}
                            tileDisabled={() => false}
                            selectRange={false}
                            allowPartialRange={false}
                            locale="fr-FR"
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
                        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          <Calendar
                            onChange={(date) => {
                              if (date instanceof Date) {
                                // Format date as YYYY-MM-DD without timezone issues
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateString = `${year}-${month}-${day}`;
                                setFormData(prev => ({ ...prev, baptismDate: dateString }));
                                setShowBaptismCalendar(false);
                              }
                            }}
                            value={formData.baptismDate ? new Date(formData.baptismDate + 'T00:00:00') : null}
                            minDate={undefined}
                            maxDate={undefined}
                            tileDisabled={() => false}
                            selectRange={false}
                            allowPartialRange={false}
                            locale="fr-FR"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baptism Location */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de Baptême</label>
                    <input
                      type="text"
                      value={formData.baptismLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, baptismLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Lieu de baptême"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                position: 'relative'
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajout en cours...
                </>
              ) : 'Ajouter Membre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Invitation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  

  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;
  console.log("churchId : ", churchId)

  // Fetch members data

  // Register mutation for adding new members
  const [register] = useRegisterMutation();

  const handleAddMember = async (formData: AddMemberFormData) => {
    setIsAddingMember(true);
    try {
      // Validate required fields
      if (!formData.firstname) {
        toast.error('Le nom est obligatoire');
        return;
      }
      
      if (!formData.lastname) {
        toast.error('Le prénom est obligatoire');
        return;
      }
      
      
    
      
      // If there's a profile image, use FormData to handle the multipart request
      if (formData.profileImage) {
        const formDataObj = new FormData();
        
        // Add the image file
        formDataObj.append('profileImage', formData.profileImage);
        
        // Add all other form fields
        Object.keys(formData).forEach(key => {
          if (key !== 'profileImage') {
            const value = formData[key as keyof AddMemberFormData];
            // Include all values except null and undefined
            if (value !== null && value !== undefined) {
              formDataObj.append(key, String(value));
            }
          }
        });
        
        // Add church ID
        if (churchId) {
          formDataObj.append('churchId', churchId);
        }
        
        await register(formDataObj).unwrap();
        
      } else {
        // No image, use regular JSON request
        const userData = {
          ...formData,
          churchId: churchId || '',
          profileImage: undefined // Remove profileImage from the object
        };
        
        await register(userData).unwrap();
      }
      
      // Close modal and show success message
      setIsAddMemberModalOpen(false);
      toast.success('Membre ajouté avec succès!');
      
      // Refetch users to update the list
      // refetch();
    } catch (error: any) {
      console.error('Error adding member:', error);
      const errorMessage = error?.data?.message || error?.message || 'Erreur lors de l\'ajout du membre';
      console.log("error : ", error)
      toast.error(`Erreur d'enregistrement: ${errorMessage}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <div className="">
      <ToastContainer position="top-right" autoClose={5000} />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Membres</h1>
        <p className="text-gray-600">Gérez les membres de votre église</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">

            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              disabled={isAddingMember}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAddingMember ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter Membre
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Informations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
             
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Vous pouvez seulement ajouter</h3>
                      <p className="text-gray-500 mb-4">Ajoutez des membres pour aider d'aller plus rapides</p>          
                    </div>
                  </td>
                </tr>
            </tbody>
          </table>
        </div>
      </div>


      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={handleAddMember}
        isLoading={isAddingMember}
      />
    </div>
  );
}