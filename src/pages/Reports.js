import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { reportsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    totalExpenses: 0,
    expensesByCategory: [],
    expensesByMonth: [],
    budgetComparison: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Categories
  const categories = [
    { id: 'food', name: 'Food & Dining' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'utilities', name: 'Utilities' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'health', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'personal', name: 'Personal Care' },
    { id: 'travel', name: 'Travel' },
    { id: 'other', name: 'Other' }
  ];

  // Fetch report data with retry capability
  const fetchReportData = async (retryCount = 0) => {
    setLoading(true);
    setError(null); // Clear previous errors
    
    // Validate date range before sending request
    const startDateObj = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError('Invalid date format');
      toast.error('Invalid date format');
      setLoading(false);
      return;
    }
    
    if (endDateObj < startDateObj) {
      setError('End date cannot be before start date');
      toast.error('End date cannot be before start date');
      setLoading(false);
      return;
    }
    
    try {
      // Log the request parameters for debugging
      console.log('Fetching report data with parameters:', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        retryAttempt: retryCount
      });
      
      const response = await reportsAPI.getReport(dateRange.startDate, dateRange.endDate);
      
      // Check if we have a successful response
      if (response.data && response.data.success) {
        // Initialize with default values if any data is missing
        const reportDataWithDefaults = {
          totalExpenses: response.data.data?.totalExpenses || 0,
          expensesByCategory: response.data.data?.expensesByCategory || [],
          expensesByMonth: response.data.data?.expensesByMonth || [],
          budgetComparison: response.data.data?.budgetComparison || []
        };
        
        setReportData(reportDataWithDefaults);
        setError(null);
      } else {
        const errorMsg = response.data?.message || 'Failed to fetch report data';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      
      // Determine if this is a network error or server error
      const isNetworkError = !err.response && err.message === 'Network Error';
      const isServerError = err.response?.status >= 500;
      
      // If it's a network error or server error and we haven't retried too many times, retry
      if ((isNetworkError || isServerError) && retryCount < 2) {
        console.log(`Retrying report fetch (attempt ${retryCount + 1})...`);
        toast.info(`Connection issue detected. Retrying... (${retryCount + 1}/2)`);
        
        // Wait a bit before retrying (exponential backoff)
        const retryDelay = 1000 * Math.pow(2, retryCount);
        setTimeout(() => {
          fetchReportData(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Format a user-friendly error message
      let errorMessage = 'Error fetching report data. Please try again.';
      
      if (isNetworkError) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (isServerError) {
        errorMessage = 'The server encountered an error. Our team has been notified.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setLoading(false);
      }
    }
  };

  // Using useCallback to memoize the fetchReportData function
  const memoizedFetchReportData = useCallback(() => {
    fetchReportData();
  }, [dateRange]); // dateRange is the only external dependency

  useEffect(() => {
    memoizedFetchReportData();
  }, [memoizedFetchReportData]); // Now correctly depends on the memoized function

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // State for currency
  const [currency, setCurrency] = useState('USD');

  // Set currency from localStorage on component mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('defaultCurrency') || 'USD';
    setCurrency(savedCurrency);
    
    // Listen for storage events to update currency when changed in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'defaultCurrency') {
        setCurrency(e.newValue || 'USD');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };

  // Download report as CSV
  const downloadReport = () => {
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header
    csvContent += 'Expense Report,' + dateRange.startDate + ' to ' + dateRange.endDate + '\n\n';
    
    // Add total expenses
    csvContent += 'Total Expenses,' + reportData.totalExpenses + '\n\n';
    
    // Add expenses by category
    csvContent += 'Expenses by Category\n';
    csvContent += 'Category,Amount\n';
    reportData.expensesByCategory.forEach(item => {
      csvContent += getCategoryName(item.category) + ',' + item.amount + '\n';
    });
    csvContent += '\n';
    
    // Add expenses by month
    csvContent += 'Expenses by Month\n';
    csvContent += 'Month,Amount\n';
    reportData.expensesByMonth.forEach(item => {
      csvContent += item.month + ',' + item.amount + '\n';
    });
    csvContent += '\n';
    
    // Add budget comparison
    csvContent += 'Budget Comparison\n';
    csvContent += 'Category,Budget,Actual,Difference\n';
    reportData.budgetComparison.forEach(item => {
      csvContent += getCategoryName(item.category) + ',' + item.budget + ',' + item.actual + ',' + item.difference + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expense_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    toast.success('Report downloaded successfully');
  };

  if (loading && !reportData.expensesByCategory.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <button
          onClick={downloadReport}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
          Download Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Expenses Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Total Expenses</h2>
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(reportData.totalExpenses)}</p>
            <p className="text-sm text-gray-500 mt-2">{dateRange.startDate} to {dateRange.endDate}</p>
          </div>

          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Expenses by Category</h2>
            {reportData.expensesByCategory.length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="space-y-3">
                {reportData.expensesByCategory.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{getCategoryName(item.category)}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses by Month */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Expenses by Month</h2>
            {reportData.expensesByMonth.length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="space-y-3">
                {reportData.expensesByMonth.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{item.month}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Comparison */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Budget Comparison</h2>
            {reportData.budgetComparison.length === 0 ? (
              <p className="text-gray-500">No budget data available. Set up budgets to see comparison.</p>
            ) : (
              <div className="space-y-4">
                {reportData.budgetComparison.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{getCategoryName(item.category)}</span>
                      <span className={`font-medium ${item.difference < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {item.difference < 0 ? 'Over by ' : 'Under by '}
                        {formatCurrency(Math.abs(item.difference))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${item.difference < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (item.actual / item.budget) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Budget: {formatCurrency(item.budget)}</span>
                      <span>Actual: {formatCurrency(item.actual)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
