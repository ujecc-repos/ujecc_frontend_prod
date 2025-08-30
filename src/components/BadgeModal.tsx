import React from 'react';
import { XMarkIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import BadgeGenerator from './BadgeGenerator';
import { useGetUserByTokenQuery } from '../store/services/authApi';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
  nif?: string;
  picture?: string;
}

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  churchData?: {
    name?: string;
    address?: string;
    phone?: string;
    pastorName?: string;
  };
}

const BadgeModal: React.FC<BadgeModalProps> = ({
  isOpen,
  onClose,
  member,
  churchData
}) => {
  if (!isOpen || !member) return null;

  const handleBadgeGenerated = () => {
    // Optional: Show success message or close modal
    console.log('Badge generated successfully!');
  };

  const { data: userData } = useGetUserByTokenQuery();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <IdentificationIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Créer Badge</h3>
              <p className="text-sm text-gray-600">
                {member.firstname} {member.lastname}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Prévisualisez et téléchargez le badge pour ce membre. Le badge sera généré au format PNG.
            </p>
          </div>

          <BadgeGenerator
            member={member}
            churchName={churchData?.name}
            churchAddress={`${userData?.church?.address}`}
            churchPhone={`${userData?.church?.phone}`}
            pastorName={`${userData?.church?.mainPasteur}`}
            onBadgeGenerated={handleBadgeGenerated}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeModal;