import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetFuneralByIdQuery, useUpdateFuneralMutation } from '../../store/services/funeralApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import moment from 'moment';

export default function EditFuneraille() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);

    // Get current user and church ID
    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id || '';

    // Fetch funeral data
    const { data: funeral, isLoading: isLoadingFuneral, error } = useGetFuneralByIdQuery(id || '', {
        skip: !id,
    });

    // Update mutation
    const [updateFuneral] = useUpdateFuneralMutation();

    // Form state
    const [formData, setFormData] = useState({
        fullname: '',
        birthDate: null as Date | null,
        deathDate: null as Date | null,
        funeralDate: null as Date | null,
        funeralTime: '',
        relationShip: '',
        email: '',
        nextOfKin: '',
        officiantName: '',
        description: '',
        funeralLocation: '',
        deathCertificate: null as File | null,
    });

    // Load existing data when funeral is fetched
    useEffect(() => {
        if (funeral) {
            setFormData({
                fullname: funeral.fullname || '',
                birthDate: funeral.birthDate ? new Date(funeral.birthDate) : null,
                deathDate: funeral.deathDate ? new Date(funeral.deathDate) : null,
                funeralDate: funeral.funeralDate ? new Date(funeral.funeralDate) : null,
                funeralTime: funeral.funeralTime || '',
                relationShip: funeral.relationShip || '',
                email: funeral.email || '',
                nextOfKin: funeral.nextOfKin || '',
                officiantName: funeral.officiantName || '',
                description: funeral.description || '',
                funeralLocation: funeral.funeralLocation || '',
                deathCertificate: null,
            });
        }
    }, [funeral]);

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

            handleInputChange('deathCertificate', file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const dataToSend = new FormData();
            dataToSend.append('fullname', formData.fullname);
            dataToSend.append('birthDate', formData.birthDate ? moment(formData.birthDate).format('YYYY-MM-DD') : '');
            if (formData.deathDate) dataToSend.append('deathDate', moment(formData.deathDate).format('YYYY-MM-DD'));
            dataToSend.append('funeralDate', formData.funeralDate ? moment(formData.funeralDate).format('YYYY-MM-DD') : '');
            dataToSend.append('funeralTime', formData.funeralTime);
            dataToSend.append('relationShip', formData.relationShip);
            dataToSend.append('email', formData.email);
            dataToSend.append('nextOfKin', formData.nextOfKin);
            dataToSend.append('officiantName', formData.officiantName);
            dataToSend.append('description', formData.description);
            dataToSend.append('funeralLocation', formData.funeralLocation);
            dataToSend.append('churchId', churchId);
            if (formData.deathCertificate) dataToSend.append('deathCertificate', formData.deathCertificate);

            await updateFuneral({ id: id!, funeral: dataToSend }).unwrap();

            toast.success('Funéraille modifiée avec succès');
            navigate('/tableau-de-bord/admin/funerailles');
        } catch (error: any) {
            console.error('Erreur lors de la modification de la funéraille:', error);
            toast.error('Erreur lors de la modification de la funéraille');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingFuneral) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error || !funeral) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-500 mb-4">Funéraille non trouvée</div>
                <button
                    onClick={() => navigate('/tableau-de-bord/admin/funerailles')}
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
                    onClick={() => navigate('/tableau-de-bord/admin/funerailles')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Modifier la Funéraille</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Deceased Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations du Défunt</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom complet <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.fullname}
                                onChange={(e) => handleInputChange('fullname', e.target.value)}
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
                                Date de décès
                            </label>
                            <DatePicker
                                selected={formData.deathDate}
                                onChange={(date) => handleInputChange('deathDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Relation <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.relationShip}
                                onChange={(e) => handleInputChange('relationShip', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proche parent <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nextOfKin}
                                onChange={(e) => handleInputChange('nextOfKin', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Funeral Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de la Funéraille</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de la funéraille <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.funeralDate}
                                onChange={(date) => handleInputChange('funeralDate', date)}
                                dateFormat="dd/MM/yyyy"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                showYearDropdown
                                dropdownMode="select"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Heure de la funéraille <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.funeralTime}
                                onChange={(e) => handleInputChange('funeralTime', e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lieu de la funéraille <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.funeralLocation}
                                onChange={(e) => handleInputChange('funeralLocation', e.target.value)}
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
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificat de décès (PDF, optionnel)
                            </label>
                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="deathCertificate"
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    <DocumentIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Certificat existant
                                </label>
                                <input
                                    type="file"
                                    id="deathCertificate"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-500">
                                    {formData.deathCertificate ? formData.deathCertificate.name : funeral.deathCertificate ? 'Fichier existant — choisissez-en un pour le remplacer' : 'Aucun fichier'}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">PDF uniquement, 5 Mo maximum.</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/tableau-de-bord/admin/funerailles')}
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
