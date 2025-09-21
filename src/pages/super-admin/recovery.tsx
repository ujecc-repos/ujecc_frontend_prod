import React, {useState, useMemo} from 'react'
import { useGetChurchesQuery, useAddUserToChurchMutation } from '../../store/services/churchApi';
import { useGetMembersRecoveryQuery } from '../../store/services/authApi';
import { toast, ToastContainer } from 'react-toastify';
import Select from 'react-select';

interface AddUserToChurchFormData {
  userId: string;
  churchId: string;
}

export default function Recovery() {

    const [addUserToChurch] = useAddUserToChurchMutation();
    const [addUserToChurchFormData, setAddUserToChurchFormData] = useState<AddUserToChurchFormData>({
    userId: '',
    churchId: ''
  });
  const { data: users, refetch: refetchUsers } = useGetMembersRecoveryQuery();
    const { data: churches } = useGetChurchesQuery();
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

   // Loading state for add user to church
  const [isAddUserToChurchLoading, setIsAddUserToChurchLoading] = useState<boolean>(false);
  
  // Form errors for add user to church
  const [addUserToChurchErrors, setAddUserToChurchErrors] = useState<Record<string, string>>({});
  
  // Filter users based on date and church association
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Filter out users who already have a church
      if (user.church) return false;
      
      // Apply date filter
      if (selectedDateFilter === 'all') return true;
      
      if (!user.createdAt) return false;
      
      // Extract date part only (YYYY-MM-DD) from ISO string
      const userDateOnly = new Date(user.createdAt).toISOString().split('T')[0];
      
      return userDateOnly === selectedDateFilter;
    });
  }, [users, selectedDateFilter]);

  // Transform filtered users for react-select
  const userOptions = useMemo(() => {
    const message = "pas d'église"
    if (!filteredUsers) return [];
    return filteredUsers.map(user => {
      // Format creation time to show hours and minutes
      let timeString = '';
      if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        const hours = createdDate.getHours();
        const minutes = createdDate.getMinutes();
        
        if (minutes === 0) {
          timeString = `${hours}h`;
        } else {
          timeString = `${hours}h ${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      return {
        value: user.id,
        label: `${user.firstname} ${user.lastname} (${message}) ${timeString}`
      };
    });
  }, [filteredUsers]);

  // Generate date options from available users
  const dateOptions = useMemo(() => {
    if (!users) return [{ value: 'all', label: 'Toutes les dates' }];
    
    const dates = users
      .filter(user => !user.church && user.createdAt) // Only users without church and with createdAt
      .map(user => {
        const date = new Date(user.createdAt!);
        return {
          value: date.toISOString().split('T')[0], // YYYY-MM-DD format
          label: date.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        };
      })
      .filter((date, index, self) => 
        index === self.findIndex(d => d.value === date.value)
      ) // Remove duplicates
      .sort((a, b) => new Date(b.value).getTime() - new Date(a.value).getTime()); // Sort by date descending
    
    return [{ value: 'all', label: 'Toutes les dates' }, ...dates];
  }, [users]);

  // Transform churches for react-select
  const churchOptions = useMemo(() => {
    if (!churches) return [];
    return churches.map(church => ({
      value: church.id,
      label: church.name
    }));
  }, [churches]);

    const validateAddUserToChurchForm = () => {
    const errors: Record<string, string> = {};
    if (!addUserToChurchFormData.userId) errors.userId = 'L\'utilisateur est requis';
    if (!addUserToChurchFormData.churchId) errors.churchId = 'L\'église est requise';
    
    setAddUserToChurchErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleAddUserToChurchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddUserToChurchForm()) return;
    
    setIsAddUserToChurchLoading(true);
    try {
      const { userId, churchId } = addUserToChurchFormData;
      await addUserToChurch({ userId, churchId }).unwrap();
      toast.success('Utilisateur ajouté à l\'église avec succès!');
      
      // Refetch users to update the list immediately
      await refetchUsers();
      
      // Reset form
      setAddUserToChurchFormData({
        userId: '',
        churchId: ''
      });
    } catch (error) {
      console.error('Error adding user to church:', error);
      toast.error('Erreur lors de l\'ajout de l\'utilisateur à l\'église');
    } finally {
      setIsAddUserToChurchLoading(false);
    }
  };

  return (
    <div>
    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ajouter un Utilisateur à une Église</h2>
            
            <form onSubmit={handleAddUserToChurchSubmit} className="space-y-6">
              {/* Date Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par date de création</label>
                <Select
                  value={dateOptions.find(option => option.value === selectedDateFilter)}
                  onChange={(selectedOption: any) => setSelectedDateFilter(selectedOption?.value || 'all')}
                  options={dateOptions}
                  placeholder="Sélectionner une date"
                  isClearable={false}
                  isSearchable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
                  <Select
                    value={userOptions.find(option => option.value === addUserToChurchFormData.userId)}
                    onChange={(selectedOption: any) => setAddUserToChurchFormData(prev => ({ ...prev, userId: selectedOption?.value || '' }))}
                    options={userOptions}
                    placeholder="Sélectionner un utilisateur"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {addUserToChurchErrors.userId && <p className="mt-1 text-sm text-red-600">{addUserToChurchErrors.userId}</p>}
                </div>
                
                {/* Church Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Église</label>
                  <Select
                    value={churchOptions.find(option => option.value === addUserToChurchFormData.churchId)}
                    onChange={(selectedOption: any) => setAddUserToChurchFormData(prev => ({ ...prev, churchId: selectedOption?.value || '' }))}
                    options={churchOptions}
                    placeholder="Sélectionner une église"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {addUserToChurchErrors.churchId && <p className="mt-1 text-sm text-red-600">{addUserToChurchErrors.churchId}</p>}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isAddUserToChurchLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAddUserToChurchLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ajout en cours...
                    </>
                  ) : (
                    'Ajouter l\'Utilisateur à l\'Église'
                  )}
                </button>
              </div>
            </form>
            <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}