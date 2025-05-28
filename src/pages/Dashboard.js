import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { expensesAPI, setNavigate } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [category, setCategory] = useState('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Set up navigation for API service
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  // Memoize fetchExpenses with useCallback
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.token) {
        throw new Error('No authentication token found');
      }

      // Make sure the Authorization header is set
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.get('/expenses');
      
      if (response.data.success) {
        setExpenses(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      
      if (err.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('user');
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to load expenses. Please try again.');
        toast.error(err.response?.data?.message || 'Failed to load expenses');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Add navigate as a dependency since it's used in the function

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.token) {
          throw new Error('No authentication token found');
        }
        
        // Set the auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
        
        // Fetch expenses if we have a valid token
        await fetchExpenses();
      } catch (err) {
        console.error('Authentication check failed:', err);
        toast.error('Please log in to continue');
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate, fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !description || !category || !date) {
      toast.error('Please fill in all fields');
      return;
    }

    console.log('Submitting expense:', { amount, description, category, date });
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        amount: parseFloat(amount),
        description: description.trim(),
        category: category.trim(),
        date: date,
      };
      
      console.log('Sending expense data:', expenseData);
      const response = await expensesAPI.create(expenseData);
      console.log('Expense created:', response.data);
      
      // Refresh expenses
      await fetchExpenses();
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      
      toast.success('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Failed to add expense';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesAPI.delete(id);
        await fetchExpenses();
        toast.success('Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Check if user is authenticated
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Current user from localStorage:', user);
        
        if (!user?.token) {
          console.error('No user token found, redirecting to login');
          toast.error('Please login to continue');
          navigate('/login');
          return;
        }
        
        // Set the default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
        
        console.log('Fetching expenses...');
        await fetchExpenses();
        
      } catch (error) {
        console.error('Error in loadData:', error);
        
        if (isMounted) {
          if (error.response?.status === 401) {
            // Token might be expired, clear user and redirect to login
            localStorage.removeItem('user');
            toast.error('Your session has expired. Please login again.');
            navigate('/login');
          } else {
            setErrorMessage('Failed to load dashboard. Please try refreshing the page.');
            toast.error('Failed to load dashboard data');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, fetchExpenses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Expense Form */}
            <div className="md:col-span-1">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="food">Food & Dining</option>
                      <option value="transportation">Transportation</option>
                      <option value="utilities">Utilities</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="shopping">Shopping</option>
                      <option value="health">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="personal">Personal Care</option>
                      <option value="travel">Travel</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Expense'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Expense List */}
            <div className="md:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Recent Expenses</h2>
                    <div className="flex-1 max-w-xs ml-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search expenses..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden">
                  {expenses.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <li key={expense.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600">
                                  {expense.category === 'food' && '🍔'}
                                  {expense.category === 'transportation' && '🚗'}
                                  {expense.category === 'utilities' && '🔌'}
                                  {expense.category === 'entertainment' && '🎬'}
                                  {expense.category === 'shopping' && '🛍️'}
                                  {expense.category === 'health' && '🏥'}
                                  {expense.category === 'education' && '🎓'}
                                  {expense.category === 'personal' && '💇'}
                                  {expense.category === 'travel' && '✈️'}
                                  {expense.category === 'other' && '📝'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {expense.description}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ${expense.amount} • {expense.category} • {new Date(expense.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding a new expense.</p>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => document.getElementById('amount').focus()}
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Expense
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
