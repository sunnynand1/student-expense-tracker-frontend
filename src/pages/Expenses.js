import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { expensesAPI } from '../services/api';
import { toast } from 'react-toastify';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'food'
  });
  const [editingId, setEditingId] = useState(null);

  // Categories with icons
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

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesAPI.getAll();
      if (response.data.success) {
        setExpenses(response.data.data);
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
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing expense
        const response = await expensesAPI.update(editingId, formData);
        if (response.data.success) {
          toast.success('Expense updated successfully');
          fetchExpenses();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to update expense');
        }
      } else {
        // Create new expense
        const response = await expensesAPI.create(formData);
        if (response.data.success) {
          toast.success('Expense added successfully');
          fetchExpenses();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to add expense');
        }
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      toast.error('Error saving expense. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'food'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Edit expense
  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category
    });
    setEditingId(expense._id);
    setShowForm(true);
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await expensesAPI.delete(id);
        if (response.data.success) {
          toast.success('Expense deleted successfully');
          fetchExpenses();
        } else {
          toast.error(response.data.message || 'Failed to delete expense');
        }
      } catch (err) {
        console.error('Error deleting expense:', err);
        toast.error('Error deleting expense. Please try again.');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Expense
            </>
          )}
        </button>
      </div>

      {/* Expense Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingId ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No expenses found. Add your first expense to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Expense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryName(expense.category)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
