import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startPeriode?: string;
  endPeriode?: string;
  location?: string;
  churchId: string;
  church?: any;
  attendees?: any[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  isRecurring?: boolean;
  frequency?: string
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any, eventId: string) => void;
  isLoading: boolean;
  event: Event | null;
}

export default function EditEventModal({ isOpen, onClose, onSubmit, isLoading, event }: EditEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startPeriode, setStartPeriode] = useState('');
  const [endPeriode, setEndPeriode] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [status, setStatus] = useState('upcoming');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      
      // Format dates for input fields
      if (event.startDate) {
        const date = new Date(event.startDate);
        setStartDate(date.toISOString().split('T')[0]);
      }
      
      if (event.endDate) {
        const date = new Date(event.endDate);
        setEndDate(date.toISOString().split('T')[0]);
      }
      
      setStartPeriode(event.startPeriode || '');
      setEndPeriode(event.endPeriode || '');
      setIsRecurring(event.isRecurring || false);
      setFrequency(event.frequency || 'weekly');
      setStatus(event.status || 'upcoming');
    }
  }, [event]);

  const resetForm = () => {
    if (!event) return;
    
    setTitle(event.title || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    
    if (event.startDate) {
      const date = new Date(event.startDate);
      setStartDate(date.toISOString().split('T')[0]);
    } else {
      setStartDate('');
    }
    
    if (event.endDate) {
      const date = new Date(event.endDate);
      setEndDate(date.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
    
    setStartPeriode(event.startPeriode || '');
    setEndPeriode(event.endPeriode || '');
    setIsRecurring(event.isRecurring || false);
    setFrequency(event.frequency || 'weekly');
    setStatus(event.status || 'upcoming');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (isRecurring && !frequency) {
      newErrors.frequency = 'La fréquence est requise pour un événement récurrent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !event) {
      return;
    }

    const eventData = {
      title,
      description,
      location,
      startDate,
      endDate: endDate || startDate, // If no end date, use start date
      startPeriode,
      endPeriode,
      isRecurring,
      frequency: isRecurring ? frequency : null,
      status,
    };

    onSubmit(eventData, event.id);
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl rounded bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Modifier l'événement
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
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titre *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Date de début *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startPeriode" className="block text-sm font-medium text-gray-700">
                  Heure de début
                </label>
                <input
                  type="time"
                  id="startPeriode"
                  value={startPeriode}
                  onChange={(e) => setStartPeriode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="endPeriode" className="block text-sm font-medium text-gray-700">
                  Heure de fin
                </label>
                <input
                  type="time"
                  id="endPeriode"
                  value={endPeriode}
                  onChange={(e) => setEndPeriode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Lieu
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="upcoming">À venir</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                Événement récurrent
              </label>
            </div>

            {isRecurring && (
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                  Fréquence
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.frequency ? 'border-red-500' : ''}`}
                >
                  <option value="quotidien">Quotidien</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="annuel">Annuel</option>
                </select>
                {errors.frequency && <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>}
              </div>
            )}

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