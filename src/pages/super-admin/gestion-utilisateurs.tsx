
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// Import API hooks (adjust based on your actual API structure)
import {  useGetUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '../../store/services/authApi';

// Import custom components
import ChangeRoleModal from '../../components/ChangeRoleModal';
import DeleteMemberModal from '../../components/DeleteMemberModal';
import EditMemberModal from '../../components/EditMemberModal';

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


export default function GestionUtilisateurs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<Member | null>(null);
  const itemsPerPage = 7;

  // Get user data and church ID
  // const { data: userData } = useGetUserByTokenQuery();
  // const churchId = userData?.church?.id;

  // Fetch members data
  const { data: membersData, isLoading: isMembersLoading, refetch } = useGetUsersQuery();

  // Register mutation for adding new members
  
  // Update user mutation for editing members
  const [updateUser] = useUpdateUserMutation();
  
  // Delete user mutation for deleting members
  const [deleteUser] = useDeleteUserMutation();
  
  // Create transfer mutation for transferring members
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


  const handleRoleChange = async (newRole: string) => {
    if (!selectedMemberForAction) return;
    
    try {
      // TODO: Implement API call to update member role
      console.log(`Changing role for ${selectedMemberForAction.firstname} ${selectedMemberForAction.lastname} to ${newRole}`);
      
      // Close modal and reset selected member
      setIsChangeRoleModalOpen(false);
      setSelectedMemberForAction(null);
      
      // Optionally refetch data
      // refetch();
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


  const handleRowClick = (member: Member) => {
    navigate(`/tableau-de-bord/admin/person/${member.id}`);
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
          </div>
        </div>

        {/* Results Count */}
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

      {/* <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      /> */}

      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          setSelectedMemberForAction(null);
        }}
        member={selectedMemberForAction}
        onRoleChange={handleRoleChange}
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
    </div>
  );
}