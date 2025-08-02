import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import type { MultiValue } from 'react-select';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// Import API hooks
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetUsersByChurchQuery } from '../../store/services/authApi';
import { useCreateAppointmentMutation } from '../../store/services/appointmentApi';

const CreationRendezVous: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetUserByTokenQuery();
  const { data: users = [] } = useGetUsersByChurchQuery(currentUser?.church?.id || '', {
    skip: !currentUser?.church?.id,
  });
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation();

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    notes: '',
    date: new Date(),
    time: '',
    duration: '30',
    selectedUsers: [] as string[],
  });
  
  // User options for react-select
  const userOptions = users.map((user: any) => ({
    value: user.id,
    label: `${user.firstname} ${user.lastname}`
  }));

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationModal, setValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, date }));
    }
  };

  // Handle user selection with react-select
  interface SelectOption {
    value: string;
    label: string;
  }

  const handleUserSelection = (selectedOptions: MultiValue<SelectOption> | null) => {
    const selectedUserIds = selectedOptions ? selectedOptions.map((option: SelectOption) => option.value) : [];
    setFormData(prev => ({
      ...prev,
      selectedUsers: selectedUserIds
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const appointmentData = {
        name: formData.name,
        description: formData.description,
        visibility: formData.visibility,
        notes: formData.notes,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time,
        duration: formData.duration, // Keep as string to match API expectations
        userIds: formData.selectedUsers,
        churchId: currentUser?.church?.id || '',
      };

      await createAppointment(appointmentData).unwrap();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      const errorMsg = error.data?.message || 'Une erreur est survenue lors de la création du rendez-vous';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  // Handle next step
  const handleNext = () => {
    // Validation pour l'étape 1
    if (step === 1) {
      if (!formData.name) {
        setValidationMessage('Veuillez saisir un nom pour le rendez-vous');
        setValidationModal(true);
        return;
      }
      if (!formData.description) {
        setValidationMessage('Veuillez saisir une description pour le rendez-vous');
        setValidationModal(true);
        return;
      }
      if (!formData.visibility) {
        setValidationMessage('Veuillez sélectionner la visibilité du rendez-vous');
        setValidationModal(true);
        return;
      }
    }
    
    // Validation pour l'étape 2
    if (step === 2) {
      if (!formData.date) {
        setValidationMessage('Veuillez sélectionner une date pour le rendez-vous');
        setValidationModal(true);
        return;
      }
      if (!formData.time) {
        setValidationMessage('Veuillez sélectionner une heure pour le rendez-vous');
        setValidationModal(true);
        return;
      }
      if (!formData.duration) {
        setValidationMessage('Veuillez sélectionner une durée pour le rendez-vous');
        setValidationModal(true);
        return;
      }
    }
    
    // Validation pour l'étape 3
    if (step === 3) {
      if (formData.selectedUsers.length === 0) {
        setValidationMessage('Veuillez sélectionner au moins un participant');
        setValidationModal(true);
        return;
      }
      handleSubmit();
      return;
    }
    
    // Passer à l'étape suivante si toutes les validations sont passées
    setStep(step + 1);
  };

  // Handle previous step
  const handlePrevious = () => {
    setStep(step - 1);
  };

  // Define field types for type safety
  type FieldBase = {
    name: string;
    label: string;
    type: string;
    required: boolean;
  };

  type TextField = FieldBase & {
    type: 'text' | 'textarea' | 'time';
    placeholder: string;
    options?: Array<{ value: string; label: string }>;
  };

  type SelectField = FieldBase & {
    type: 'select';
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  };

  type DateField = FieldBase & {
    type: 'date';
    placeholder: string;
    options?: Array<{ value: string; label: string }>;
  };

  type UserSelectField = FieldBase & {
    type: 'userSelect';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  };

  type Field = TextField | SelectField | DateField | UserSelectField;

  type FormSection = {
    title: string;
    icon: React.ReactElement;
    fields: Field[];
  };

  // Define form sections
  const formSections: FormSection[] = [
    {
      title: 'Informations générales',
      icon: <DocumentTextIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        { name: 'name', label: 'Titre', type: 'text', placeholder: 'Titre du rendez-vous', required: true },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Description du rendez-vous', required: true },
        { name: 'visibility', label: 'Visibilité', type: 'select', options: [
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Privé' },
        ], placeholder: 'Sélectionner la visibilité', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes additionnelles', required: false },
      ],
    },
    {
      title: 'Date et heure',
      icon: <CalendarIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        { name: 'date', label: 'Date', type: 'date', placeholder: 'Date du rendez-vous', required: true },
        { name: 'time', label: 'Heure', type: 'time', placeholder: 'Heure du rendez-vous', required: true },
        { name: 'duration', label: 'Durée (minutes)', type: 'select', options: [
          { value: '15', label: '15 minutes' },
          { value: '30', label: '30 minutes' },
          { value: '45', label: '45 minutes' },
          { value: '60', label: '1 heure' },
          { value: '90', label: '1 heure 30 minutes' },
          { value: '120', label: '2 heures' },
        ], placeholder: 'Sélectionner une durée', required: true },
      ],
    },
    {
      title: 'Participants',
      icon: <UserGroupIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        { name: 'selectedUsers', label: 'Sélectionner les participants', type: 'userSelect', required: false, placeholder: 'Sélectionner des participants...' },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Removed ToastContainer */}
      
      {/* Back button */}
      <button
        onClick={() => navigate('/tableau-de-bord/admin/rendez-vous')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-1" />
        Retour aux rendez-vous
      </button>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Créer un nouveau rendez-vous</h1>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {formSections.map((section, index) => (
            <div key={index} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${step > index + 1 ? 'bg-teal-500' : step === index + 1 ? 'bg-teal-500' : 'bg-gray-200'}`}
                >
                  {step > index + 1 ? (
                    <CheckIcon className="h-6 w-6 text-white" />
                  ) : (
                    <span className={`text-sm font-medium ${step === index + 1 ? 'text-white' : 'text-gray-500'}`}>{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium mt-2 text-gray-700">{section.title}</span>
              </div>
              {index < formSections.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200">
                  {step > index + 1 && <div className="h-full bg-teal-500" />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center mb-6">
          {formSections[step - 1].icon}
          <h2 className="text-xl font-semibold text-gray-900 ml-2">{formSections[step - 1].title}</h2>
        </div>

        <div className="space-y-6">
          {formSections[step - 1].fields.map((field, index) => (
            <div key={index} className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof typeof formData] as string}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof typeof formData] as string}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={field.required}
                />
              )}
              
              {field.type === 'select' && (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof typeof formData] as string}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={field.required}
                >
                  {(field as SelectField).placeholder && (
                    <option value="" disabled>{(field as SelectField).placeholder}</option>
                  )}
                  {(field as SelectField).options.map((option: { value: string; label: string }, idx: number) => (
                    <option key={idx} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'date' && (
                <div className="relative date-picker-container">
                  <DatePicker
                    selected={formData.date}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={field.required}
                    placeholderText={field.placeholder}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              )}
              
              {field.type === 'time' && (
                <div className="relative">
                  <input
                    type="time"
                    id={field.name}
                    name={field.name}
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder={field.placeholder}
                    required={field.required}
                    style={{ paddingRight: '2.5rem' }} /* Ajout d'un padding à droite pour éviter que l'icône ne couvre le sélecteur */
                  />
              
                </div>
              )}
              
              {field.type === 'userSelect' && (
                <div>
                  <Select<SelectOption, true>
                    isMulti
                    options={userOptions}
                    value={userOptions.filter(option => formData.selectedUsers.includes(option.value))}
                    onChange={handleUserSelection}
                    placeholder={field.placeholder || "Sélectionner des participants..."}
                    noOptionsMessage={() => "Aucun utilisateur trouvé"}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#14b8a6' : '#d1d5db',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(20, 184, 166, 0.3)' : 'none',
                        '&:hover': {
                          borderColor: '#14b8a6'
                        }
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#14b8a6' : state.isFocused ? '#e6fffa' : 'white',
                        color: state.isSelected ? 'white' : '#374151'
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#e6fffa',
                        borderRadius: '0.375rem'
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: '#0f766e',
                        fontWeight: 500
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: '#0f766e',
                        ':hover': {
                          backgroundColor: '#14b8a6',
                          color: 'white'
                        }
                      })
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.selectedUsers.length} participant(s) sélectionné(s)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={step === 1}
          className={`px-6 py-2 rounded-md text-sm font-medium ${step === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Précédent
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement...
            </span>
          ) : step === 3 ? 'Créer le rendez-vous' : 'Suivant'}
        </button>
      </div>

      {/* Modal de succès */}
      <Dialog open={showSuccessModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="h-10 w-10 text-green-500" />
              </div>
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                Rendez-vous créé avec succès
              </Dialog.Title>
              <p className="text-sm text-gray-500 text-center mb-6">
                Le rendez-vous a été créé avec succès dans le système.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/tableau-de-bord/admin/rendez-vous')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Retour à la liste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Créer un autre
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal d'erreur */}
      <Dialog open={showErrorModal} onClose={() => setShowErrorModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XMarkIcon className="h-10 w-10 text-red-500" />
              </div>
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                Erreur
              </Dialog.Title>
              <p className="text-sm text-gray-500 text-center mb-6">
                {errorMessage || 'Une erreur est survenue lors de la création du rendez-vous.'}
              </p>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Fermer
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de validation */}
      <Transition appear show={validationModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setValidationModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full shadow-xl">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XMarkIcon className="h-10 w-10 text-red-500" />
                  </div>
                  <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                    Champ requis
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    {validationMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setValidationModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Styles pour le DatePicker et react-select */}
      <style>
        {`.date-picker-container .react-datepicker-wrapper {
          width: 100%;
        }
        .date-picker-container .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
        }
        .react-datepicker__input-container input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.3);
          border-color: #14b8a6;
        }
        .react-select-container {
          width: 100%;
        }
        .react-select__control {
          border-radius: 0.375rem;
          min-height: 38px;
        }
        .react-select__menu {
          border-radius: 0.375rem;
          z-index: 100;
        }`}
      </style>
    </div>
  );
};

export default CreationRendezVous;