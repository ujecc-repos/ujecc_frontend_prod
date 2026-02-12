import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { useGetMinistryByIdQuery, useGetUsersByMinistryQuery } from '../../store/services/ministryApi';
import { useGetChurchByIdQuery } from '../../store/services/churchApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';

export default function MinistryUsers() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Get user data to access church ID
    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id;

    const { data: churchData } = useGetChurchByIdQuery(churchId ? churchId.toString() : '', {
        skip: !userData?.church?.id,
    });

    // Fetch ministry details
    const { data: ministry, isLoading: isLoadingMinistry } = useGetMinistryByIdQuery(id || '', {
        skip: !id,
    });

    // Fetch users for this ministry with pagination
    const {
        data: usersData,
        isLoading: isLoadingUsers,
    } = useGetUsersByMinistryQuery(
        {
            ministryId: id || '',
            page: currentPage,
            limit: itemsPerPage,
        },
        {
            skip: !id,
        }
    );

    const users = usersData?.users || [];
    const pagination = usersData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

    // Filter users based on search query
    const filteredUsers = React.useMemo(() => {
        if (!searchQuery) return users;

        const lowerCaseQuery = searchQuery.toLowerCase();
        return users.filter(
            (user: any) =>
                user.firstname?.toLowerCase().includes(lowerCaseQuery) ||
                user.lastname?.toLowerCase().includes(lowerCaseQuery) ||
                user.email?.toLowerCase().includes(lowerCaseQuery) ||
                user.phone?.toLowerCase().includes(lowerCaseQuery)
        );
    }, [users, searchQuery]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleBackClick = () => {
        navigate('/tableau-de-bord/admin/ministères');
    };

    const isLoading = isLoadingMinistry || isLoadingUsers;

    return (
        <div className="container mx-auto py-8">
            {isLoading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={handleBackClick}
                            className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            <span>Retour aux {churchData?.option}s</span>
                        </button>

                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Membres du {churchData?.option}: {ministry?.name}
                                </h1>
                                {ministry?.description && (
                                    <p className="text-gray-600 mt-2">{ministry.description}</p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600">
                                    {pagination.total} membre{pagination.total > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Rechercher un membre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Membre
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Téléphone
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rôle
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date d'adhésion
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                <div className="flex flex-col items-center justify-center py-12">
                                                    <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
                                                    <p className="text-gray-500">
                                                        {searchQuery
                                                            ? 'Aucun membre trouvé pour cette recherche'
                                                            : `Aucun membre dans ce ${churchData?.option}`}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user: any) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.firstname?.charAt(0).toUpperCase() || 'U'}
                                                            {user.lastname?.charAt(0).toUpperCase() || ''}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.firstname} {user.lastname}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                        {user.email || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                        {user.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'LEADER'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {user.role || 'MEMBER'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.createdAt
                                                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })
                                                        : 'Date inconnue'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 0 && (
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                                        <span className="text-sm font-medium text-gray-700">
                                            Affichage de <span className="text-purple-600 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                                            <span className="text-purple-600 font-bold">
                                                {Math.min(currentPage * itemsPerPage, pagination.total)}
                                            </span>{' '}
                                            sur <span className="text-purple-600 font-bold">{pagination.total}</span> membre{pagination.total > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Précédent
                                    </button>

                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                                ? 'bg-teal-600 text-white'
                                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
                                        disabled={currentPage === pagination.totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
