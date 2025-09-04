import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {  Tab } from '@headlessui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Country, State, City } from 'country-state-city';

// API Imports
import { useRegisterMutation, useGetUsersQuery } from '../../store/services/authApi';
import { useCreateChurchMutation, useGetChurchesQuery, useAddUserToChurchMutation, useGetAllTtisQuery, useConnectTtiToChurchMutation, useConnectChurchToMissionMutation } from '../../store/services/churchApi';
import { useGetMissionsQuery } from '../../store/services/mission';
import { useGetDepartementCommunesQuery } from '../../store/services/churchApi';
import Creatable from 'react-select/creatable';
// Types
interface CreateChurchFormData {
  name: string;
  country: string;
  departement: string;
  commune: string;
  sectionCommunale: string;
  rue?: string;
  telephone?: string;
  missionId: string;
  longitude: string;
  latitude: string;
}

interface SelectOption {
  value: string;
  label: string;
  isoCode?: string; // For storing state/country codes when needed
}

// Data Structure Type
interface DataType {
  [departement: string]: {
    communes: {
      [commune: string]: string[];
    };
  };
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

interface ConnectTtiFormData {
  churchId: string;
  ttiId: string;
}

interface ConnectChurchToMissionFormData {
  churchId: string;
  missionId: string;
}

const GestionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('church');
  
  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['church', 'user', 'addUserToChurch', 'connectTti', 'connectChurchToMission'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  console.log(activeTab)
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
  
  // Static Data for locations
  const data: DataType = {
    "Ouest": {
      communes: Ouest || {}
    },
    "Nord": {
      communes: Nord || {}
    },
    "Nord-Est": {
      communes: NordEst || {}
    },
    "Nord-Ouest": {
      communes: NordOuest || {}
    },
    "Sud": {
      communes: Sude || {}
    },
    "Sud-Est": {
      communes: SudEst || {}
    },
    "Artibonite": {
      communes: Artibonite || {}
    },
    "Centre": {
      communes: Centre || {}
    },
    "Grand'Anse": {
      communes: GrandAnse || {}
    },
    "Nippes": {
      communes: Nippes || {}
    },
  };
  
  // Location selector state
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(null);
  const [departement, setDepartement] = useState<SelectOption | null>(null);
  const [commune, setCommune] = useState<SelectOption | null>(null);
  const [sectionCommunale, setSectionCommunale] = useState<SelectOption | null>(null);
  
  // Check if Haiti is selected
  const isHaitiSelected = selectedCountry?.value === 'Haiti';
  
  // Transform data for react-select
  const countryOptions: SelectOption[] = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: country.name,
    isoCode: country.isoCode // Keep isoCode for API calls
  }));
  
  // Location options based on selected country
  const departementOptions: SelectOption[] = useMemo(() => {
    if (isHaitiSelected) {
      return Object.keys(data).map((dept) => ({
        value: dept,
        label: dept,
      }));
    } else if (selectedCountry) {
      // Find the selected country's isoCode for API call
      const countryIsoCode = selectedCountry.isoCode || Country.getAllCountries().find(country => country.name === selectedCountry.value)?.isoCode;
      if (!countryIsoCode) return [];
      
      return State.getStatesOfCountry(countryIsoCode).map((state) => ({
        value: state.name,
        label: state.name,
        isoCode: state.isoCode // Keep isoCode for API calls
      }));
    }
    return [];
  }, [isHaitiSelected, selectedCountry, data]);
  
  const communeOptions: SelectOption[] = useMemo(() => {
    if (isHaitiSelected && departement) {
      return Object.keys(data[departement.value].communes).map((commune) => ({
        value: commune,
        label: commune,
      }));
    } else if (!isHaitiSelected && selectedCountry && departement) {
      // Find the selected country's isoCode and state's isoCode for API call
      const countryIsoCode = selectedCountry.isoCode || Country.getAllCountries().find(country => country.name === selectedCountry.value)?.isoCode;
      if (!countryIsoCode) return [];
      
      const selectedState = State.getStatesOfCountry(countryIsoCode).find(state => state.name === departement.value);
      const stateIsoCode = selectedState?.isoCode || departement.isoCode || departement.value;
      
      return City.getCitiesOfState(countryIsoCode, stateIsoCode).map((city) => ({
        value: city.name,
        label: city.name,
      }));
    }
    return [];
  }, [isHaitiSelected, selectedCountry, departement, data]);
  
  const sectionCommunaleOptions: SelectOption[] = useMemo(() => {
    if (isHaitiSelected && departement && commune) {
      return data[departement.value].communes[commune.value].map((section) => ({
        value: section,
        label: section,
      }));
    }
    return [];
  }, [isHaitiSelected, departement, commune, data]);

  // Church form state
  const [churchFormData, setChurchFormData] = useState<CreateChurchFormData>({
    name: '',
    country: '',
    departement: '',
    commune: '',
    sectionCommunale: '',
    rue: '',
    telephone: '',
    missionId: '',
    longitude: '',
    latitude: ''
  });
  
  // Handle location selection changes
  const handleCountryChange = (selectedOption: SelectOption | null) => {
    setSelectedCountry(selectedOption);
    setDepartement(null);
    setCommune(null);
    setSectionCommunale(null);
    
    // Update church form data
    setChurchFormData(prev => ({
      ...prev,
      country: selectedOption?.value || '',
      departement: '',
      commune: '',
      sectionCommunale: ''
    }));
  };
  
  const handleDepartementChange = (selectedOption: SelectOption | null) => {
    setDepartement(selectedOption);
    setCommune(null);
    setSectionCommunale(null);
    
    // Update church form data
    setChurchFormData(prev => ({
      ...prev,
      departement: selectedOption?.value || '',
      commune: '',
      sectionCommunale: ''
    }));
  };
  
  const handleCommuneChange = (selectedOption: SelectOption | null) => {
    setCommune(selectedOption);
    setSectionCommunale(null);
    
    // Update church form data
    setChurchFormData(prev => ({
      ...prev,
      commune: selectedOption?.value || '',
      sectionCommunale: ''
    }));
  };
  
  const handleSectionCommunaleChange = (selectedOption: SelectOption | null) => {
    setSectionCommunale(selectedOption);
    
    // Update church form data
    setChurchFormData(prev => ({
      ...prev,
      sectionCommunale: selectedOption?.value || ''
    }));
  };
  
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
  const { data: ttis } = useGetAllTtisQuery();
  const [createChurch] = useCreateChurchMutation();
  const [registerUser] = useRegisterMutation();
  const [addUserToChurch] = useAddUserToChurchMutation();
  const [connectTtiToChurch] = useConnectTtiToChurchMutation();
  const [connectChurchToMission] = useConnectChurchToMissionMutation();
  
  // Add User To Church form state
  const [addUserToChurchFormData, setAddUserToChurchFormData] = useState<AddUserToChurchFormData>({
    userId: '',
    churchId: ''
  });
  
  // Loading state for add user to church
  const [isAddUserToChurchLoading, setIsAddUserToChurchLoading] = useState<boolean>(false);
  
  // Form errors for add user to church
  const [addUserToChurchErrors, setAddUserToChurchErrors] = useState<Record<string, string>>({});

  // Connect TTI to Church form state
  const [connectTtiFormData, setConnectTtiFormData] = useState<ConnectTtiFormData>({
    churchId: '',
    ttiId: ''
  });

  // Loading state for connect TTI
  const [isConnectTtiLoading, setIsConnectTtiLoading] = useState<boolean>(false);

  // Form errors for connect TTI
  const [connectTtiErrors, setConnectTtiErrors] = useState<Record<string, string>>({});

  // Connect Church to Mission form state
  const [connectChurchToMissionFormData, setConnectChurchToMissionFormData] = useState<ConnectChurchToMissionFormData>({
    churchId: '',
    missionId: ''
  });

  // Loading state for connect church to mission
  const [isConnectChurchToMissionLoading, setIsConnectChurchToMissionLoading] = useState<boolean>(false);

  // Form errors for connect church to mission
  const [connectChurchToMissionErrors, setConnectChurchToMissionErrors] = useState<Record<string, string>>({});

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
    if (!churchFormData.country) errors.country = 'Le pays est requis';
    if (!churchFormData.departement) {
      errors.departement = isHaitiSelected ? 'Le département est requis' : 'L\'état est requis';
    }
    if (!churchFormData.commune) {
      errors.commune = isHaitiSelected ? 'La commune est requise' : 'La ville est requise';
    }
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
        country: '',
        departement: '',
        commune: '',
        sectionCommunale: '',
        rue: '',
        telephone: '',
        missionId: '',
        longitude: '',
        latitude: ''
      });
      // Reset location states
      setSelectedCountry(null);
      setDepartement(null);
      setCommune(null);
      setSectionCommunale(null);
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

  // Validate connect TTI form
  const validateConnectTtiForm = () => {
    const errors: Record<string, string> = {};
    if (!connectTtiFormData.churchId) errors.churchId = 'L\'église est requise';
    // TTI validation is no longer needed as we use the single TTI automatically
    setConnectTtiErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle connect TTI to church form submission
  const handleConnectTtiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateConnectTtiForm()) return;
    
    // Use the single TTI ID automatically
    if (!singleTtiId) {
      toast.error('Aucun TTI disponible');
      return;
    }
    
    setIsConnectTtiLoading(true);
    try {
      const { churchId } = connectTtiFormData;
      const ttiId = singleTtiId;
      console.log("data : ", churchId, ttiId)
      await connectTtiToChurch({ churchId, ttiId }).unwrap();
      toast.success('TTI connecté à l\'église avec succès!');
      // Reset form
      setConnectTtiFormData({
        churchId: '',
        ttiId: ''
      });
    } catch (error) {
      console.error('Error connecting TTI to church:', error);
      toast.error('Erreur lors de la connexion du TTI à l\'église');
    } finally {
      setIsConnectTtiLoading(false);
    }
  };

  // Validate connect church to mission form
  const validateConnectChurchToMissionForm = () => {
    const errors: Record<string, string> = {};
    if (!connectChurchToMissionFormData.churchId) errors.churchId = 'L\'église est requise';
    if (!connectChurchToMissionFormData.missionId) errors.missionId = 'La mission est requise';
    setConnectChurchToMissionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle connect church to mission form submission
  const handleConnectChurchToMissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateConnectChurchToMissionForm()) return;
    
    setIsConnectChurchToMissionLoading(true);
    try {
      await connectChurchToMission(connectChurchToMissionFormData).unwrap();
      toast.success('Église connectée à la mission avec succès!');
      // Reset form
      setConnectChurchToMissionFormData({
        churchId: '',
        missionId: ''
      });
    } catch (error) {
      console.error('Error connecting church to mission:', error);
      toast.error('Erreur lors de la connexion de l\'église à la mission');
    } finally {
       setIsConnectChurchToMissionLoading(false);
     }
   };
  
  // Transform users for react-select
  const userOptions = useMemo(() => {
    const message = "pas d'église"
    if (!users) return [];
    return users.map(user => ({
      value: user.id,
      label: `${user.firstname} ${user.lastname} (${user.church ? user.church.name : message})`
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

  // Transform TTIs for react-select
  // const ttiOptions = useMemo(() => {
  //   if (!ttis) return [];
  //   return ttis.map(tti => ({
  //     value: tti.id,
  //     label: `${tti.nom} (Timothee Training Institute)`
  //   }));
  // }, [ttis]);

  // Get the single TTI ID automatically
  const singleTtiId = useMemo(() => {
    if (ttis && ttis.length === 1) {
      return ttis[0].id;
    }
    return null;
  }, [ttis]);

  // Get the single TTI name for display
  // const singleTtiName = useMemo(() => {
  //   if (ttis && ttis.length === 1) {
  //     return `${ttis[0].nom} (Timothee Training Institute)`;
  //   }
  //   return null;
  // }, [ttis]);

  // Map activeTab to index for Tab.Group
  const getTabIndex = (tab: string) => {
    switch (tab) {
      case 'church': return 0;
      case 'user': return 1;
      case 'addUserToChurch': return 2;
      case 'connectTti': return 3;
      case 'connectChurchToMission': return 4;
      default: return 0;
    }
  };

  const handleTabChange = (index: number) => {
    const tabs = ['church', 'user', 'addUserToChurch', 'connectTti', 'connectChurchToMission'];
    setActiveTab(tabs[index]);
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestion des Églises et Utilisateurs</h1>
      
      <Tab.Group selectedIndex={getTabIndex(activeTab)} onChange={handleTabChange}>
        <Tab.List className="flex  space-x-1">
          <Tab
            // className={({ selected }) =>
            //   `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            // }
          >
            {/* Créer une Église */}
          </Tab>
          <Tab
            // s
          >
            {/* Créer un Utilisateur */}
          </Tab>
          <Tab
            // className={({ selected }) =>
            //   `w-full py-[0px] text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            // }
          >
            {/* Ajouter un Utilisateur à une Église */}
          </Tab>
          <Tab
            // className={({ selected }) =>
            //   `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            // }
          >
            {/* Connecter à TTI */}
          </Tab>
          <Tab
            // className={({ selected }) =>
            //   `w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${selected ? 'bg-teal-600 text-white shadow' : 'text-gray-700 hover:bg-teal-100'}`
            // }
          >
            {/* Connecter Église à Mission */}
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
                  <Creatable
                    value={churchOptions.find(option => option.label === churchFormData.name)}
                    onChange={(selectedOption: any) => setChurchFormData(prev => ({ ...prev, name: selectedOption?.label || '' }))}
                    options={churchOptions}
                    placeholder="Sélectionner une église"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                  {churchErrors.name && <p className="mt-1 text-sm text-red-600">{churchErrors.name}</p>}
                </div>
                
                {/* Country */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countryOptions}
                    placeholder="Sélectionner un pays"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.country && <p className="mt-1 text-sm text-red-600">{churchErrors.country}</p>}
                </div>
                
                {/* Department/State */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isHaitiSelected ? 'Département' : 'État'}
                  </label>
                  <Select
                    value={departement}
                    onChange={handleDepartementChange}
                    options={departementOptions}
                    placeholder={isHaitiSelected ? 'Sélectionner un département' : 'Sélectionner un état'}
                    isClearable
                    isSearchable
                    isDisabled={!selectedCountry}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.departement && <p className="mt-1 text-sm text-red-600">{churchErrors.departement}</p>}
                </div>
                
                {/* Commune/City */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isHaitiSelected ? 'Commune' : 'Ville'}
                  </label>
                  <Select
                    value={commune}
                    onChange={handleCommuneChange}
                    options={communeOptions}
                    placeholder={isHaitiSelected ? 'Sélectionner une commune' : 'Sélectionner une ville'}
                    isClearable
                    isSearchable
                    isDisabled={!departement}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {churchErrors.commune && <p className="mt-1 text-sm text-red-600">{churchErrors.commune}</p>}
                </div>
                
                {/* Section Communale - Only for Haiti */}
                {isHaitiSelected && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Communale</label>
                    <Select
                      value={sectionCommunale}
                      onChange={handleSectionCommunaleChange}
                      options={sectionCommunaleOptions}
                      placeholder="Sélectionner une section communale"
                      isClearable
                      isSearchable
                      isDisabled={!commune}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                )}
                
                {/* Rue - Only for non-Haiti countries */}
                {!isHaitiSelected && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rue</label>
                    <input
                      type="text"
                      value={churchFormData.rue || ''}
                      onChange={(e) => setChurchFormData(prev => ({ ...prev, rue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Entrer l'adresse de la rue"
                    />
                  </div>
                )}
                
                {/* Telephone - Only for non-Haiti countries */}
                {!isHaitiSelected && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro</label>
                    <input
                      type="number"
                      value={churchFormData.telephone || ''}
                      onChange={(e) => setChurchFormData(prev => ({ ...prev, telephone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Entrer le numéro"
                    />
                  </div>
                )}
                
                {/* Mission */}
                <div className="col-span-2">
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
                
                {/* Longitude */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="text"
                    value={churchFormData.longitude}
                    onChange={(e) => setChurchFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: -72.3388"
                  />
                </div>
                
                {/* Latitude */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="text"
                    value={churchFormData.latitude}
                    onChange={(e) => setChurchFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: 18.5944"
                  />
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
                          value={userFormData.birthDate ? userFormData.birthDate.split('-').reverse().join('/') : ''}
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
                                    const year = selectedDate.getFullYear();
                                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(selectedDate.getDate()).padStart(2, '0');
                                    setUserFormData(prev => ({ ...prev, birthDate: `${year}-${month}-${day}` }));
                                    setShowBirthCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.birthDate ? new Date(userFormData.birthDate + 'T00:00:00') : null}
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
                          value={userFormData.joinDate ? userFormData.joinDate.split('-').reverse().join('/') : ''}
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
                                    const year = selectedDate.getFullYear();
                                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(selectedDate.getDate()).padStart(2, '0');
                                    setUserFormData(prev => ({ ...prev, joinDate: `${year}-${month}-${day}` }));
                                    setShowJoinCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.joinDate ? new Date(userFormData.joinDate + 'T00:00:00') : null}
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
                          value={userFormData.baptismDate ? userFormData.baptismDate.split('-').reverse().join('/') : ''}
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
                                    const year = selectedDate.getFullYear();
                                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(selectedDate.getDate()).padStart(2, '0');
                                    setUserFormData(prev => ({ ...prev, baptismDate: `${year}-${month}-${day}` }));
                                    setShowBaptismCalendar(false);
                                  }
                                }
                              }}
                              value={userFormData.baptismDate ? new Date(userFormData.baptismDate + 'T00:00:00') : null}
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
          
          {/* Connect TTI to Church Panel */}
          <Tab.Panel className="bg-white rounded-xl shadow-lg p-6 ring-1 ring-teal-500/5">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Connecter une Église à un tti</h2>
            
            <form onSubmit={handleConnectTtiSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Church Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Église</label>
                  <Select
                    value={churchOptions.find(option => option.value === connectTtiFormData.churchId)}
                    onChange={(selectedOption: any) => setConnectTtiFormData(prev => ({ ...prev, churchId: selectedOption?.value || '' }))}
                    options={churchOptions}
                    placeholder="Sélectionner une église"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {connectTtiErrors.churchId && <p className="mt-1 text-sm text-red-600">{connectTtiErrors.churchId}</p>}
                </div>
                
                {/* TTI Display */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TTI (Timothee Training Institute)</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {singleTtiName || 'Aucun TTI disponible'}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">TTI sélectionné automatiquement</p>
                </div> */}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isConnectTtiLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isConnectTtiLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </>
                  ) : (
                    'Connecter le TTI à l\'Église'
                  )}
                </button>
              </div>
            </form>
          </Tab.Panel>
          
          {/* Connect Church to Mission Panel */}
          <Tab.Panel className="bg-white rounded-xl shadow-lg p-6 ring-1 ring-teal-500/5">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Connecter une Église à une Mission</h2>
            
            <form onSubmit={handleConnectChurchToMissionSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Church Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Église</label>
                  <Select
                    value={churchOptions.find(option => option.value === connectChurchToMissionFormData.churchId)}
                    onChange={(selectedOption: any) => setConnectChurchToMissionFormData(prev => ({ ...prev, churchId: selectedOption?.value || '' }))}
                    options={churchOptions}
                    placeholder="Sélectionner une église"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {connectChurchToMissionErrors.churchId && <p className="mt-1 text-sm text-red-600">{connectChurchToMissionErrors.churchId}</p>}
                </div>
                
                {/* Mission Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                  <Select
                    value={missionOptions.find(option => option.value === connectChurchToMissionFormData.missionId)}
                    onChange={(selectedOption: any) => setConnectChurchToMissionFormData(prev => ({ ...prev, missionId: selectedOption?.value || '' }))}
                    options={missionOptions}
                    placeholder="Sélectionner une mission"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {connectChurchToMissionErrors.missionId && <p className="mt-1 text-sm text-red-600">{connectChurchToMissionErrors.missionId}</p>}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isConnectChurchToMissionLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isConnectChurchToMissionLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </>
                  ) : (
                    'Connecter l\'Église à la Mission'
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
