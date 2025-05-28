import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { budgetsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'food',
    period: 'monthly'
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

  // Budget periods
  const periods = [
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' }
  ];

  // Fetch budgets
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await budgetsAPI.getAll();
      if (response.data.success) {
        setBudgets(response.data.data);
      } else {
        setError('Failed to fetch budgets');
        toast.error('Failed to fetch budgets');
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Error fetching budgets. Please try again.');
      toast.error('Error fetching budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
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
        // Update existing budget
        const response = await budgetsAPI.update(editingId, formData);
        if (response.data.success) {
          toast.success('Budget updated successfully');
          fetchBudgets();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to update budget');
        }
      } else {
        // Create new budget
        const response = await budgetsAPI.create(formData);
        if (response.data.success) {
          toast.success('Budget added successfully');
          fetchBudgets();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to add budget');
        }
      }
    } catch (err) {
      console.error('Error saving budget:', err);
      toast.error('Error saving budget. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'food',
      period: 'monthly'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Edit budget
  const handleEdit = (budget) => {
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      category: budget.category,
      period: budget.period
    });
    setEditingId(budget._id);
    setShowForm(true);
  };

  // Delete budget
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const response = await budgetsAPI.delete(id);
        if (response.data.success) {
          toast.success('Budget deleted successfully');
          fetchBudgets();
        } else {
          toast.error(response.data.message || 'Failed to delete budget');
        }
      } catch (err) {
        console.error('Error deleting budget:', err);
        toast.error('Error deleting budget. Please try again.');
      }
    }
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

  // Get period name
  const getPeriodName = (periodId) => {
    const period = periods.find(p => p.id === periodId);
    return period ? period.name : 'Monthly';
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budgets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Budget
            </>
          )}
        </button>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Budget' : 'Add New Budget'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {periods.map(period => (
                    <option key={period.id} value={period.id}>{period.name}</option>
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
                {editingId ? 'Update Budget' : 'Add Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No budgets found. Add your first budget to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Budget
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{budget.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryName(budget.category)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPeriodName(budget.period)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(budget.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
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

export default Budgets;
