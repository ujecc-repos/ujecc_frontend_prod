import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetMarriageQuery, useUpdateMarriageMutation } from '../../store/services/mariageApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import moment from 'moment';

export default function EditMariage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);

    // Get current user and church ID
    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id || '';

    // Fetch marriage data
    const { data: marriage, isLoading: isLoadingMarriage, error } = useGetMarriageQuery(id || '', {
        skip: !id,
    });

    // Update mutation
    const [updateMarriage] = useUpdateMarriageMutation();

    // Form state
    const [formData, setFormData] = useState({
        brideFullname: '',
        birthDate: null as Date | null,
        groomFullname: '',
        goomBirthDate: null as Date | null,
        weddingDate: null as Date | null,
        weddingLocation: '',
        officiantName: '',
        civilStateOfficer: '',
        witnessSignature: '',
        weddingCertificate: null as File | null,
        brideCertificate: null as File | null,
        grooomCertificate: null as File | null,
    });

    // Load existing data when marriage is fetched
    useEffect(() => {
        if (marriage) {
            setFormData({
                brideFullname: marriage.brideFullname || '',
                birthDate: marriage.birthDate ? new Date(marriage.birthDate) : null,
                groomFullname: marriage.groomFullname || '',
                goomBirthDate: marriage.goomBirthDate ? new Date(marriage.goomBirthDate) : null,
                weddingDate: marriage.weddingDate ? new Date(marriage.weddingDate) : null,
                weddingLocation: marriage.weddingLocation || '',
                officiantName: marriage.officiantName || '',
                civilStateOfficer: marriage.civilStateOfficer || '',
                witnessSignature: marriage.witnessSignature || '',
                weddingCertificate: null,
                brideCertificate: null,
                grooomCertificate: null,
            });
        }
    }, [marriage]);

    // Handle input changes
    const handleInputChange = (name: string, value: string | Date | File | null) => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle file change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate file type
            if (file.type !== 'application/pdf') {
                toast.error('Seuls les fichiers PDF sont acceptés.');
                e.target.value = '';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La taille du fichier ne doit pas dépasser 5MB.');
                e.target.value = '';
                return;
            }

            handleInputChange(fieldName, file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Create FormData for file upload
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('brideFullname', formData.brideFullname);
            formDataToSend.append('birthDate', formData.birthDate ? moment(formData.birthDate).format('YYYY-MM-DD') : '');
            formDataToSend.append('groomFullname', formData.groomFullname);
            formDataToSend.append('goomBirthDate', formData.goomBirthDate ? moment(formData.goomBirthDate).format('YYYY-MM-DD') : '');
            formDataToSend.append('weddingDate', formData.weddingDate ? moment(formData.weddingDate).format('YYYY-MM-DD') : '');
            formDataToSend.append('weddingLocation', formData.weddingLocation);
            formDataToSend.append('officiantName', formData.officiantName);
            formDataToSend.append('civilStateOfficer', formData.civilStateOfficer);
            formDataToSend.append('witnessSignature', formData.witnessSignature);
            formDataToSend.append('churchId', churchId);

            // Add certificates if new files were selected
            if (formData.weddingCertificate) {
                formDataToSend.append('weddingCertificate', formData.weddingCertificate);
            }
            if (formData.brideCertificate) {
                formDataToSend.append('brideCertificate', formData.brideCertificate);
            }
            if (formData.grooomCertificate) {
                formDataToSend.append('grooomCertificate', formData.grooomCertificate);
            }

            // Submit update
            await updateMarriage({ id: id!, marriage: formDataToSend }).unwrap();

            toast.success('Mariage modifié avec succès');
            navigate('/tableau-de-bord/admin/mariages');
        } catch (error: any) {
            console.error('Erreur lors de la modification du mariage:', error);
            toast.error('Erreur lors de la modification du mariage');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingMarriage) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error || !marriage) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-500 mb-4">Mariage non trouvé</div>
                <button
                    onClick={() => navigate('/tableau-de-bord/admin/mariages')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/tableau-de-bord/admin/mariages')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Modifier le Mariage</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bride Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de la Mariée</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom complet de la mariée <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.brideFullname}
                                onChange={(e) => handleInputChange('brideFullname', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de naissance de la mariée <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.birthDate}
                                onChange={(date) => handleInputChange('birthDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificat de la mariée (PDF, optionnel)
                            </label>
                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="brideCertificate"
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Choisir un nouveau fichier
                                </label>
                                <input
                                    type="file"
                                    id="brideCertificate"
                                    accept="application/pdf"
                                    onChange={(e) => handleFileChange(e, 'brideCertificate')}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-500">
                                    {formData.brideCertificate
                                        ? formData.brideCertificate.name
                                        : marriage.brideCertificate ? 'Fichier existant' : 'Aucun fichier'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Groom Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations du Marié</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom complet du marié <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.groomFullname}
                                onChange={(e) => handleInputChange('groomFullname', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de naissance du marié <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.goomBirthDate}
                                onChange={(date) => handleInputChange('goomBirthDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificat du marié (PDF, optionnel)
                            </label>
                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="grooomCertificate"
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Choisir un nouveau fichier
                                </label>
                                <input
                                    type="file"
                                    id="grooomCertificate"
                                    accept="application/pdf"
                                    onChange={(e) => handleFileChange(e, 'grooomCertificate')}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-500">
                                    {formData.grooomCertificate
                                        ? formData.grooomCertificate.name
                                        : marriage.grooomCertificate ? 'Fichier existant' : 'Aucun fichier'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wedding Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations du Mariage</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date du mariage <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.weddingDate}
                                onChange={(date) => handleInputChange('weddingDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lieu du mariage <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.weddingLocation}
                                onChange={(e) => handleInputChange('weddingLocation', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom de l'officiant <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.officiantName}
                                onChange={(e) => handleInputChange('officiantName', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Officier d'état civil <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.civilStateOfficer}
                                onChange={(e) => handleInputChange('civilStateOfficer', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Signature du témoin <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.witnessSignature}
                                onChange={(e) => handleInputChange('witnessSignature', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificat de mariage (PDF, optionnel)
                            </label>
                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="weddingCertificate"
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Choisir un nouveau fichier
                                </label>
                                <input
                                    type="file"
                                    id="weddingCertificate"
                                    accept="application/pdf"
                                    onChange={(e) => handleFileChange(e, 'weddingCertificate')}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-500">
                                    {formData.weddingCertificate
                                        ? formData.weddingCertificate.name
                                        : marriage.weddingCertificate ? 'Fichier existant' : 'Aucun fichier'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/tableau-de-bord/admin/mariages')}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Modification...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>

            {/* Styles for DatePicker */}
            <style>
                {`.react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container {
          width: 100%;
        }`}
            </style>
        </div>
    );
}
