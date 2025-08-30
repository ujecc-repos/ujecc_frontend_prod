import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import {
  useGetTimotheesByChurchQuery,
  useGetUsersByChurchQuery,
  useConnectTitheMutation,
  useGetUserByTokenQuery
} from '../store/services/authApi';

interface ConnectTitheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function ConnectTitheModal({ isOpen, onClose, onSuccess }: ConnectTitheModalProps) {
  const [selectedTimothee, setSelectedTimothee] = useState<SingleValue<SelectOption>>(null);
  const [selectedTithe, setSelectedTithe] = useState<SingleValue<SelectOption>>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  // Fetch data
  const { data: timotheesData, isLoading: isTimotheesLoading } = useGetTimotheesByChurchQuery(churchId || '', { skip: !churchId });
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersByChurchQuery(churchId || '', { skip: !churchId });
  
  // Connect tithe mutation
  const [connectTithe] = useConnectTitheMutation();

  // Transform data for react-select
  const timotheeOptions: SelectOption[] = timotheesData?.map(timothee => ({
    value: timothee.id,
    label: `${timothee.firstname} ${timothee.lastname}`
  })) || [];

  // Filter users who are not Timothees and don't already have a Timothee assigned
  const titheOptions: SelectOption[] = usersData?.filter(user => 
    !user.istimothee && !user.timothee
  ).map(user => ({
    value: user.id,
    label: `${user.firstname} ${user.lastname}`
  })) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTimothee || !selectedTithe) {
      alert('Veuillez sélectionner un Timothée et une personne à connecter.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await connectTithe({
        titheId: selectedTithe.value,
        timotheeId: selectedTimothee.value
      }).unwrap();
      
      // Reset form
      setSelectedTimothee(null);
      setSelectedTithe(null);
      
      // Show success message
      alert('Connexion réussie! La personne a été assignée au Timothée.');
      
      // Call success callback and close modal
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error connecting tithe:', error);
      const errorMessage = error?.data?.message || 'Erreur lors de la connexion. Veuillez réessayer.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedTimothee(null);
      setSelectedTithe(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Connecter une personne à un Timothée
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Timothee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un Timothée *
            </label>
            <Select
              value={selectedTimothee}
              onChange={setSelectedTimothee}
              options={timotheeOptions}
              placeholder="Choisir un Timothée..."
              isLoading={isTimotheesLoading}
              isDisabled={isSubmitting}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "Aucun Timothée trouvé"}
            />
          </div>

          {/* Tithe User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une personne (Tite) *
            </label>
            <Select
              value={selectedTithe}
              onChange={setSelectedTithe}
              options={titheOptions}
              placeholder="Choisir une personne..."
              isLoading={isUsersLoading}
              isDisabled={isSubmitting}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "Aucune personne disponible"}
            />
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Seules les personnes qui ne sont pas déjà des Timothées et qui n'ont pas encore été assignées à un Timothée sont disponibles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedTimothee || !selectedTithe}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Connexion...' : 'Connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}