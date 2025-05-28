import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CogIcon, UserCircleIcon, BellIcon, LockClosedIcon, CreditCardIcon, ChartPieIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const navigation = [
  { name: 'Profile', href: '/settings', icon: UserCircleIcon, description: 'Manage your personal information and account details' },
  { name: 'Budget Settings', href: '/settings/budget', icon: ChartPieIcon, description: 'Configure your budget preferences and default categories' },
  { name: 'Currency', href: '/settings/currency', icon: CurrencyDollarIcon, description: 'Set your preferred currency and formatting options' },
  { name: 'Notifications', href: '/settings/notifications', icon: BellIcon, description: 'Control how and when you receive alerts and reminders' },
  { name: 'Security', href: '/settings/security', icon: LockClosedIcon, description: 'Protect your account with secure authentication options' },
  { name: 'Preferences', href: '/settings/preferences', icon: CogIcon, description: 'Customize your experience with app-wide settings' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultCategories, setDefaultCategories] = useState({
    food: { enabled: true, percentage: 25 },
    utilities: { enabled: true, percentage: 35 },
    transportation: { enabled: true, percentage: 15 },
    entertainment: { enabled: true, percentage: 10 },
    personal: { enabled: true, percentage: 5 },
    health: { enabled: true, percentage: 5 },
    education: { enabled: true, percentage: 3 },
    other: { enabled: true, percentage: 2 }
  });
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  const [budgetThreshold, setBudgetThreshold] = useState(80);

  useEffect(() => {
    const currentNav = navigation.find(nav => nav.href === location.pathname);
    setCurrentTab(currentNav?.name || 'Profile');
    
    // Load saved settings from localStorage
    const savedCurrency = localStorage.getItem('defaultCurrency');
    if (savedCurrency) {
      setDefaultCurrency(savedCurrency);
    }
    
    const savedCategories = localStorage.getItem('defaultCategories');
    if (savedCategories) {
      try {
        setDefaultCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('Error parsing saved categories:', error);
      }
    }
    
    const savedReminderFrequency = localStorage.getItem('reminderFrequency');
    if (savedReminderFrequency) {
      setReminderFrequency(savedReminderFrequency);
    }
    
    const savedBudgetThreshold = localStorage.getItem('budgetThreshold');
    if (savedBudgetThreshold) {
      setBudgetThreshold(savedBudgetThreshold);
    }
  }, [location]);

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setDefaultCurrency(newCurrency);
    localStorage.setItem('defaultCurrency', newCurrency);
    toast.success('Default currency updated successfully');
  };

  const handleCategoryToggle = (category) => {
    setDefaultCategories(prev => {
      const updatedCategories = {
        ...prev,
        [category]: {
          ...prev[category],
          enabled: !prev[category].enabled
        }
      };
      // Save to localStorage
      localStorage.setItem('defaultCategories', JSON.stringify(updatedCategories));
      return updatedCategories;
    });
  };

  const handlePercentageChange = (category, value) => {
    setDefaultCategories(prev => {
      const updatedCategories = {
        ...prev,
        [category]: {
          ...prev[category],
          percentage: parseInt(value, 10) || 0
        }
      };
      // Save to localStorage
      localStorage.setItem('defaultCategories', JSON.stringify(updatedCategories));
      return updatedCategories;
    });
  };

  const handleSaveBudgetSettings = () => {
    // Here you would typically save to backend
    toast.success('Budget settings saved successfully');
  };

  const handleReminderFrequencyChange = (e) => {
    const newFrequency = e.target.value;
    setReminderFrequency(newFrequency);
    localStorage.setItem('reminderFrequency', newFrequency);
  };

  const handleThresholdChange = (e) => {
    const newThreshold = e.target.value;
    setBudgetThreshold(newThreshold);
    localStorage.setItem('budgetThreshold', newThreshold);
  };

  const renderTabContent = () => {
    switch(currentTab) {
      case 'Budget Settings':
        return (
          <div className="space-y-6 px-4 py-5 sm:p-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Default Budget Categories</h4>
              <p className="text-sm text-gray-500 mb-4">
                Configure which categories to include in your automatic budget plans and their default allocation percentages.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(defaultCategories).map(([category, settings]) => (
                  <div key={category} className="flex items-center space-x-4 p-3 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={() => handleCategoryToggle(category)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {category.replace(/_/g, ' ')}
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settings.percentage}
                          onChange={(e) => handlePercentageChange(category, e.target.value)}
                          disabled={!settings.enabled}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-500 w-8 text-right">{settings.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-5 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Budget Alerts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reminder Frequency</label>
                  <select
                    value={reminderFrequency}
                    onChange={handleReminderFrequencyChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">How often you want to receive budget reminders</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Threshold Alert (%)</label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={budgetThreshold}
                      onChange={handleThresholdChange}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-500 w-8 text-right">{budgetThreshold}%</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Get alerted when you reach this percentage of your budget</p>
                </div>
              </div>
            </div>
            
            <div className="pt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveBudgetSettings}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        );
        
      case 'Currency':
        return (
          <div className="space-y-6 px-4 py-5 sm:p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={handleCurrencyChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="JPY">Japanese Yen (¥)</option>
                <option value="CAD">Canadian Dollar (C$)</option>
                <option value="AUD">Australian Dollar (A$)</option>
                <option value="INR">Indian Rupee (₹)</option>
                <option value="CNY">Chinese Yuan (¥)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">This will be used for all budget and expense displays</p>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Currency Format Preview</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">One thousand:</span>
                  <span className="text-sm font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency: defaultCurrency }).format(1000)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Decimal value:</span>
                  <span className="text-sm font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency: defaultCurrency }).format(1234.56)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Negative value:</span>
                  <span className="text-sm font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency: defaultCurrency }).format(-99.99)}</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="px-4 py-5 sm:p-6">
            <p className="text-sm text-gray-500">{navigation.find(nav => nav.name === currentTab)?.description || 'Configure your settings'}</p>
            {currentTab === 'Profile' && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">This section is under development. Check back soon for profile management options.</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-6">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Customize your experience and manage your account preferences
              </p>
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
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                          'group rounded-md px-3 py-3 flex items-center text-sm font-medium transition-colors'
                        )}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        <item.icon
                          className={classNames(
                            isCurrent ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                            'flex-shrink-0 -ml-1 mr-3 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </aside>

              <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      {navigation.find(nav => nav.name === currentTab)?.icon && 
                        React.createElement(
                          navigation.find(nav => nav.name === currentTab)?.icon, 
                          { 
                            className: "flex-shrink-0 mr-2 h-5 w-5 text-gray-500",
                            "aria-hidden": "true"
                          }
                        )
                      }
                      {currentTab}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {navigation.find(nav => nav.name === currentTab)?.description || 'Configure your settings'}
                    </p>
                  </div>
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
