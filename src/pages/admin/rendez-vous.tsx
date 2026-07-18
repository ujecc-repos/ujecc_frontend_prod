import { useNavigate } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon, ClockIcon, CalendarIcon, UserIcon, DocumentTextIcon, EyeIcon, TrashIcon, EllipsisVerticalIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useGetAppointmentsByChurchQuery, useDeleteAppointmentMutation } from '../../store/services/appointmentApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { Fragment, useState } from 'react';

// Types
interface Appointment {
  id: string;
  name: string;
  visibility: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  externalParticipants?: string | null;
  assignedUsers: User[];
  churchId?: string;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  profileImage?: string;
}

const getExternalParticipantNames = (value?: string | null) =>
  value
    ?.split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean) ?? [];

const getAppointmentDateTime = (appointment: Pick<Appointment, 'date' | 'time'>) => {
  const datePart = appointment.date?.slice(0, 10);
  const dateMatch = datePart?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const [, year, month, day] = dateMatch;
  const timeMatch = appointment.time?.match(/^(\d{1,2}):(\d{2})/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  const value = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);

  return Number.isNaN(value.getTime()) ? null : value;
};

const formatAppointmentDate = (appointment: Pick<Appointment, 'date' | 'time'>) => {
  const value = getAppointmentDateTime(appointment);
  if (!value) return 'Date non définie';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
};

const appointmentIsCompleted = (appointment: Pick<Appointment, 'date' | 'time'>) => {
  const value = getAppointmentDateTime(appointment);
  return value ? value.getTime() < Date.now() : false;
};

