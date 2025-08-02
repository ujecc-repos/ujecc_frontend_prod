import React, { useState, useMemo, useEffect } from 'react';
import {  Tab } from '@headlessui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Imports
import { useRegisterMutation, useGetUsersQuery } from '../../store/services/authApi';
import { useCreateChurchMutation, useGetChurchesQuery, useAddUserToChurchMutation } from '../../store/services/churchApi';
import { useGetMissionsQuery } from '../../store/services/mission';

// Types
interface CreateChurchFormData {
  name: string;
  departement: string;
  commune: string;
  sectionCommunale: string;
  missionId: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface Departement {
  id: string;
  name: string;
}

interface Commune {
  id: string;
  name: string;
  departementId: string;
}

interface SectionCommunale {
  id: string;
  name: string;
  communeId: string;
}

interface CreateUserFormData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: string;
  mobilePhone?: string;
  homePhone?: string;
  gender?: string;
  birthDate?: string;
  joinDate?: string;
  baptismDate?: string;
  baptismLocation?: string;
  civilState?: string;
  spouseFullName?: string;
  minister?: string;
  country?: string;
  birthCountry?: string;
  city?: string;
  birthCity?: string;
  addressLine?: string;
  profession?: string;
  age?: string;
  personToContact?: string;
  facebook?: string;
  membreActif: boolean;
}

interface AddUserToChurchFormData {
  userId: string;
  churchId: string;
}

