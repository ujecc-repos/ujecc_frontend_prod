import React, { useState, useMemo } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { useGetMinistriesByChurchQuery } from '../store/services/ministryApi';
import { useGetUserByTokenQuery } from '../store/services/authApi';
import 'react-datepicker/dist/react-datepicker.css';

interface CreateGroupFormData {
  name: string;
  description: string;
  minister: string;
  meetingDay: string;
  meetingTime: Date | null;
  meetingLocation: string;
  meetingFrequency: string;
  ageGroup: string;
  maxMembers: string;
  profileImage: File | null;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateGroupFormData) => void;
  isLoading: boolean;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateGroupFormData>({
    name: '',
    description: '',
    minister: '',
    meetingDay: '',
    meetingTime: null,
    meetingLocation: '',
    meetingFrequency: '',
    ageGroup: '',
    maxMembers: '',
    profileImage: null
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get user data and church ID for fetching ministries
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;
  
  // Fetch ministries for the church
  const { data: ministriesData } = useGetMinistriesByChurchQuery(churchId || '', { skip: !churchId });
  
  // Transform ministries data for react-select
  const ministryOptions = useMemo(() => {
    if (!ministriesData) return [];
    return ministriesData.map(ministry => ({
      value: ministry.name,
      label: ministry.name
    }));
  }, [ministriesData]);

  // Meeting frequency options
  const frequencyOptions = [
    { value: 'Chaque Jour', label: 'Chaque Jour' },
    { value: 'Chaque Semaine', label: 'Chaque Semaine' },
    { value: 'Chaque Mois', label: 'Chaque Mois' },
    { value: 'Chaque Année', label: 'Chaque Année' },
  ];

  // Meeting day options
  const dayOptions = [
    { value: 'Chaque Dimanche', label: 'Chaque Dimanche' },
    { value: 'Chaque Lundi', label: 'Chaque Lundi' },
    { value: 'Chaque Mardi', label: 'Chaque Mardi' },
    { value: 'Chaque Mercredi', label: 'Chaque Mercredi' },
    { value: 'Chaque Jeudi', label: 'Chaque Jeudi' },
    { value: 'Chaque Vendredi', label: 'Chaque Vendredi' },
    { value: 'Chaque Samedi', label: 'Chaque Samedi' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom du groupe est obligatoire';
    if (!formData.minister.trim()) newErrors.minister = 'Le ministère est obligatoire';
    
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
    setFormData({
      name: '',
      description: '',
      minister: '',
      meetingDay: '',
      meetingTime: null,
      meetingLocation: '',
      meetingFrequency: '',
      ageGroup: '',
      maxMembers: '',
      profileImage: null
    });
    setImagePreview(null);
    setErrors({});
    setActiveTab('basic');
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
          .date-picker-container .react-datepicker__time-container {
            border-left: 1px solid #d1d5db;
          }
          .date-picker-container .react-datepicker__time-list-item {
            padding: 8px 12px;
            font-size: 0.875rem;
          }
          .date-picker-container .react-datepicker__time-list-item:hover {
            background-color: #f3f4f6;
          }
          .date-picker-container .react-datepicker__time-list-item--selected {
            background-color: #14b8a6 !important;
            color: white !important;
          }
          .date-picker-container .react-datepicker__time-list-item--selected:hover {
            background-color: #0f766e !important;
          }
          .date-picker-container .react-datepicker__header {
            background-color: #14b8a6;
            border-bottom: 1px solid #14b8a6;
          }
          .date-picker-container .react-datepicker__header .react-datepicker__current-month {
            color: white;
            font-weight: 600;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Créer un Nouveau Groupe</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {[
            { key: 'basic', label: 'Informations de Base' },
            { key: 'meeting', label: 'Détails des Réunions' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Form Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-1 cursor-pointer hover:bg-teal-700">
                      <PhotoIcon className="h-4 w-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Groupe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nom du groupe"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Description du groupe"
                    />
                  </div>

                  {/* Ministry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ministère <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={ministryOptions.find(option => option.value === formData.minister) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, minister: selectedOption?.value || '' }))}
                      options={ministryOptions}
                      placeholder="Sélectionner un ministère"
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: errors.minister ? '#ef4444' : '#d1d5db',
                          '&:hover': {
                            borderColor: errors.minister ? '#ef4444' : '#d1d5db'
                          },
                          '&:focus-within': {
                            borderColor: '#14b8a6',
                            boxShadow: '0 0 0 1px #14b8a6'
                          }
                        })
                      }}
                    />
                    {errors.minister && <p className="mt-1 text-sm text-red-500">{errors.minister}</p>}
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tranche d'âge</label>
                    <input
                      type="text"
                      value={formData.ageGroup}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="ex: 18-25, Adultes, Enfants"
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
              {isLoading ? 'Création...' : 'Créer le Groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default CreateGroupModal;