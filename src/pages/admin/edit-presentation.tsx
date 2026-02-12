import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetPresentationQuery, useUpdatePresentationMutation } from '../../store/services/presentationApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import moment from 'moment';

export default function EditPresentation() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);

    // Get current user and church ID
    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id || '';

    // Fetch presentation data
    const { data: presentation, isLoading: isLoadingPresentation, error } = useGetPresentationQuery(id || '', {
        skip: !id,
    });

    // Update mutation
    const [updatePresentation] = useUpdatePresentationMutation();

    // Form state
    const [formData, setFormData] = useState({
        childName: '',
        dateOfBirth: null as Date | null,
        placeOfBirth: '',
        presentationDate: null as Date | null,
        fatherName: '',
        motherName: '',
        officiantName: '',
        address: '',
        phone: '',
        witness: '',
        description: '',
    });

    // Load existing data when presentation is fetched
    useEffect(() => {
        if (presentation) {
            setFormData({
                childName: presentation.childName || '',
                dateOfBirth: presentation.dateOfBirth ? new Date(presentation.dateOfBirth) : null,
                placeOfBirth: presentation.placeOfBirth || '',
                presentationDate: presentation.presentationDate ? new Date(presentation.presentationDate) : null,
                fatherName: presentation.fatherName || '',
                motherName: presentation.motherName || '',
                officiantName: presentation.officiantName || '',
                address: presentation.address || '',
                phone: presentation.phone || '',
                witness: presentation.witness || '',
                description: presentation.description || '',
            });
        }
    }, [presentation]);

    // Handle input changes
    const handleInputChange = (name: string, value: string | Date | null) => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Prepare data for submission
            const dataToSend = {
                childName: formData.childName,
                dateOfBirth: formData.dateOfBirth ? moment(formData.dateOfBirth).format('YYYY-MM-DD') : '',
                placeOfBirth: formData.placeOfBirth,
                presentationDate: formData.presentationDate ? moment(formData.presentationDate).format('YYYY-MM-DD') : '',
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                officiantName: formData.officiantName,
                address: formData.address,
                phone: formData.phone,
                witness: formData.witness,
                description: formData.description,
                churchId: churchId,
            };

            // Submit update
            await updatePresentation({ id: id!, presentation: dataToSend }).unwrap();

            toast.success('Présentation modifiée avec succès');
            navigate('/tableau-de-bord/admin/presentation');
        } catch (error: any) {
            console.error('Erreur lors de la modification de la présentation:', error);
            toast.error('Erreur lors de la modification de la présentation');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingPresentation) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error || !presentation) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-500 mb-4">Présentation non trouvée</div>
                <button
                    onClick={() => navigate('/tableau-de-bord/admin/presentation')}
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
                    onClick={() => navigate('/tableau-de-bord/admin/presentation')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Modifier la Présentation</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Child Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de l'Enfant</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom de l'enfant <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.childName}
                                onChange={(e) => handleInputChange('childName', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de naissance <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.dateOfBirth}
                                onChange={(date) => handleInputChange('dateOfBirth', date)}
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

                {/* Parents Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations des Parents</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du père <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.fatherName}
                                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom de la mère <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.motherName}
                                onChange={(e) => handleInputChange('motherName', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Presentation Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de la Présentation</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de présentation <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.presentationDate}
                                onChange={(date) => handleInputChange('presentationDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
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
                                value={formData.witness}
                                onChange={(e) => handleInputChange('witness', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/tableau-de-bord/admin/presentation')}
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
