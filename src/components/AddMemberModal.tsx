import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAddUserToGroupMutation } from '../store/services/groupApi';
import { useGetUsersByChurchQuery} from '../store/services/authApi';
import type { User as ApiUser } from '../store/services/authApi';
import type { Group } from '../store/services/groupApi';
import Select from 'react-select';

// Extend the API User type to ensure compatibility
type User = ApiUser & {
  // Ensure role is always a string (not undefined)
  role: string;
}

// Option type for react-select
type SelectOption = {
  value: string;
  label: string;
  user: User;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  churchId: string;
}

export default function AddMemberModal({ isOpen, onClose, group, churchId }: AddMemberModalProps) {
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  
  const { data: users, isLoading: isLoadingUsers } = useGetUsersByChurchQuery(churchId);
  const [addUserToGroup, { isLoading: isAdding, isSuccess, error }] = useAddUserToGroupMutation();
  
  // Filter users who are not already in the group and prepare options for react-select
  useEffect(() => {
    if (users && group) {
      const existingUserIds = new Set(group.users?.map(user => user.id) || []);
      const availableUsers = users.filter(user => !existingUserIds.has(user.id)) as User[];
      
      // Transform users to react-select options
      const options = availableUsers.map(user => ({
        value: user.id,
        label: `${user.firstname} ${user.lastname} (${user.email})`,
        user: user
      }));
      
      setUserOptions(options);
    }
  }, [users, group]);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
    }
  }, [isOpen]);
  
  // Handle success
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);
  
  const handleAddMember = async () => {
    if (!selectedOption || !group) return;
    
    try {
      await addUserToGroup({
        groupId: group.id,
        userId: selectedOption.value
      }).unwrap();
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Ajouter un membre à {group?.name}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
              Sélectionner un utilisateur
            </label>
            <Select
              id="user-select"
              options={userOptions}
              value={selectedOption}
              onChange={(option) => setSelectedOption(option)}
              isLoading={isLoadingUsers}
              isSearchable={true}
              placeholder="Rechercher un utilisateur..."
              noOptionsMessage={() => "Tous les utilisateurs sont déjà membres de ce groupe"}
              classNames={{
                control: (state) => 
                  `px-1 py-1 border border-gray-300 rounded-md shadow-sm ${state.isFocused ? 'border-teal-500 ring-1 ring-teal-500' : ''}`
              }}
              styles={{
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected ? '#14b8a6' : state.isFocused ? '#e6fffa' : 'white',
                  color: state.isSelected ? 'white' : '#374151',
                }),
                control: (provided) => ({
                  ...provided,
                  boxShadow: 'none',
                }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999
                })
              }}
            />
          </div>
          
          {error && (
            <div className="mt-3 text-sm text-red-600">
              Une erreur s'est produite. Veuillez réessayer.
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleAddMember}
            disabled={!selectedOption || isAdding}
          >
            {isAdding ? (
              <>
                <span className="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Ajout en cours...
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}