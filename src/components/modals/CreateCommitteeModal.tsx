import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateCommitteeMutation } from '../../store/services/committeeApi';

interface CreateCommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  onSuccess?: () => void;
}

export default function CreateCommitteeModal({ isOpen, onClose, churchId, onSuccess }: CreateCommitteeModalProps) {
  const [createCommittee, { isLoading }] = useCreateCommitteeMutation();
  
  // Form state
  const [comiteeName, setComiteeName] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [leaderIds, setLeaderIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setComiteeName('');
    setDescription('');
    setMeetingDay('');
    setMeetingTime('');
    setLeaderIds([]);
    setMemberIds([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!comiteeName.trim()) {
      newErrors.comiteeName = 'Le nom du comité est requis';
    }

    if (!meetingDay) {
      newErrors.meetingDay = 'Le jour de réunion est requis';
    }

    if (!meetingTime) {
      newErrors.meetingTime = "L'heure de réunion est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const committeeData = {
      comiteeName,
      description,
      meetingDay,
      meetingTime,
      leaderIds,
      memberIds,
      churchId
    };

    try {
      await createCommittee(committeeData).unwrap();
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create committee:', error);
      // Handle API errors here
    }
  };

  // Days of the week options
  const daysOfWeek = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
  ];

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl rounded bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Créer un nouveau comité
            </Dialog.Title>
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="comiteeName" className="block text-sm font-medium text-gray-700">
                Nom du comité *
              </label>
              <input
                type="text"
                id="comiteeName"
                value={comiteeName}
                placeholder="Nom du comité"
                onChange={(e) => setComiteeName(e.target.value)}
                className={`mt-1 py-2 outline-none px-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.comiteeName ? 'border-red-500' : ''}`}
              />
              {errors.comiteeName && <p className="mt-1 text-sm text-red-600">{errors.comiteeName}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                placeholder="Description"
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 outline-none px-2 py-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="meetingDay" className="block text-sm font-medium text-gray-700">
                  Jour de réunion *
                </label>
                <select
                  id="meetingDay"
                  value={meetingDay}
                  onChange={(e) => setMeetingDay(e.target.value)}
                  className={`mt-1 px-2 outline-none block py-2 w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.meetingDay ? 'border-red-500' : ''}`}
                >
                  <option value="">Sélectionner un jour</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                {errors.meetingDay && <p className="mt-1 text-sm text-red-600">{errors.meetingDay}</p>}
              </div>

              <div>
                <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700">
                  Heure de réunion *
                </label>
                <input
                  type="time"
                  id="meetingTime"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className={`mt-1 outline-none px-2 block w-full rounded-md border-gray-300 shadow-sm py-2 focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.meetingTime ? 'border-red-500' : ''}`}
                />
                {errors.meetingTime && <p className="mt-1 text-sm text-red-600">{errors.meetingTime}</p>}
              </div>
            </div>

            {/* Note: Member and leader selection would typically be implemented here */}
            {/* This would require fetching church members from an API and implementing a multi-select component */}
            {/* For simplicity, we're omitting this part in this implementation */}

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Création en cours...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}