const GestionPage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('church');
  console.log(activeTab)
  
  // Fake data for locations
  const departements: Departement[] = [
    { id: 'dep1', name: 'Ouest' },
    { id: 'dep2', name: 'Nord' },
    { id: 'dep3', name: 'Nord-Est' },
    { id: 'dep4', name: 'Nord-Ouest' },
    { id: 'dep5', name: 'Sud' },
    { id: 'dep6', name: 'Sud-Est' },
    { id: 'dep7', name: 'Artibonite' },
    { id: 'dep8', name: 'Centre' },
    { id: 'dep9', name: 'Grand\'Anse' },
    { id: 'dep10', name: 'Nippes' }
  ];
  
  const communes: Commune[] = [
    // Ouest
    { id: 'com1', name: 'Port-au-Prince', departementId: 'dep1' },
    { id: 'com2', name: 'Carrefour', departementId: 'dep1' },
    { id: 'com3', name: 'Delmas', departementId: 'dep1' },
    { id: 'com4', name: 'Pétion-Ville', departementId: 'dep1' },
    { id: 'com5', name: 'Croix-des-Bouquets', departementId: 'dep1' },
    // Nord
    { id: 'com6', name: 'Cap-Haïtien', departementId: 'dep2' },
    { id: 'com7', name: 'Limbé', departementId: 'dep2' },
    { id: 'com8', name: 'Plaisance', departementId: 'dep2' },
    // Nord-Est
    { id: 'com9', name: 'Fort-Liberté', departementId: 'dep3' },
    { id: 'com10', name: 'Ouanaminthe', departementId: 'dep3' },
    // Nord-Ouest
    { id: 'com11', name: 'Port-de-Paix', departementId: 'dep4' },
    { id: 'com12', name: 'Saint-Louis du Nord', departementId: 'dep4' },
    // Sud
    { id: 'com13', name: 'Les Cayes', departementId: 'dep5' },
    { id: 'com14', name: 'Aquin', departementId: 'dep5' },
    // Sud-Est
    { id: 'com15', name: 'Jacmel', departementId: 'dep6' },
    { id: 'com16', name: 'Belle-Anse', departementId: 'dep6' },
    // Artibonite
    { id: 'com17', name: 'Gonaïves', departementId: 'dep7' },
    { id: 'com18', name: 'Saint-Marc', departementId: 'dep7' },
    // Centre
    { id: 'com19', name: 'Hinche', departementId: 'dep8' },
    { id: 'com20', name: 'Mirebalais', departementId: 'dep8' },
    // Grand'Anse
    { id: 'com21', name: 'Jérémie', departementId: 'dep9' },
    { id: 'com22', name: 'Anse-d\'Hainault', departementId: 'dep9' },
    // Nippes
    { id: 'com23', name: 'Miragoâne', departementId: 'dep10' },
    { id: 'com24', name: 'Anse-à-Veau', departementId: 'dep10' }
  ];
  
  const sectionCommunales: SectionCommunale[] = [
    // Port-au-Prince
    { id: 'sec1', name: 'Turgeau', communeId: 'com1' },
    { id: 'sec2', name: 'Bel Air', communeId: 'com1' },
    { id: 'sec3', name: 'Martissant', communeId: 'com1' },
    // Carrefour
    { id: 'sec4', name: 'Thor', communeId: 'com2' },
    { id: 'sec5', name: 'Rivière Froide', communeId: 'com2' },
    // Delmas
    { id: 'sec6', name: 'Delmas 32', communeId: 'com3' },
    { id: 'sec7', name: 'Delmas 75', communeId: 'com3' },
    // Pétion-Ville
    { id: 'sec8', name: 'Frères', communeId: 'com4' },
    { id: 'sec9', name: 'Pernier', communeId: 'com4' },
    // Cap-Haïtien
    { id: 'sec10', name: 'Bande du Nord', communeId: 'com6' },
    { id: 'sec11', name: 'Haut du Cap', communeId: 'com6' },
    // Gonaïves
    { id: 'sec12', name: 'Pont Tamarin', communeId: 'com17' },
    { id: 'sec13', name: 'Bassin', communeId: 'com17' },
    // Les Cayes
    { id: 'sec14', name: 'Bourdet', communeId: 'com13' },
    { id: 'sec15', name: 'Laborde', communeId: 'com13' },
    // Jacmel
    { id: 'sec16', name: 'La Montagne', communeId: 'com15' },
    { id: 'sec17', name: 'La Vallée', communeId: 'com15' },
    // Other communes
    { id: 'sec18', name: 'Section 1', communeId: 'com5' },
    { id: 'sec19', name: 'Section 1', communeId: 'com7' },
    { id: 'sec20', name: 'Section 1', communeId: 'com8' },
    { id: 'sec21', name: 'Section 1', communeId: 'com9' },
    { id: 'sec22', name: 'Section 1', communeId: 'com10' },
    { id: 'sec23', name: 'Section 1', communeId: 'com11' },
    { id: 'sec24', name: 'Section 1', communeId: 'com12' }
  ];
  
  // Transform location data for react-select
  const departementOptions = useMemo(() => {
    return departements.map(dep => ({
      value: dep.id,
      label: dep.name
    }));
  }, [departements]);
  
  const [filteredCommuneOptions, setFilteredCommuneOptions] = useState<SelectOption[]>([]);
  const [filteredSectionOptions, setFilteredSectionOptions] = useState<SelectOption[]>([]);

  // Church form state
  const [churchFormData, setChurchFormData] = useState<CreateChurchFormData>({
    name: '',
    departement: '',
    commune: '',
    sectionCommunale: '',
    missionId: ''
  });
  
  // Update commune options when departement changes
  useEffect(() => {
    if (churchFormData.departement) {
      const filteredCommunes = communes.filter(commune => commune.departementId === churchFormData.departement);
      setFilteredCommuneOptions(filteredCommunes.map(commune => ({
        value: commune.id,
        label: commune.name
      })));
      
      // Reset commune and section communale when departement changes
      setChurchFormData(prev => ({
        ...prev,
        commune: '',
        sectionCommunale: ''
      }));
      
      setFilteredSectionOptions([]);
    } else {
      setFilteredCommuneOptions([]);
      setFilteredSectionOptions([]);
    }
  }, [churchFormData.departement, communes]);
  
  // Update section communale options when commune changes
  useEffect(() => {
    // Only run this effect when commune changes, not when sectionCommunale changes
    const communeId = churchFormData.commune;
    
    // Check if commune has a value (it will be the commune ID)
    if (communeId && communeId !== '') {
      // Filter sections based on the selected commune
      const filteredSections = sectionCommunales.filter(section => section.communeId === communeId);
      
      // Update the filtered section options
      setFilteredSectionOptions(filteredSections.map(section => ({
        value: section.id,
        label: section.name
      })));
      
      // Reset section communale when commune changes
      // We need to do this in a separate useEffect to avoid infinite loops
    } else {
      setFilteredSectionOptions([]);
    }
  }, [churchFormData.commune, sectionCommunales]);
  
  // Separate useEffect to reset sectionCommunale when commune changes
  useEffect(() => {
    // Only reset if commune has changed and we have a previous sectionCommunale value
    if (churchFormData.commune && churchFormData.sectionCommunale) {
      setChurchFormData(prev => ({
        ...prev,
        sectionCommunale: ''
      }));
    }
  }, [churchFormData.commune]);
  
  // User form state
  const [userFormData, setUserFormData] = useState<CreateUserFormData>({
    email: '',
    password: `J${Math.floor(10000000 + Math.random() * 90000000)}`,
    firstname: '',
    lastname: '',
    role: 'Admin',
    membreActif: true
  });
  
  // Calendar states
  const [showBirthCalendar, setShowBirthCalendar] = useState<boolean>(false);
  const [showJoinCalendar, setShowJoinCalendar] = useState<boolean>(false);
  const [showBaptismCalendar, setShowBaptismCalendar] = useState<boolean>(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // User form active tab
  const [userActiveTab, setUserActiveTab] = useState<string>('personal');
  
  // Form errors
  const [churchErrors, setChurchErrors] = useState<Record<string, string>>({});
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isChurchLoading, setIsChurchLoading] = useState<boolean>(false);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(false);

  // API hooks
  const { data: missions } = useGetMissionsQuery();
  const { data: users } = useGetUsersQuery();
  const { data: churches } = useGetChurchesQuery();
  const [createChurch] = useCreateChurchMutation();
  const [registerUser] = useRegisterMutation();
  const [addUserToChurch] = useAddUserToChurchMutation();
  
  // Add User To Church form state
  const [addUserToChurchFormData, setAddUserToChurchFormData] = useState<AddUserToChurchFormData>({
    userId: '',
    churchId: ''
  });
  
  // Loading state for add user to church
  const [isAddUserToChurchLoading, setIsAddUserToChurchLoading] = useState<boolean>(false);
  
  // Form errors for add user to church
  const [addUserToChurchErrors, setAddUserToChurchErrors] = useState<Record<string, string>>({});

  // Transform missions for react-select
  const missionOptions = useMemo(() => {
    if (!missions) return [];
    return missions.map(mission => ({
      value: mission.id,
      label: mission.missionName
    }));
  }, [missions]);

  // Validate church form
  const validateChurchForm = () => {
    const errors: Record<string, string> = {};
    if (!churchFormData.name.trim()) errors.name = 'Le nom de l\'église est requis';
    if (!churchFormData.departement) errors.departement = 'Le département est requis';
    if (!churchFormData.commune) errors.commune = 'La commune est requise';
    // if (!churchFormData.missionId) errors.missionId = 'La mission est requise';
    
    setChurchErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate user form
  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    if (!userFormData.firstname.trim()) errors.firstname = 'Le prénom est requis';
    if (!userFormData.lastname.trim()) errors.lastname = 'Le nom est requis';
    if (!userFormData.email.trim()) errors.email = 'L\'email est requis';
    if (!userFormData.password.trim()) errors.password = 'Le mot de passe est requis';
    // if (!userFormData.role.trim()) errors.role = 'Le rôle est requis';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userFormData.email && !emailRegex.test(userFormData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    setUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle church form submission
  const handleChurchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateChurchForm()) return;
    
    setIsChurchLoading(true);
    try {
      await createChurch(churchFormData).unwrap();
      toast.success('Église créée avec succès!');
      // Reset form
      setChurchFormData({
        name: '',
        departement: '',
        commune: '',
        sectionCommunale: '',
        missionId: ''
      });
    } catch (error) {
      console.error('Error creating church:', error);
      toast.error('Erreur lors de la création de l\'église');
    } finally {
      setIsChurchLoading(false);
    }
  };

  // Handle user form submission
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;
    
    setIsUserLoading(true);
    try {
      await registerUser(userFormData).unwrap();
      toast.success('Utilisateur créé avec succès!');
      // Reset form
      setUserFormData({
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        role: 'Admin',
        membreActif: true
      });
      setUserActiveTab('personal');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsUserLoading(false);
    }
  };

  // Validate add user to church form
  const validateAddUserToChurchForm = () => {
    const errors: Record<string, string> = {};
    if (!addUserToChurchFormData.userId) errors.userId = 'L\'utilisateur est requis';
    if (!addUserToChurchFormData.churchId) errors.churchId = 'L\'église est requise';
    
    setAddUserToChurchErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add user to church form submission
  const handleAddUserToChurchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddUserToChurchForm()) return;
    
    setIsAddUserToChurchLoading(true);
    try {
      const { userId, churchId } = addUserToChurchFormData;
      await addUserToChurch({ userId, churchId }).unwrap();
      toast.success('Utilisateur ajouté à l\'église avec succès!');
      // Reset form
      setAddUserToChurchFormData({
        userId: '',
        churchId: ''
      });
    } catch (error) {
      console.error('Error adding user to church:', error);
      toast.error('Erreur lors de l\'ajout de l\'utilisateur à l\'église');
    } finally {
      setIsAddUserToChurchLoading(false);
    }
  };
  
  // Transform users for react-select
  const userOptions = useMemo(() => {
    if (!users) return [];
    return users.map(user => ({
      value: user.id,
      label: `${user.firstname} ${user.lastname} (${user.email})`
    }));
  }, [users]);
  
  // Transform churches for react-select
  const churchOptions = useMemo(() => {
    if (!churches) return [];
    return churches.map(church => ({
      value: church.id,
      label: church.name
    }));
  }, [churches]);

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestion des Églises et Utilisateurs</h1>
      
      <Tab.Group>
        <Tab.List className="flex p-1 space-x-1 bg-teal-900/10 rounded-xl mb-8">
          <Tab
            className={({ selected }) =>
              `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            }
            onClick={() => setActiveTab('church')}
          >
            Créer une Église
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            }
            onClick={() => setActiveTab('user')}
          >
            Créer un Utilisateur
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            }
            onClick={() => setActiveTab('addUserToChurch')}
          >
            Ajouter un Utilisateur à une Église
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          {/* Church Creation Panel */}
          <Tab.Panel className="bg-white rounded-xl shadow-lg p-6 ring-1 ring-teal-500/5">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Créer une Nouvelle Église</h2>
            
            <form onSubmit={handleChurchSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Church Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'Église</label>
                  <input
                    type="text"
                    value={churchFormData.name}
                    onChange={(e) => setChurchFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nom de l'église"
                  />
                  {churchErrors.name && <p className="mt-1 text-sm text-red-600">{churchErrors.name}</p>}
                </div>
                
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                  <Select
                    value={departementOptions.find(option => option.value === churchFormData.departement)}
                    onChange={(selectedOption: any) => setChurchFormData(prev => ({ 
                      ...prev, 
                      departement: selectedOption?.value || '' 
                    }))}
                    options={departementOptions}
                    placeholder="Sélectionner un département"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.departement && <p className="mt-1 text-sm text-red-600">{churchErrors.departement}</p>}
                </div>
                
                {/* Commune */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
                  <Select
                    value={filteredCommuneOptions.find(option => option.value === churchFormData.commune)}
                    onChange={(selectedOption: any) => setChurchFormData(prev => ({ 
                      ...prev, 
                      commune: selectedOption?.value || '' 
                    }))}
                    options={filteredCommuneOptions}
                    placeholder="Sélectionner une commune"
                    isClearable
                    isSearchable
                    isDisabled={!churchFormData.departement}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.commune && <p className="mt-1 text-sm text-red-600">{churchErrors.commune}</p>}
                </div>
                
                {/* Section Communale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Communale</label>
                  <Select
                    value={filteredSectionOptions.find(option => option.value === churchFormData.sectionCommunale)}
                    onChange={(selectedOption: any) => setChurchFormData(prev => ({ 
                      ...prev, 
                      sectionCommunale: selectedOption?.value || '' 
                    }))}
                    options={filteredSectionOptions}
                    placeholder="Sélectionner une section communale"
                    isClearable
                    isSearchable
                    isDisabled={!churchFormData.commune || churchFormData.commune === ''}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                
                {/* Mission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                  <Select
                    value={missionOptions.find(option => option.value === churchFormData.missionId)}
                    onChange={(selectedOption: any) => setChurchFormData(prev => ({ ...prev, missionId: selectedOption?.value || '' }))}
                    options={missionOptions}
                    placeholder="Sélectionner une mission"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.missionId && <p className="mt-1 text-sm text-red-600">{churchErrors.missionId}</p>}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isChurchLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isChurchLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création...
                    </>
                  ) : (
                    'Créer l\'Église'
                  )}
                </button>
              </div>
            </form>
          </Tab.Panel>
          
          {/* User Creation Panel */}
          <Tab.Panel className="bg-white rounded-xl shadow-lg p-6 ring-1 ring-teal-500/5">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Créer un Nouvel Utilisateur</h2>
            
            <form onSubmit={handleUserSubmit} className="space-y-6">
              {/* User Form Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setUserActiveTab('personal')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${userActiveTab === 'personal' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Informations Personnelles
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserActiveTab('contact')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${userActiveTab === 'contact' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Contact & Localisation
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserActiveTab('church')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${userActiveTab === 'church' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Informations Église
                  </button>
                </nav>
              </div>
              
              {/* Personal Information Tab */}
              {userActiveTab === 'personal' && (
                <div className="space-y-6">
                  {/* Active Member Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Membre Actif</span>
                    <button
                      type="button"
                      onClick={() => setUserFormData(prev => ({ ...prev, membreActif: !prev.membreActif }))}
                      className={`${userFormData.membreActif ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${userFormData.membreActif ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        value={userFormData.firstname}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, firstname: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Prénom"
                      />
                      {userErrors.firstname && <p className="mt-1 text-sm text-red-600">{userErrors.firstname}</p>}
                    </div>
                    
                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        value={userFormData.lastname}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, lastname: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nom"
                      />
                      {userErrors.lastname && <p className="mt-1 text-sm text-red-600">{userErrors.lastname}</p>}
                    </div>
                    
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Électronique</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="email@exemple.com"
                      />
                      {userErrors.email && <p className="mt-1 text-sm text-red-600">{userErrors.email}</p>}
                    </div>
                    
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de Passe</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={userFormData.password}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                          placeholder="Mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {userErrors.password && <p className="mt-1 text-sm text-red-600">{userErrors.password}</p>}
                    </div>
                    
                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                      <div className="flex space-x-4 mt-1">
                        <div className="flex items-center">
                          <input
                            id="male"
                            type="radio"
                            name="gender"
                            value="Homme"
                            checked={userFormData.gender === 'Homme'}
                            onChange={() => setUserFormData(prev => ({ ...prev, gender: 'Homme' }))}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                          />
                          <label htmlFor="male" className="ml-2 block text-sm text-gray-700">Homme</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="female"
                            type="radio"
                            name="gender"
                            value="Femme"
                            checked={userFormData.gender === 'Femme'}
                            onChange={() => setUserFormData(prev => ({ ...prev, gender: 'Femme' }))}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                          />
                          <label htmlFor="female" className="ml-2 block text-sm text-gray-700">Femme</label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de Naissance</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={userFormData.birthDate ? new Date(userFormData.birthDate).toLocaleDateString('fr-FR') : ''}
                          onClick={() => setShowBirthCalendar(!showBirthCalendar)}
                          readOnly
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
                                    setUserFormData(prev => ({ ...prev, birthDate: selectedDate.toISOString().split('T')[0] }));
                                    setShowBirthCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.birthDate ? new Date(userFormData.birthDate) : null}
                              className="react-calendar"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Civil State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">État Civil</label>
                      <select
                        value={userFormData.civilState || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, civilState: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="célibataire">Célibataire</option>
                        <option value="marié(e)">Marié(e)</option>
                        <option value="divorcé(e)">Divorcé(e)</option>
                        <option value="veuf/veuve">Veuf/Veuve</option>
                      </select>
                    </div>
                    
                    {/* Spouse Name (conditional) */}
                    {userFormData.civilState === 'marié(e)' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom du conjoint(e)</label>
                        <input
                          type="text"
                          value={userFormData.spouseFullName || ''}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, spouseFullName: e.target.value }))}
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
                        value={userFormData.profession || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, profession: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Profession"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Contact & Location Tab */}
              {userActiveTab === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mobile Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone Mobile</label>
                      <input
                        type="tel"
                        value={userFormData.mobilePhone || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, mobilePhone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Téléphone mobile"
                      />
                    </div>
                    
                    {/* Home Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone Fixe</label>
                      <input
                        type="tel"
                        value={userFormData.homePhone || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, homePhone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Téléphone fixe"
                      />
                    </div>
                    
                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        value={userFormData.addressLine || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Adresse complète"
                      />
                    </div>
                    
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                      <input
                        type="text"
                        value={userFormData.city || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Ville"
                      />
                    </div>
                    
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                      <input
                        type="text"
                        value={userFormData.country || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Pays"
                      />
                    </div>
                    
                    {/* Birth City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ville de Naissance</label>
                      <input
                        type="text"
                        value={userFormData.birthCity || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, birthCity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Ville de naissance"
                      />
                    </div>
                    
                    {/* Birth Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pays de Naissance</label>
                      <input
                        type="text"
                        value={userFormData.birthCountry || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, birthCountry: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Pays de naissance"
                      />
                    </div>
                    
                    {/* Person to Contact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personne à Contacter</label>
                      <input
                        type="text"
                        value={userFormData.personToContact || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, personToContact: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Personne à contacter en cas d'urgence"
                      />
                    </div>
                    
                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                      <input
                        type="text"
                        value={userFormData.facebook || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, facebook: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Profil Facebook"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Church Information Tab */}
              {userActiveTab === 'church' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Directeur">Director</option>
                      </select>
                      {userErrors.role && <p className="mt-1 text-sm text-red-600">{userErrors.role}</p>}
                    </div>
                    
                    {/* Join Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date d'Adhésion</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={userFormData.joinDate ? new Date(userFormData.joinDate).toLocaleDateString('fr-FR') : ''}
                          onClick={() => setShowJoinCalendar(!showJoinCalendar)}
                          readOnly
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
                                    setUserFormData(prev => ({ ...prev, joinDate: selectedDate.toISOString().split('T')[0] }));
                                    setShowJoinCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.joinDate ? new Date(userFormData.joinDate) : null}
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
                          value={userFormData.baptismDate ? new Date(userFormData.baptismDate).toLocaleDateString('fr-FR') : ''}
                          onClick={() => setShowBaptismCalendar(!showBaptismCalendar)}
                          readOnly
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
                                    setUserFormData(prev => ({ ...prev, baptismDate: selectedDate.toISOString().split('T')[0] }));
                                    setShowBaptismCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.baptismDate ? new Date(userFormData.baptismDate) : null}
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
                        value={userFormData.baptismLocation || ''}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, baptismLocation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Lieu de baptême"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isUserLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUserLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création...
                    </>
                  ) : (
                    'Créer l\'Utilisateur'
                  )}
                </button>
              </div>
            </form>
          </Tab.Panel>
          {/* Add User To Church Panel */}
          <Tab.Panel className="bg-white rounded-xl shadow-lg p-6 ring-1 ring-teal-500/5">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ajouter un Utilisateur à une Église</h2>
            
            <form onSubmit={handleAddUserToChurchSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
                  <Select
                    value={userOptions.find(option => option.value === addUserToChurchFormData.userId)}
                    onChange={(selectedOption: any) => setAddUserToChurchFormData(prev => ({ ...prev, userId: selectedOption?.value || '' }))}
                    options={userOptions}
                    placeholder="Sélectionner un utilisateur"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {addUserToChurchErrors.userId && <p className="mt-1 text-sm text-red-600">{addUserToChurchErrors.userId}</p>}
                </div>
                
                {/* Church Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Église</label>
                  <Select
                    value={churchOptions.find(option => option.value === addUserToChurchFormData.churchId)}
                    onChange={(selectedOption: any) => setAddUserToChurchFormData(prev => ({ ...prev, churchId: selectedOption?.value || '' }))}
                    options={churchOptions}
                    placeholder="Sélectionner une église"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {addUserToChurchErrors.churchId && <p className="mt-1 text-sm text-red-600">{addUserToChurchErrors.churchId}</p>}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isAddUserToChurchLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAddUserToChurchLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ajout en cours...
                    </>
                  ) : (
                    'Ajouter l\'Utilisateur à l\'Église'
                  )}
                </button>
              </div>
            </form>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default GestionPage;