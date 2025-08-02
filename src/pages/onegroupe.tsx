import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, UserIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useGetGroupByIdQuery } from '../store/services/groupApi';
import AddMemberModal from '../components/AddMemberModal';
import { useGetUserByTokenQuery } from '../store/services/authApi';

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  picture?: string;
}

export default function Onegroupe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  const { data: group, isLoading, error } = useGetGroupByIdQuery(id || '');
  const { data: currentUser } = useGetUserByTokenQuery();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Groupe non trouvé ou erreur lors du chargement des données.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/tableau-de-bord/admin/groupes')}
          className="mt-4 flex items-center px-4 py-2 text-sm font-medium text-teal-600 bg-white border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour aux groupes
        </button>
      </div>
    );
  }
  
  return (
    <>
    <div className="max-w-7xl py-2">
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/tableau-de-bord/admin/groupes')}
          className="flex items-center px-4 py-2 text-sm font-medium text-teal-600 bg-white border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour aux groupes
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/tableau-de-bord/admin/groupe/${id}/edit`)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-800 border-1 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ajouter un membre
          </button>
        </div>
      </div>
      
      {/* Group header with image and basic info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4 flex-shrink-0">
            {group.picture ? (
              <img 
                src={`https://api.ujecc.org${group.picture}`} 
                alt={group.name} 
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
            <div className="text-sm text-gray-500 mb-4">
              Créé le {new Date(group.createdAt).toLocaleDateString('fr-FR')}
            </div>
            
            <p className="text-gray-700 mb-4">{group.description || 'Aucune description disponible.'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-gray-700">Responsable: {group.minister || 'Non assigné'}</span>
              </div>
              
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-gray-700">
                  {group.users?.length || 0} membre{(group.users?.length || 0) !== 1 ? 's' : ''}
                  {group.maxMembers ? ` / ${group.maxMembers} max` : ''}
                </span>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-gray-700">
                  {group.meetingDays ? `Réunion: ${group.meetingDays}` : 'Jour de réunion non défini'}
                  {group.meetingFrequency ? ` (${group.meetingFrequency})` : ''}
                </span>
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-gray-700">
                  {group.meetingTime ? `Heure: ${group.meetingTime}` : 'Heure non définie'}
                </span>
              </div>
              
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-gray-700">
                  {group.meetingLocation ? `Lieu: ${group.meetingLocation}` : 'Lieu non défini'}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                  {group.ageGroup || 'Groupe d\'âge non défini'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'members' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Membres ({group.users?.length || 0})
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'info' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du groupe</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Informations générales</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs text-gray-500">Nom du groupe</dt>
                        <dd className="text-sm font-medium text-gray-900">{group.name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Description</dt>
                        <dd className="text-sm text-gray-900">{group.description || 'Aucune description'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Groupe d'âge</dt>
                        <dd className="text-sm text-gray-900">{group.ageGroup || 'Non défini'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Responsable</dt>
                        <dd className="text-sm text-gray-900">{group.minister || 'Non assigné'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Détails des réunions</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs text-gray-500">Jours de réunion</dt>
                        <dd className="text-sm text-gray-900">{group.meetingDays || 'Non défini'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Heure de réunion</dt>
                        <dd className="text-sm text-gray-900">{group.meetingTime || 'Non défini'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Lieu de réunion</dt>
                        <dd className="text-sm text-gray-900">{group.meetingLocation || 'Non défini'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Fréquence</dt>
                        <dd className="text-sm text-gray-900">{group.meetingFrequency || 'Non défini'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Membres du groupe</h3>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center px-3 py-1 text-sm font-medium text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Ajouter un membre
                </button>
              </div>
              
              {group.users && group.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.users.map((member: GroupMember) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {member.picture ? (
                                  <img className="h-10 w-10 rounded-full object-cover" src={`https://api.ujecc.org${member.picture}`} alt="" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.firstName} {member.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || 'Non renseigné'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || 'Non renseigné'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {member.role || 'Membre'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigate(`/tableau-de-bord/admin/person/${member.id}`)}
                              className="text-teal-600 hover:text-teal-900 mr-3"
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre dans ce groupe</h3>
                  <p className="text-gray-500 mb-4">Commencez à ajouter des membres à ce groupe.</p>
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    Ajouter un membre
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Add Member Modal */}
    {currentUser && currentUser.church && group && (
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        group={group}
        churchId={currentUser.church.id}
      />
    )}
    </>
  )
}