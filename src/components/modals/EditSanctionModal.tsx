import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Sanction {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface EditSanctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sanctionData: any, sanctionId: string) => void;
  isLoading: boolean;
  sanction: Sanction | null;
}

export default function EditSanctionModal({ isOpen, onClose, onSubmit, isLoading, sanction }: EditSanctionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [_errors, setErrors] = useState<Record<string, string>>({});

  console.log(name, description, startDate, endDate)

  useEffect(() => {
    if (sanction) {
      setName(sanction.name || '');
      setDescription(sanction.description || '');
      
      // Format dates for input fields
      if (sanction.startDate) {
        const date = new Date(sanction.startDate);
        setStartDate(date.toISOString().split('T')[0]);
      }
      
      if (sanction.endDate) {
        const date = new Date(sanction.endDate);
        setEndDate(date.toISOString().split('T')[0]);
      }
      
      setStatus(sanction.status || 'active');
    }
  }, [sanction]);

  const resetForm = () => {
    if (!sanction) return;
    
    setName(sanction.name || '');
    setDescription(sanction.description || '');
    
    if (sanction.startDate) {
      const date = new Date(sanction.startDate);
      setStartDate(date.toISOString().split('T')[0]);
    } else {
      setStartDate('');
    }
    
    if (sanction.endDate) {
      const date = new Date(sanction.endDate);
      setEndDate(date.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
    
    setStatus(sanction.status || 'active');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    // Pas besoin de validation car seul le statut est modifiable
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !sanction) {
      return;
    }

    // Ne soumettre que le statut
    const sanctionData = {
      status,
    };

    onSubmit(sanctionData, sanction.id);
  };

  if (!sanction) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl rounded bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Modifier le statut de la sanction
            </Dialog.Title>
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
              >
                <option value="active">Active</option>
                <option value="pending">En cours</option>
                <option value="completed">Complété</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mise à jour en cours...' : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
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