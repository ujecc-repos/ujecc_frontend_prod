import React, { useState } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
}

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onRoleChange: (memberId: string, newRole: string) => void;
}

const roleOptions = [
  { value: 'Membre', label: 'Membre' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Directeur', label: 'Directeur' },
  { value: 'SuperAdmin', label: 'SuperAdmin' }
];

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  member,
  onRoleChange
}) => {
  const [selectedRole, setSelectedRole] = useState<{ value: string; label: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (member && isOpen) {
      const currentRole = roleOptions.find(option => option.value === member.role) || roleOptions[0];
      setSelectedRole(currentRole);
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !selectedRole) return;

    setIsLoading(true);
    try {
      await onRoleChange(member.id, selectedRole.value);
      onClose();
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Changer le rôle</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-1">
                {member.firstname} {member.lastname}
              </h4>
              <p className="text-sm text-gray-600">{member.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Rôle actuel: <span className="font-medium">{member.role || 'Membre'}</span>
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau rôle
            </label>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              options={roleOptions}
              placeholder="Sélectionner un rôle"
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: '#d1d5db',
                  '&:hover': {
                    borderColor: '#3b82f6'
                  },
                  '&:focus-within': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6'
                  }
                })
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedRole || selectedRole.value === member.role}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Modification...' : 'Modifier le rôle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;