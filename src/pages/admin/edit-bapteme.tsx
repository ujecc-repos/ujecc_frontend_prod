import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetBaptismByIdQuery, useUpdateBaptismMutation } from '../../store/services/baptismApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import moment from 'moment';

export default function EditBapteme() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);

    // Get current user and church ID
    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id || '';

    // Fetch baptism data
    const { data: baptism, isLoading: isLoadingBaptism, error } = useGetBaptismByIdQuery(id || '', {
        skip: !id,
    });

    // Update mutation
    const [updateBaptism] = useUpdateBaptismMutation();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        birthDate: null as Date | null,
        placeOfBirth: '',
        conversionDate: null as Date | null,
        testimony: '',
        previousChurch: '',
        baptismDate: null as Date | null,
        baptismLocation: '',
        officiantName: '',
        withness: '',
        baptismCertificate: null as File | null,
    });

    // Load existing data when baptism is fetched
    useEffect(() => {
        if (baptism) {
            setFormData({
                fullName: baptism.fullName || '',
                birthDate: baptism.birthDate ? new Date(baptism.birthDate) : null,
                placeOfBirth: baptism.placeOfBirth || '',
                conversionDate: baptism.conversionDate ? new Date(baptism.conversionDate) : null,
                testimony: baptism.testimony || '',
                previousChurch: baptism.previousChurch || '',
                baptismDate: baptism.baptismDate ? new Date(baptism.baptismDate) : null,
                baptismLocation: baptism.baptismLocation || '',
                officiantName: baptism.officiantName || '',
                withness: baptism.withness || '',
                baptismCertificate: null,
            });
        }
    }, [baptism]);

    // Handle input changes
    const handleInputChange = (name: string, value: string | Date | File | null) => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle file change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

            handleInputChange('baptismCertificate', file);
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

            // Add baptism certificate if a new file was selected
            if (formData.baptismCertificate) {
                formDataToSend.append('baptismCertificate', formData.baptismCertificate);
            }

            // Submit update
            await updateBaptism({ id: id!, ...Object.fromEntries(formDataToSend) }).unwrap();

            toast.success('Baptême modifié avec succès');
            navigate('/tableau-de-bord/admin/bapteme');
        } catch (error: any) {
            console.error('Erreur lors de la modification du baptême:', error);
            toast.error('Erreur lors de la modification du baptême');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingBaptism) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error || !baptism) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-500 mb-4">Baptême non trouvé</div>
                <button
                    onClick={() => navigate('/tableau-de-bord/admin/bapteme')}
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
                    onClick={() => navigate('/tableau-de-bord/admin/bapteme')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Modifier le Baptême</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations Personnelles</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom complet <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de naissance <span className="text-red-500">*</span>
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
                                Lieu de naissance <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.placeOfBirth}
                                onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Religious Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations Religieuses</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de conversion <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.conversionDate}
                                onChange={(date) => handleInputChange('conversionDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Témoignage <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.testimony}
                                onChange={(e) => handleInputChange('testimony', e.target.value)}
                                rows={4}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Église précédente
                            </label>
                            <input
                                type="text"
                                value={formData.previousChurch}
                                onChange={(e) => handleInputChange('previousChurch', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Baptism Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations du Baptême</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date du baptême <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.baptismDate}
                                onChange={(date) => handleInputChange('baptismDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lieu du baptême <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.baptismLocation}
                                onChange={(e) => handleInputChange('baptismLocation', e.target.value)}
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
                                Témoin <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.withness}
                                onChange={(e) => handleInputChange('withness', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificat de baptême (PDF, optionnel)
                            </label>
                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="baptismCertificate"
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Choisir un nouveau fichier
                                </label>
                                <input
                                    type="file"
                                    id="baptismCertificate"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-500">
                                    {formData.baptismCertificate
                                        ? formData.baptismCertificate.name
                                        : baptism.baptismCertificate ? 'Fichier existant' : 'Aucun fichier'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/tableau-de-bord/admin/bapteme')}
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
