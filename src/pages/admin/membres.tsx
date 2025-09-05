import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  IdentificationIcon,
  XMarkIcon,
  ArrowRightIcon,
  CalendarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import Calendar from 'react-calendar';
import Select from 'react-select';
import 'react-calendar/dist/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useGetDepartementCommunesQuery} from '../../store/services/churchApi';

// Import API hooks (adjust based on your actual API structure)
import { useGetUserByTokenQuery, useGetUsersByChurchQuery, useRegisterMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../store/services/authApi';
import { useGetMinistriesByChurchQuery } from '../../store/services/ministryApi';
import { useCreateTransferMutation } from '../../store/services/transferApi';

// Import custom components
import ChangeRoleModal from '../../components/ChangeRoleModal';
import BadgeModal from '../../components/BadgeModal';
import DeleteMemberModal from '../../components/DeleteMemberModal';
import EditMemberModal from '../../components/EditMemberModal';
import TransferMemberModal from '../../components/TransferMemberModal';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  mobilePhone?: string;
  picture?: string;
  role?: string;
  sex?: string;
  birthDate?: string;
  etatCivil?: string;
  profession?: string;
  city?: string;
  country?: string;
  addressLine?: string;
}

type AgeCategory = 'enfant' | 'adolescent' | 'jeune' | 'adulte' | 'all';
type GenderType = 'homme' | 'femme' | 'all';
type CivilStateType = 'célibataire' | 'marié(e)' | 'divorcé(e)' | 'veuf/veuve' | 'all';
type SearchType = 'name' | 'email' | 'phone';