// const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({ isOpen, onClose, onSubmit, users, churchId }) => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState<CreateAppointmentFormData>({
//     name: '',
//     visibility: 'public',
//     description: '',
//     date: '',
//     time: '',
//     duration: '30',
//     notes: '',
//     userIds: [],
//     churchId,
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleUserSelection = (userId: string) => {
//     setFormData(prev => {
//       const userIds = prev.userIds.includes(userId)
//         ? prev.userIds.filter(id => id !== userId)
//         : [...prev.userIds, userId];
//       return { ...prev, userIds };
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   const nextStep = () => setStep(prev => prev + 1);
//   const prevStep = () => setStep(prev => prev - 1);

//   return (
//     <Transition appear show={isOpen} as={Fragment}>
//       <Dialog as="div" className="relative z-10" onClose={onClose}>
//         <Transition.Child
//           as={Fragment}
//           enter="ease-out duration-300"
//           enterFrom="opacity-0"
//           enterTo="opacity-100"
//           leave="ease-in duration-200"
//           leaveFrom="opacity-100"
//           leaveTo="opacity-0"
//         >
//           <div className="fixed inset-0 bg-black bg-opacity-25" />
//         </Transition.Child>

//         <div className="fixed inset-0 overflow-y-auto">
//           <div className="flex min-h-full items-center justify-center p-4 text-center">
//             <Transition.Child
//               as={Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 scale-95"
//               enterTo="opacity-100 scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 scale-100"
//               leaveTo="opacity-0 scale-95"
//             >
//               <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
//                 <div className="flex justify-between items-center mb-4">
//                   <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
//                     {step === 1 ? 'Créer un rendez-vous - Détails' : step === 2 ? 'Créer un rendez-vous - Date et heure' : 'Créer un rendez-vous - Participants'}
//                   </Dialog.Title>
//                   <button
//                     type="button"
//                     className="text-gray-400 hover:text-gray-500"
//                     onClick={onClose}
//                   >
//                     <XMarkIcon className="h-6 w-6" aria-hidden="true" />
//                   </button>
//                 </div>

//                 <form onSubmit={handleSubmit}>
//                   {step === 1 && (
//                     <div className="space-y-4">
//                       <div>
//                         <label htmlFor="name" className="block text-sm font-medium text-gray-700">Titre</label>
//                         <input
//                           type="text"
//                           id="name"
//                           name="name"
//                           value={formData.name}
//                           onChange={handleChange}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                           required
//                         />
//                       </div>

//                       <div>
//                         <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
//                         <textarea
//                           id="description"
//                           name="description"
//                           value={formData.description}
//                           onChange={handleChange}
//                           rows={3}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                         />
//                       </div>

//                       <div>
//                         <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">Visibilité</label>
//                         <select
//                           id="visibility"
//                           name="visibility"
//                           value={formData.visibility}
//                           onChange={handleChange}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                         >
//                           <option value="public">Public</option>
//                           <option value="private">Privé</option>
//                         </select>
//                       </div>

//                       <div>
//                         <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
//                         <textarea
//                           id="notes"
//                           name="notes"
//                           value={formData.notes}
//                           onChange={handleChange}
//                           rows={2}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                         />
//                       </div>
//                     </div>
//                   )}

//                   {step === 2 && (
//                     <div className="space-y-4">
//                       <div>
//                         <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
//                         <input
//                           type="date"
//                           id="date"
//                           name="date"
//                           value={formData.date}
//                           onChange={handleChange}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                           required
//                         />
//                       </div>

//                       <div>
//                         <label htmlFor="time" className="block text-sm font-medium text-gray-700">Heure</label>
//                         <input
//                           type="time"
//                           id="time"
//                           name="time"
//                           value={formData.time}
//                           onChange={handleChange}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                           required
//                         />
//                       </div>

//                       <div>
//                         <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durée (minutes)</label>
//                         <select
//                           id="duration"
//                           name="duration"
//                           value={formData.duration}
//                           onChange={handleChange}
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//                         >
//                           <option value="15">15 minutes</option>
//                           <option value="30">30 minutes</option>
//                           <option value="45">45 minutes</option>
//                           <option value="60">1 heure</option>
//                           <option value="90">1 heure 30 minutes</option>
//                           <option value="120">2 heures</option>
//                         </select>
//                       </div>
//                     </div>
//                   )}

//                   {step === 3 && (
//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
//                         <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
//                           {users.length > 0 ? (
//                             users.map(user => (
//                               <div key={user.id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
//                                 <input
//                                   type="checkbox"
//                                   id={`user-${user.id}`}
//                                   checked={formData.userIds.includes(user.id)}
//                                   onChange={() => handleUserSelection(user.id)}
//                                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                                 />
//                                 <label htmlFor={`user-${user.id}`} className="ml-3 block text-sm font-medium text-gray-700">
//                                   {user.firstname} {user.lastname} ({user.email})
//                                 </label>
//                               </div>
//                             ))
//                           ) : (
//                             <p className="text-sm text-gray-500 py-2">Aucun utilisateur disponible</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="mt-6 flex justify-between">
//                     {step > 1 ? (
//                       <button
//                         type="button"
//                         onClick={prevStep}
//                         className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//                       >
//                         Précédent
//                       </button>
//                     ) : (
//                       <div></div>
//                     )}

//                     {step < 3 ? (
//                       <button
//                         type="button"
//                         onClick={nextStep}
//                         className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//                       >
//                         Suivant
//                       </button>
//                     ) : (
//                       <button
//                         type="submit"
//                         className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//                       >
//                         Créer
//                       </button>
//                     )}
//                   </div>
//                 </form>
//               </Dialog.Panel>
//             </Transition.Child>
//           </div>
//         </div>
//       </Dialog>
//     </Transition>
//   );
// };

// View Appointment Modal Component
interface ViewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const ViewAppointmentModal: React.FC<ViewAppointmentModalProps> = ({ isOpen, onClose, appointment }) => {
  if (!appointment) return null;

  const isCompleted = appointmentIsCompleted(appointment);
  const externalParticipantNames = getExternalParticipantNames(appointment.externalParticipants);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-[1px]" />
        </Transition.Child>

        <div className="fixed inset-0 z-[201] overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 py-6 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl transform flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left align-middle shadow-2xl shadow-slate-900/15 transition-all">
                <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-gradient-to-r from-teal-50 via-white to-white px-6 py-5 sm:px-8">
                  <div className="flex min-w-0 items-center">
                    <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
                      <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700">Détails du rendez-vous</p>
                      <Dialog.Title as="h3" className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
                        {appointment.name}
                      </Dialog.Title>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onClick={onClose}
                    aria-label="Fermer"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="overflow-y-auto px-6 py-6 sm:px-8">
                  <div className={`mb-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    <div className={`mr-1.5 h-2 w-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-yellow-600'}`}></div>
                    {isCompleted ? 'Complété' : 'En attente'}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Date</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatAppointmentDate(appointment)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <ClockIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Heure et durée</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {appointment.time || 'Heure non définie'}
                          {appointment.duration ? ` (${appointment.duration} minutes)` : ''}
                        </p>
                      </div>
                    </div>

                    {appointment.description && (
                      <div className="flex items-start rounded-xl border border-slate-200 p-4 sm:col-span-2">
                        <DocumentTextIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Description</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{appointment.description}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start rounded-xl border border-slate-200 p-4">
                      <EyeIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Visibilité</p>
                        <div className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium ${appointment.visibility === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          <div className={`mr-1.5 h-2 w-2 rounded-full ${appointment.visibility === 'public' ? 'bg-blue-600' : 'bg-purple-600'}`}></div>
                          {appointment.visibility === 'public' ? 'Public' : 'Privé'}
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="flex items-start rounded-xl border border-slate-200 p-4">
                        <DocumentTextIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{appointment.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start rounded-xl border border-slate-200 p-4 sm:col-span-2">
                      <UserIcon className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">Participants</p>
                        {appointment.assignedUsers && appointment.assignedUsers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {appointment.assignedUsers.map(user => (
                              <div key={user.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mr-1">
                                  <UserIcon className="h-4 w-4 text-teal-600" aria-hidden="true" />
                                </div>
                                <span className="text-xs text-gray-700">{user.firstname} {user.lastname}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {externalParticipantNames.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Participants externes</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {externalParticipantNames.map((name, index) => (
                                <span key={`${name}-${index}`} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs text-teal-800">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(!appointment.assignedUsers?.length && !externalParticipantNames.length) && (
                          <p className="text-sm text-gray-500">Aucun participant</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    className="inline-flex min-w-24 justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Delete Appointment Modal Component
interface DeleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointmentName: string;
}

const DeleteAppointmentModal: React.FC<DeleteAppointmentModalProps> = ({ isOpen, onClose, onConfirm, appointmentName }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                       <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                     </div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Supprimer le rendez-vous
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-700">
                    Êtes-vous sûr de vouloir supprimer le rendez-vous <span className="font-medium">{appointmentName}</span> ? Cette action est irréversible.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    onClick={onConfirm}
                  >
                    Supprimer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Main Component
const RendezVous: React.FC = () => {
  const navigate = useNavigate();
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointmentsData, isLoading: isLoadingAppointments, refetch: refetchAppointments } = 
    useGetAppointmentsByChurchQuery(churchId, { skip: !churchId });
  // const { data: usersData,  } = useGetUsersByChurchQuery(churchId, { skip: !churchId });
  // const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
  const [deleteAppointment] = useDeleteAppointmentMutation();

  const appointments = appointmentsData || [];
  // const users = usersData || [];

  // Filter appointments based on search query and upcoming filter
  const filteredAppointments = appointments.filter(appointment => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch = appointment.name.toLowerCase().includes(normalizedSearch) ||
      appointment.description?.toLowerCase().includes(normalizedSearch) ||
      appointment.externalParticipants?.toLowerCase().includes(normalizedSearch);
    
    if (showUpcoming) {
      const appointmentDate = getAppointmentDateTime(appointment);
      return matchesSearch && Boolean(appointmentDate && appointmentDate.getTime() >= Date.now());
    }
    
    return matchesSearch;
  });

  // Sort appointments by date (newest first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = getAppointmentDateTime(a)?.getTime() ?? 0;
    const dateB = getAppointmentDateTime(b)?.getTime() ?? 0;
    return dateB - dateA;
  });

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await deleteAppointment(selectedAppointment.id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
      refetchAppointments();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  };

  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="mt-2 text-sm text-gray-600">
            Liste des rendez-vous programmés pour votre église.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tableau-de-bord/rendez-vous/creation')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto transition-colors"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Ajouter un rendez-vous
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative max-w-xs w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-teal-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                  placeholder="Rechercher un rendez-vous"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-white px-3 py-2 rounded-md border border-gray-300 shadow-sm">
                <input
                  id="upcoming"
                  name="upcoming"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                />
                <label htmlFor="upcoming" className="ml-2 block text-sm text-gray-700">
                  Afficher uniquement les rendez-vous à venir
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {isLoadingAppointments ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                </div>
              ) : sortedAppointments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibilité</th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAppointments.map((appointment) => {
                      const isCompleted = appointmentIsCompleted(appointment);
                      const formattedDate = formatAppointmentDate(appointment);

                      return (
                        <tr 
                          key={appointment.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => openViewModal(appointment)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <CalendarIcon className="h-6 w-6 text-teal-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{appointment.name}</div>
                                <div className="text-sm text-gray-500">{appointment.description?.substring(0, 50)}{appointment.description?.length > 50 ? '...' : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{appointment.time || 'Heure non définie'}</span>
                              {appointment.duration && <span className="ml-1">· {appointment.duration} min</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              <span className={`mr-1.5 h-2 w-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-yellow-500'}`} />
                              {isCompleted ? 'Complété' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const participantNames = [
                                ...(appointment.assignedUsers ?? []).map((user) => `${user.firstname} ${user.lastname}`),
                                ...getExternalParticipantNames(appointment.externalParticipants),
                              ];

                              return participantNames.length ? (
                              <div className="max-w-xs">
                                <div
                                  className="truncate text-sm font-medium text-gray-900"
                                  title={participantNames.join(', ')}
                                >
                                  {participantNames.slice(0, 2).join(', ')}
                                  {participantNames.length > 2 && ` +${participantNames.length - 2}`}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {participantNames.length} participant{participantNames.length > 1 ? 's' : ''}
                                </div>
                              </div>
                              ) : (
                              <span className="text-sm text-gray-500">Aucun participant</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${appointment.visibility === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {appointment.visibility === 'public' ? 'Public' : 'Privé'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Menu as="div" className="relative inline-block text-left">
                              <Menu.Button 
                                className="flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </Menu.Button>
                              <Menu.Items
                                anchor="bottom end"
                                portal
                                modal={false}
                                transition
                                className="z-[100] w-48 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black/5 focus:outline-none [--anchor-gap:0.5rem] transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
                              >
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openViewModal(appointment);
                                        }}
                                        className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                      >
                                        <EyeIcon className="mr-3 h-4 w-4 text-gray-400" />
                                        Voir détails
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openDeleteModal(appointment);
                                        }}
                                        className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left`}
                                      >
                                        <TrashIcon className="mr-3 h-4 w-4 text-red-400" />
                                        Supprimer
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Menu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 bg-white">
                  <div className="rounded-full bg-teal-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun rendez-vous</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">Vous n'avez pas encore créé de rendez-vous pour votre église. Commencez par créer un nouveau rendez-vous.</p>
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => navigate('/tableau-de-bord/rendez-vous/creation')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Ajouter un rendez-vous
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* We're no longer using the CreateAppointmentModal as we've created a dedicated page */}

      <ViewAppointmentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        appointment={selectedAppointment}
      />

      <DeleteAppointmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAppointment}
        appointmentName={selectedAppointment?.name || ''}
      />
    </div>
  );
};

export default RendezVous;
