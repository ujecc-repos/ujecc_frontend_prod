import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useCreateSundayClassMutation } from '../../store/services/sundayClassApi';

export default function CreateSundayClass() {
  const navigate = useNavigate();
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;
  
  const [createSundayClass, { isLoading }] = useCreateSundayClassMutation();
  
  const [formData, setFormData] = useState({
    nom: '',
    teacher: '',
    ageGroup: 'Enfants (3-12 ans)',
    startTime: '09:00',
    endTime: '10:30',
    book: '',
    location: '',
    maxStudents: '20',
    description: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ageGroups = [
    'Enfants (3-12 ans)',
    'Adolescents (13-17 ans)',
    'Jeunes (18-30 ans)',
    'Adultes (31+ ans)'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la classe est requis';
    }
    
    if (!formData.teacher.trim()) {
      newErrors.teacher = 'Le nom de l\'enseignant est requis';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'L\'heure de début est requise';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'L\'heure de fin est requise';
    }
    
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début';
    }
    
    if (!formData.maxStudents || parseInt(formData.maxStudents) <= 0) {
      newErrors.maxStudents = 'Le nombre maximum d\'étudiants doit être supérieur à 0';
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
    
    if (!churchId) {
      setErrors({ general: 'ID de l\'église non disponible. Veuillez vous reconnecter.' });
      return;
    }
    
    try {
      await createSundayClass({
        ...formData,
        churchId,
      }).unwrap();
      
      // Show success message
      alert('Classe créée avec succès!');
      
      // Navigate back to the Sunday classes list
      navigate('/admin/ecole-du-dimanche');
    } catch (error: any) {
      console.error('Failed to create Sunday class:', error);
      setErrors({
        general: error.data?.message || 'Une erreur est survenue lors de la création de la classe'
      });
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/ecole-du-dimanche')}
            className="mr-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Créer une nouvelle classe</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.general && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className={`block w-full rounded-md border ${errors.nom ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
          </div>

          {/* Teacher */}
          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
              Enseignant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="teacher"
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
              className={`block w-full rounded-md border ${errors.teacher ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
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
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {ageGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
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
              className={`block w-full rounded-md border ${errors.maxStudents ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
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
                  className={`block w-full rounded-md border ${errors.startTime ? 'border-red-300' : 'border-gray-300'} shadow-sm pl-10 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
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
                  className={`block w-full rounded-md border ${errors.endTime ? 'border-red-300' : 'border-gray-300'} shadow-sm pl-10 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
              </div>
              {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
            </div>
          </div>

          {/* Location */}
          {/* <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lieu
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Salle, bâtiment, etc."
            />
          </div> */}

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
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className={`block w-full rounded-md border ${errors.description ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            placeholder="Décrivez brièvement cette classe et son contenu..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/ecole-du-dimanche')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}