import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Profile', href: '/settings', icon: '👤' },
  { name: 'Preferences', href: '/settings/preferences', icon: '⚙️' },
  { name: 'Notifications', href: '/settings/notifications', icon: '🔔' },
  { name: 'Security', href: '/settings/security', icon: '🔒' },
  { name: 'Billing', href: '/settings/billing', icon: '💳' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState('');

  useEffect(() => {
    const currentNav = navigation.find(nav => nav.href === location.pathname);
    setCurrentTab(currentNav?.name || 'Profile');
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-6">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Settings
              </h2>
            </div>
          </div>

          <div className="mt-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
              <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = item.href === location.pathname;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          isCurrent
                            ? 'bg-gray-50 text-indigo-700 hover:bg-white hover:text-indigo-700'
                            : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
                          'group rounded-md px-3 py-2 flex items-center text-sm font-medium'
                        )}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </aside>

              <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg
                ">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentTab}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {currentTab === 'Profile' && 'Update your profile information and settings.'}
                      {currentTab === 'Preferences' && 'Customize your application preferences.'}
                      {currentTab === 'Notifications' && 'Manage how you receive notifications.'}
                      {currentTab === 'Security' && 'Update your password and security settings.'}
                      {currentTab === 'Billing' && 'Manage your subscription and billing information.'}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <Outlet />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