interface FilterState {
  ageCategory: AgeCategory;
  gender: GenderType;
  civilState: CivilStateType;
  searchType: SearchType;
  city: string;
  profession: string;
  country: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClear: () => void;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
}

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

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApplyFilters, onClear }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activeSection, setActiveSection] = useState<string>('searchType');
  
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Recherche avancée</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'searchType', label: 'Type de recherche' },
              { key: 'demographics', label: 'Démographie' },
              { key: 'location', label: 'Localisation' }
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.key
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeSection === 'searchType' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Type de recherche</h4>
                <div className="space-y-2">
                  {[
                    { value: 'name', label: 'Nom' },
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Téléphone' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="searchType"
                        value={option.value}
                        checked={localFilters.searchType === option.value}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, searchType: e.target.value as SearchType }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'demographics' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Genre</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'homme', label: 'Homme' },
                      { value: 'femme', label: 'Femme' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={localFilters.gender === option.value}
                          onChange={(e) => setLocalFilters(prev => ({ ...prev, gender: e.target.value as GenderType }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Catégorie d'âge</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'enfant', label: 'Enfant (0-12 ans)' },
                      { value: 'adolescent', label: 'Adolescent (13-17 ans)' },
                      { value: 'jeune', label: 'Jeune (18-35 ans)' },
                      { value: 'adulte', label: 'Adulte (36+ ans)' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="ageCategory"
                          value={option.value}
                          checked={localFilters.ageCategory === option.value}
                          onChange={(e) => setLocalFilters(prev => ({ ...prev, ageCategory: e.target.value as AgeCategory }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">État civil</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'célibataire', label: 'Célibataire' },
                      { value: 'marié(e)', label: 'Marié(e)' },
                      { value: 'divorcé(e)', label: 'Divorcé(e)' },
                      { value: 'veuf/veuve', label: 'Veuf/Veuve' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="civilState"
                          value={option.value}
                          checked={localFilters.civilState === option.value}
                          onChange={(e) => setLocalFilters(prev => ({ ...prev, civilState: e.target.value as CivilStateType }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Profession</label>
                  <input
                    type="text"
                    value={localFilters.profession}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, profession: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Filtrer par profession..."
                  />
                </div>
              </div>
            )}

            {activeSection === 'location' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Ville</label>
                  <input
                    type="text"
                    value={localFilters.city}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Filtrer par ville..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Pays</label>
                  <input
                    type="text"
                    value={localFilters.country}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Filtrer par pays..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Effacer
          </button>
          <button
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les Membres</h3>
        <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation pour télécharger la liste des membres.</p>
        
        <div className="space-y-3">
          <button
            onClick={() => onExport('xlsx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en Excel (.xlsx)
          </button>
          
          <button
            onClick={() => onExport('pdf')}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en PDF (.pdf)
          </button>
          
          <button
            onClick={() => onExport('docx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en Word (.docx)
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

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

export default function Membres() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferringMember, setIsTransferringMember] = useState(false);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<Member | null>(null);
  const itemsPerPage = 7;

  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;
  console.log("churchId : ", churchId)

  // Fetch members data
  const { data: membersData, isLoading: isMembersLoading, refetch } = useGetUsersByChurchQuery(churchId || '', { skip: !churchId });
  console.log("users : ", membersData)

  // Register mutation for adding new members
  const [register] = useRegisterMutation();
  
  // Update user mutation for editing members
  const [updateUser] = useUpdateUserMutation();
  
  // Delete user mutation for deleting members
  const [deleteUser] = useDeleteUserMutation();
  
  // Create transfer mutation for transferring members
  const [createTransfer] = useCreateTransferMutation();

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    ageCategory: 'all',
    gender: 'all',
    civilState: 'all',
    searchType: 'name',
    city: '',
    profession: '',
    country: ''
  });

  // Check if any data is still loading
  useEffect(() => {
    setIsLoading(isMembersLoading);
  }, [isMembersLoading]);

  // Calculate age from birthDate
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

  // Get age category from birthDate
  const getAgeCategoryFromBirthDate = (birthDate: string | undefined): AgeCategory => {
    if (!birthDate) return 'adulte';
    
    const age = calculateAge(birthDate);
    
    if (age >= 0 && age <= 12) return 'enfant';
    if (age >= 13 && age <= 17) return 'adolescent';
    if (age >= 18 && age <= 35) return 'jeune';
    return 'adulte';
  };

  // Filter members based on all criteria
  const filteredMembers = useMemo(() => {
    if (!membersData) return [];
    
    return membersData.filter((member: Member) => {
      // Basic search by name, email, or phone based on searchType
      let basicSearchMatch = true;
      if (searchQuery) {
        if (filters.searchType === 'name') {
          basicSearchMatch = 
            (member.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (member.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        } else if (filters.searchType === 'email') {
          basicSearchMatch = member.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        } else if (filters.searchType === 'phone') {
          basicSearchMatch = member.mobilePhone?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        }
      }
      if (!basicSearchMatch) return false;
      
      // Age category filter
      if (filters.ageCategory !== 'all') {
        const category = getAgeCategoryFromBirthDate(member.birthDate);
        if (category !== filters.ageCategory) return false;
      }
      
      // Gender filter
      if (filters.gender !== 'all' && member.sex !== filters.gender) return false;
      
      // Civil state filter
      if (filters.civilState !== 'all' && member.etatCivil !== filters.civilState) return false;
      
      // City filter
      if (filters.city && filters.city.trim() !== '') {
        if (!member.city) return false;
        if (!member.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      }
      
      // Profession filter
      if (filters.profession && filters.profession.trim() !== '') {
        if (!member.profession) return false;
        if (!member.profession.toLowerCase().includes(filters.profession.toLowerCase())) return false;
      }
      
      // Country filter
      if (filters.country && filters.country.trim() !== '') {
        if (!member.country) return false;
        if (!member.country.toLowerCase().includes(filters.country.toLowerCase())) return false;
      }
      
      return true;
    });
  }, [membersData, searchQuery, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setFilters({
      ageCategory: 'all',
      gender: 'all',
      civilState: 'all',
      searchType: 'name',
      city: '',
      profession: '',
      country: ''
    });
  };

  const handleChangeRole = (member: Member) => {
    setSelectedMemberForAction(member);
    setIsChangeRoleModalOpen(true);
  };

  const handleCreateBadge = (member: Member) => {
    setSelectedMemberForAction(member);
    setIsBadgeModalOpen(true);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateUser({
        id: memberId,
        role: newRole
      }).unwrap();
      
      // Close modal and reset selected member
      setIsChangeRoleModalOpen(false);
      setSelectedMemberForAction(null);
      
      // Refetch data to update the UI
      refetch();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleDeleteMember = (member: Member) => {
    setSelectedMemberForAction(member);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (memberId: string) => {
    try {
      // Call the delete user API
      await deleteUser(memberId).unwrap();
      console.log(`Successfully deleted member with ID: ${memberId}`);
      
      // Close modal and reset selected member
      setIsDeleteModalOpen(false);
      setSelectedMemberForAction(null);
      
      // Refetch data to update the list
      refetch();
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleEditMember = (member: Member) => {
    setSelectedMemberForAction(member);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: any) => {
    if (!selectedMemberForAction) return;
    
    setIsEditingMember(true);
    try {
      // Map frontend field names to backend field names
      const mappedFormData = {
        ...formData,
        sex: formData.gender, // Map gender to sex
        membreActif: formData.isActiveMember, // Map isActiveMember to membreActif
      };
      
      // Remove the old field names
      delete mappedFormData.gender;
      delete mappedFormData.isActiveMember;
      
      // If there's a profile image, use FormData to handle the multipart request
      if (formData.profileImage) {
        const formDataObj = new FormData();
        
        // Add the member ID
        formDataObj.append('id', selectedMemberForAction.id);
        
        // Add the image file
        formDataObj.append('profileImage', formData.profileImage);
        
        // Add all other form fields with proper mapping
        Object.keys(mappedFormData).forEach(key => {
          if (key !== 'profileImage') {
            const value = mappedFormData[key];
            // Include all values except null and undefined
            if (value !== null && value !== undefined) {
              formDataObj.append(key, String(value));
            }
          }
        });
        
        await updateUser(formDataObj).unwrap();
      } else {
        // No image, use regular JSON request
        const updateData = {
          id: selectedMemberForAction.id,
          ...mappedFormData,
          profileImage: undefined
        };
        delete updateData.profileImage;
        
        await updateUser(updateData).unwrap();
      }
      
      // Close modal and reset selected member
      setIsEditModalOpen(false);
      setSelectedMemberForAction(null);
      
      // Refetch data to show updated information
      refetch();
    } catch (error: any) {
      console.error('Error updating member:', error);
      const errorMessage = error?.data?.message || error?.message || 'Erreur lors de la mise à jour de l\'utilisateur';
      console.log("error : ", error);
      alert(`Erreur de mise à jour: ${errorMessage}`);
    } finally {
      setIsEditingMember(false);
    }
  };

  const handleTransferMember = (member: Member) => {
    setSelectedMemberForAction(member);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (formData: any) => {
    if (!selectedMemberForAction || !userData?.church?.id) return;
    
    setIsTransferringMember(true);
    try {
      // Prepare the transfer data
      const transferData = {
        fromChurchId: userData.church.id,
        toChurchId: formData.toChurchId,
        userId: selectedMemberForAction.id,
        type: formData.type,
        reason: formData.reason || ''
      };
      
      // Call the API to create the transfer
      await createTransfer(transferData).unwrap();
      
      // Close modal and reset selected member
      setIsTransferModalOpen(false);
      setSelectedMemberForAction(null);
      
      // Refetch data to show updated information
      refetch();
    } catch (error) {
      console.error('Error transferring member:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsTransferringMember(false);
    }
  };

  const handleRowClick = (member: Member) => {
    navigate(`/tableau-de-bord/admin/person/${member.id}`);
  };

  // Export functions
  const generatePDF = async (members: Member[]) => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Set font size and add title
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('LISTE DES MEMBRES DE L\'ÉGLISE', 105, 20, { align: 'center' });
    
    // Add church name
    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.text(userData?.church?.name || 'Église', 105, 30, { align: 'center' });
    
    // Add info section
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text(`Date du rapport: ${formattedDate}`, 20, 45);
    doc.text(`Nombre total de membres: ${members.length}`, 20, 52);
    
    // Add table headers
    let yPos = 65;
    const colWidths = [40, 40, 50, 60];
    const startX = 20;
    
    // Table header
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(221, 221, 221);
    doc.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 10, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Prénom', startX + 5, yPos);
    doc.text('Nom', startX + colWidths[0] + 5, yPos);
    doc.text('Email', startX + colWidths[0] + colWidths[1] + 5, yPos);
    doc.text('Téléphone', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPos);
    
    // Table rows
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    
    members.forEach((member, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 10, 'F');
      }
      
      doc.text(member.firstname || '', startX + 5, yPos);
      doc.text(member.lastname || '', startX + colWidths[0] + 5, yPos);
      doc.text(member.email || '', startX + colWidths[0] + colWidths[1] + 5, yPos);
      doc.text(member.mobilePhone || '', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPos);
      
      yPos += 10;
    });
    
    doc.save('membres-eglise.pdf');
  };

  const generateExcel = (members: Member[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      members.map(member => ({
        'Prénom': member.firstname || '',
        'Nom': member.lastname || '',
        'Email': member.email || '',
        'Téléphone': member.mobilePhone || '',
        'Genre': member.sex || '',
        'Ville': member.city || '',
        'Pays': member.country || '',
        'Profession': member.profession || '',
        'État Civil': member.etatCivil || '',
        'Rôle': member.role || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membres');
    XLSX.writeFile(workbook, 'membres-eglise.xlsx');
  };

  const generateWord = async (members: Member[]) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'LISTE DES MEMBRES DE L\'ÉGLISE',
                bold: true,
                size: 32,
                color: '2C3E50'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: userData?.church?.name || 'Église',
                size: 24,
                color: '7F8C8D'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date du rapport: ${new Date().toLocaleDateString('fr-FR')}`,
                size: 20
              })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Nombre total de membres: ${members.length}`,
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Prénom', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nom', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Téléphone', bold: true })] })] })
                ]
              }),
              ...members.map(member => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: member.firstname || '' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: member.lastname || '' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: member.email || '' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: member.mobilePhone || '' })] })] })
                ]
              }))
            ]
          })
        ]
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'membres-eglise.docx');
  };

  const handleExport = async (type: 'xlsx' | 'pdf' | 'docx') => {
    try {
      switch (type) {
        case 'xlsx':
          generateExcel(filteredMembers);
          break;
        case 'pdf':
          await generatePDF(filteredMembers);
          break;
        case 'docx':
          await generateWord(filteredMembers);
          break;
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

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

  const hasActiveFilters = Object.values(filters).some(value => 
    (typeof value === 'string' && value !== 'all' && value !== '' && value !== 'name')
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

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
              onClick={() => setFilterVisible(true)}
              className={`relative flex items-center px-4 py-2 border rounded-lg transition-colors ${
                hasActiveFilters
                  ? 'border-teal-600 text-teal-600 bg-teal-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="absolute -top-2 -right-2 h-4 w-4 bg-teal-600 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exporter
            </button>

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

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {filteredMembers.length > 0 ? (
              `Affichage de ${startIndex + 1}-${Math.min(endIndex, filteredMembers.length)} sur ${filteredMembers.length} membre${filteredMembers.length !== 1 ? 's' : ''}`
            ) : (
              '0 membre trouvé'
            )}
          </span>
          
          {/* Quick Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = '/tableau-de-bord/admin/groupes'}
              className="flex items-center px-3 py-1 text-sm text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
            >
              Groupes
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
            <button
              className="flex items-center px-3 py-1 text-sm text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
            >
              transferts
              <ArrowRightIcon className="h-4 w-4 ml-1" />
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
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre trouvé</h3>
                      <p className="text-gray-500 mb-4">Ajoutez des membres ou modifiez vos filtres pour voir des résultats</p>
                      <button
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter le premier membre
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageMembers.map((member) => (
                  <tr 
                    key={member.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(member)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.picture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={`https://ujecc-backend.onrender.com${member.picture}`}
                              // src={`http://localhost:4000${member.picture}`}
                              alt={`${member.firstname} ${member.lastname}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstname} {member.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.birthDate && `${calculateAge(member.birthDate)} ans`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.mobilePhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.sex}</div>
                      <div className="text-sm text-gray-500">{member.etatCivil}</div>
                      <div className="text-sm text-gray-500">{member.profession}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.city}</div>
                      <div className="text-sm text-gray-500">{member.country}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'Directeur' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {member.role || 'Membre'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMember(member);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors group relative"
                          title="Modifier"
                        >
                          <PencilIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Modifier</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeRole(member);
                          }}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors group relative"
                          title="Changer rôle"
                        >
                          <UserIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Changer rôle</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateBadge(member);
                          }}
                          className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors group relative"
                          title="Créer badge"
                        >
                          <IdentificationIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Créer badge</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransferMember(member);
                          }}
                          className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors group relative"
                          title="Transférer"
                        >
                          <ArrowRightIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Transférer</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(member);
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors group relative"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Pagination */}
      {filteredMembers.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner">
          {/* Mobile Pagination */}
          <div className="flex items-center justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">{currentPage}</span>
                <span className="text-sm text-gray-500 mx-1">/</span>
                <span className="text-sm font-medium text-gray-700">{totalPages}</span>
              </div>
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              Suivant
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {/* Results Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Affichage de <span className="text-indigo-600 font-bold">{startIndex + 1}</span> à{' '}
                    <span className="text-indigo-600 font-bold">{Math.min(endIndex, filteredMembers.length)}</span> sur{' '}
                    <span className="text-purple-600 font-bold">{filteredMembers.length}</span> résultats
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              {/* First Page Button */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                title="Première page"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => {
                  if (totalPages <= 7 || page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={totalPages <= 1}
                        className={`relative inline-flex items-center justify-center w-12 h-10 font-bold rounded-xl shadow-md transform hover:scale-110 transition-all duration-200 ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg'
                        } ${totalPages <= 1 ? 'cursor-not-allowed opacity-40' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === 4 && currentPage > 5) {
                    return (
                      <div key={page} className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    );
                  } else if (page === totalPages - 3 && currentPage < totalPages - 4) {
                    return (
                      <div key={page} className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last Page Button */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                title="Dernière page"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <FilterModal
        isOpen={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onClear={handleClearFilters}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={handleAddMember}
        isLoading={isAddingMember}
      />

      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        onRoleChange={handleRoleChange}
      />

      <BadgeModal
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        churchData={{
          name: userData?.church?.name,
          address: "Rue 25 H, Cap-Haïtien Haiti",
          phone: "Téléphone: 37533055",
          pastorName: "Rév. Lucien Caleb, Pasteur Titulaire"
        }}
      />

      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        onDelete={handleConfirmDelete}
      />

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        onSubmit={handleEditSubmit}
        isLoading={isEditingMember}
      />

      <TransferMemberModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        onSubmit={handleTransferSubmit}
        isLoading={isTransferringMember}
      />
    </div>
  );
}