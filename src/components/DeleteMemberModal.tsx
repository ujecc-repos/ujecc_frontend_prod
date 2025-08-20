import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
  picture?: string;
}

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onDelete: (memberId: string) => Promise<void>;
  isLoading?: boolean;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onDelete,
  isLoading = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!member) return;

    try {
      setIsDeleting(true);
      await onDelete(member.id);
      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);
      // You can add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  if (!member) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black-100 bg-opacity-80 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Dialog.Title className="mt-3 text-lg font-semibold text-white text-center">
                    Supprimer le membre
                  </Dialog.Title>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {/* Member Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0">
                      {member.picture ? (
                        <img
                          src={`https://ujecc-backend.onrender.com${member.picture}`}
                          alt={`${member.firstname} ${member.lastname}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.firstname} {member.lastname}
                      </h3>
                      {member.email && (
                        <p className="text-sm text-gray-500">{member.email}</p>
                      )}
                      {member.role && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          Attention : Cette action est irréversible
                        </h4>
                        <p className="text-sm text-red-700">
                          Êtes-vous sûr de vouloir supprimer définitivement ce membre ? 
                          Toutes les données associées seront perdues.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isDeleting || isLoading}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || isLoading}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isDeleting || isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Supprimer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteMemberModal;