import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { budgetsAPI } from '../services/api';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTotalBudgetForm, setShowTotalBudgetForm] = useState(false);
  const [totalBudgetAmount, setTotalBudgetAmount] = useState('');
  const [budgetPlanName, setBudgetPlanName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'food',
    period: 'monthly'
  });
  const [editingId, setEditingId] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [expandedPlans, setExpandedPlans] = useState({});

  // Categories with icons
  const categories = [
    { id: 'food', name: 'Food & Dining' },
    { id: 'utilities', name: 'Housing & Utilities' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'personal', name: 'Personal Care' },
    { id: 'health', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'other', name: 'Other Expenses' }
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
        const budgetsData = response.data.data;
        setBudgets(budgetsData);
        
        // Extract unique budget plans from the budgets
        const plans = {};
        budgetsData.forEach(budget => {
          if (budget.planId && budget.planName) {
            if (!plans[budget.planId]) {
              plans[budget.planId] = {
                id: budget.planId,
                name: budget.planName,
                totalAmount: budgetsData
                  .filter(b => b.planId === budget.planId)
                  .reduce((sum, b) => sum + parseFloat(b.amount), 0),
                budgets: []
              };
            }
            plans[budget.planId].budgets.push(budget);
          }
        });
        
        setBudgetPlans(Object.values(plans));
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

  // Handle total budget amount change
  const handleTotalBudgetChange = (e) => {
    setTotalBudgetAmount(e.target.value);
  };
  
  // Handle budget plan name change
  const handleBudgetPlanNameChange = (e) => {
    setBudgetPlanName(e.target.value);
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
          toast.success('Budget created successfully');
          fetchBudgets();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to create budget');
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
      amount: budget.amount,
      category: budget.category,
      period: budget.period
    });
    setEditingId(budget.id);
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
  
  // Delete all budgets
  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL budgets? This action cannot be undone.')) {
      try {
        // Create an array of promises for each budget deletion
        const deletePromises = budgets.map(budget => budgetsAPI.delete(budget.id));
        
        // Wait for all deletions to complete
        await Promise.all(deletePromises);
        
        toast.success('All budgets deleted successfully');
        fetchBudgets();
      } catch (err) {
        console.error('Error deleting all budgets:', err);
        toast.error('Error deleting all budgets. Please try again.');
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

  // Generate budget plan based on total budget amount
  const generateBudgetPlan = async () => {
    if (!totalBudgetAmount || isNaN(parseFloat(totalBudgetAmount)) || parseFloat(totalBudgetAmount) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    
    if (!budgetPlanName.trim()) {
      toast.error('Please enter a name for your budget plan');
      return;
    }
    
    setGeneratingPlan(true);
    
    try {
      const amount = parseFloat(totalBudgetAmount);
      
      // Default budget allocation percentages based on common spending patterns
      const allocations = [
        { category: 'food', name: 'Food & Dining', percentage: 0.25 },
        { category: 'utilities', name: 'Housing & Utilities', percentage: 0.35 },
        { category: 'transportation', name: 'Transportation', percentage: 0.15 },
        { category: 'entertainment', name: 'Entertainment', percentage: 0.10 },
        { category: 'personal', name: 'Personal Care', percentage: 0.05 },
        { category: 'health', name: 'Healthcare', percentage: 0.05 },
        { category: 'education', name: 'Education', percentage: 0.03 },
        { category: 'other', name: 'Other Expenses', percentage: 0.02 }
      ];
      
      // Get current month and year for budget names
      const date = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();
      
      // Generate a unique plan identifier
      const planId = `Plan-${Date.now().toString().slice(-6)}`;
      
      // Create a budget for each category
      for (const allocation of allocations) {
        const categoryAmount = Math.round(amount * allocation.percentage * 100) / 100;
        const budgetData = {
          name: `${allocation.name}`,
          amount: categoryAmount,
          category: allocation.category,
          period: 'monthly',
          planId: planId,
          planName: budgetPlanName.trim()
        };
        
        await budgetsAPI.create(budgetData);
      }
      
      toast.success(`Budget plan '${budgetPlanName.trim()}' generated successfully!`);
      fetchBudgets();
      setShowTotalBudgetForm(false);
      setTotalBudgetAmount('');
      setBudgetPlanName('');
    } catch (err) {
      console.error('Error generating budget plan:', err);
      toast.error('Error generating budget plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get period name
  const getPeriodName = (periodId) => {
    const period = periods.find(p => p.id === periodId);
    return period ? period.name : periodId;
  };
  
  // Toggle plan expansion
  const togglePlanExpansion = (planId) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTotalBudgetForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Generate Budget Plan
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Budget
          </button>
          {budgets.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Total Budget Form with Budget Plan Name */}
      {showTotalBudgetForm && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Generate Budget Plan</h3>
          
          {/* Budget Plan Name Input */}
          <div className="mb-4">
            <label htmlFor="budgetPlanName" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Plan Name
            </label>
            <input
              type="text"
              name="budgetPlanName"
              id="budgetPlanName"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., May 2025 Monthly Budget"
              value={budgetPlanName}
              onChange={handleBudgetPlanNameChange}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Give your budget plan a descriptive name to easily identify it later.
            </p>
          </div>
          
          {/* Total Budget Amount Input */}
          <div className="mb-4">
            <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-1">
              Total Budget Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="totalBudget"
                id="totalBudget"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={totalBudgetAmount}
                onChange={handleTotalBudgetChange}
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USD
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This will automatically generate a budget plan with recommended allocations.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setShowTotalBudgetForm(false);
                setBudgetPlanName('');
                setTotalBudgetAmount('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={generateBudgetPlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Budget Plan'
              )}
            </button>
          </div>
        </div>
      )}

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

      {/* Budget Plans and Individual Budgets */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading budgets...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Budget Plans Section */}
          {budgetPlans.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Budget Plans</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Click on a plan name to view its budget details</p>
              </div>
              <ul className="divide-y divide-gray-200">
                {budgetPlans.map(plan => (
                  <li key={plan.id} className="hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => togglePlanExpansion(plan.id)}
                      >
                        <div className="flex items-center">
                          {expandedPlans[plan.id] ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <span className="font-medium text-indigo-600">{plan.name}</span>
                        </div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {formatCurrency(plan.totalAmount)}
                        </div>
                      </div>
                      
                      {/* Expanded Plan Details */}
                      {expandedPlans[plan.id] && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {plan.budgets.map(budget => (
                                  <tr key={budget.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{getCategoryName(budget.category)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(budget.amount)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{getPeriodName(budget.period)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => handleEdit(budget)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(budget.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <TrashIcon className="h-4 w-4" />
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
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Individual Budgets Section */}
          {budgets.filter(budget => !budget.planId).length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Individual Budgets</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Budgets not part of any plan</p>
              </div>
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
                    {budgets.filter(budget => !budget.planId).map((budget) => (
                      <tr key={budget.id} className="hover:bg-gray-50">
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
                            onClick={() => handleDelete(budget.id)}
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
          ) : budgetPlans.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-4">No budgets found. Add your first budget or generate a budget plan to get started!</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowTotalBudgetForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Generate Budget Plan
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Budget
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Budgets;