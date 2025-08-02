import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO, isValid, parse, differenceInDays, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect } from 'react';

// Style pour le DatePicker
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker-popper {
    z-index: 9999 !important;
    position: absolute;
  }
  .react-datepicker {
    font-family: inherit;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
  }
  .datepicker-popper {
    z-index: 9999 !important;
  }
`;
// Import API hooks
import { useGetUserByTokenQuery, useGetUpcomingBirthdaysQuery } from '../../store/services/authApi';

interface BirthdayUser {
  id: string;
  firstname: string;
  lastname: string;
  birthDate?: string;
  picture?: string;
  daysUntilBirthday?: number;
  age?: number;
}

const Anniversaire: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Injecter les styles CSS pour le DatePicker
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = datePickerStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Get current user to get churchId
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetUserByTokenQuery();
  
  // Fetch upcoming birthdays
  const { data: birthdaysData, isLoading: isBirthdaysLoading, error: birthdaysError, refetch } = 
    useGetUpcomingBirthdaysQuery(
      { churchId: currentUser?.church?.id || '', days: 365 },
      { skip: !currentUser?.church?.id }
    );

  // Calculate age from birthDate
  const calculateAge = (birthDate: string | undefined): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date to display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parse date from various formats
  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    
    // Try parsing ISO format (YYYY-MM-DD)
    let date = parseISO(dateString);
    if (isValid(date)) return date;
    
    // Try parsing DD-MM-YYYY format
    date = parse(dateString, 'dd-MM-yyyy', new Date());
    if (isValid(date)) return date;
    
    // Try parsing MM/DD/YYYY format
    date = parse(dateString, 'MM/dd/yyyy', new Date());
    if (isValid(date)) return date;
    
    return null;
  };

  // Calculate days until next birthday
  const calculateDaysUntilBirthday = (birthDate: string | undefined): number => {
    if (!birthDate) return 999; // Large number for sorting
    
    const today = new Date();
    const parsedBirthDate = parseDate(birthDate);
    
    if (!parsedBirthDate) return 999;
    
    // Create this year's birthday
    const thisYearBirthday = new Date(today.getFullYear(), parsedBirthDate.getMonth(), parsedBirthDate.getDate());
    
    // If birthday has passed this year, use next year's birthday
    if (today > thisYearBirthday) {
      const nextYearBirthday = addYears(thisYearBirthday, 1);
      return differenceInDays(nextYearBirthday, today);
    }
    
    return differenceInDays(thisYearBirthday, today);
  };

  // Process birthdays data
  const processedBirthdays = useMemo(() => {
    if (!birthdaysData) return [];
    
    return birthdaysData.map((user) => ({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      birthDate: user.birthDate,
      picture: user.picture,
      daysUntilBirthday: calculateDaysUntilBirthday(user.birthDate),
      age: calculateAge(user.birthDate)
    }));
  }, [birthdaysData]);

  // Filter birthdays based on search query and selected date
  const filteredBirthdays = useMemo(() => {
    if (!processedBirthdays) return [];
    
    let filtered = processedBirthdays;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstname?.toLowerCase().includes(query) ||
          user.lastname?.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected date
    if (selectedDate) {
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      
      filtered = filtered.filter((user) => {
        const birthDate = parseDate(user.birthDate);
        if (!birthDate) return false;
        
        return birthDate.getMonth() === selectedMonth && birthDate.getDate() === selectedDay;
      });
    }
    
    // Sort by days until birthday
    return filtered.sort((a, b) => (a.daysUntilBirthday || 999) - (b.daysUntilBirthday || 999));
  }, [processedBirthdays, searchQuery, selectedDate]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Render birthday card
  const BirthdayCard = ({ user }: { user: BirthdayUser }) => {
    const birthDate = parseDate(user.birthDate);
    const formattedBirthDate = formatDate(user.birthDate);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-indigo-100 hover:shadow-lg transition-all duration-200">
        <div className="flex p-5">
          <div className="flex-shrink-0">
            {user.picture ? (
              <img
                src={`http://localhost:4000${user.picture}`}
                alt={`${user.firstname} ${user.lastname}`}
                className="h-20 w-20 rounded-full object-cover border-2 border-indigo-200 shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200 shadow">
                <UserIcon className="h-10 w-10 text-indigo-500" />
              </div>
            )}
          </div>
          <div className="ml-5 flex-1">
            <h3 className="text-xl font-bold text-indigo-900">
              {user.firstname} {user.lastname}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" />
              <span className="font-medium">{formattedBirthDate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <CakeIcon className="h-5 w-5 mr-2 text-indigo-500" />
              <span className="font-medium">{user.age} ans</span>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between">
            {user.daysUntilBirthday !== undefined && user.daysUntilBirthday === 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200 shadow-sm">
                Aujourd'hui 🎉
              </span>
            ) : user.daysUntilBirthday !== undefined && user.daysUntilBirthday <= 7 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                {user.daysUntilBirthday} jour{user.daysUntilBirthday !== 1 ? 's' : ''}
              </span>
            ) : user.daysUntilBirthday !== undefined ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                {user.daysUntilBirthday} jour{user.daysUntilBirthday !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">
                Date inconnue
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-2 overflow-visible">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anniversaires</h1>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          Rafraîchir
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative rounded-lg shadow-md max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-indigo-500" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-2 border-indigo-200 rounded-lg bg-white shadow-inner"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-w-xs relative z-10">
              <div className="relative rounded-lg shadow-md w-full overflow-visible">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20 bg-transparent">
                  <CalendarIcon className="h-6 w-6 text-indigo-500" />
                </div>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM"
                  placeholderText="Sélectionner une date"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 py-3 sm:text-sm border-2 border-indigo-200 rounded-lg bg-white shadow-inner"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale={fr}
                  isClearable
                  popperClassName="datepicker-popper"
                  popperModifiers={[
                    // {
                    //   name: 'preventOverflow',
                    //   // enabled: true,
                    //   options: {
                    //     rootBoundary: 'viewport',
                    //     padding: 8
                    //   },
                    //   phase: 'main',
                    //   fn: ({ state }) => state
                    // }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isCurrentUserLoading || isBirthdaysLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-600"></div>
              <span className="ml-3 text-indigo-700 font-medium">Chargement...</span>
            </div>
          ) : birthdaysError ? (
            <div className="text-center py-12 bg-red-50 rounded-lg">
              <p className="text-red-600 mb-4 font-medium">Une erreur est survenue lors du chargement des anniversaires.</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Réessayer
              </button>
            </div>
          ) : filteredBirthdays.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              {selectedDate ? (
                <p className="text-gray-600 font-medium">Aucun anniversaire trouvé pour cette date.</p>
              ) : searchQuery ? (
                <p className="text-gray-600 font-medium">Aucun résultat trouvé pour <span className="font-bold text-indigo-600">"{searchQuery}"</span>.</p>
              ) : (
                <p className="text-gray-600 font-medium">Aucun anniversaire à venir.</p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-indigo-800 mb-6 border-b-2 border-indigo-100 pb-2">
                {selectedDate
                  ? `Anniversaires du ${format(selectedDate, 'dd MMMM', { locale: fr })}`
                  : 'Anniversaires à venir'}
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {filteredBirthdays.length}
                </span>
              </h2>
              <div className="space-y-6">
                {filteredBirthdays.map((user) => (
                  <BirthdayCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Anniversaire;