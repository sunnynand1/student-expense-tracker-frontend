import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { expensesAPI } from '../services/api';
import { toast } from 'react-toastify';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expenses for the current month
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      const response = await expensesAPI.getAll();
      
      if (response.data.success) {
        // Filter expenses for the current month on the client side
        const filteredExpenses = response.data.data.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
        });
        setExpenses(filteredExpenses);
      } else {
        setError('Failed to fetch expenses');
        toast.error('Failed to fetch expenses');
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Error fetching expenses. Please try again.');
      toast.error('Error fetching expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentDate]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Total days in the month
    const daysInMonth = lastDay.getDate();
    
    // Calendar array
    const calendar = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }
    
    return calendar;
  };

  // Get expenses for a specific day
  const getExpensesForDay = (day) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && 
             expenseDate.getMonth() === month - 1 && 
             expenseDate.getDate() === day;
    });
  };

  // Get total expenses for a specific day
  const getTotalForDay = (day) => {
    if (!day) return 0;
    
    const dayExpenses = getExpensesForDay(day);
    return dayExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Format month name
  const formatMonth = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    
    const today = new Date();
    return today.getFullYear() === currentDate.getFullYear() && 
           today.getMonth() === currentDate.getMonth() && 
           today.getDate() === day;
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && expenses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Expense Calendar</h1>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-xl font-semibold text-center text-indigo-800">{formatMonth(currentDate)}</h2>
        </div>

        {error ? (
          <div className="p-4 bg-red-50">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 border-b border-gray-200">
            {/* Weekday headers */}
            {weekdays.map((day, index) => (
              <div key={index} className="py-2 text-center text-sm font-medium text-gray-500 border-r last:border-r-0 border-gray-200">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayExpenses = getExpensesForDay(day);
              const hasExpenses = dayExpenses.length > 0;
              const dayTotal = getTotalForDay(day);
              
              return (
                <div 
                  key={index} 
                  className={`min-h-[100px] p-2 border-r last:border-r-0 border-b last-row:border-b-0 border-gray-200 ${!day ? 'bg-gray-50' : ''} ${isToday(day) ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className={`inline-block w-6 h-6 text-center ${isToday(day) ? 'bg-blue-500 text-white rounded-full' : ''}`}>
                          {day}
                        </span>
                        {hasExpenses && (
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                            {formatCurrency(dayTotal)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayExpenses.slice(0, 3).map((expense, i) => (
                          <div key={i} className="text-xs p-1 bg-indigo-50 rounded truncate" title={expense.description}>
                            {expense.description.length > 15 ? expense.description.substring(0, 15) + '...' : expense.description}
                          </div>
                        ))}
                        {dayExpenses.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayExpenses.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
