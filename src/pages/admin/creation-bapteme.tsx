import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ArrowLeftIcon, DocumentIcon, UserIcon, CalendarIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useCreateBaptismMutation } from '../../store/services/baptismApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import moment from 'moment';

// Interface pour définir la structure d'une section de formulaire
interface FormSection {
  title: string;
  icon: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'file' | 'checkbox';
    placeholder: string;
    required?: boolean;
    accept?: string;
    dependsOn?: string;
  }[];
}

export default function CreationBapteme() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Récupération des données utilisateur et de l'église
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';
  
  // Mutation pour créer un baptême
  const [createBaptism] = useCreateBaptismMutation();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: null as Date | null,
    placeOfBirth: '',
    conversionDate: null as Date | null,
    testimony: '',
    previousChurch: '',
    isCatechumene: false,
    catechumeneStartDate: null as Date | null,
    catechumeneEndDate: null as Date | null,
    baptismDate: null as Date | null,
    baptismLocation: '',
    officiantName: '',
    withness: '',
    baptismCertificate: null as File | null,
  });

  // Fonction pour gérer les changements dans les champs textuels et dates
  const handleInputChange = (name: string, value: string | Date | File | boolean | null) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  // Fonction pour gérer le téléchargement de documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newErrors = { ...errors };
      
      // Vérifier le type de fichier (PDF uniquement)
      if (file.type !== 'application/pdf') {
        newErrors[fieldName] = 'Seuls les fichiers PDF sont acceptés.';
        setErrors(newErrors);
        e.target.value = '';
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        newErrors[fieldName] = 'La taille du fichier ne doit pas dépasser 5MB.';
        setErrors(newErrors);
        e.target.value = '';
        return;
      }
      
      // Effacer l'erreur si le fichier est valide
      if (errors[fieldName]) {
        delete newErrors[fieldName];
        setErrors(newErrors);
      }
      
      handleInputChange(fieldName, file);
    }
  };

  // Fonction pour valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validation générale selon l'étape actuelle
    if (currentStep === 0) {
      // Validation des informations personnelles
      if (!formData.fullName) {
        newErrors.fullName = 'Le nom complet est requis.';
      } else if (formData.fullName.length < 2) {
        newErrors.fullName = 'Le nom complet doit contenir au moins 2 caractères.';
      }
      
      if (!formData.birthDate) {
        newErrors.birthDate = 'La date de naissance est requise.';
      }
      
      if (!formData.placeOfBirth) {
        newErrors.placeOfBirth = 'Le lieu de naissance est requis.';
      }
    } else if (currentStep === 1) {
      // Validation des informations religieuses
      if (!formData.conversionDate) {
        newErrors.conversionDate = 'La date de conversion est requise.';
      }
      
      if (!formData.testimony) {
        newErrors.testimony = 'Le témoignage est requis.';
      }
      
      // Validation conditionnelle pour catéchumène
      if (formData.isCatechumene && !formData.catechumeneStartDate) {
        newErrors.catechumeneStartDate = 'La date de début de catéchuménat est requise.';
      }
    } else if (currentStep === 2) {
      // Validation des informations du baptême
      if (!formData.baptismDate) {
        newErrors.baptismDate = 'La date du baptême est requise.';
      }
      
      if (!formData.baptismLocation) {
        newErrors.baptismLocation = 'Le lieu du baptême est requis.';
      }
      
      if (!formData.officiantName) {
        newErrors.officiantName = 'Le nom de l\'officiant est requis.';
      }
      
      if (!formData.withness) {
        newErrors.withness = 'Le nom du témoin est requis.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction pour passer à l'étape suivante
  const handleNext = () => {
    if (validateForm()) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Fonction pour revenir à l'étape précédente
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Création d'un objet FormData pour l'envoi des fichiers
      const formDataToSend = new FormData();
      
      // Ajout des champs textuels
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('birthDate', formData.birthDate ? moment(formData.birthDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('placeOfBirth', formData.placeOfBirth);
      formDataToSend.append('conversionDate', formData.conversionDate ? moment(formData.conversionDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('testimony', formData.testimony);
      formDataToSend.append('previousChurch', formData.previousChurch || '');
      formDataToSend.append('baptismDate', formData.baptismDate ? moment(formData.baptismDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('baptismLocation', formData.baptismLocation);
      formDataToSend.append('officiantName', formData.officiantName);
      formDataToSend.append('withness', formData.withness);
      formDataToSend.append('churchId', churchId);
      formDataToSend.append('isCatechumene', formData.isCatechumene ? 'true' : 'false');
      
      // Ajout des champs conditionnels
      if (formData.isCatechumene && formData.catechumeneStartDate) {
        formDataToSend.append('catechumeneStartDate', moment(formData.catechumeneStartDate).format('DD-MM-YYYY'));
      }
      
      if (formData.isCatechumene && formData.catechumeneEndDate) {
        formDataToSend.append('catechumeneEndDate', moment(formData.catechumeneEndDate).format('DD-MM-YYYY'));
      }
      
      // Ajout du certificat de baptême s'il existe
      if (formData.baptismCertificate) {
        formDataToSend.append('baptismCertificate', formData.baptismCertificate);
      }
      
      // Envoi des données au serveur
      await createBaptism(formDataToSend).unwrap();
      
      // Affichage du modal de succès
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Erreur lors de la création du baptême:', error);
      
      // Afficher l'erreur dans le formulaire
      const newErrors: Record<string, string> = {};
      newErrors.form = error?.data?.message || 
                      (error?.status === 400 ? 'Données invalides. Veuillez vérifier vos informations.' : 
                      (error?.status === 422 ? 'Format de données incorrect. Veuillez vérifier vos informations.' : 
                      (error?.status >= 500 ? 'Erreur du serveur. Veuillez réessayer plus tard.' : 
                      (error?.name === 'NetworkError' || !error?.status ? 'Problème de connexion. Vérifiez votre connexion internet.' : 
                      'Une erreur inattendue s\'est produite. Veuillez réessayer.'))));
      
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  // Définition des sections du formulaire
  const formSections: FormSection[] = [
    {
      title: 'Informations Personnelles',
      icon: <UserIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'fullName',
          label: 'Nom complet',
          type: 'text',
          placeholder: 'Entrez le nom complet',
          required: true,
        },
        {
          name: 'birthDate',
          label: 'Date de naissance',
          type: 'date',
          placeholder: 'Sélectionnez la date de naissance',
          required: true,
        },
        {
          name: 'placeOfBirth',
          label: 'Lieu de naissance',
          type: 'text',
          placeholder: 'Entrez le lieu de naissance',
          required: true,
        },
      ],
    },
    {
      title: 'Informations Religieuses',
      icon: <BookOpenIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'conversionDate',
          label: 'Date de conversion',
          type: 'date',
          placeholder: 'Sélectionnez la date de conversion',
          required: true,
        },
        {
          name: 'testimony',
          label: 'Témoignage',
          type: 'textarea',
          placeholder: 'Entrez le témoignage',
          required: true,
        },
        {
          name: 'previousChurch',
          label: 'Église précédente',
          type: 'text',
          placeholder: 'Entrez le nom de l\'église précédente',
          required: false,
        },
        {
          name: 'isCatechumene',
          label: 'Est catéchumène',
          type: 'checkbox',
          placeholder: '',
          required: false,
        },
        {
          name: 'catechumeneStartDate',
          label: 'Date de début du catéchuménat',
          type: 'date',
          placeholder: 'Sélectionnez la date de début',
          required: false,
          dependsOn: 'isCatechumene',
        },
        {
          name: 'catechumeneEndDate',
          label: 'Date de fin du catéchuménat',
          type: 'date',
          placeholder: 'Sélectionnez la date de fin',
          required: false,
          dependsOn: 'isCatechumene',
        },
      ],
    },
    {
      title: 'Informations du Baptême',
      icon: <CalendarIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'baptismDate',
          label: 'Date du baptême',
          type: 'date',
          placeholder: 'Sélectionnez la date du baptême',
          required: true,
        },
        {
          name: 'baptismLocation',
          label: 'Lieu du baptême',
          type: 'text',
          placeholder: 'Entrez le lieu du baptême',
          required: true,
        },
        {
          name: 'officiantName',
          label: 'Nom de l\'officiant',
          type: 'text',
          placeholder: 'Entrez le nom de l\'officiant',
          required: true,
        },
        {
          name: 'withness',
          label: 'Témoin',
          type: 'text',
          placeholder: 'Entrez le nom du témoin',
          required: true,
        },
        {
          name: 'baptismCertificate',
          label: 'Certificat de baptême (PDF, optionnel)',
          type: 'file',
          placeholder: 'Téléchargez le certificat de baptême',
          required: false,
          accept: 'application/pdf',
        },
      ],
    },
  ];

  // Rendu du composant
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      {/* En-tête */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/tableau-de-bord/admin/bapteme')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrement de Baptême</h1>
      </div>

      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {formSections.map((section, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${index <= currentStep ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'} mb-2`}
              >
                {section.icon}
              </div>
              <span
                className={`text-sm ${index <= currentStep ? 'text-teal-500 font-medium' : 'text-gray-500'}`}
              >
                {section.title}
              </span>
              {index < formSections.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 w-24 ${index < currentStep ? 'bg-teal-500' : 'bg-gray-200'} mt-5`}
                  style={{ marginLeft: '100%' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contenu du formulaire basé sur l'étape actuelle */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            {formSections[currentStep].icon}
            <span className="ml-2">{formSections[currentStep].title}</span>
          </h2>
          
          <div className="space-y-4">
            {formSections[currentStep].fields.map((field) => {
              // Vérifier si le champ dépend d'un autre champ
              if (field.dependsOn && !formData[field.dependsOn as keyof typeof formData]) {
                return null; // Ne pas afficher le champ si la dépendance n'est pas satisfaite
              }
              
              return (
                <div key={field.name} className="space-y-1">
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <>
                      <input
                        type="text"
                        id={field.name}
                        value={formData[field.name as keyof typeof formData] as string || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`block w-full px-4 py-2 border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500`}
                      />
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </>
                  )}
                  
                  {field.type === 'textarea' && (
                    <>
                      <textarea
                        id={field.name}
                        value={formData[field.name as keyof typeof formData] as string || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={`block w-full px-4 py-2 border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500`}
                      />
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </>
                  )}
                  
                  {field.type === 'date' && (
                    <>
                      <div className="date-picker-container">
                        <DatePicker
                          selected={formData[field.name as keyof typeof formData] as Date | null}
                          onChange={(date) => handleInputChange(field.name, date)}
                          dateFormat="dd/MM/yyyy"
                          placeholderText={field.placeholder}
                          className={`block w-full px-4 py-2 border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500`}
                          showYearDropdown
                          dropdownMode="select"
                        />
                      </div>
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </>
                  )}
                  
                  {field.type === 'checkbox' && (
                    <>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={field.name}
                          checked={formData[field.name as keyof typeof formData] as boolean || false}
                          onChange={(e) => handleInputChange(field.name, e.target.checked)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
                          {field.placeholder}
                        </label>
                      </div>
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </>
                  )}
                  
                  {field.type === 'file' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor={field.name}
                          className={`flex items-center px-4 py-2 bg-white border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer`}
                        >
                          <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Choisir un fichier
                        </label>
                        <input
                          type="file"
                          id={field.name}
                          accept={field.accept}
                          onChange={(e) => handleFileChange(e, field.name)}
                          className="sr-only"
                        />
                        <span className="text-sm text-gray-500">
                          {formData[field.name as keyof typeof formData] 
                          ? (formData[field.name as keyof typeof formData] as File).name 
                          : 'Aucun fichier choisi'}
                        </span>
                      </div>
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium ${currentStep === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Précédent
          </button>
          
          {currentStep < formSections.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </form>

      {/* Modal de succès */}
      <Dialog open={isSuccessModalOpen} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                Baptême enregistré avec succès
              </Dialog.Title>
              <p className="text-sm text-gray-500 text-center mb-6">
                Les informations du baptême ont été enregistrées avec succès dans le système.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    navigate('/tableau-de-bord/admin/bapteme');
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Retour à la liste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Enregistrer un autre
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Affichage des erreurs générales du formulaire */}
      {errors.form && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.form}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles pour le DatePicker */}
      <style>
        {`.date-picker-container .react-datepicker-wrapper {
          width: 100%;
        }
        .date-picker-container .react-datepicker__input-container {
          width: 100%;
        }`}
      </style>
    </div>
  );
}