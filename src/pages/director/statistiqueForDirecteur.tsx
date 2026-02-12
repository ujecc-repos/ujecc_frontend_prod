import React, { useEffect, useState, useMemo } from 'react';
import { useGetMissionByPresidentQuery } from '../../store/services/mission';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { 
  UserIcon, 
  BuildingLibraryIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  HeartIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleValue?: string | number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, value, subtitle, subtitleValue, icon, color }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-20 mr-4`}>
          {icon}
        </div>
        <span className="text-gray-600 text-sm">{title}</span>
      </div>
      <div className="px-3 text-2xl font-bold mb-2">{value}</div>
      {subtitle && (
        <div className="flex items-center mt-2">
          <span className="text-gray-500 text-xs mr-1">{subtitle}</span>
          <span className="text-xs font-medium" style={{ color }}>{subtitleValue}</span>
        </div>
      )}
    </div>
  );
};

export const StatistiqueForDirecteur = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { data: userData, isLoading: isUserDataLoading } = useGetUserByTokenQuery();
  
  // Get mission data by president name using firstname and lastname from userData
  const presidentName = userData ? `${userData.firstname}${userData.lastname}` : '';
  const { data: missionData, isLoading: isMissionDataLoading } = useGetMissionByPresidentQuery(
    { presidentName },
    { skip: isUserDataLoading || !presidentName }
  );
  
  // Check if any data is still loading
  useEffect(() => {
    if (isUserDataLoading || isMissionDataLoading) {
      setIsLoading(true);
    } else {
      // Only set loading to false if we have userData and missionData
      if (userData && missionData) {
        setIsLoading(false);
      }
    }
  }, [isUserDataLoading, isMissionDataLoading, userData, missionData]);
  
  // Calculate counts from mission statistics
  const baptismsCount = useMemo(() => 
    missionData?.statistics?.totalBaptisms || 0, 
    [missionData]
  );
  const funeralsCount = useMemo(() => 
    missionData?.statistics?.totalFunerals || 0, 
    [missionData]
  );
  const transfersCount = useMemo(() => 
    missionData?.statistics?.totalTransfers || 0, 
    [missionData]
  );
  
  // Get mission statistics
  const totalChurches = useMemo(() => 
    missionData?.statistics?.totalChurches || 0, 
    [missionData]
  );
  const totalMembers = useMemo(() => 
    missionData?.statistics?.totalMembers || 0, 
    [missionData]
  );
  const totalPastors = useMemo(() => 
    missionData?.statistics?.totalPastors || 0, 
    [missionData]
  );
  const totalRevenue = useMemo(() => 
    missionData?.statistics?.totalRevenue || 0, 
    [missionData]
  );
  const totalExpenses = useMemo(() => 
    missionData?.statistics?.totalExpenses || 0, 
    [missionData]
  );
  
  // Calculate church-specific statistics
  const marriagesCount = useMemo(() => {
    if (!missionData?.churches) return 0;
    
    return missionData.churches.reduce((total, church) => {
      return total + (church.statistics?.sacraments?.marriagesTotal || 0);
    }, 0);
  }, [missionData]);

  return (
    <div className="container mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bienvenue 👏</h1>
            <h2 className="text-xl text-gray-600">Tableau de bord global</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
           
              <MetricCard
                title="Églises"
                value={totalChurches || `0`}
                icon={<BuildingLibraryIcon className="h-6 w-6 text-teal-500" />}
                color="text-teal-500"
              />
          
            {totalMembers > 0 && (
              <MetricCard
                title="Membres"
                value={totalMembers}
                icon={<UserGroupIcon className="h-6 w-6 text-red-400" />}
                color="text-red-400"
              />
            )}
           
              <MetricCard
                title="Pasteurs"
                value={totalPastors || "0"}
                icon={<UserIcon className="h-6 w-6 text-teal-400" />}
                color="text-teal-400"
              />

              <MetricCard
                title="Baptêmes"
                value={baptismsCount || "0"}
                icon={<BuildingLibraryIcon className="h-6 w-6 text-yellow-400" />}
                color="text-yellow-400"
              />
              <MetricCard
                title="Décès"
                value={funeralsCount || "0"}
                icon={<BuildingLibraryIcon className="h-6 w-6 text-indigo-500" />}
                color="text-indigo-500"
              />
              <MetricCard
                title="Transferts"
                value={transfersCount || "0"}
                icon={<ArrowsRightLeftIcon className="h-6 w-6 text-indigo-700" />}
                color="text-indigo-700"
              />
              <MetricCard
                title="Revenue"
                value={`${totalRevenue.toLocaleString()}` || "0"}
                icon={<BanknotesIcon className="h-6 w-6 text-green-500" />}
                color="text-green-500"
              />
              <MetricCard
                title="Dépense"
                value={`${totalExpenses.toLocaleString()}` || "0"}
                icon={<CurrencyDollarIcon className="h-6 w-6 text-red-500" />}
                color="text-red-500"
              />
            
              <MetricCard
                title="Mariages"
                value={marriagesCount || "0"}
                icon={<HeartIcon className="h-6 w-6 text-pink-500" />}
                color="text-pink-500"
              />

          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Statistiques de la Mission</h3>
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white">
              <h4 className="text-sm opacity-80 mb-2">{missionData?.missionName || 'Mission'}</h4>
              <div className="text-3xl font-bold mb-1">{totalMembers}</div>
              <div className="text-sm opacity-80">Membres actifs dans {totalChurches} églises</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}