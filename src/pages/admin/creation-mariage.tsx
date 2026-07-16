import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentIcon, UserIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useCreateMarriageMutation } from '../../store/services/mariageApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { Dialog } from '@headlessui/react';

// Interface pour définir la structure d'une section de formulaire
interface FormSection {
  title: string;
  icon: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'date' | 'file';
    placeholder: string;
    required?: boolean;
    accept?: string;
  }[];
}

export default function CreationMariage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour gérer les erreurs de validation pour chaque champ
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Récupération des données utilisateur et de l'église
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  
  // Mutation pour créer un mariage
  const [createMarriage] = useCreateMarriageMutation();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    brideFullname: '',
    brideBirthDate: null as Date | null,
    brideCertificate: null as File | null,
    groomFullname: '',
    goomBirthDate: null as Date | null, // Changé de groomBirthDate à goomBirthDate pour correspondre au backend
    grooomCertificate: null as File | null,
    weddingDate: null as Date | null,
    weddingLocation: '',
    officiantName: '',
    civilStateOfficer: '',
    witnessSignature: '',
    weddingCertificate: null as File | null,
  });

  // Fonction pour gérer les changements dans les champs textuels
  const handleInputChange = (name: string, value: string | Date | File | null) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Fonction pour gérer le téléchargement de documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier (PDF uniquement)
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'Seuls les fichiers PDF sont acceptés.'
        }));
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'La taille du fichier ne doit pas dépasser 5MB.'
        }));
        return;
      }
      
      // Effacer l'erreur si le fichier est valide
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[fieldName];
        return newErrors;
      });
      
      handleInputChange(fieldName, file);
    }
  };

  // Fonction pour valider le formulaire
  const validateForm = () => {
    // Réinitialiser les erreurs
    setErrors({});
    let newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Validation générale
    if (currentStep === 0) {
      // Validation des informations de la mariée
      if (!formData.brideFullname) {
        newErrors.brideFullname = 'Le nom complet de la mariée est requis.';
        isValid = false;
      } else if (formData.brideFullname.length < 2) {
        newErrors.brideFullname = 'Le nom complet de la mariée doit contenir au moins 2 caractères.';
        isValid = false;
      }
      
      if (!formData.brideBirthDate) {
        newErrors.brideBirthDate = 'La date de naissance de la mariée est requise.';
        isValid = false;
      } else {
        // Vérification de l'âge (minimum 18 ans)
        const today = new Date();
        const birthDate = new Date(formData.brideBirthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          newErrors.brideBirthDate = 'La mariée doit avoir au moins 18 ans.';
          isValid = false;
        }
      }
      
      if (!formData.brideCertificate) {
        newErrors.brideCertificate = 'Le document d\'identité de la mariée est requis.';
        isValid = false;
      }
    } else if (currentStep === 1) {
      // Validation des informations du marié
      if (!formData.groomFullname) {
        newErrors.groomFullname = 'Le nom complet du marié est requis.';
        isValid = false;
      } else if (formData.groomFullname.length < 2) {
        newErrors.groomFullname = 'Le nom du marié doit contenir au moins 2 caractères.';
        isValid = false;
      }
      
      if (!formData.goomBirthDate) {
        newErrors.goomBirthDate = 'La date de naissance du marié est requise.';
        isValid = false;
      } else {
        // Vérification de l'âge (minimum 18 ans)
        const today = new Date();
        const groomAge = today.getFullYear() - new Date(formData.goomBirthDate).getFullYear();
        const birthMonth = new Date(formData.goomBirthDate).getMonth();
        const currentMonth = today.getMonth();
        
        if (groomAge < 18 || (groomAge === 18 && birthMonth > currentMonth)) {
          newErrors.goomBirthDate = 'Le marié doit avoir au moins 18 ans.';
          isValid = false;
        }
      }
      
      if (!formData.grooomCertificate) {
        newErrors.grooomCertificate = 'Le document d\'identité du marié est requis.';
        isValid = false;
      }
    } else if (currentStep === 2) {
      // Validation des informations du mariage
      
      if (!formData.weddingLocation) {
        newErrors.weddingLocation = 'Le lieu du mariage est requis.';
        isValid = false;
      }

      if (!formData.officiantName) {
        newErrors.officiantName = 'Le nom de l\'officiant est requis.';
        isValid = false;
      }
      
      if (!formData.civilStateOfficer) {
        newErrors.civilStateOfficer = 'Le nom de l\'officier d\'état civil est requis.';
        isValid = false;
      } else if (formData.civilStateOfficer.length < 2) {
        newErrors.civilStateOfficer = 'Le nom de l\'officier d\'état civil doit contenir au moins 2 caractères.';
        isValid = false;
      }
      
      if (!formData.witnessSignature) {
        newErrors.witnessSignature = 'La signature du témoin est requise.';
        isValid = false;
      } else if (formData.witnessSignature.length < 2) {
        newErrors.witnessSignature = 'La signature du témoin doit contenir au moins 2 caractères.';
        isValid = false;
      }
      
      if (!formData.weddingDate) {
        newErrors.weddingDate = 'La date du mariage est requise.';
        isValid = false;
      }
    }
    
    // Mettre à jour l'état des erreurs
    setErrors(newErrors);
    
    return isValid;
  };

  // Fonction pour passer à l'étape suivante
  const handleNext = () => {
    // Valider le formulaire avant de passer à l'étape suivante
    if (validateForm()) {
      // Réinitialiser les erreurs avant de passer à l'étape suivante
      setErrors({});
      setCurrentStep(currentStep + 1);
    }
  };

  // Fonction pour revenir à l'étape précédente
  const handlePrevious = () => {
    // Réinitialiser les erreurs avant de revenir à l'étape précédente
    setErrors({});
    setCurrentStep(currentStep - 1);
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire avant soumission
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Création d'un objet FormData pour l'envoi des fichiers
      const formDataToSend = new FormData();
      
      // Ajout des champs textuels
      formDataToSend.append('brideFullname', formData.brideFullname);
      formDataToSend.append('birthDate', formData.brideBirthDate ? moment(formData.brideBirthDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('groomFullname', formData.groomFullname);
      formDataToSend.append('goomBirthDate', formData.goomBirthDate ? moment(formData.goomBirthDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('weddingDate', formData.weddingDate ? moment(formData.weddingDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('weddingLocation', formData.weddingLocation);
      formDataToSend.append('officiantName', formData.officiantName);
      formDataToSend.append('civilStateOfficer', formData.civilStateOfficer);
      formDataToSend.append('witnessSignature', formData.witnessSignature);
      formDataToSend.append('churchId', churchId);
      
      // Ajout des fichiers s'ils existent
      if (formData.brideCertificate) {
        formDataToSend.append('brideCertificate', formData.brideCertificate);
      }
      
      if (formData.grooomCertificate) {
        formDataToSend.append('grooomCertificate', formData.grooomCertificate);
      }
      
      if (formData.weddingCertificate) {
        formDataToSend.append('weddingCertificate', formData.weddingCertificate);
      }
      console.log("formDataToSend : ", formData)
      // Envoi des données au serveur
      await createMarriage(formDataToSend).unwrap();
      
      // Affichage du modal de succès
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Erreur lors de la création du mariage:', error);
      
      // Gestion des différents types d'erreurs
      let errorMsg = '';
      if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.status === 400) {
        console.log("error : ", error)
        errorMsg = 'Données invalides. Veuillez vérifier vos informations.';
      } else if (error?.status === 422) {
        errorMsg = 'Format de données incorrect. Veuillez vérifier vos informations.';
      } else if (error?.status >= 500) {
        errorMsg = 'Erreur du serveur. Veuillez réessayer plus tard.';
      } else if (error?.name === 'NetworkError' || !error?.status) {
        errorMsg = 'Problème de connexion. Vérifiez votre connexion internet.';
      } else {
        errorMsg = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
      }
      
      // Afficher l'erreur générale dans l'état errors
      setErrors({ general: errorMsg });
      // Afficher l'erreur en haut du formulaire
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } finally {
      setIsLoading(false);
    }
  };

  // Définition des sections du formulaire
  const formSections: FormSection[] = [
    {
      title: 'Informations de la Mariée',
      icon: <UserIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'brideFullname',
          label: 'Nom complet de la mariée',
          type: 'text',
          placeholder: 'Entrez le nom complet de la mariée',
          required: true,
        },
        {
          name: 'brideBirthDate',
          label: 'Date de naissance de la mariée',
          type: 'date',
          placeholder: 'Sélectionnez la date de naissance',
          required: true,
        },
        {
          name: 'brideCertificate',
          label: 'Document d\'identité de la mariée (PDF)',
          type: 'file',
          placeholder: 'Choisir un fichier',
          required: true,
          accept: 'application/pdf',
        },
      ],
    },
    {
      title: 'Informations du Marié',
      icon: <UserIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'groomFullname',
          label: 'Nom complet du marié',
          type: 'text',
          placeholder: 'Entrez le nom complet du marié',
          required: true,
        },
        {
          name: 'goomBirthDate',
          label: 'Date de naissance du marié',
          type: 'date',
          placeholder: 'Sélectionnez la date de naissance',
          required: true,
        },
        {
          name: 'grooomCertificate',
          label: 'Document d\'identité du marié (PDF)',
          type: 'file',
          placeholder: 'Choisir un fichier',
          required: true,
          accept: 'application/pdf',
        },
      ],
    },
    {
      title: 'Informations du Mariage',
      icon: <HeartIcon className="h-6 w-6 text-teal-500" />,
      fields: [
        {
          name: 'weddingDate',
          label: 'Date du mariage',
          type: 'date',
          placeholder: 'Sélectionnez la date du mariage',
          required: true,
        },
        {
          name: 'weddingLocation',
          label: 'Lieu du mariage',
          type: 'text',
          placeholder: 'Entrez le lieu du mariage',
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
          name: 'civilStateOfficer',
          label: 'Officier d\'état civil',
          type: 'text',
          placeholder: 'Entrez le nom de l\'officier d\'état civil',
          required: true,
        },
        {
          name: 'witnessSignature',
          label: 'Signature du témoin',
          type: 'text',
          placeholder: 'Entrez le nom du témoin',
          required: true,
        },
        {
          name: 'weddingCertificate',
          label: 'Certificat de mariage (PDF, optionnel)',
          type: 'file',
          placeholder: 'Téléchargez le certificat de mariage',
          required: false,
          accept: 'application/pdf',
        },
      ],
    },
  ];

  // Rendu du composant
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      {/* En-tête */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/tableau-de-bord/admin/mariages')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrement de Mariage</h1>
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
        {/* Message d'erreur général */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{errors.general}</p>
          </div>
        )}
        
        {/* Contenu du formulaire basé sur l'étape actuelle */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            {formSections[currentStep].icon}
            <span className="ml-2">{formSections[currentStep].title}</span>
          </h2>
          
          <div className="space-y-4">
            {formSections[currentStep].fields.map((field) => (
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
                      <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
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
                      <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
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
                      <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
                    )}
                  </>
                )}
              </div>
            ))}
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
                Mariage enregistré avec succès
              </Dialog.Title>
              <p className="text-sm text-gray-500 text-center mb-6">
                Les informations du mariage ont été enregistrées avec succès dans le système.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    navigate('/tableau-de-bord/admin/mariages');
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

      {/* La modale d'erreur a été supprimée car les erreurs sont maintenant affichées directement dans le formulaire */}

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