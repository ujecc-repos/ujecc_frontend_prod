import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useCreateSundayClassMutation } from '../../store/services/sundayClassApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { toast } from 'react-toastify';

interface CreateSundayClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateSundayClassModal({ isOpen, onClose, onSuccess }: CreateSundayClassModalProps) {
  const { data: userData } = useGetUserByTokenQuery();
  const [createSundayClass, { isLoading }] = useCreateSundayClassMutation();
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    teacher: '',
    ageGroup: '',
    startTime: '',
    endTime: '',
    location: '',
    book: '',
    maxStudents: '',
    description: '',
    churchId: userData?.church?.id || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      nom: '',
      teacher: '',
      ageGroup: '',
      startTime: '',
      endTime: '',
      location: '',
      book: '',
      maxStudents: '',
      description: '',
      churchId: userData?.church?.id || ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la classe est requis';
    }
    
    if (!formData.teacher.trim()) {
      newErrors.teacher = "Le nom du moniteur est requis";
    }
    
    if (!formData.ageGroup) {
      newErrors.ageGroup = "Le groupe d'âge est requis";
    }
    
    if (!formData.startTime) {
      newErrors.startTime = "L'heure de début est requise";
    }
    
    if (!formData.endTime) {
      newErrors.endTime = "L'heure de fin est requise";
    }
    
    if (!formData.maxStudents) {
      newErrors.maxStudents = "Le nombre maximum d'étudiants est requis";
    } else if (isNaN(Number(formData.maxStudents)) || Number(formData.maxStudents) <= 0) {
      newErrors.maxStudents = "Veuillez entrer un nombre valide supérieur à 0";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Ensure churchId is set
    if (!formData.churchId && userData?.church?.id) {
      setFormData(prev => ({
        ...prev,
        churchId: userData.church.id
      }));
    }
    
    try {
      await createSundayClass(formData).unwrap();
      toast.success('Classe créée avec succès!');
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create Sunday class:', error);
      toast.error('Erreur lors de la création de la classe');
    }
  };

  // Age group options
  const ageGroups = [
    '3-5 ans',
    '6-8 ans',
    '9-11 ans',
    '12-14 ans',
    '15-17 ans',
    'Adultes'
  ];

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Créer une nouvelle classe
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Class Name */}
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la classe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${errors.nom ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                  placeholder="Ex: Classe des petits"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>

              {/* Teacher */}
              <div>
                <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
                  Moniteur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="teacher"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${errors.teacher ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                  placeholder="Nom Du Moniteur"
                />
                {errors.teacher && <p className="mt-1 text-sm text-red-600">{errors.teacher}</p>}
              </div>

              {/* Age Group */}
              <div>
                <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  Groupe d'âge <span className="text-red-500">*</span>
                </label>
                <select
                  id="ageGroup"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${errors.ageGroup ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                >
                  <option value="">Sélectionner un groupe d'âge</option>
                  {ageGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {errors.ageGroup && <p className="mt-1 text-sm text-red-600">{errors.ageGroup}</p>}
              </div>

              {/* Max Students */}
              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre maximum d'étudiants <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  min="1"
                  value={formData.maxStudents}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${errors.maxStudents ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                />
                {errors.maxStudents && <p className="mt-1 text-sm text-red-600">{errors.maxStudents}</p>}
              </div>

              {/* Time Range */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className={`block w-full rounded-md border ${errors.startTime ? 'border-red-300' : 'border-gray-300'} shadow-sm pl-10 py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                    />
                  </div>
                  {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
                </div>
                <div className="flex-1">
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className={`block w-full rounded-md border ${errors.endTime ? 'border-red-300' : 'border-gray-300'} shadow-sm pl-10 py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                    />
                  </div>
                  {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="Salle, bâtiment, etc."
                />
              </div>

              {/* Book */}
              <div>
                <label htmlFor="book" className="block text-sm font-medium text-gray-700 mb-1">
                  Livre/Matériel
                </label>
                <input
                  type="text"
                  id="book"
                  name="book"
                  value={formData.book}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="Titre du livre ou matériel utilisé"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`block w-full rounded-md border ${errors.description ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
                placeholder="Décrivez brièvement cette classe et son contenu..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  'Créer la classe'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}