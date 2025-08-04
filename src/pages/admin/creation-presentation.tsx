import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog } from '@headlessui/react';
import { useCreatePresentationMutation } from '../../store/services/presentationApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import moment from 'moment';

export default function CreationPresentation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [createPresentation, { isLoading }] = useCreatePresentationMutation();
  const { data: userToken } = useGetUserByTokenQuery();

  const [formData, setFormData] = useState({
    childName: '',
    dateOfBirth: null as Date | null,
    placeOfBirth: '',
    fatherName: '',
    motherName: '',
    address: '',
    phone: '',
    presentationDate: null as Date | null,
    officiantName: '',
    witness: '',
    description: '',
    birthCertificate: null as File | null,
  });

  // Validation des champs
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.childName) newErrors.childName = 'Le nom de l\'enfant est obligatoire';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'La date de naissance est obligatoire';
      if (!formData.placeOfBirth) newErrors.placeOfBirth = 'Le lieu de naissance est obligatoire';
      if (!formData.birthCertificate) {
        newErrors.birthCertificate = 'Le certificat de naissance est obligatoire';
      } else {
        // Validation du type de fichier (PDF uniquement)
        if (formData.birthCertificate.type !== 'application/pdf') {
          newErrors.birthCertificate = 'Le certificat de naissance doit être au format PDF';
        }
        
        // Validation de la taille du fichier (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (formData.birthCertificate.size > maxSize) {
          newErrors.birthCertificate = 'Le certificat de naissance ne doit pas dépasser 5MB';
        }
      }
    } else if (step === 1) {
      if (!formData.fatherName) newErrors.fatherName = 'Le nom du père est obligatoire';
      if (!formData.motherName) newErrors.motherName = 'Le nom de la mère est obligatoire';
      if (!formData.address) newErrors.address = 'L\'adresse est obligatoire';
      if (!formData.phone) newErrors.phone = 'Le numéro de téléphone est obligatoire';
      // Validation du format du téléphone
      if (formData.phone && !/^\+?[0-9]{8,15}$/.test(formData.phone)) {
        newErrors.phone = 'Format de téléphone invalide';
      }
    } else if (step === 2) {
      if (!formData.presentationDate) newErrors.presentationDate = 'La date de présentation est obligatoire';
      if (!formData.officiantName) newErrors.officiantName = 'Le nom de l\'officiant est obligatoire';
      if (!formData.witness) newErrors.witness = 'Le témoin est obligatoire';
      if (!formData.description) newErrors.description = 'La description est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when input changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        const newErrors = { ...errors };
        newErrors[name] = 'Le fichier doit être au format PDF';
        setErrors(newErrors);
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const newErrors = { ...errors };
        newErrors[name] = 'Le fichier ne doit pas dépasser 5MB';
        setErrors(newErrors);
        e.target.value = ''; // Reset input
        return;
      }
      
      // File is valid, update form data and clear any errors
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (!isValid) {
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateStep(currentStep);
    if (!isValid) {
      return;
    }

    try {
      // Création de l'objet FormData pour l'envoi multipart/form-data
      const formDataToSend = new FormData();
      
      // Ajout des champs texte
      formDataToSend.append('childName', formData.childName);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth ? moment(formData.dateOfBirth).format('YYYY-MM-DD') : '');
      formDataToSend.append('placeOfBirth', formData.placeOfBirth);
      formDataToSend.append('fatherName', formData.fatherName);
      formDataToSend.append('motherName', formData.motherName);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('presentationDate', formData.presentationDate ? moment(formData.presentationDate).format('YYYY-MM-DD') : '');
      formDataToSend.append('officiantName', formData.officiantName);
      formDataToSend.append('witness', formData.witness);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('churchId', userToken?.church?.id || '1');
      formDataToSend.append('status', 'pending');
      
      // Ajout du fichier de certificat de naissance
      if (formData.birthCertificate) {
        formDataToSend.append('birthCertificate', formData.birthCertificate);
      }

      await createPresentation(formDataToSend).unwrap();
      setIsSuccessModalOpen(true);
      toast.success('Présentation enregistrée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la présentation:', error);
      const newErrors = { ...errors };
      newErrors.server = 'Une erreur est survenue lors de l\'enregistrement de la présentation';
      setErrors(newErrors);
      toast.error('Erreur lors de l\'enregistrement de la présentation');
    }
  };

  // Définition des sections du formulaire
  const formSections = [
    {
      title: 'Information De L\'enfant',
      fields: [
        {
          name: 'childName',
          label: 'Nom Complet',
          placeholder: 'Entrez le nom complet de l\'enfant',
          type: 'text',
          required: true,
        },
        {
          name: 'dateOfBirth',
          label: 'Date de Naissance',
          placeholder: 'Sélectionnez la date de naissance',
          type: 'date',
          required: true,
        },
        {
          name: 'placeOfBirth',
          label: 'Lieu de Naissance',
          placeholder: 'Entrez le lieu de naissance',
          type: 'text',
          required: true,
        },
        {
          name: 'birthCertificate',
          label: 'Certificat de Naissance',
          placeholder: 'Téléchargez le certificat de naissance',
          type: 'file',
          required: true,
          accept: 'application/pdf',
        },
      ],
    },
    {
      title: 'Information Des Parents',
      fields: [
        {
          name: 'fatherName',
          label: 'Nom du Père',
          placeholder: 'Entrez le nom du père',
          type: 'text',
          required: true,
        },
        {
          name: 'motherName',
          label: 'Nom de la Mère',
          placeholder: 'Entrez le nom de la mère',
          type: 'text',
          required: true,
        },
        {
          name: 'address',
          label: 'Adresse',
          placeholder: 'Entrez l\'adresse',
          type: 'text',
          required: true,
        },
        {
          name: 'phone',
          label: 'Téléphone',
          placeholder: 'Entrez le numéro de téléphone',
          type: 'tel',
          required: true,
        },
      ],
    },
    {
      title: 'Détails De Présentation',
      fields: [
        {
          name: 'presentationDate',
          label: 'Date de Présentation',
          placeholder: 'Sélectionnez la date de présentation',
          type: 'date',
          required: true,
        },
        {
          name: 'officiantName',
          label: 'Nom de l\'Officiant',
          placeholder: 'Entrez le nom de l\'officiant',
          type: 'text',
          required: true,
        },
        {
          name: 'witness',
          label: 'Témoin',
          placeholder: 'Entrez le nom du témoin',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          placeholder: 'Entrez une description',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ];
  
  // Rendu du composant
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* En-tête */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrement de Présentation</h1>
      </div>
      
      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {formSections.map((section, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="mt-2 text-sm text-gray-600">{section.title}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / formSections.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {formSections[currentStep].title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formSections[currentStep].fields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' || field.type === 'tel' ? (
                  <div className="flex flex-col w-full">
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name as keyof typeof formData] as string}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className={`border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ) : field.type === 'date' ? (
                  <div className="flex flex-col w-full">
                    <DatePicker
                      selected={formData[field.name as keyof typeof formData] as Date}
                      onChange={(date) => handleInputChange(field.name, date)}
                      placeholderText={field.placeholder}
                      dateFormat="dd/MM/yyyy"
                      className={`border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ) : field.type === 'file' ? (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-center w-full">
                      <label
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <DocumentIcon className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Cliquez pour télécharger</span> ou glissez et déposez
                          </p>
                          <p className="text-xs text-gray-500">PDF uniquement (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept={field.accept}
                          onChange={(e) => handleFileChange(e, field.name)}
                        />
                      </label>
                    </div>
                    {formData[field.name as keyof typeof formData] && (
                      <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm text-gray-600 truncate">
                          {(formData[field.name as keyof typeof formData] as File).name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInputChange(field.name, null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ) : field.type === 'textarea' ? (
                  <div className="flex flex-col w-full">
                    <textarea
                      placeholder={field.placeholder}
                      value={formData[field.name as keyof typeof formData] as string}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      rows={4}
                      className={`border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        
        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Précédent
            </button>
          ) : (
            <div></div>
          )}
          
          {currentStep < formSections.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </form>
      
      {/* Modal de succès */}
      <Dialog
        open={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              
              <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
                Enregistrement réussi
              </Dialog.Title>
              
              <p className="text-gray-600 text-center mb-6">
                La présentation a été enregistrée avec succès.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    navigate('/tableau-de-bord/admin/presentation');
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  Voir la liste
                </button>
                
                <button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    // Réinitialiser le formulaire
                    setFormData({
                      childName: '',
                      dateOfBirth: null,
                      placeOfBirth: '',
                      fatherName: '',
                      motherName: '',
                      address: '',
                      phone: '',
                      presentationDate: null,
                      officiantName: '',
                      witness: '',
                      description: '',
                      birthCertificate: null,
                    });
                    setCurrentStep(0);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Nouvel enregistrement
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      
      {/* Server error display */}
      {errors.server && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.server}
        </div>
      )}
    </div>
  );
}