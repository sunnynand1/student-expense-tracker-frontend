import { Fragment, useState } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  BellIcon,
  ChartBarIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  Bars3Icon,
  UserIcon,
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: false },
  { name: 'Expenses', href: '/expenses', icon: BanknotesIcon, current: false },
  { name: 'Budgets', href: '/budgets', icon: ChartBarIcon, current: false },
  { name: 'Reports', href: '/reports', icon: ChartPieIcon, current: false },
  { name: 'Documents', href: '/documents', icon: FolderIcon, current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('lastLogin');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update current navigation item based on route
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 relative">
      {/* Mobile sidebar */}
      {/* Mobile sidebar with improved accessibility */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-50 md:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col  pt-5 pb-4 bg-gradient-to-b from-indigo-800 to-indigo-600 h-full overflow-y-auto">
              <Transition.Child
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-5 right-5">
                  <button
                    type="button"
                    className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-900/50 backdrop-blur-sm text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200 shadow-lg"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-shrink-0 flex items-center px-4 py-2 mb-4 border-b border-indigo-500/30">
                <BanknotesIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-white text-xl font-semibold">Expense Tracker</span>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                <div className="mb-4">
                  <h3 className="px-3 text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Menu
                  </h3>
                  <nav className="mt-2 space-y-2">
                  {updatedNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-indigo-800 text-white shadow-lg'
                          : 'text-indigo-100 hover:bg-indigo-600/70 hover:shadow-md',
                        'group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200'
                      )}
                      onClick={() => setSidebarOpen(false)}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <item.icon
                        className={classNames(
                          item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                  </nav>
                </div>
                
                {/* User profile section */}
                <div className="mt-6 pt-4 border-t border-indigo-500/30">
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                      Your Account
                    </h3>
                  </div>
                  <div className="px-2 space-y-1">
                    <Link
                      to="/profile"
                      className="group flex items-center px-3 py-2 text-base font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 transition-all duration-200"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <UserIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="group flex items-center px-3 py-2 text-base font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 transition-all duration-200"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Settings
                    </Link>
                    <button
                      className="w-full group flex items-center px-3 py-2 text-base font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 transition-all duration-200"
                      onClick={() => {
                        setSidebarOpen(false);
                        handleLogout();
                      }}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-col h-0 flex-1 bg-gradient-to-b from-indigo-800 to-indigo-600">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 py-2 mb-4 border-b border-indigo-500/30">
                <BanknotesIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-white text-xl font-semibold">Expense Tracker</span>
              </div>
              
              <div className="flex-1 px-2">
                <div className="mb-4">
                  <h3 className="px-3 text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Menu
                  </h3>
                  <nav className="mt-2 space-y-2">
                    {updatedNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-indigo-800 text-white shadow-lg'
                            : 'text-indigo-100 hover:bg-indigo-600/70 hover:shadow-md',
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                            'mr-3 flex-shrink-0 h-5 w-5'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                
                {/* User account section */}
                <div className="mt-6 mb-4">
                  <h3 className="px-3 text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Your Account
                  </h3>
                  <nav className="mt-2 space-y-2">
                    <Link
                      to="/profile"
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 hover:shadow-md transition-all duration-200"
                    >
                      <UserIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 hover:shadow-md transition-all duration-200"
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-600/70 hover:shadow-md transition-all duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-indigo-200 group-hover:text-white" />
                      Sign out
                    </button>
                  </nav>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex border-t border-indigo-500/30 p-4">
              <div className="flex items-center w-full">
                <div>
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-indigo-300/30"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`}
                    alt={user.name || 'User'}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                  <p className="text-xs text-indigo-200 truncate">{user.email || 'user@example.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden flex items-center justify-center transition-colors duration-200"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search"
                    type="search"
                    name="search"
                  />
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Profile dropdown */}
              <Menu as="div" className="ml-3 relative">
                <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`}
                    alt={user.name || 'User'}
                  />
                </Menu.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700 flex items-center'
                          )}
                        >
                          <UserIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700 flex items-center'
                          )}
                        >
                          <Cog6ToothIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'w-full text-left block px-4 py-2 text-sm text-gray-700 flex items-center'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
