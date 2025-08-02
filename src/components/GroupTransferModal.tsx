import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ArrowRightIcon,
  UsersIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Select from 'react-select';
import { useGetGroupsByChurchQuery, useGetGroupByIdQuery } from '../store/services/groupApi';
import { useGetUsersByChurchQuery, useGetUserByTokenQuery } from '../store/services/authApi';

interface GroupTransferFormData {
  userId: string;
  sourceGroupId: string;
  targetGroupId: string;
}

interface GroupTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: GroupTransferFormData) => void;
  isLoading: boolean;
}

const GroupTransferModal: React.FC<GroupTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<GroupTransferFormData>({
    userId: '',
    sourceGroupId: '',
    targetGroupId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current user data to get the church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  // Fetch groups and users from the church
  const { data: groups = [], isLoading: isLoadingGroups } = useGetGroupsByChurchQuery(churchId, {
    skip: !churchId
  });
  const { data: users = [], isLoading: isLoadingUsers } = useGetUsersByChurchQuery(churchId, {
    skip: !churchId
  });

  // Get the selected source group data to check if user is a member
  const { data: selectedGroupData } = useGetGroupByIdQuery(formData.sourceGroupId || '', {
    skip: !formData.sourceGroupId
  });
  
  // Get the selected target group data to check if user is already a member
  const { data: targetGroupData } = useGetGroupByIdQuery(formData.targetGroupId || '', {
    skip: !formData.targetGroupId
  });

  // Format data for dropdowns
  const groupOptions = useMemo(() => {
    return groups.map(g => ({ 
      value: g.id, 
      label: g.name,
      memberCount: g.users?.length || 0
    }));
  }, [groups]);

  const userOptions = useMemo(() => {
    return users.map(u => ({ 
      value: u.id, 
      label: `${u.firstname} ${u.lastname}`,
      email: u.email,
      picture: u.picture
    }));
  }, [users]);

  // Filter target groups to exclude the source group
  const targetGroupOptions = useMemo(() => {
    return groupOptions.filter(group => group.value !== formData.sourceGroupId);
  }, [groupOptions, formData.sourceGroupId]);

  const resetForm = () => {
    setFormData({
      userId: '',
      sourceGroupId: '',
      targetGroupId: ''
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.userId) {
      newErrors.userId = 'Veuillez sélectionner un utilisateur';
    }
    if (!formData.sourceGroupId) {
      newErrors.sourceGroupId = 'Veuillez sélectionner le groupe actuel';
    }
    if (!formData.targetGroupId) {
      newErrors.targetGroupId = 'Veuillez sélectionner le groupe de destination';
    }
    
    if (formData.sourceGroupId === formData.targetGroupId) {
      newErrors.targetGroupId = 'Le groupe de destination doit être différent du groupe actuel';
    }

    // Check if the user is actually in the source group
    if (formData.userId && formData.sourceGroupId && selectedGroupData) {
      const isUserInSourceGroup = selectedGroupData.users?.some(user => user.id === formData.userId);
      if (!isUserInSourceGroup) {
        newErrors.userId = `L'utilisateur sélectionné n'est pas membre du groupe ${selectedGroupData.name}`;
      }
    }
    
    // Check if the user is already in the target group
    if (formData.userId && formData.targetGroupId && targetGroupData) {
      const isUserInTargetGroup = targetGroupData.users?.some(user => user.id === formData.userId);
      if (isUserInTargetGroup) {
        newErrors.targetGroupId = `L'utilisateur est déjà membre du groupe ${targetGroupData.name}`;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof GroupTransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedUser = userOptions.find(user => user.value === formData.userId);
  const selectedSourceGroup = groupOptions.find(group => group.value === formData.sourceGroupId);
  const selectedTargetGroup = groupOptions.find(group => group.value === formData.targetGroupId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ArrowRightIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Transférer un Membre</h3>
                <p className="text-teal-100 text-sm">Transférer un membre d'un groupe à un autre</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Transfer Preview */}
        {selectedUser && selectedSourceGroup && selectedTargetGroup && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser.picture ? (
                    <img
                      src={`https://api.ujecc.org${selectedUser.picture}`}
                      alt={selectedUser.label}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    selectedUser.label.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.label}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <ArrowRightIcon className="h-6 w-6 text-gray-400" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">De: <span className="text-teal-600">{selectedSourceGroup.label}</span></p>
                <p className="text-sm font-medium text-gray-700">Vers: <span className="text-blue-600">{selectedTargetGroup.label}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner l'utilisateur *
            </label>
            <Select
              options={userOptions}
              value={userOptions.find(option => option.value === formData.userId) || null}
              onChange={(selectedOption) => handleInputChange('userId', selectedOption?.value || '')}
              placeholder="Choisir un utilisateur..."
              isLoading={isLoadingUsers}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              formatOptionLabel={(option: any) => (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {option.picture ? (
                      <img
                        src={`https://api.ujecc.org${option.picture}`}
                        alt={option.label}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      option.label.split(' ').map((n: string) => n[0]).join('')
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.email}</div>
                  </div>
                </div>
              )}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.userId ? '#ef4444' : state.isFocused ? '#14b8a6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                  '&:hover': {
                    borderColor: errors.userId ? '#ef4444' : '#14b8a6'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#14b8a6' : state.isFocused ? '#f0fdfa' : 'white',
                  color: state.isSelected ? 'white' : '#374151'
                })
              }}
            />
            {errors.userId && (
              <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
            )}
          </div>

          {/* Source Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groupe actuel *
            </label>
            <Select
              options={groupOptions}
              value={groupOptions.find(option => option.value === formData.sourceGroupId) || null}
              onChange={(selectedOption) => {
                handleInputChange('sourceGroupId', selectedOption?.value || '');
                // Reset target group if it's the same as source
                if (formData.targetGroupId === selectedOption?.value) {
                  handleInputChange('targetGroupId', '');
                }
              }}
              placeholder="Groupe de départ..."
              isLoading={isLoadingGroups}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              formatOptionLabel={(option: any) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="h-5 w-5 text-teal-600" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{option.memberCount} membres</span>
                </div>
              )}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.sourceGroupId ? '#ef4444' : state.isFocused ? '#14b8a6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                  '&:hover': {
                    borderColor: errors.sourceGroupId ? '#ef4444' : '#14b8a6'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#14b8a6' : state.isFocused ? '#f0fdfa' : 'white',
                  color: state.isSelected ? 'white' : '#374151'
                })
              }}
            />
            {errors.sourceGroupId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceGroupId}</p>
            )}
          </div>

          {/* Target Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau groupe *
            </label>
            <Select
              options={targetGroupOptions}
              value={targetGroupOptions.find(option => option.value === formData.targetGroupId) || null}
              onChange={(selectedOption) => handleInputChange('targetGroupId', selectedOption?.value || '')}
              placeholder="Groupe de destination..."
              isLoading={isLoadingGroups}
              isSearchable
              isDisabled={!formData.sourceGroupId}
              className="react-select-container"
              classNamePrefix="react-select"
              formatOptionLabel={(option: any) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{option.memberCount} membres</span>
                </div>
              )}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.targetGroupId ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                  '&:hover': {
                    borderColor: errors.targetGroupId ? '#ef4444' : '#3b82f6'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
                  color: state.isSelected ? 'white' : '#374151'
                })
              }}
            />
            {errors.targetGroupId && (
              <p className="mt-1 text-sm text-red-600">{errors.targetGroupId}</p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Attention</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce transfert déplacera le membre du groupe actuel vers le nouveau groupe. 
                  L'utilisateur perdra l'accès aux ressources spécifiques du groupe actuel.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.userId || !formData.sourceGroupId || !formData.targetGroupId}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 border border-transparent rounded-lg hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transfert en cours...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Confirmer le Transfert</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupTransferModal;