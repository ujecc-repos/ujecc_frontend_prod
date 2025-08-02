import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ArrowRightIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import Select from 'react-select';
import { useGetChurchesQuery } from '../store/services/churchApi';
import { useGetUserByTokenQuery } from '../store/services/authApi';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  picture?: string;
  role?: string;
}

interface TransferMemberFormData {
  toChurchId: string;
  type: string;
  reason?: string;
}

interface TransferMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSubmit: (formData: TransferMemberFormData) => void;
  isLoading: boolean;
}

const TransferMemberModal: React.FC<TransferMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<TransferMemberFormData>({
    toChurchId: '',
    type: 'transfer',
    reason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current user data to get the current church
  const { data: userData } = useGetUserByTokenQuery();
  const currentChurchId = userData?.church?.id;
  const currentChurchName = userData?.church?.name;

  // Fetch all churches for the dropdown
  const { data: churchesData, isLoading: isChurchesLoading } = useGetChurchesQuery();

  // Filter out the current church from the options
  const churchOptions = useMemo(() => {
    if (!churchesData || !currentChurchId) return [];
    return churchesData
      .filter(church => church.id !== currentChurchId)
      .map(church => ({
        value: church.id,
        label: church.name
      }));
  }, [churchesData, currentChurchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.toChurchId) {
      newErrors.toChurchId = 'Veuillez sélectionner une église de destination';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof TransferMemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleChurchSelect = (selectedOption: any) => {
    handleInputChange('toChurchId', selectedOption?.value || '');
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ArrowRightIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Transférer le Membre</h3>
                <p className="text-blue-100 text-sm">Transférer vers une autre église</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Member Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {member.picture ? (
                <img
                  src={`https://api.ujecc.org${member.picture}`}
                  alt={`${member.firstname} ${member.lastname}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                `${member.firstname?.[0] || ''}${member.lastname?.[0] || ''}`
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {member.firstname} {member.lastname}
              </h4>
              <p className="text-gray-600">{member.email}</p>
              <p className="text-sm text-gray-500">
                Rôle: <span className="font-medium">{member.role || 'Membre'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Info */}
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Église actuelle</p>
                <p className="text-blue-600 font-semibold">{currentChurchName}</p>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-gray-400" />
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Église de destination</p>
                <p className="text-purple-600 font-semibold">
                  {formData.toChurchId ? 
                    churchOptions.find(option => option.value === formData.toChurchId)?.label || 'Sélectionnée'
                    : 'À sélectionner'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Church Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Église de destination *
            </label>
            <Select
              options={churchOptions}
              value={churchOptions.find(option => option.value === formData.toChurchId) || null}
              onChange={handleChurchSelect}
              placeholder="Sélectionner une église..."
              isLoading={isChurchesLoading}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.toChurchId ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                  '&:hover': {
                    borderColor: errors.toChurchId ? '#ef4444' : '#3b82f6'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
                  color: state.isSelected ? 'white' : '#374151'
                })
              }}
            />
            {errors.toChurchId && (
              <p className="mt-1 text-sm text-red-600">{errors.toChurchId}</p>
            )}
          </div>

          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de transfert
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="transfer">Transfert standard</option>
              <option value="temporary">Transfert temporaire</option>
              <option value="permanent">Transfert permanent</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du transfert (optionnel)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
              placeholder="Expliquez la raison du transfert..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Attention</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce transfert déplacera définitivement le membre vers l'église sélectionnée. 
                  Cette action nécessitera une validation de l'église de destination.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.toChurchId}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
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

export default TransferMemberModal;