import { Fragment, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Ecclesys from "../assets/Ecclesys 1.png"


import {
  BellIcon,
  CogIcon,
  ArrowPathIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BanknotesIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BuildingLibraryIcon,
  Bars3CenterLeftIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HeartIcon,
  GiftIcon,
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { TfiStatsUp } from "react-icons/tfi";
import { motion } from 'framer-motion';
import { useGetLogoutMutation } from '../store/services/authApi';


const navigation = {
  Admin: [
    { name: 'Tableau de bord', href: '/tableau-de-bord', icon: TfiStatsUp },
    { name: 'Membres', href: '/tableau-de-bord/admin/membres', icon: UserIcon },
    {
      name: 'Groupes',
      href: '/tableau-de-bord/admin/groupes',
      icon: BriefcaseIcon,
    },
    {
      name: 'pasteurs',
      href: '/tableau-de-bord/admin/pasteurs',
      icon: UserGroupIcon,
    },
    {
      name: 'ministères',
      href: '/tableau-de-bord/admin/ministères',
      icon: BuildingLibraryIcon,
    },
    {
      name: 'Évenements',
      href: '/tableau-de-bord/admin/evenements',
      icon: CalendarDaysIcon,
    },
    { name: 'Sanctions', href: '/tableau-de-bord/admin/sanctions', icon: ExclamationTriangleIcon },
    {
      name: 'Mariages',
      href: '/tableau-de-bord/admin/mariages',
      icon: HeartIcon,
    },
    {
      name: 'Funérailles',
      href: '/tableau-de-bord/admin/funerailles',
      icon: UserIcon,
    },
    { name: 'Présentation', href: '/tableau-de-bord/admin/presentation', icon: PresentationChartLineIcon },
    {
      name: 'Baptême',
      href: '/tableau-de-bord/admin/bapteme',
      icon: GiftIcon,
    },
    {
      name: 'Comités',
      href: '/tableau-de-bord/admin/comite',
      icon: UserGroupIcon,
    },
    {
      name: 'École du dimanche',
      href: '/tableau-de-bord/admin/ecole-du-dimanche',
      icon: AcademicCapIcon,
    },
    {
      name: 'Anniversaires',
      href: '/tableau-de-bord/admin/anniversaires',
      icon: GiftIcon,
    },
    {
      name: 'transferts',
      href: '/tableau-de-bord/admin/transferts',
      icon: ArrowsRightLeftIcon,
    },
    // {
    //   name: 'Rendez-vous',
    //   href: '/tableau-de-bord/admin/rendez-vous',
    //   icon: ClockIcon,
    // },
     {
      name: 'Finance complete',
      href: '/tableau-de-bord/admin/finances',
      icon: BanknotesIcon,
    },
     {
      name: 'Dépenses',
      href: '/tableau-de-bord/admin/depense',
      icon: CurrencyDollarIcon,
    },
  ],
  SuperAdmin: [
    { name: 'Tableau de bord', href: '/tableau-de-bord', icon: TfiStatsUp },
    { name: 'Missions', href: '/tableau-de-bord/super-admin/missions', icon: UserIcon },
    { name: 'Gestions', href: '/tableau-de-bord/super-admin/gestions', icon: BuildingLibraryIcon },
  ],
  Directeur: [
    { name: 'Tableau de bord', href: '/tableau-de-bord', icon: TfiStatsUp },
    { name: 'Église', href: "/tableau-de-bord/eglise", icon: BuildingLibraryIcon},
    { name: "pasteurs", href: "/tableau-de-bord/pasteurs", icon: UserIcon}
  ],
};

type UserRole = 'Admin' | 'SuperAdmin' | 'Directeur';

const DashboardLayout = ({ userRole }: {userRole: UserRole}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationCount] = useState(3);
  const [activeTab, setActiveTab] = useState(1)
  const [chatVisible, setChatVisible] = useState(false)
  const [logOut] = useGetLogoutMutation()
  // const { user, logout } = useAuth();
  const user = { name: 'User', email: 'user@example.com' }; // Temporary mock user
  const logout = () => Promise.resolve(); // Temporary mock logout
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    logOut();
    navigate('/connecter');
  };

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-3 overflow-y-auto bg-white pb-4">
                  <div className='px-3 border-b border-gray-200'>
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <img
                      className="h-10 w-auto"
                      src={Ecclesys}
                      alt="Internet Banking"
                    />
                    <div className='pt-[8px]'>
                    <h3 className="text-2xl font-semibold leading-6 text-gray-900">
                      Ecclesys
                    </h3>
                  </div>
                  </div>
                  </div>
                  {/* user profile section */}
                  <div className='px-3 border-b border-gray-200'>
                  <div className="flex  items-center space-x-4 px-2 pb-4 ">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-white relative">
                      <img
                        className="h-10 w-auto rounded-full"
                        src="https://goodnewsmission.eu/wp-content/uploads/2017/03/p_posp.jpg?189db0"
                        alt="User Image"
                      />
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 capitalize">{user?.name}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </div>
                  </div>
                  <div className="px-6 border-b border-gray-200">
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation[userRole].map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${location.pathname === item.href ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}`}
                              >
                                <item.icon
                                  className={`h-6 w-6 shrink-0 ${location.pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`}
                                  aria-hidden="true"
                                />
                                {!sidebarCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {item.name}
                                  </motion.span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <motion.div 
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col`}
        animate={{ width: sidebarCollapsed ? '5rem' : '18rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}>
        <div className="flex grow flex-col gap-y-3 overflow-y-auto border-r border-gray-200 bg-white pb-4">
          {!sidebarCollapsed && <div className='px-4 border-b border-gray-200'>
            <div className="flex h-16 shrink-0 items-center justify-between">
              <img
                className="h-12 w-auto"
                src={Ecclesys}
                alt="Internet Banking"
              />
              <div className='pt-[8px]'>
                <h1 className="text-2xl font-semibold leading-6 text-gray-900">
                  Ecclesys
                </h1>
              </div>
            </div>
          </div>}
          {sidebarCollapsed && <div className='px-2 border-b border-gray-200'><div className="flex h-14 shrink-0 items-center justify-between">
              <img
                className="h-10 w-auto"
                src={Ecclesys}
                alt="Internet Banking"
              />
            </div></div>}
          
          {/* User Profile Section */}
          <div className="px-3 border-b border-gray-200">
          <div className="flex items-center space-x-4 px-2 pb-4 pt-1">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-white relative">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={"https://goodnewsmission.eu/wp-content/uploads/2017/03/p_posp.jpg?189db0"}
                alt="User Image"
              />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></div>
            </div>
            {!sidebarCollapsed && <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 capitalize">{user?.name}</span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>}
          </div>
          </div>

          {/* Navigation Section with Scrollable Content */}
          <div className="flex min-h-[150px] flex-col flex-grow">
            <div className="px-6 flex-grow   overflow-y-auto">
              <nav className="flex flex-col h-full">
                <ul role="list" className="flex flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation[userRole].filter(item => item.name !== 'Logout').map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${location.pathname === item.href ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}`}
                          >
                            <item.icon
                              className={`h-6 w-6 shrink-0 ${location.pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`}
                              aria-hidden="true"
                            />
                            {!sidebarCollapsed && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Fixed Logout Button */}
            <div className="px-4 py-3 border-t border-gray-200 ">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-red-600 bg-red-50 group"
              >
                <ArrowRightOnRectangleIcon
                  className="h-6 w-6 shrink-0 text-red-500 group-hover:text-red-600"
                  aria-hidden="true"
                />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Se Déconnecter
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content with motion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 lg:pl-72"
      >
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3CenterLeftIcon className="h-6 w-6" aria-hidden="true" />
            {/* <Bars3Icon className="h-6 w-6" aria-hidden="true" /> */}
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <motion.button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden mt-[12px] lg:flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                rotate: sidebarCollapsed ? 180 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {/* <Bars3Icon className="h-6 w-6" aria-hidden="true" /> */}
              {sidebarCollapsed ? <XMarkIcon className="h-6 w-6" aria-hidden="true" /> : <Bars3CenterLeftIcon className="h-6 w-6" aria-hidden="true" />}
              {/* <Bars3CenterLeftIcon className="h-6 w-6" aria-hidden="true" /> */}
            </motion.button>
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search-field"
                  className="block rounded-[20px] h-9 w-[30%] border-0 bg-gray-50 py-0 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-1 outline-none focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mt-[12px]"
                  placeholder="Search..."
                  type="search"
                  name="search"
                />
              </div>
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {notificationCount > 0 && (
                  <span className="absolute top-[11px] right-[14px] inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center gap-x-3">
                    {/* Beautiful User Chip */}
                    <div className="flex items-center bg-teal-500 hover:bg-teal-600 text-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center mr-3 ring-2 ring-white/30">
                        <img
                           className="h-6 w-6 rounded-full object-cover"
                           src="https://goodnewsmission.eu/wp-content/uploads/2017/03/p_posp.jpg?189db0"
                           alt="User Image"
                         />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold leading-tight">
                          {/* {user?.name || 'User'} */}
                        </span>
                        <span className="text-sm opacity-90 leading-tight">
                          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                      </div>
                      <div className="ml-2 opacity-75">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to={`/tableau-de-bord/mon-compte`}
                          className={`flex items-center px-3 py-2 text-sm leading-6 ${active ? 'bg-gray-50' : ''}`}
                        >
                          <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Mon Compte
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            navigate("/tableau-de-bord/parametre")
                          }}
                          className={`flex w-full items-center px-3 py-2 text-sm leading-6 ${active ? 'bg-gray-50' : ''}`}
                        >
                          <CogIcon className="h-5 w-5 mr-3 text-gray-400" />
                           Paramètre
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                        onClick={() => {
                          navigate("/tableau-de-bord/mon-compte/change-password")
                        }}
                          className={`flex w-full items-center px-3 py-2 text-sm leading-6 ${active ? 'bg-gray-50' : ''}`}
                        >
                          <BellIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Changer mot de passe
                        </button>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`flex w-full items-center px-3 py-2 text-sm leading-6 ${active ? 'bg-gray-50' : ''}`}
                        >
                          <ArrowPathIcon className="h-5 w-5 mr-3 text-gray-400" />
                          rafraîchir
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`flex w-full items-center px-3 py-2 text-sm leading-6 text-red-600 ${active ? 'bg-gray-50' : ''}`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" />
                          Se Déconnecter
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-6 bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className=''>
            <Outlet />
            </div>
        </div>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
