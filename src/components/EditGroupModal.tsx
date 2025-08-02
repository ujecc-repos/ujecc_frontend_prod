import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Group {
  id: string;
  name: string;
  description?: string;
  church?: any;
  users?: any[];
  ageGroup: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
  meetingFrequency?: string;
  maxMembers?: string;
  minister?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  minister: string;
  ageGroup: string;
  maxMembers: string;
  meetingDay: string;
  meetingTime: Date | null;
  meetingLocation: string;
  meetingFrequency: string;
  profileImage: File | null;
}

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
  group: Group | null;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, onSubmit, isLoading, group }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'meeting'>('info');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    minister: '',
    ageGroup: '',
    maxMembers: '',
    meetingDay: '',
    meetingTime: null,
    meetingLocation: '',
    meetingFrequency: '',
    profileImage: null
  });

  // Options for dropdowns
  const frequencyOptions = [
    {value: "quotidien", label: "Quotidien"},
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: "annuel", label: "Annuel"}
  ];

  const dayOptions = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
    { value: 'dimanche', label: 'Dimanche' }
  ];

  // Initialize form data when group data is available
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        minister: group.minister || '',
        ageGroup: group.ageGroup || '',
        maxMembers: group.maxMembers || '',
        meetingDay: group.meetingDay || '',
        meetingTime: group.meetingTime ? new Date(`2000-01-01T${group.meetingTime}`) : null,
        meetingLocation: group.meetingLocation || '',
        meetingFrequency: group.meetingFrequency || '',
        profileImage: null
      });

      // Set image preview if group has a picture
      if (group.picture) {
        setImagePreview(group.picture);
      }
    }
  }, [group]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est requis';
    }
    
    if (!formData.ageGroup.trim()) {
      newErrors.ageGroup = 'La tranche d\'âge est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        minister: group.minister || '',
        ageGroup: group.ageGroup || '',
        maxMembers: group.maxMembers || '',
        meetingDay: group.meetingDay || '',
        meetingTime: group.meetingTime ? new Date(`2000-01-01T${group.meetingTime}`) : null,
        meetingLocation: group.meetingLocation || '',
        meetingFrequency: group.meetingFrequency || '',
        profileImage: null
      });

      // Reset image preview to group's picture
      if (group.picture) {
        setImagePreview(group.picture);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        minister: '',
        ageGroup: '',
        maxMembers: '',
        meetingDay: '',
        meetingTime: null,
        meetingLocation: '',
        meetingFrequency: '',
        profileImage: null
      });
      setImagePreview(null);
    }
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .date-picker-container .react-datepicker-wrapper {
            width: 100%;
          }
          .date-picker-container .react-datepicker__input-container {
            width: 100%;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl transform transition-all w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Modifier le Groupe</h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'info' ? 'text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('info')}
            >
              Informations de Base
            </button>
            <button
              type="button"
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'meeting' ? 'text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('meeting')}
            >
              Détails des Réunions
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
            {/* Basic Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Group Image */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Group preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400 text-4xl">G</div>
                    )}
                  </div>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer">
                    <span>Changer l'image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du groupe <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="ex: Groupe de louange, Ministère des jeunes"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tranche d'âge <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.ageGroup}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                      className={`w-full px-3 py-2 border ${errors.ageGroup ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="ex: 18-25 ans, Adultes, Enfants"
                    />
                    {errors.ageGroup && <p className="mt-1 text-sm text-red-500">{errors.ageGroup}</p>}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Description du groupe et de ses activités"
                    />
                  </div>

                  {/* Minister */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
                    <input
                      type="text"
                      value={formData.minister}
                      onChange={(e) => setFormData(prev => ({ ...prev, minister: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Nom du responsable"
                    />
                  </div>

                  {/* Max Members */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre maximum de membres</label>
                    <input
                      type="number"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Nombre maximum (optionnel)"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Details Tab */}
            {activeTab === 'meeting' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Meeting Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure de réunion</label>
                    <div className="date-picker-container">
                      <DatePicker
                        selected={formData.meetingTime}
                        onChange={(time) => setFormData(prev => ({ ...prev, meetingTime: time }))}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Heure"
                        dateFormat="HH:mm"
                        placeholderText="Sélectionner l'heure"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Meeting Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de réunion</label>
                    <input
                      type="text"
                      value={formData.meetingLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="ex: Salle de fellowship, Église principale"
                    />
                  </div>

                  {/* Meeting Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence des réunions</label>
                    <Select
                      value={frequencyOptions.find(option => option.value === formData.meetingFrequency) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, meetingFrequency: selectedOption?.value || '' }))}
                      options={frequencyOptions}
                      placeholder="Sélectionner la fréquence"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 1px #14b8a6'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Meeting Day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jour de réunion</label>
                    <Select
                      value={dayOptions.find(option => option.value === formData.meetingDay) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, meetingDay: selectedOption?.value || '' }))}
                      options={dayOptions}
                      placeholder="Sélectionner le jour"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 1px #14b8a6'
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditGroupModal;