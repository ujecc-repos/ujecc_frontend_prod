import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { useGetUsersByChurchQuery, useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetChurchByIdQuery } from '../../store/services/churchApi';
import type { Ministry } from '../../store/services/ministryApi';

interface AssignUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: string) => void;
    isLoading: boolean;
    ministry: Ministry | null;
}

interface Church {
    id?: string | number;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    picture?: string;
    anthem?: string;
    facebook?: string;
    instagram?: string;
    option?: string;
    whatsapp?: string;
    [key: string]: any;
}

interface UserOption {
    value: string;
    label: string;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    ministry,
}) => {
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [error, setError] = useState('');

    const { data: userData } = useGetUserByTokenQuery();
    const churchId = userData?.church?.id;

    const { data: churchData } = useGetChurchByIdQuery(churchId ? churchId.toString() : '', {
        skip: !userData?.church?.id,
    }) as { data: Church | undefined, isLoading: boolean };

    // Fetch all users from the same church
    const { data: users = [], isLoading: usersLoading } = useGetUsersByChurchQuery(
        churchId ? churchId.toString() : '',
        { skip: !churchId }
    );

    // Transform users to react-select options
    const userOptions: UserOption[] = React.useMemo(() => {
        return users.map((user) => ({
            value: user.id,
            label: `${user.firstname} ${user.lastname}${user.email ? ` (${user.email})` : ''}`,
        }));
    }, [users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) {
            setError('Veuillez sélectionner un utilisateur');
            return;
        }

        onSubmit(selectedUser.value);
        resetForm();
    };

    const resetForm = () => {
        setSelectedUser(null);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Custom styles for react-select
    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderColor: error ? '#ef4444' : state.isFocused ? '#14b8a6' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#14b8a6' : '#d1d5db',
            },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? '#14b8a6'
                : state.isFocused
                    ? '#ccfbf1'
                    : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer',
        }),
        menu: (provided: any) => ({
            ...provided,
            zIndex: 9999,
        }),
        menuList: (provided: any) => ({
            ...provided,
            maxHeight: '300px',
        }),
        menuPortal: (provided: any) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <UserPlusIcon className="h-6 w-6 text-teal-600" />
                                            <span>Assigner un utilisateur</span>
                                        </div>
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={handleClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                {ministry && (
                                    <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                                        <p className="text-sm text-gray-700">
                                            {churchData?.option}: <span className="font-semibold text-teal-700">{ministry.name}</span>
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        {/* User Selection with React-Select */}
                                        <div>
                                            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                                                Sélectionner un utilisateur <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                id="user"
                                                options={userOptions}
                                                value={selectedUser}
                                                onChange={(option) => {
                                                    setSelectedUser(option);
                                                    setError('');
                                                }}
                                                isLoading={usersLoading}
                                                isDisabled={usersLoading}
                                                isClearable
                                                isSearchable
                                                placeholder={usersLoading ? 'Chargement...' : 'Rechercher et sélectionner un utilisateur...'}
                                                noOptionsMessage={() => 'Aucun utilisateur trouvé'}
                                                loadingMessage={() => 'Chargement...'}
                                                styles={customStyles}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                            />
                                            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                            onClick={handleClose}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isLoading || usersLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Attribution en cours...
                                                </>
                                            ) : (
                                                'Assigner'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AssignUserModal;
